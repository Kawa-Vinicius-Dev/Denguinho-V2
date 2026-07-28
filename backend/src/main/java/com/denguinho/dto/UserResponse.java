package com.denguinho.dto;

import java.util.UUID;

public record UserResponse(
        UUID id,
        String name,
        String email,
        UUID coupleId,
        boolean hasAvatar
) {
}
