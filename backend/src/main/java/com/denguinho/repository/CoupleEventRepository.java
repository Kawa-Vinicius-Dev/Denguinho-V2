package com.denguinho.repository;

import com.denguinho.entity.CoupleEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CoupleEventRepository extends JpaRepository<CoupleEvent, UUID> {
    List<CoupleEvent> findAllByCouple_IdOrderByEventDateAsc(UUID coupleId);

    Optional<CoupleEvent> findByIdAndCouple_Id(UUID id, UUID coupleId);
}
