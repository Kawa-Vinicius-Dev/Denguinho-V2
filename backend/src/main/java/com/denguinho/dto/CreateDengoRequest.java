package com.denguinho.dto;

import com.denguinho.entity.DengoKind;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateDengoRequest(
        @NotNull DengoKind kind,
        @NotBlank @Size(max = 80) String message,
        @Size(max = 100) String subject
) {
}
