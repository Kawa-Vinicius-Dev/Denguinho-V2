package com.denguinho.entity;

public enum ChallengeScope {
    INDIVIDUAL(25),
    COUPLE(40);

    private final int pointsPerAdvance;

    ChallengeScope(int pointsPerAdvance) {
        this.pointsPerAdvance = pointsPerAdvance;
    }

    public int pointsPerAdvance() {
        return pointsPerAdvance;
    }
}
