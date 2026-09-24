package com.denguinho.dto;

import com.denguinho.entity.ChallengeCategory;
import com.denguinho.entity.ChallengePeriod;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateChallengeRequest(
        @NotBlank @Size(max = 80) String title,
        @NotNull ChallengeCategory category,
        @NotNull ChallengePeriod period,
        @NotNull @Min(1) @Max(20) Integer goal
) {
}
