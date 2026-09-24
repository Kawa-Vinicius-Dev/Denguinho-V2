package com.denguinho.dto;

import java.util.UUID;

public record ChallengeProgressResponse(
        UUID id,
        int points,
        ChallengeResponse challenge
) {
}
