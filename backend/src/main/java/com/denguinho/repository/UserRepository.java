package com.denguinho.repository;

import com.denguinho.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    List<User> findAllByCoupleIdOrderByCreatedAtAsc(UUID coupleId);

    long countByCoupleId(UUID coupleId);
}

