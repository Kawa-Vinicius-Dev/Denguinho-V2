CREATE TABLE dengos (
    id UUID PRIMARY KEY,
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    kind VARCHAR(16) NOT NULL,
    message VARCHAR(80) NOT NULL,
    subject VARCHAR(100),
    response VARCHAR(40),
    responded_at TIMESTAMP WITH TIME ZONE,
    reaction VARCHAR(16),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT ck_dengos_kind CHECK (kind IN ('REQUEST', 'CHEER'))
);

CREATE INDEX idx_dengos_couple_created ON dengos(couple_id, created_at);
CREATE INDEX idx_dengos_sender_id ON dengos(sender_id);

CREATE TABLE focus_sessions (
    id UUID PRIMARY KEY,
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    task VARCHAR(90) NOT NULL,
    minutes INTEGER NOT NULL,
    points INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT ck_focus_sessions_minutes CHECK (minutes BETWEEN 1 AND 180),
    CONSTRAINT ck_focus_sessions_points CHECK (points >= 0)
);

CREATE INDEX idx_focus_sessions_couple_created ON focus_sessions(couple_id, created_at);
CREATE INDEX idx_focus_sessions_user_id ON focus_sessions(user_id);
