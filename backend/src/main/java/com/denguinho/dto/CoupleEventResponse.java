package com.denguinho.dto;

import com.denguinho.entity.EventRecurrence;

import java.time.LocalDate;
import java.util.UUID;

public record CoupleEventResponse(
        UUID id,
        String title,
        LocalDate eventDate,
        EventRecurrence recurrence,
        UUID createdBy
) {
}
