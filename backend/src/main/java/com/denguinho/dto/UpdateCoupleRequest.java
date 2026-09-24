package com.denguinho.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record UpdateCoupleRequest(
        @NotBlank @Size(max = 160) String currentObjective,
        @PastOrPresent LocalDate relationshipStartedOn,
        @Min(0) @Max(100) Integer photoPositionX,
        @Min(0) @Max(100) Integer photoPositionY
) {
}
