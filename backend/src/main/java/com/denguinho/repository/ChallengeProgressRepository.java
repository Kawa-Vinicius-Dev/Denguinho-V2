package com.denguinho.repository;

import com.denguinho.entity.ChallengeProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChallengeProgressRepository extends JpaRepository<ChallengeProgress, UUID> {
    List<ChallengeProgress> findAllByChallenge_IdInAndCreatedAtGreaterThanEqual(
            Collection<UUID> challengeIds,
            Instant from
    );

    Optional<ChallengeProgress> findByIdAndChallenge_Id(UUID id, UUID challengeId);

    @Query("""
            SELECT progress FROM ChallengeProgress progress
            JOIN FETCH progress.challenge challenge
            WHERE challenge.couple.id = :coupleId
              AND progress.createdAt >= :from
              AND progress.createdAt < :to
            """)
    List<ChallengeProgress> findAllForCoupleBetween(
            @Param("coupleId") UUID coupleId,
            @Param("from") Instant from,
            @Param("to") Instant to
    );

    @Query("""
            SELECT COALESCE(SUM(progress.points), 0) FROM ChallengeProgress progress
            WHERE progress.challenge.couple.id = :coupleId
            """)
    long sumPointsByCoupleId(@Param("coupleId") UUID coupleId);

    long countByChallenge_Couple_Id(UUID coupleId);
}
