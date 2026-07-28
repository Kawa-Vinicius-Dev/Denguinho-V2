CREATE TABLE couples (
    id UUID PRIMARY KEY,
    current_objective VARCHAR(160) NOT NULL DEFAULT 'Construir uma rotina que caiba na vida real',
    photo_filename VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE users (
    id UUID PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    email VARCHAR(160) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    couple_id UUID REFERENCES couples(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uk_users_email UNIQUE (email)
);

CREATE INDEX idx_users_couple_id ON users(couple_id);

CREATE TABLE couple_invites (
    id UUID PRIMARY KEY,
    code VARCHAR(12) NOT NULL,
    couple_id UUID NOT NULL REFERENCES couples(id),
    created_by UUID NOT NULL REFERENCES users(id),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uk_couple_invites_code UNIQUE (code)
);

CREATE INDEX idx_invites_couple_id ON couple_invites(couple_id);

