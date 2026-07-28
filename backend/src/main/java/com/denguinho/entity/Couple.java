package com.denguinho.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "couples")
public class Couple {
    @Id
    private UUID id;

    @Column(name = "current_objective", nullable = false, length = 160)
    private String currentObjective;

    @Column(name = "photo_filename")
    private String photoFilename;

    @Column(name = "relationship_started_on")
    private LocalDate relationshipStartedOn;

    @Column(name = "photo_position_x", nullable = false)
    private short photoPositionX;

    @Column(name = "photo_position_y", nullable = false)
    private short photoPositionY;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected Couple() {
    }

    public Couple(String currentObjective) {
        this.id = UUID.randomUUID();
        this.currentObjective = currentObjective;
        this.photoPositionX = 50;
        this.photoPositionY = 50;
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public String getCurrentObjective() {
        return currentObjective;
    }

    public void setCurrentObjective(String currentObjective) {
        this.currentObjective = currentObjective;
    }

    public String getPhotoFilename() {
        return photoFilename;
    }

    public void setPhotoFilename(String photoFilename) {
        this.photoFilename = photoFilename;
    }

    public LocalDate getRelationshipStartedOn() {
        return relationshipStartedOn;
    }

    public void setRelationshipStartedOn(LocalDate relationshipStartedOn) {
        this.relationshipStartedOn = relationshipStartedOn;
    }

    public int getPhotoPositionX() {
        return photoPositionX;
    }

    public void setPhotoPositionX(int photoPositionX) {
        this.photoPositionX = (short) photoPositionX;
    }

    public int getPhotoPositionY() {
        return photoPositionY;
    }

    public void setPhotoPositionY(int photoPositionY) {
        this.photoPositionY = (short) photoPositionY;
    }
}
