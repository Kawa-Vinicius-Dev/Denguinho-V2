package com.denguinho.repository;

import com.denguinho.entity.CoupleInvite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;

public interface CoupleInviteRepository extends JpaRepository<CoupleInvite, UUID> {
    boolean existsByCodeIgnoreCase(String code);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<CoupleInvite> findByCodeIgnoreCase(String code);
}
