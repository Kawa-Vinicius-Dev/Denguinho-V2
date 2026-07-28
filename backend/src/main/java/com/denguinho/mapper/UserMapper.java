package com.denguinho.mapper;

import com.denguinho.dto.UserResponse;
import com.denguinho.entity.User;

public final class UserMapper {
    private UserMapper() {
    }

    public static UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getCouple() == null ? null : user.getCouple().getId(),
                user.getAvatarFilename() != null
        );
    }
}
