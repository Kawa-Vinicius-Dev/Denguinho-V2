package com.denguinho.dto;

import com.denguinho.entity.EventRecurrence;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CreateCoupleEventRequest(
        @NotBlank @Size(max = 100) String title,
        @NotNull LocalDate eventDate,
        @NotNull EventRecurrence recurrence
) {
}
