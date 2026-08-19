-- ==============================================================================
-- YAQIN - Social & Dating Network Database Schema for Supabase
-- ==============================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT UNIQUE, -- Telegram ID or Numeric ID
    username TEXT,
    first_name TEXT NOT NULL,
    bio TEXT DEFAULT '',
    profile_pic TEXT,
    gender TEXT CHECK (gender IN ('male', 'female')),
    birth_date DATE,
    age INT,
    region TEXT,
    interests JSONB DEFAULT '[]'::jsonb,
    phone_number TEXT,
    is_profile_complete BOOLEAN DEFAULT false,
    views_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TELEGRAM AUTH SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.telegram_auth_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    otp_code TEXT NOT NULL UNIQUE,
    telegram_id BIGINT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT (now() + interval '10 minutes')
);

-- 3. POSTS TABLE
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    caption TEXT DEFAULT '',
    hashtags JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of hashtags (e.g. ["#tanishuv", "#sayohat"])
    location TEXT DEFAULT '',
    images JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of image URLs (1 to 10 images)
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. POST LIKES TABLE
CREATE TABLE IF NOT EXISTS public.post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(post_id, user_id)
);

-- 5. POST COMMENTS TABLE
CREATE TABLE IF NOT EXISTS public.post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. DATING SWIPES (Likes & Skips) TABLE
CREATE TABLE IF NOT EXISTS public.dating_swipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id BIGINT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    target_id BIGINT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('like', 'skip', 'superlike')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(sender_id, target_id)
);

-- 7. DATING MATCHES TABLE
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id BIGINT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    user2_id BIGINT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user1_id, user2_id)
);

-- 8. PROFILE VIEWS (Analytics) TABLE
CREATE TABLE IF NOT EXISTS public.profile_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    viewer_id BIGINT REFERENCES public.users(user_id) ON DELETE SET NULL,
    profile_id BIGINT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_dating_swipes_sender ON public.dating_swipes(sender_id);
CREATE INDEX IF NOT EXISTS idx_dating_swipes_target ON public.dating_swipes(target_id);
CREATE INDEX IF NOT EXISTS idx_matches_user1 ON public.matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2 ON public.matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_profile ON public.profile_views(profile_id);

-- POLICIES FOR PUBLIC / SERVICE ROLE
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public Read Users" ON public.users;
    CREATE POLICY "Public Read Users" ON public.users FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public Insert Users" ON public.users;
    CREATE POLICY "Public Insert Users" ON public.users FOR INSERT WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Update Users" ON public.users;
    CREATE POLICY "Public Update Users" ON public.users FOR UPDATE USING (true);

    DROP POLICY IF EXISTS "Public Posts" ON public.posts;
    CREATE POLICY "Public Posts" ON public.posts FOR ALL USING (true);

    DROP POLICY IF EXISTS "Public Post Likes" ON public.post_likes;
    CREATE POLICY "Public Post Likes" ON public.post_likes FOR ALL USING (true);

    DROP POLICY IF EXISTS "Public Post Comments" ON public.post_comments;
    CREATE POLICY "Public Post Comments" ON public.post_comments FOR ALL USING (true);

    DROP POLICY IF EXISTS "Public Dating Swipes" ON public.dating_swipes;
    CREATE POLICY "Public Dating Swipes" ON public.dating_swipes FOR ALL USING (true);

    DROP POLICY IF EXISTS "Public Matches" ON public.matches;
    CREATE POLICY "Public Matches" ON public.matches FOR ALL USING (true);

    DROP POLICY IF EXISTS "Public Profile Views" ON public.profile_views;
    CREATE POLICY "Public Profile Views" ON public.profile_views FOR ALL USING (true);

    DROP POLICY IF EXISTS "Public Auth Sessions" ON public.telegram_auth_sessions;
    CREATE POLICY "Public Auth Sessions" ON public.telegram_auth_sessions FOR ALL USING (true);
END
$$;
