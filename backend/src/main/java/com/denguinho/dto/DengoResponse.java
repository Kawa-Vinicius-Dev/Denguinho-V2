package com.denguinho.dto;

import com.denguinho.entity.DengoKind;

import java.time.Instant;
import java.util.UUID;

public record DengoResponse(
        UUID id,
        DengoKind kind,
        String message,
        String subject,
        UUID senderId,
        String response,
        Instant respondedAt,
        String reaction,
        Instant createdAt
) {
}
