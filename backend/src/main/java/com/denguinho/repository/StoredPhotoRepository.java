package com.denguinho.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public class StoredPhotoRepository {
    private final JdbcTemplate jdbcTemplate;

    public StoredPhotoRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void save(
            String filename,
            UUID ownerId,
            String contentType,
            byte[] content
    ) {
        jdbcTemplate.update(
                """
                INSERT INTO stored_photos (filename, owner_id, content_type, content, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                filename,
                ownerId,
                contentType,
                content,
                Timestamp.from(Instant.now())
        );
    }

    public Optional<StoredPhoto> findByFilename(String filename) {
        return jdbcTemplate.query(
                        """
                        SELECT filename, content_type, content
                        FROM stored_photos
                        WHERE filename = ?
                        """,
                        (resultSet, rowNumber) -> new StoredPhoto(
                                resultSet.getString("filename"),
                                resultSet.getString("content_type"),
                                resultSet.getBytes("content")
                        ),
                        filename
                )
                .stream()
                .findFirst();
    }

    public void deleteByFilename(String filename) {
        jdbcTemplate.update(
                "DELETE FROM stored_photos WHERE filename = ?",
                filename
        );
    }

    public record StoredPhoto(
            String filename,
            String contentType,
            byte[] content
    ) {
    }
}
