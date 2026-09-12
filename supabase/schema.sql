-- ==========================================
-- LIFE//OS Complete Supabase Database Schema
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------
-- 1. PROFILES TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------
-- 2. CHARACTERS TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Operator',
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
  xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
  gold INTEGER NOT NULL DEFAULT 0 CHECK (gold >= 0),
  strength INTEGER NOT NULL DEFAULT 10 CHECK (strength >= 0),
  intellect INTEGER NOT NULL DEFAULT 10 CHECK (intellect >= 0),
  discipline INTEGER NOT NULL DEFAULT 10 CHECK (discipline >= 0),
  vitality INTEGER NOT NULL DEFAULT 10 CHECK (vitality >= 0),
  creativity INTEGER NOT NULL DEFAULT 10 CHECK (creativity >= 0),
  current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak INTEGER NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
  momentum INTEGER NOT NULL DEFAULT 100 CHECK (momentum BETWEEN 0 AND 100),
  archetype TEXT NOT NULL DEFAULT 'The Balanced',
  last_active_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------
-- 3. TASKS TABLE (QUESTS)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'epic')),
  attribute TEXT NOT NULL CHECK (attribute IN ('strength', 'intellect', 'discipline', 'vitality', 'creativity')),
  base_xp INTEGER NOT NULL CHECK (base_xp > 0),
  base_gold INTEGER NOT NULL CHECK (base_gold >= 0),
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------
-- 4. TASK COMPLETIONS TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  xp_awarded INTEGER NOT NULL,
  gold_awarded INTEGER NOT NULL,
  attribute_stat_awarded INTEGER NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completion_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- ------------------------------------------
-- 5. ITEMS CATALOG TABLE (ARMORY SHOP)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('theme', 'badge', 'frame', 'effect')),
  price INTEGER NOT NULL CHECK (price >= 0),
  asset_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------
-- 6. INVENTORY TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  is_equipped BOOLEAN NOT NULL DEFAULT false,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id)
);

-- ------------------------------------------
-- 7. ACHIEVEMENTS CATALOG TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  badge_icon TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  gold_reward INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------
-- 8. USER ACHIEVEMENTS TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- ------------------------------------------
-- 9. QUEST CHAINS TABLES
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.quest_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quest_chain_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id UUID NOT NULL REFERENCES public.quest_chains(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  UNIQUE(chain_id, step_order)
);

-- ==========================================
-- INDEXES FOR OPTIMAL PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_characters_user_id ON public.characters(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON public.tasks(user_id, category);
CREATE INDEX IF NOT EXISTS idx_task_completions_user_date ON public.task_completions(user_id, completion_date);
CREATE INDEX IF NOT EXISTS idx_inventory_user ON public.inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_chain_tasks ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());

-- Characters Policies
CREATE POLICY "Users view own character" ON public.characters FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users update own character" ON public.characters FOR UPDATE USING (user_id = auth.uid());

-- Tasks Policies
CREATE POLICY "Users manage own tasks" ON public.tasks FOR ALL USING (user_id = auth.uid());

-- Task Completions Policies
CREATE POLICY "Users view own task completions" ON public.task_completions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users insert own task completions" ON public.task_completions FOR INSERT WITH CHECK (user_id = auth.uid());

-- Items Catalog Policies
CREATE POLICY "Authenticated users view items" ON public.items FOR SELECT TO authenticated USING (true);

-- Inventory Policies
CREATE POLICY "Users view own inventory" ON public.inventory FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users insert own inventory" ON public.inventory FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own inventory" ON public.inventory FOR UPDATE USING (user_id = auth.uid());

-- Achievements Policies
CREATE POLICY "Authenticated users view achievements" ON public.achievements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users view own unlocked achievements" ON public.user_achievements FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users insert own user_achievements" ON public.user_achievements FOR INSERT WITH CHECK (user_id = auth.uid());

-- Quest Chains Policies
CREATE POLICY "Users manage own quest chains" ON public.quest_chains FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users view chain tasks" ON public.quest_chain_tasks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.quest_chains WHERE id = chain_id AND user_id = auth.uid())
);
CREATE POLICY "Users insert chain tasks" ON public.quest_chain_tasks FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.quest_chains WHERE id = chain_id AND user_id = auth.uid())
);

-- ==========================================
-- AUTOMATIC PROFILE & CHARACTER CREATION TRIGGER
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  INSERT INTO public.characters (user_id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Operator')
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- INITIAL CATALOG SEED DATA
-- ==========================================

-- Seed Achievements
INSERT INTO public.achievements (code, title, description, badge_icon, xp_reward, gold_reward)
VALUES
  ('FIRST_QUEST', 'First Blood', 'Complete your very first real-world quest', 'Swords', 100, 50),
  ('STREAK_3', 'Momentum Rising', 'Maintain an active quest streak for 3 consecutive days', 'Zap', 200, 100),
  ('STREAK_7', 'Unstoppable Force', 'Maintain a perfect 7-day streak', 'Flame', 500, 250),
  ('QUESTS_10', 'Veteran Operator', 'Complete 10 total quests', 'Trophy', 300, 150),
  ('LEVEL_5', 'Adept Ascendance', 'Reach Character Level 5', 'ShieldAlert', 600, 300),
  ('FIRST_PURCHASE', 'Armory Supporter', 'Purchase your first item from the shop', 'ShoppingBag', 150, 75)
ON CONFLICT (code) DO NOTHING;

-- Seed Shop Items
INSERT INTO public.items (name, description, category, price, metadata)
VALUES
  ('Cyberpunk Tactical Theme', 'High-contrast neon HUD aesthetic for your interface', 'theme', 200, '{"theme": "cyberpunk"}'::jsonb),
  ('Obsidian Void Theme', 'Ultra dark minimalist tactical palette', 'theme', 250, '{"theme": "obsidian"}'::jsonb),
  ('Gold Operator Frame', 'Gilded avatar border reserved for high-performing operators', 'frame', 150, '{"border": "gold"}'::jsonb),
  ('Neon Plasma Frame', 'Animated glowing energy aura frame', 'frame', 300, '{"border": "plasma"}'::jsonb),
  ('Level Up Fireworks', 'Particle effect triggered during level-up celebration', 'effect', 100, '{"particle": "fireworks"}'::jsonb)
ON CONFLICT DO NOTHING;

-- ==========================================
-- ATOMIC STORED PROCEDURES (RACE CONDITION PROOF)
-- ==========================================

CREATE OR REPLACE FUNCTION public.complete_quest_rpc(p_task_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
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

CREATE OR REPLACE FUNCTION public.purchase_item_rpc(p_item_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
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
