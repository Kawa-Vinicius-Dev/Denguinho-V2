package com.denguinho.repository;

import com.denguinho.entity.FocusSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface FocusSessionRepository extends JpaRepository<FocusSession, UUID> {
    List<FocusSession> findAllByCouple_IdAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
            UUID coupleId,
            Instant from,
            Instant to
    );

    @Query("""
            SELECT COALESCE(SUM(session.points), 0) FROM FocusSession session
            WHERE session.couple.id = :coupleId
            """)
    long sumPointsByCoupleId(@Param("coupleId") UUID coupleId);

    long countByCouple_Id(UUID coupleId);
}
