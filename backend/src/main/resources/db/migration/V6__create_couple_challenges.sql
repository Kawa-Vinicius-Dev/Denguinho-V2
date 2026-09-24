CREATE TABLE challenges (
    id UUID PRIMARY KEY,
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES users(id),
    title VARCHAR(80) NOT NULL,
    category VARCHAR(24) NOT NULL,
    period VARCHAR(16) NOT NULL,
    scope VARCHAR(16) NOT NULL,
    goal INTEGER NOT NULL,
    points_per_advance INTEGER NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    archived_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT ck_challenges_category
        CHECK (category IN ('STUDIES', 'WORK', 'PROJECTS', 'HEALTH', 'ORGANIZATION',
                            'FINANCES', 'RELATIONSHIP', 'LEISURE', 'OTHER')),
    CONSTRAINT ck_challenges_period CHECK (period IN ('WEEKLY', 'MONTHLY')),
    CONSTRAINT ck_challenges_scope CHECK (scope IN ('INDIVIDUAL', 'COUPLE')),
    CONSTRAINT ck_challenges_goal CHECK (goal BETWEEN 1 AND 20),
    CONSTRAINT ck_challenges_points CHECK (points_per_advance > 0),
    CONSTRAINT ck_challenges_owner CHECK (
        (scope = 'INDIVIDUAL' AND owner_id IS NOT NULL)
        OR (scope = 'COUPLE' AND owner_id IS NULL)
    )
);

CREATE INDEX idx_challenges_couple_id ON challenges(couple_id);
CREATE INDEX idx_challenges_owner_id ON challenges(owner_id);
CREATE INDEX idx_challenges_created_by ON challenges(created_by);

CREATE TABLE challenge_progress (
    id UUID PRIMARY KEY,
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    points INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT ck_challenge_progress_points CHECK (points > 0)
);

CREATE INDEX idx_challenge_progress_challenge_created
    ON challenge_progress(challenge_id, created_at);

CREATE INDEX idx_challenge_progress_user_id ON challenge_progress(user_id);
