package com.denguinho;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CoupleActivityIntegrationTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void challengesAdvanceWithinTheirPeriodAndFeedTheScoreboard() throws Exception {
        String lia = register("Lia", "lia-activity@example.com");
        String caio = register("Caio", "caio-activity@example.com");
        pair(lia, caio);
        String nina = register("Nina", "nina-activity@example.com");
        String theo = register("Theo", "theo-activity@example.com");
        pair(nina, theo);

        JsonNode reading = json(perform(post("/api/couples/me/challenges"), lia, """
                {"title":"Ler 20 páginas","category":"STUDIES","period":"WEEKLY","scope":"INDIVIDUAL","goal":2}
                """)
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.pointsPerAdvance").value(25))
                .andExpect(jsonPath("$.progress").value(0)));
        String readingId = reading.get("id").asText();

        JsonNode cooking = json(perform(post("/api/couples/me/challenges"), caio, """
                {"title":"Cozinhar juntos","category":"RELATIONSHIP","period":"MONTHLY","scope":"COUPLE","goal":3}
                """)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.ownerId").doesNotExist())
                .andExpect(jsonPath("$.pointsPerAdvance").value(40)));
        String cookingId = cooking.get("id").asText();

        perform(post("/api/couples/me/challenges/{id}/progress", readingId), caio, null)
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("CHALLENGE_OWNER_ONLY"));

        perform(post("/api/couples/me/challenges/{id}/progress", readingId), lia, null)
                .andExpect(status().isCreated());
        String lastProgressId = json(perform(post("/api/couples/me/challenges/{id}/progress", readingId), lia, null)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.challenge.progress").value(2))
                .andExpect(jsonPath("$.challenge.completed").value(true)))
                .get("id").asText();
        perform(post("/api/couples/me/challenges/{id}/progress", readingId), lia, null)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CHALLENGE_PERIOD_COMPLETE"));

        perform(post("/api/couples/me/challenges/{id}/progress", cookingId), caio, null)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.points").value(40));

        perform(post("/api/couples/me/focus-sessions"), lia, """
                {"task":"Planejar a semana","minutes":25}
                """)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.points").value(25));

        perform(get("/api/couples/me/scoreboard"), caio, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.week.members.length()").value(2))
                .andExpect(jsonPath("$.week.members[0].name").value("Lia"))
                .andExpect(jsonPath("$.week.members[0].points").value(50))
                .andExpect(jsonPath("$.week.members[1].points").value(0))
                .andExpect(jsonPath("$.week.couplePoints").value(65))
                .andExpect(jsonPath("$.week.advances").value(3))
                .andExpect(jsonPath("$.week.focusMinutes").value(25))
                .andExpect(jsonPath("$.month.couplePoints").value(65))
                .andExpect(jsonPath("$.totals.points").value(115));

        perform(get("/api/couples/me/challenges"), nina, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
        perform(patch("/api/couples/me/challenges/{id}", readingId), nina, """
                {"title":"Invadido","category":"OTHER","period":"WEEKLY","goal":1}
                """)
                .andExpect(status().isNotFound());
        perform(delete("/api/couples/me/challenges/{id}/progress/{progressId}", readingId, lastProgressId), nina, null)
                .andExpect(status().isNotFound());

        perform(delete("/api/couples/me/challenges/{id}/progress/{progressId}", readingId, lastProgressId), lia, null)
                .andExpect(status().isNoContent());
        perform(get("/api/couples/me/challenges"), caio, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].title").value("Ler 20 páginas"))
                .andExpect(jsonPath("$[0].progress").value(1))
                .andExpect(jsonPath("$[0].completed").value(false));

        perform(delete("/api/couples/me/challenges/{id}", cookingId), lia, null)
                .andExpect(status().isNoContent());
        perform(get("/api/couples/me/challenges"), lia, null)
                .andExpect(jsonPath("$.length()").value(1));
        perform(get("/api/couples/me/scoreboard"), lia, null)
                .andExpect(jsonPath("$.week.couplePoints").value(65));
    }

    @Test
    void dengosTravelBetweenPartnersOnly() throws Exception {
        String lia = register("Lia", "lia-dengo@example.com");
        String caio = register("Caio", "caio-dengo@example.com");
        String nina = register("Nina", "nina-dengo@example.com");

        perform(post("/api/couples/invites"), nina, null).andExpect(status().isOk());
        perform(post("/api/couples/me/dengos"), nina, """
                {"kind":"REQUEST","message":"Um cheiro"}
                """)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("PARTNER_REQUIRED"));

        pair(lia, caio);
        String requestId = json(perform(post("/api/couples/me/dengos"), lia, """
                {"kind":"REQUEST","message":"Cadê meu denguinho?"}
                """)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.kind").value("REQUEST")))
                .get("id").asText();

        perform(put("/api/couples/me/dengos/{id}/response", requestId), lia, """
                {"response":"Tô indo"}
                """)
                .andExpect(status().isForbidden());
        perform(put("/api/couples/me/dengos/{id}/response", requestId), nina, """
                {"response":"Tô indo"}
                """)
                .andExpect(status().isNotFound());
        perform(put("/api/couples/me/dengos/{id}/response", requestId), caio, """
                {"response":"Tô indo"}
                """)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.response").value("Tô indo"));
        perform(put("/api/couples/me/dengos/{id}/reaction", requestId), lia, """
                {"reaction":"❤️"}
                """)
                .andExpect(status().isOk());

        perform(post("/api/couples/me/dengos"), caio, """
                {"kind":"CHEER","message":"🔥","subject":"Ler 20 páginas"}
                """)
                .andExpect(status().isCreated());

        String recent = perform(get("/api/couples/me/dengos"), lia, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].kind").value("CHEER"))
                .andExpect(jsonPath("$[0].subject").value("Ler 20 páginas"))
                .andExpect(jsonPath("$[1].response").value("Tô indo"))
                .andReturn()
                .getResponse()
                .getContentAsString(StandardCharsets.UTF_8);
        assertThat(recent).contains("❤️");

        perform(get("/api/couples/me/dengos"), nina, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
        perform(get("/api/couples/me/scoreboard"), caio, null)
                .andExpect(jsonPath("$.week.dengos").value(2))
                .andExpect(jsonPath("$.totals.dengos").value(2));
    }

    private ResultActions perform(MockHttpServletRequestBuilder request, String token, String body) throws Exception {
        request.header("Authorization", "Bearer " + token);
        if (body != null) {
            request.contentType(MediaType.APPLICATION_JSON).content(body);
        }
        return mockMvc.perform(request);
    }

    private JsonNode json(ResultActions result) throws Exception {
        return objectMapper.readTree(result.andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8));
    }

    private void pair(String inviterToken, String partnerToken) throws Exception {
        String code = json(perform(post("/api/couples/invites"), inviterToken, null)
                .andExpect(status().isOk()))
                .get("code").asText();
        perform(post("/api/couples/join"), partnerToken, """
                {"code":"%s"}
                """.formatted(code))
                .andExpect(status().isOk());
    }

    private String register(String name, String email) throws Exception {
        String body = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"%s","email":"%s","password":"senha-segura"}
                                """.formatted(name, email)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(body).get("token").asText();
    }
}
