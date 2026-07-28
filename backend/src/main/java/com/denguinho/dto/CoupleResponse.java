package com.denguinho.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CoupleResponse(
        UUID id,
        List<UserResponse> members,
        String currentObjective,
        LocalDate relationshipStartedOn,
        int photoPositionX,
        int photoPositionY,
        boolean hasCustomPhoto,
        int jointProgress
) {
}
