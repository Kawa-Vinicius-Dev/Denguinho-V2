package com.denguinho.controller;

import com.denguinho.dto.ScoreboardResponse;
import com.denguinho.service.ScoreboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/couples/me/scoreboard")
public class ScoreboardController {
    private final ScoreboardService scoreboardService;

    public ScoreboardController(ScoreboardService scoreboardService) {
        this.scoreboardService = scoreboardService;
    }

    @GetMapping
    ScoreboardResponse get() {
        return scoreboardService.get();
    }
}
