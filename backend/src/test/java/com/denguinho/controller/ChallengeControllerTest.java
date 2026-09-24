package com.denguinho.controller;

import com.denguinho.config.SecurityConfig;
import com.denguinho.dto.ChallengeProgressResponse;
import com.denguinho.dto.ChallengeResponse;
import com.denguinho.entity.ChallengeCategory;
import com.denguinho.entity.ChallengePeriod;
import com.denguinho.entity.ChallengeScope;
import com.denguinho.exception.BusinessException;
import com.denguinho.security.AppUserDetailsService;
import com.denguinho.security.JwtService;
import com.denguinho.service.ChallengeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ChallengeController.class)
@Import({SecurityConfig.class, ChallengeControllerTest.WebSecurity.class})
class ChallengeControllerTest {
    private static final UUID CHALLENGE_ID = UUID.fromString("7a1f1d4e-2b8c-4a53-9d1e-6a4c1f0b2c3d");

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @MockitoBean
    private ChallengeService challengeService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private AppUserDetailsService userDetailsService;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @Test
    void requiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/couples/me/challenges"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser
    void listsChallengesWithTheirCurrentPeriod() throws Exception {
        when(challengeService.list()).thenReturn(List.of(response(2, true)));

        mockMvc.perform(get("/api/couples/me/challenges"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(CHALLENGE_ID.toString()))
                .andExpect(jsonPath("$[0].period").value("WEEKLY"))
                .andExpect(jsonPath("$[0].progress").value(2))
                .andExpect(jsonPath("$[0].completed").value(true))
                .andExpect(jsonPath("$[0].periodStartsOn").value("2026-09-21"))
                .andExpect(jsonPath("$[0].history").isArray());
    }

    @Test
    @WithMockUser
    void createsAChallengeAndPointsToIt() throws Exception {
        when(challengeService.create(any())).thenReturn(response(0, false));

        mockMvc.perform(post("/api/couples/me/challenges")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title":"Ler 20 páginas",
                                  "category":"STUDIES",
                                  "period":"WEEKLY",
                                  "scope":"INDIVIDUAL",
                                  "goal":2
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().string(
                        "Location",
                        "http://localhost/api/couples/me/challenges/" + CHALLENGE_ID
                ))
                .andExpect(jsonPath("$.title").value("Ler 20 páginas"))
                .andExpect(jsonPath("$.pointsPerAdvance").value(25));
    }

    @Test
    @WithMockUser
    void rejectsInvalidChallenges() throws Exception {
        mockMvc.perform(post("/api/couples/me/challenges")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":" ","category":"STUDIES","period":"WEEKLY","scope":"COUPLE","goal":21}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fields.title").exists())
                .andExpect(jsonPath("$.fields.goal").exists());

        verify(challengeService, never()).create(any());
    }

    @Test
    @WithMockUser
    void rejectsDailyChallenges() throws Exception {
        mockMvc.perform(post("/api/couples/me/challenges")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Beber água","category":"HEALTH","period":"DAILY","scope":"INDIVIDUAL","goal":1}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST_BODY"));

        verify(challengeService, never()).create(any());
    }

    @Test
    @WithMockUser
    void registersProgress() throws Exception {
        UUID progressId = UUID.fromString("0f6a4b8e-5c2d-4e1f-8a3b-9c7d6e5f4a3b");
        when(challengeService.registerProgress(CHALLENGE_ID))
                .thenReturn(new ChallengeProgressResponse(progressId, 25, response(1, false)));

        mockMvc.perform(post("/api/couples/me/challenges/{id}/progress", CHALLENGE_ID))
                .andExpect(status().isCreated())
                .andExpect(header().string(
                        "Location",
                        "http://localhost/api/couples/me/challenges/%s/progress/%s".formatted(CHALLENGE_ID, progressId)
                ))
                .andExpect(jsonPath("$.points").value(25))
                .andExpect(jsonPath("$.challenge.progress").value(1));
    }

    @Test
    @WithMockUser
    void explainsWhyProgressWasRefused() throws Exception {
        when(challengeService.registerProgress(CHALLENGE_ID)).thenThrow(new BusinessException(
                HttpStatus.FORBIDDEN,
                "CHALLENGE_OWNER_ONLY",
                "Só quem criou pode registrar avanços."
        ));

        mockMvc.perform(post("/api/couples/me/challenges/{id}/progress", CHALLENGE_ID))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("CHALLENGE_OWNER_ONLY"))
                .andExpect(jsonPath("$.message").value("Só quem criou pode registrar avanços."));
    }

    @Test
    @WithMockUser
    void deletesAndUndoesWithNoContent() throws Exception {
        UUID progressId = UUID.randomUUID();

        mockMvc.perform(delete("/api/couples/me/challenges/{id}", CHALLENGE_ID))
                .andExpect(status().isNoContent());
        mockMvc.perform(delete("/api/couples/me/challenges/{id}/progress/{progressId}", CHALLENGE_ID, progressId))
                .andExpect(status().isNoContent());

        verify(challengeService).delete(CHALLENGE_ID);
        verify(challengeService).undoProgress(CHALLENGE_ID, progressId);
    }

    @Test
    @WithMockUser
    void rejectsMalformedIdentifiers() throws Exception {
        doThrow(new IllegalStateException("não deveria ser chamado")).when(challengeService).delete(any());

        mockMvc.perform(delete("/api/couples/me/challenges/{id}", "nao-e-uuid"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_PARAMETER"));
    }

    @TestConfiguration
    @EnableWebSecurity
    static class WebSecurity {
    }

    private ChallengeResponse response(int progress, boolean completed) {
        return new ChallengeResponse(
                CHALLENGE_ID,
                "Ler 20 páginas",
                ChallengeCategory.STUDIES,
                ChallengePeriod.WEEKLY,
                ChallengeScope.INDIVIDUAL,
                UUID.randomUUID(),
                2,
                25,
                progress,
                completed,
                LocalDate.of(2026, 9, 21),
                LocalDate.of(2026, 9, 27),
                null,
                List.of(),
                UUID.randomUUID(),
                Instant.parse("2026-09-20T12:00:00Z")
        );
    }
}
