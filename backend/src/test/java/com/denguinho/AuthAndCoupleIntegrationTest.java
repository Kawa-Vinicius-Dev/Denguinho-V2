package com.denguinho;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthAndCoupleIntegrationTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void registersAuthenticatesAndFormsCoupleThroughSingleUseInvite() throws Exception {
        String firstToken = register("Lia", "lia@example.com");
        String secondToken = register("Caio", "caio@example.com");

        String inviteBody = mockMvc.perform(post("/api/couples/invites")
                        .header("Authorization", bearer(firstToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").isString())
                .andReturn()
                .getResponse()
                .getContentAsString();
        String code = objectMapper.readTree(inviteBody).get("code").asText();

        mockMvc.perform(post("/api/couples/join")
                        .header("Authorization", bearer(secondToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"code":"%s"}
                                """.formatted(code)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.members.length()").value(2))
                .andExpect(jsonPath("$.members[0].email").value("lia@example.com"))
                .andExpect(jsonPath("$.members[1].email").value("caio@example.com"));

        mockMvc.perform(get("/api/couples/me")
                        .header("Authorization", bearer(firstToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.members.length()").value(2));

        String thirdToken = register("Bia", "bia@example.com");
        mockMvc.perform(post("/api/couples/join")
                        .header("Authorization", bearer(thirdToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"code":"%s"}
                                """.formatted(code)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("INVALID_INVITE"));
    }

    @Test
    void rejectsDuplicateEmailAndInvalidCredentials() throws Exception {
        register("Nina", "nina@example.com");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Outra Nina","email":"NINA@example.com","password":"senha-segura"}
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("EMAIL_ALREADY_USED"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"nina@example.com","password":"senha-incorreta"}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
    }

    @Test
    void protectedResourcesRequireJwt() throws Exception {
        String response = mockMvc.perform(get("/api/me"))
                .andExpect(status().isUnauthorized())
                .andReturn()
                .getResponse()
                .getContentAsString();
        assertThat(response).isEmpty();
    }

    @Test
    void configuresRelationshipDateAndManagesCoupleAgenda() throws Exception {
        String token = register("Kawã", "kawa-agenda@example.com");

        mockMvc.perform(post("/api/couples/invites")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/api/couples/me")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "currentObjective":"Planejar e viver bons momentos juntos",
                                  "relationshipStartedOn":"2024-06-26",
                                  "photoPositionX":42,
                                  "photoPositionY":68
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.relationshipStartedOn").value("2024-06-26"))
                .andExpect(jsonPath("$.photoPositionX").value(42))
                .andExpect(jsonPath("$.photoPositionY").value(68));

        String eventBody = mockMvc.perform(post("/api/couples/me/events")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title":"Trocar presentes",
                                  "eventDate":"2026-08-15",
                                  "recurrence":"MONTHLY"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Trocar presentes"))
                .andExpect(jsonPath("$.recurrence").value("MONTHLY"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String eventId = objectMapper.readTree(eventBody).get("id").asText();

        mockMvc.perform(patch("/api/couples/me/events/{eventId}", eventId)
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title":"Trocar presentes e jantar",
                                  "eventDate":"2026-08-26",
                                  "recurrence":"YEARLY"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Trocar presentes e jantar"))
                .andExpect(jsonPath("$.eventDate").value("2026-08-26"))
                .andExpect(jsonPath("$.recurrence").value("YEARLY"));

        mockMvc.perform(get("/api/couples/me/events")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].eventDate").value("2026-08-26"));

        mockMvc.perform(delete("/api/couples/me/events/{eventId}", eventId)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/couples/me/events")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void updatesPersonalProfileAvatarAndPassword() throws Exception {
        String token = register("Kawã", "kawa-profile@example.com");

        mockMvc.perform(patch("/api/me")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Kawã Alves"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Kawã Alves"))
                .andExpect(jsonPath("$.hasAvatar").value(false));

        byte[] png = new byte[]{
                (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
                0x00, 0x00, 0x00, 0x00
        };
        MockMultipartFile avatar = new MockMultipartFile(
                "avatar",
                "avatar.png",
                "image/png",
                png
        );

        mockMvc.perform(multipart("/api/me/avatar")
                        .file(avatar)
                        .with(request -> {
                            request.setMethod("PUT");
                            return request;
                        })
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasAvatar").value(true));

        mockMvc.perform(get("/api/me/avatar")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(result -> assertThat(result.getResponse().getContentType())
                        .isEqualTo("image/png"));

        mockMvc.perform(patch("/api/me/password")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "currentPassword":"senha-segura",
                                  "newPassword":"senha-nova-123"
                                }
                                """))
                .andExpect(status().isNoContent());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email":"kawa-profile@example.com",
                                  "password":"senha-segura"
                                }
                                """))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email":"kawa-profile@example.com",
                                  "password":"senha-nova-123"
                                }
                                """))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/me/avatar")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasAvatar").value(false));
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
        JsonNode response = objectMapper.readTree(body);
        return response.get("token").asText();
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }
}
