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
@Table(name = "dengos")
public class Dengo {
    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "couple_id", nullable = false)
    private Couple couple;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private DengoKind kind;

    @Column(nullable = false, length = 80)
    private String message;

    @Column(length = 100)
    private String subject;

    @Column(length = 40)
    private String response;

    @Column(name = "responded_at")
    private Instant respondedAt;

    @Column(length = 16)
    private String reaction;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected Dengo() {
    }

    public Dengo(
            Couple couple,
            User sender,
            DengoKind kind,
            String message,
            String subject,
            Instant createdAt
    ) {
        this.id = UUID.randomUUID();
        this.couple = couple;
        this.sender = sender;
        this.kind = kind;
        this.message = message;
        this.subject = subject;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public Couple getCouple() {
        return couple;
    }

    public User getSender() {
        return sender;
    }

    public DengoKind getKind() {
        return kind;
    }

    public String getMessage() {
        return message;
    }

    public String getSubject() {
        return subject;
    }

    public String getResponse() {
        return response;
    }

    public Instant getRespondedAt() {
        return respondedAt;
    }

    public String getReaction() {
        return reaction;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public boolean isSentBy(User user) {
        return sender.getId().equals(user.getId());
    }

    public void respond(String response, Instant when) {
        this.response = response;
        this.respondedAt = when;
    }

    public void react(String reaction) {
        this.reaction = reaction;
    }
}
