ALTER TABLE couples
    ADD COLUMN relationship_started_on DATE;

CREATE TABLE couple_events (
    id UUID PRIMARY KEY,
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    event_date DATE NOT NULL,
    recurrence VARCHAR(16) NOT NULL DEFAULT 'NONE',
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT ck_couple_events_recurrence
        CHECK (recurrence IN ('NONE', 'MONTHLY', 'YEARLY'))
);

CREATE INDEX idx_couple_events_couple_date
    ON couple_events(couple_id, event_date);

CREATE INDEX idx_couple_events_created_by
    ON couple_events(created_by);
