ALTER TABLE couples
    ADD COLUMN photo_position_x SMALLINT NOT NULL DEFAULT 50;

ALTER TABLE couples
    ADD COLUMN photo_position_y SMALLINT NOT NULL DEFAULT 50;

ALTER TABLE couples
    ADD CONSTRAINT ck_couples_photo_position_x
        CHECK (photo_position_x BETWEEN 0 AND 100);

ALTER TABLE couples
    ADD CONSTRAINT ck_couples_photo_position_y
        CHECK (photo_position_y BETWEEN 0 AND 100);
