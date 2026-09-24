package com.denguinho.repository;

import com.denguinho.entity.Dengo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DengoRepository extends JpaRepository<Dengo, UUID> {
    List<Dengo> findTop30ByCouple_IdOrderByCreatedAtDesc(UUID coupleId);

    Optional<Dengo> findByIdAndCouple_Id(UUID id, UUID coupleId);

    long countByCouple_IdAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
            UUID coupleId,
            Instant from,
            Instant to
    );

    long countByCouple_Id(UUID coupleId);
}
