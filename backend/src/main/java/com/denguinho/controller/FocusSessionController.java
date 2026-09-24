package com.denguinho.controller;

import com.denguinho.dto.CreateFocusSessionRequest;
import com.denguinho.dto.FocusSessionResponse;
import com.denguinho.service.FocusSessionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@RequestMapping("/api/couples/me/focus-sessions")
public class FocusSessionController {
    private final FocusSessionService focusSessionService;

    public FocusSessionController(FocusSessionService focusSessionService) {
        this.focusSessionService = focusSessionService;
    }

    @PostMapping
    ResponseEntity<FocusSessionResponse> register(@Valid @RequestBody CreateFocusSessionRequest request) {
        FocusSessionResponse session = focusSessionService.register(request);
        return ResponseEntity.created(ServletUriComponentsBuilder.fromCurrentRequest()
                        .path("/{id}")
                        .buildAndExpand(session.id())
                        .toUri())
                .body(session);
    }
}
