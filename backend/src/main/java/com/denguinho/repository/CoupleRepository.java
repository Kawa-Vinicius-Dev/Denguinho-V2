package com.denguinho.repository;

import com.denguinho.entity.Couple;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CoupleRepository extends JpaRepository<Couple, UUID> {
}

