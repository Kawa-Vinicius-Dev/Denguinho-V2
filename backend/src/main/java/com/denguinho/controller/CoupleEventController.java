package com.denguinho.controller;

import com.denguinho.dto.CoupleEventResponse;
import com.denguinho.dto.CreateCoupleEventRequest;
import com.denguinho.service.CoupleEventService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/couples/me/events")
public class CoupleEventController {
    private final CoupleEventService eventService;

    public CoupleEventController(CoupleEventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping
    List<CoupleEventResponse> list() {
        return eventService.list();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    CoupleEventResponse create(@Valid @RequestBody CreateCoupleEventRequest request) {
        return eventService.create(request);
    }

    @PatchMapping("/{eventId}")
    CoupleEventResponse update(
            @PathVariable UUID eventId,
            @Valid @RequestBody CreateCoupleEventRequest request
    ) {
        return eventService.update(eventId, request);
    }

    @DeleteMapping("/{eventId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@PathVariable UUID eventId) {
        eventService.delete(eventId);
    }
}
