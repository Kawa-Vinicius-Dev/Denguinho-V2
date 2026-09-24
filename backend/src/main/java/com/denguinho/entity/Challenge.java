package com.denguinho.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "challenges")
public class Challenge {
    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "couple_id", nullable = false)
    private Couple couple;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;

    @Column(nullable = false, length = 80)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private ChallengeCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private ChallengePeriod period;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private ChallengeScope scope;

    @Column(nullable = false)
    private int goal;

    @Column(name = "points_per_advance", nullable = false)
    private int pointsPerAdvance;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "archived_at")
    private Instant archivedAt;

    protected Challenge() {
    }

    public Challenge(
            Couple couple,
            User createdBy,
            String title,
            ChallengeCategory category,
            ChallengePeriod period,
            ChallengeScope scope,
            int goal,
            Instant createdAt
    ) {
        this.id = UUID.randomUUID();
        this.couple = couple;
        this.createdBy = createdBy;
        this.owner = scope == ChallengeScope.INDIVIDUAL ? createdBy : null;
        this.title = title;
        this.category = category;
        this.period = period;
        this.scope = scope;
        this.goal = goal;
        this.pointsPerAdvance = scope.pointsPerAdvance();
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public Couple getCouple() {
        return couple;
    }

    public User getOwner() {
        return owner;
    }

    public String getTitle() {
        return title;
    }

    public ChallengeCategory getCategory() {
        return category;
    }

    public ChallengePeriod getPeriod() {
        return period;
    }

    public ChallengeScope getScope() {
        return scope;
    }

    public int getGoal() {
        return goal;
    }

    public int getPointsPerAdvance() {
        return pointsPerAdvance;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getArchivedAt() {
        return archivedAt;
    }

    /** Desafios em casal são de ambos; desafios individuais só de quem os criou. */
    public boolean belongsTo(User user) {
        return owner == null || owner.getId().equals(user.getId());
    }

    public void update(String title, ChallengeCategory category, ChallengePeriod period, int goal) {
        this.title = title;
        this.category = category;
        this.period = period;
        this.goal = goal;
    }

    public void archive(Instant when) {
        this.archivedAt = when;
    }
}
