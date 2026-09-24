package com.denguinho.dto;

import com.denguinho.entity.ChallengeCategory;
import com.denguinho.entity.ChallengePeriod;
import com.denguinho.entity.ChallengeScope;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record ChallengeResponse(
        UUID id,
        String title,
        ChallengeCategory category,
        ChallengePeriod period,
        ChallengeScope scope,
        UUID ownerId,
        int goal,
        int pointsPerAdvance,
        int progress,
        boolean completed,
        LocalDate periodStartsOn,
        LocalDate periodEndsOn,
        UUID lastProgressId,
        List<PeriodResult> history,
        UUID createdBy,
        Instant createdAt
) {
    public record PeriodResult(
            LocalDate startsOn,
            LocalDate endsOn,
            int progress,
            boolean completed
    ) {
    }
}
