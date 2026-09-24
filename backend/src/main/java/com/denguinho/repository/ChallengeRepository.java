package com.denguinho.repository;

import com.denguinho.entity.Challenge;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChallengeRepository extends JpaRepository<Challenge, UUID> {
    List<Challenge> findAllByCouple_IdAndArchivedAtIsNullOrderByCreatedAtAsc(UUID coupleId);

    Optional<Challenge> findByIdAndCouple_IdAndArchivedAtIsNull(UUID id, UUID coupleId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT challenge FROM Challenge challenge
            WHERE challenge.id = :id
              AND challenge.couple.id = :coupleId
              AND challenge.archivedAt IS NULL
            """)
    Optional<Challenge> findActiveForUpdate(@Param("id") UUID id, @Param("coupleId") UUID coupleId);

    long countByCouple_IdAndArchivedAtIsNull(UUID coupleId);
}
