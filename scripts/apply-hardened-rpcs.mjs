import pg from 'pg'
import fs from 'fs'

let dbUrl = process.env.DATABASE_URL

if (!dbUrl && fs.existsSync('.env.local')) {
  const content = fs.readFileSync('.env.local', 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.startsWith('DATABASE_URL=')) {
      dbUrl = trimmed.replace('DATABASE_URL=', '').trim()
    }
  }
}

if (!dbUrl) {
  console.error('DATABASE_URL not found in .env.local')
  process.exit(1)
}

const client = new pg.Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
})

async function run() {
  await client.connect()
  console.log('Connected to PostgreSQL database.')

  const sql = `
    -- Ensure status column on tasks table
    ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

    -- Ensure Table Constraints
    ALTER TABLE public.task_completions DROP CONSTRAINT IF EXISTS task_completions_task_id_key;
    ALTER TABLE public.task_completions ADD CONSTRAINT task_completions_task_id_key UNIQUE (task_id);

    -- Secure RLS policies
    DROP POLICY IF EXISTS "Public profiles access" ON public.profiles;
    DROP POLICY IF EXISTS "Public characters access" ON public.characters;
    DROP POLICY IF EXISTS "Public tasks access" ON public.tasks;
    DROP POLICY IF EXISTS "Public task completions access" ON public.task_completions;
    DROP POLICY IF EXISTS "Public inventory access" ON public.inventory;
    DROP POLICY IF EXISTS "Public user achievements access" ON public.user_achievements;
    DROP POLICY IF EXISTS "Public quest chains access" ON public.quest_chains;
    DROP POLICY IF EXISTS "Public quest chain tasks access" ON public.quest_chain_tasks;

    DROP POLICY IF EXISTS "Public items access" ON public.items;
    DROP POLICY IF EXISTS "Public achievements access" ON public.achievements;
    CREATE POLICY "Public items access" ON public.items FOR SELECT USING (true);
    CREATE POLICY "Public achievements access" ON public.achievements FOR SELECT USING (true);

    -- Authoritative Atomic RPC: complete_quest_rpc
    CREATE OR REPLACE FUNCTION public.complete_quest_rpc(p_task_id UUID, p_user_id UUID DEFAULT NULL)
    RETURNS JSONB
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public, pg_temp
    AS $$
    DECLARE
      v_user_id UUID := COALESCE(p_user_id, auth.uid());
      v_task public.tasks%ROWTYPE;
      v_char public.characters%ROWTYPE;
      v_xp_gained INT;
      v_gold_gained INT;
      v_stat_gained INT;
      v_prev_level INT;
      v_new_level INT;
      v_new_xp INT;
      v_next_level_xp INT;
      v_did_level_up BOOLEAN;
      v_recent_completions INT;
      v_momentum INT;
      v_prev_archetype TEXT;
      v_new_archetype TEXT;
      v_archetype_desc TEXT;
      v_max_stat INT;
      v_min_stat INT;
      v_total_completions INT;
      v_new_achievements JSONB := '[]'::jsonb;
      v_ach_record RECORD;
      v_unlocked_ach RECORD;
    BEGIN
      IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
      END IF;

      -- Lock task row
      SELECT * INTO v_task FROM public.tasks WHERE id = p_task_id AND user_id = v_user_id FOR UPDATE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Quest not found or access denied';
      END IF;

      IF v_task.status = 'completed' THEN
        RAISE EXCEPTION 'Quest is already completed';
      END IF;

      -- Check if completion record already exists (duplicate prevention)
      IF EXISTS (SELECT 1 FROM public.task_completions WHERE task_id = p_task_id) THEN
        RAISE EXCEPTION 'Quest completion log already exists';
      END IF;

      -- Lock character row
      SELECT * INTO v_char FROM public.characters WHERE user_id = v_user_id FOR UPDATE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Character record not found';
      END IF;

      -- Authoritative rewards calculation based on difficulty
      IF v_task.difficulty = 'easy' THEN
        v_xp_gained := 50; v_gold_gained := 20; v_stat_gained := 1;
      ELSIF v_task.difficulty = 'medium' THEN
        v_xp_gained := 100; v_gold_gained := 45; v_stat_gained := 2;
      ELSIF v_task.difficulty = 'hard' THEN
        v_xp_gained := 200; v_gold_gained := 100; v_stat_gained := 4;
      ELSIF v_task.difficulty = 'epic' THEN
        v_xp_gained := 500; v_gold_gained := 250; v_stat_gained := 10;
      ELSE
        v_xp_gained := 100; v_gold_gained := 45; v_stat_gained := 2;
      END IF;

      v_prev_level := v_char.level;
      v_prev_archetype := v_char.archetype;
      v_new_xp := v_char.xp + v_xp_gained;

      -- Level formula (100 * Level^1.5)
      v_new_level := 1;
      WHILE v_new_xp >= FLOOR(100 * POWER(v_new_level + 1, 1.5)) LOOP
        v_new_level := v_new_level + 1;
      END LOOP;
      v_did_level_up := (v_new_level > v_prev_level);
      v_next_level_xp := FLOOR(100 * POWER(v_new_level + 1, 1.5)) - FLOOR(100 * POWER(v_new_level, 1.5));

      -- Update stat attributes
      IF v_task.attribute = 'strength' THEN v_char.strength := v_char.strength + v_stat_gained;
      ELSIF v_task.attribute = 'intellect' THEN v_char.intellect := v_char.intellect + v_stat_gained;
      ELSIF v_task.attribute = 'discipline' THEN v_char.discipline := v_char.discipline + v_stat_gained;
      ELSIF v_task.attribute = 'vitality' THEN v_char.vitality := v_char.vitality + v_stat_gained;
      ELSIF v_task.attribute = 'creativity' THEN v_char.creativity := v_char.creativity + v_stat_gained;
      END IF;

      -- Deterministic Archetype Calculation
      v_max_stat := GREATEST(v_char.strength, v_char.intellect, v_char.discipline, v_char.vitality, v_char.creativity);
      v_min_stat := LEAST(v_char.strength, v_char.intellect, v_char.discipline, v_char.vitality, v_char.creativity);

      IF (v_max_stat - v_min_stat <= 5) THEN
        v_new_archetype := 'The Balanced';
        v_archetype_desc := 'Versatile operator developing across all core attributes';
      ELSIF (v_char.intellect >= v_max_stat - 3 AND v_char.creativity >= v_max_stat - 3 AND v_char.intellect > v_char.strength) THEN
        v_new_archetype := 'The Builder';
        v_archetype_desc := 'Master of technical architecture and creative systems';
      ELSIF (v_char.intellect >= v_max_stat - 3 AND v_char.discipline >= v_max_stat - 3) THEN
        v_new_archetype := 'The Strategist';
        v_archetype_desc := 'Tactical planner balancing analytical foresight with execution';
      ELSIF (v_char.intellect = v_max_stat) THEN
        v_new_archetype := 'The Scholar';
        v_archetype_desc := 'Relentless seeker of deep knowledge and systematic mastery';
      ELSIF (v_char.strength = v_max_stat) THEN
        v_new_archetype := 'The Warrior';
        v_archetype_desc := 'Unstoppable physical titan powered by endurance and strength';
      ELSIF (v_char.creativity = v_max_stat) THEN
        v_new_archetype := 'The Creator';
        v_archetype_desc := 'Prolific artisan transforming ideas into disciplined output';
      ELSIF (v_char.discipline = v_max_stat) THEN
        v_new_archetype := 'The Disciplined';
        v_archetype_desc := 'Monk-like operator defined by unwavering habit adherence';
      ELSE
        v_new_archetype := 'The Balanced';
        v_archetype_desc := 'Versatile operator developing across all core attributes';
      END IF;

      -- Calculate Streak
      IF v_char.last_active_date IS NULL THEN
        v_char.current_streak := 1;
        v_char.longest_streak := GREATEST(v_char.longest_streak, 1);
      ELSIF v_char.last_active_date = CURRENT_DATE THEN
        -- Same-day completion: streak maintained
      ELSIF v_char.last_active_date = CURRENT_DATE - INTERVAL '1 day' THEN
        v_char.current_streak := v_char.current_streak + 1;
        v_char.longest_streak := GREATEST(v_char.longest_streak, v_char.current_streak);
      ELSE
        v_char.current_streak := 1;
        v_char.longest_streak := GREATEST(v_char.longest_streak, 1);
      END IF;

      -- Mark task completed
      UPDATE public.tasks SET status = 'completed', updated_at = now() WHERE id = p_task_id;

      -- Insert task completion log
      INSERT INTO public.task_completions (user_id, task_id, xp_awarded, gold_awarded, attribute_stat_awarded, completion_date)
      VALUES (v_user_id, p_task_id, v_xp_gained, v_gold_gained, v_stat_gained, CURRENT_DATE);

      -- Calculate 7-day momentum
      SELECT COUNT(*) INTO v_recent_completions FROM public.task_completions
      WHERE user_id = v_user_id AND completion_date >= (CURRENT_DATE - INTERVAL '7 days');

      v_momentum := LEAST(100, GREATEST(0, v_recent_completions * 12));

      -- Update character record
      UPDATE public.characters SET
        xp = v_new_xp,
        level = v_new_level,
        gold = v_char.gold + v_gold_gained,
        strength = v_char.strength,
        intellect = v_char.intellect,
        discipline = v_char.discipline,
        vitality = v_char.vitality,
        creativity = v_char.creativity,
        current_streak = v_char.current_streak,
        longest_streak = v_char.longest_streak,
        momentum = v_momentum,
        archetype = v_new_archetype,
        last_active_date = CURRENT_DATE,
        updated_at = now()
      WHERE user_id = v_user_id;

      -- Total completions for achievements check
      SELECT COUNT(*) INTO v_total_completions FROM public.task_completions WHERE user_id = v_user_id;

      -- Check and unlock achievements
      FOR v_ach_record IN
        SELECT * FROM public.achievements
        WHERE (code = 'FIRST_QUEST' AND v_total_completions >= 1)
           OR (code = 'STREAK_3' AND v_char.current_streak >= 3)
           OR (code = 'STREAK_7' AND v_char.current_streak >= 7)
           OR (code = 'QUESTS_10' AND v_total_completions >= 10)
           OR (code = 'LEVEL_5' AND v_new_level >= 5)
      LOOP
        INSERT INTO public.user_achievements (user_id, achievement_id)
        VALUES (v_user_id, v_ach_record.id)
        ON CONFLICT (user_id, achievement_id) DO NOTHING
        RETURNING achievement_id INTO v_unlocked_ach;

        IF v_unlocked_ach IS NOT NULL THEN
          v_new_achievements := v_new_achievements || jsonb_build_array(row_to_json(v_ach_record)::jsonb);
        END IF;
      END LOOP;

      RETURN jsonb_build_object(
        'success', true,
        'xpGained', v_xp_gained,
        'goldGained', v_gold_gained,
        'attributeGained', v_stat_gained,
        'attributeName', v_task.attribute,
        'previousLevel', v_prev_level,
        'newLevel', v_new_level,
        'didLevelUp', v_did_level_up,
        'currentXp', v_new_xp,
        'xpRequiredForNextLevel', v_next_level_xp,
        'currentStreak', v_char.current_streak,
        'longestStreak', v_char.longest_streak,
        'momentum', v_momentum,
        'build', jsonb_build_object(
          'name', v_new_archetype,
          'description', v_archetype_desc
        ),
        'didArchetypeChange', (v_new_archetype != v_prev_archetype),
        'newlyUnlockedAchievements', v_new_achievements
      );
    END;
    $$;

    -- Authoritative Atomic RPC: purchase_item_rpc
    CREATE OR REPLACE FUNCTION public.purchase_item_rpc(p_item_id UUID, p_user_id UUID DEFAULT NULL)
    RETURNS JSONB
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public, pg_temp
    AS $$
    DECLARE
      v_user_id UUID := COALESCE(p_user_id, auth.uid());
      v_item public.items%ROWTYPE;
      v_char public.characters%ROWTYPE;
      v_inv_id UUID;
      v_first_purchase_ach public.achievements%ROWTYPE;
    BEGIN
      IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
      END IF;

      SELECT * INTO v_item FROM public.items WHERE id = p_item_id;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Item not found in catalog';
      END IF;

      IF EXISTS (SELECT 1 FROM public.inventory WHERE user_id = v_user_id AND item_id = p_item_id) THEN
        RAISE EXCEPTION 'You already own this item';
      END IF;

      SELECT * INTO v_char FROM public.characters WHERE user_id = v_user_id FOR UPDATE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Character record not found';
      END IF;

      IF v_char.gold < v_item.price THEN
        RAISE EXCEPTION 'Insufficient Gold';
      END IF;

      -- Deduct gold balance
      UPDATE public.characters SET gold = v_char.gold - v_item.price, updated_at = now() WHERE user_id = v_user_id;

      -- Insert inventory record
      INSERT INTO public.inventory (user_id, item_id, is_equipped)
      VALUES (v_user_id, p_item_id, false)
      RETURNING id INTO v_inv_id;

      -- Check FIRST_PURCHASE achievement
      SELECT * INTO v_first_purchase_ach FROM public.achievements WHERE code = 'FIRST_PURCHASE';
      IF FOUND THEN
        INSERT INTO public.user_achievements (user_id, achievement_id)
        VALUES (v_user_id, v_first_purchase_ach.id)
        ON CONFLICT (user_id, achievement_id) DO NOTHING;
      END IF;

      RETURN jsonb_build_object(
        'success', true,
        'remainingGold', v_char.gold - v_item.price,
        'inventoryId', v_inv_id
      );
    END;
    $$;

    -- Restrict permissions
    REVOKE EXECUTE ON FUNCTION public.complete_quest_rpc(UUID, UUID) FROM PUBLIC;
    REVOKE EXECUTE ON FUNCTION public.complete_quest_rpc(UUID, UUID) FROM anon;
    REVOKE EXECUTE ON FUNCTION public.complete_quest_rpc(UUID, UUID) FROM authenticated;
    GRANT EXECUTE ON FUNCTION public.complete_quest_rpc(UUID, UUID) TO postgres;
    GRANT EXECUTE ON FUNCTION public.complete_quest_rpc(UUID, UUID) TO service_role;

    REVOKE EXECUTE ON FUNCTION public.purchase_item_rpc(UUID, UUID) FROM PUBLIC;
    REVOKE EXECUTE ON FUNCTION public.purchase_item_rpc(UUID, UUID) FROM anon;
    REVOKE EXECUTE ON FUNCTION public.purchase_item_rpc(UUID, UUID) FROM authenticated;
    GRANT EXECUTE ON FUNCTION public.purchase_item_rpc(UUID, UUID) TO postgres;
    GRANT EXECUTE ON FUNCTION public.purchase_item_rpc(UUID, UUID) TO service_role;
  `

  await client.query(sql)
  console.log('Database tasks status column & hardened RPCs applied successfully!')
  await client.end()
}

run().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
