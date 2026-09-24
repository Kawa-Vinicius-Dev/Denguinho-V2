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
@Table(name = "challenge_progress")
public class ChallengeProgress {
    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "challenge_id", nullable = false)
    private Challenge challenge;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private int points;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected ChallengeProgress() {
    }

    public ChallengeProgress(Challenge challenge, User user, Instant createdAt) {
        this.id = UUID.randomUUID();
        this.challenge = challenge;
        this.user = user;
        this.points = challenge.getPointsPerAdvance();
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public Challenge getChallenge() {
        return challenge;
    }

    public User getUser() {
        return user;
    }

    public int getPoints() {
        return points;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
