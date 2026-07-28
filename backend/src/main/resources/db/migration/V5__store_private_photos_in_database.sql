CREATE TABLE stored_photos (
    filename VARCHAR(255) PRIMARY KEY,
    owner_id UUID NOT NULL,
    content_type VARCHAR(32) NOT NULL,
    content BYTEA NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_stored_photos_owner_id ON stored_photos(owner_id);
