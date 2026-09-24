package com.denguinho.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateFocusSessionRequest(
        @NotBlank @Size(max = 90) String task,
        @NotNull @Min(5) @Max(180) Integer minutes
) {
}
