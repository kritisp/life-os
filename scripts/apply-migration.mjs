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
    -- 1. Ensure unique constraint on task_completions(task_id)
    ALTER TABLE public.task_completions DROP CONSTRAINT IF EXISTS task_completions_task_id_key;
    ALTER TABLE public.task_completions ADD CONSTRAINT task_completions_task_id_key UNIQUE (task_id);

    -- 2. Update complete_quest_rpc
    CREATE OR REPLACE FUNCTION public.complete_quest_rpc(p_task_id UUID, p_user_id UUID DEFAULT NULL)
    RETURNS JSONB AS $$
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
      v_did_level_up BOOLEAN;
      v_recent_completions INT;
      v_momentum INT;
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

      -- Lock character row
      SELECT * INTO v_char FROM public.characters WHERE user_id = v_user_id FOR UPDATE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Character record not found';
      END IF;

      -- Rewards calculation based on difficulty
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
      v_new_xp := v_char.xp + v_xp_gained;

      -- Calculate level from total XP formula (100 * Level^1.5)
      v_new_level := 1;
      WHILE v_new_xp >= FLOOR(100 * POWER(v_new_level + 1, 1.5)) LOOP
        v_new_level := v_new_level + 1;
      END LOOP;
      v_did_level_up := (v_new_level > v_prev_level);

      -- Update stat attributes
      IF v_task.attribute = 'strength' THEN v_char.strength := v_char.strength + v_stat_gained;
      ELSIF v_task.attribute = 'intellect' THEN v_char.intellect := v_char.intellect + v_stat_gained;
      ELSIF v_task.attribute = 'discipline' THEN v_char.discipline := v_char.discipline + v_stat_gained;
      ELSIF v_task.attribute = 'vitality' THEN v_char.vitality := v_char.vitality + v_stat_gained;
      ELSIF v_task.attribute = 'creativity' THEN v_char.creativity := v_char.creativity + v_stat_gained;
      END IF;

      -- Calculate Streak
      IF v_char.last_active_date IS NULL THEN
        v_char.current_streak := 1;
        v_char.longest_streak := GREATEST(v_char.longest_streak, 1);
      ELSIF v_char.last_active_date = CURRENT_DATE THEN
        -- Same-day completion: streak count preserved
      ELSIF v_char.last_active_date = CURRENT_DATE - INTERVAL '1 day' THEN
        v_char.current_streak := v_char.current_streak + 1;
        v_char.longest_streak := GREATEST(v_char.longest_streak, v_char.current_streak);
      ELSE
        v_char.current_streak := 1;
        v_char.longest_streak := GREATEST(v_char.longest_streak, 1);
      END IF;

      -- Mark task completed
      UPDATE public.tasks SET status = 'completed', updated_at = now() WHERE id = p_task_id;

      -- Insert task completion record
      INSERT INTO public.task_completions (user_id, task_id, xp_awarded, gold_awarded, attribute_stat_awarded, completion_date)
      VALUES (v_user_id, p_task_id, v_xp_gained, v_gold_gained, v_stat_gained, CURRENT_DATE);

      -- Count recent completions in last 7 days for momentum
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
        last_active_date = CURRENT_DATE,
        updated_at = now()
      WHERE user_id = v_user_id;

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
        'currentStreak', v_char.current_streak,
        'longestStreak', v_char.longest_streak,
        'momentum', v_momentum
      );
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- 3. Update purchase_item_rpc
    CREATE OR REPLACE FUNCTION public.purchase_item_rpc(p_item_id UUID, p_user_id UUID DEFAULT NULL)
    RETURNS JSONB AS $$
    DECLARE
      v_user_id UUID := COALESCE(p_user_id, auth.uid());
      v_item public.items%ROWTYPE;
      v_char public.characters%ROWTYPE;
      v_inv_id UUID;
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

      UPDATE public.characters SET gold = v_char.gold - v_item.price, updated_at = now() WHERE user_id = v_user_id;

      INSERT INTO public.inventory (user_id, item_id, is_equipped)
      VALUES (v_user_id, p_item_id, false)
      RETURNING id INTO v_inv_id;

      RETURN jsonb_build_object(
        'success', true,
        'remainingGold', v_char.gold - v_item.price,
        'inventoryId', v_inv_id
      );
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `

  await client.query(sql)
  console.log('Migration executed successfully!')
  await client.end()
}

run().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
