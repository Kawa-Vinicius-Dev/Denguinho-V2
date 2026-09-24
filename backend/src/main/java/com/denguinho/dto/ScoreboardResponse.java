package com.denguinho.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record ScoreboardResponse(
        PeriodScore week,
        PeriodScore month,
        Totals totals
) {
    public record PeriodScore(
            LocalDate startsOn,
            LocalDate endsOn,
            List<MemberScore> members,
            int couplePoints,
            int advances,
            int focusSessions,
            int focusMinutes,
            int dengos
    ) {
    }

    public record MemberScore(
            UUID userId,
            String name,
            int points,
            int advances
    ) {
    }

    public record Totals(
            long points,
            long advances,
            long focusSessions,
            long dengos
    ) {
    }
}
