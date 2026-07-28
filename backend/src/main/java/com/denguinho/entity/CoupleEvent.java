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
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "couple_events")
public class CoupleEvent {
    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "couple_id", nullable = false)
    private Couple couple;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(name = "event_date", nullable = false)
    private LocalDate eventDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private EventRecurrence recurrence;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected CoupleEvent() {
    }

    public CoupleEvent(
            Couple couple,
            String title,
            LocalDate eventDate,
            EventRecurrence recurrence,
            User createdBy
    ) {
        this.id = UUID.randomUUID();
        this.couple = couple;
        this.title = title;
        this.eventDate = eventDate;
        this.recurrence = recurrence;
        this.createdBy = createdBy;
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public Couple getCouple() {
        return couple;
    }

    public String getTitle() {
        return title;
    }

    public LocalDate getEventDate() {
        return eventDate;
    }

    public EventRecurrence getRecurrence() {
        return recurrence;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public void update(String title, LocalDate eventDate, EventRecurrence recurrence) {
        this.title = title;
        this.eventDate = eventDate;
        this.recurrence = recurrence;
    }
}
