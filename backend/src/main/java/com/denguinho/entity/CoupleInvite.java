package com.denguinho.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "couple_invites")
public class CoupleInvite {
    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 12)
    private String code;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "couple_id", nullable = false)
    private Couple couple;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "used_at")
    private Instant usedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected CoupleInvite() {
    }

    public CoupleInvite(String code, Couple couple, User createdBy, Instant expiresAt) {
        this.id = UUID.randomUUID();
        this.code = code;
        this.couple = couple;
        this.createdBy = createdBy;
        this.expiresAt = expiresAt;
        this.createdAt = Instant.now();
    }

    public String getCode() {
        return code;
    }

    public Couple getCouple() {
        return couple;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public Instant getUsedAt() {
        return usedAt;
    }

    public boolean isAvailable(Instant now) {
        return usedAt == null && expiresAt.isAfter(now);
    }

    public void markUsed(Instant when) {
        this.usedAt = when;
    }
}

