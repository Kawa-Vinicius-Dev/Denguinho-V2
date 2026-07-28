package com.denguinho.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record JoinCoupleRequest(
        @NotBlank
        @Pattern(regexp = "[A-Za-z0-9]{6}", message = "deve conter 6 letras ou números")
        String code
) {
}

