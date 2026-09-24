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
@Table(name = "focus_sessions")
public class FocusSession {
    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "couple_id", nullable = false)
    private Couple couple;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 90)
    private String task;

    @Column(nullable = false)
    private int minutes;

    @Column(nullable = false)
    private int points;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected FocusSession() {
    }

    public FocusSession(Couple couple, User user, String task, int minutes, int points, Instant createdAt) {
        this.id = UUID.randomUUID();
        this.couple = couple;
        this.user = user;
        this.task = task;
        this.minutes = minutes;
        this.points = points;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public String getTask() {
        return task;
    }

    public int getMinutes() {
        return minutes;
    }

    public int getPoints() {
        return points;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
