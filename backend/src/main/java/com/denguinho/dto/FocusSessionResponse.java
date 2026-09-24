package com.denguinho.dto;

import java.time.Instant;
import java.util.UUID;

public record FocusSessionResponse(
        UUID id,
        String task,
        int minutes,
        int points,
        UUID userId,
        Instant createdAt
) {
}
