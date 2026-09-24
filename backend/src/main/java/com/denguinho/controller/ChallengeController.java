package com.denguinho.controller;

import com.denguinho.dto.ChallengeProgressResponse;
import com.denguinho.dto.ChallengeResponse;
import com.denguinho.dto.CreateChallengeRequest;
import com.denguinho.dto.UpdateChallengeRequest;
import com.denguinho.service.ChallengeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/couples/me/challenges")
public class ChallengeController {
    private final ChallengeService challengeService;

    public ChallengeController(ChallengeService challengeService) {
        this.challengeService = challengeService;
    }

    @GetMapping
    List<ChallengeResponse> list() {
        return challengeService.list();
    }

    @PostMapping
    ResponseEntity<ChallengeResponse> create(@Valid @RequestBody CreateChallengeRequest request) {
        ChallengeResponse created = challengeService.create(request);
        return ResponseEntity.created(location("/{id}", created.id())).body(created);
    }

    @PatchMapping("/{challengeId}")
    ChallengeResponse update(
            @PathVariable UUID challengeId,
            @Valid @RequestBody UpdateChallengeRequest request
    ) {
        return challengeService.update(challengeId, request);
    }

    @DeleteMapping("/{challengeId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@PathVariable UUID challengeId) {
        challengeService.delete(challengeId);
    }

    @PostMapping("/{challengeId}/progress")
    ResponseEntity<ChallengeProgressResponse> registerProgress(@PathVariable UUID challengeId) {
        ChallengeProgressResponse progress = challengeService.registerProgress(challengeId);
        return ResponseEntity.created(location("/{id}", progress.id())).body(progress);
    }

    @DeleteMapping("/{challengeId}/progress/{progressId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void undoProgress(@PathVariable UUID challengeId, @PathVariable UUID progressId) {
        challengeService.undoProgress(challengeId, progressId);
    }

    private URI location(String path, UUID id) {
        return ServletUriComponentsBuilder.fromCurrentRequest().path(path).buildAndExpand(id).toUri();
    }
}
