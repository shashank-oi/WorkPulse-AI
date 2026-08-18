package com.workpulse.app;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class AuthFlowTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String uniqueEmail(String prefix) {
        return prefix + UUID.randomUUID().toString().substring(0, 8) + "@example.com";
    }

    private MvcResult postJson(String url, Object body, String token) throws Exception {
        var request = post(url)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body));
        if (token != null) {
            request.header("Authorization", "Bearer " + token);
        }
        return mockMvc.perform(request).andReturn();
    }

    private JsonNode json(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    /** Registers a fresh account and returns the JWT. */
    private String register(String name, String email, String password) throws Exception {
        MvcResult result = postJson("/api/auth/register",
                Map.of("name", name, "email", email, "password", password), null);
        assertThat(result.getResponse().getStatus()).isEqualTo(200);
        return json(result).path("token").asText();
    }

    @Test
    void registerLoginAndMe() throws Exception {
        String email = uniqueEmail("alice");
        String token = register("Alice", email, "password123");

        // me returns the fresh account with no company yet.
        MvcResult me = mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.role").value("user"))
                .andExpect(jsonPath("$.status").value("active"))
                .andExpect(jsonPath("$.companyId").doesNotExist())
                .andReturn();
        assertThat(json(me).path("id").asLong()).isPositive();

        // Login with the right password.
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("email", email, "password", "password123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value(email));

        // Wrong password and unknown email both fail with 401.
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("email", email, "password", "wrong-password"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid email or password"));

        // Duplicate registration conflicts.
        MvcResult dup = postJson("/api/auth/register",
                Map.of("name", "Alice Again", "email", email, "password", "password123"), null);
        assertThat(dup.getResponse().getStatus()).isEqualTo(409);

        // No token -> 401 with the JSON error shape.
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Please log in to continue"));
    }

    @Test
    void createCompanyPromotesAdminAndJoinCodeWorks() throws Exception {
        String owner = register("Owner", uniqueEmail("owner"), "password123");

        MvcResult created = postJson("/api/companies", Map.of("name", "Acme Labs"), owner);
        assertThat(created.getResponse().getStatus()).isEqualTo(200);
        String code = json(created).path("code").asText();
        assertThat(code).hasSize(6);

        // The creator is now the ADMIN of that company.
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + owner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("admin"))
                .andExpect(jsonPath("$.companyId").isNumber())
                .andExpect(jsonPath("$.companyCode").value(code));

        // Creating a second company is rejected while already a member.
        MvcResult second = postJson("/api/companies", Map.of("name", "Second Co"), owner);
        assertThat(second.getResponse().getStatus()).isEqualTo(409);

        // A new user joins with the code and becomes USER.
        String newcomer = register("Newcomer", uniqueEmail("nina"), "password123");
        MvcResult joined = postJson("/api/companies/join", Map.of("code", code), newcomer);
        assertThat(joined.getResponse().getStatus()).isEqualTo(200);
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + newcomer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("user"))
                .andExpect(jsonPath("$.companyCode").value(code));

        // Both appear in the roster.
        mockMvc.perform(get("/api/companies/members")
                        .header("Authorization", "Bearer " + owner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));

        // A bad code is a 404 with a friendly message.
        MvcResult bad = postJson("/api/companies/join", Map.of("code", "NOPE99"), newcomer);
        assertThat(bad.getResponse().getStatus()).isEqualTo(409); // already in a company
        String solo = register("Solo", uniqueEmail("solo"), "password123");
        MvcResult badJoin = postJson("/api/companies/join", Map.of("code", "NOPE99"), solo);
        assertThat(badJoin.getResponse().getStatus()).isEqualTo(404);
    }

    @Test
    void adminInvitedEmployeeClaimsAccountAndJoinsAutomatically() throws Exception {
        String admin = register("Boss", uniqueEmail("boss"), "password123");
        postJson("/api/companies", Map.of("name", "Invite Co"), admin);

        String invitedEmail = uniqueEmail("bob");
        MvcResult added = postJson("/api/companies/members",
                Map.of("name", "Bob Builder", "email", invitedEmail), admin);
        assertThat(added.getResponse().getStatus()).isEqualTo(200);
        assertThat(json(added).path("status").asText()).isEqualTo("invited");
        assertThat(json(added).path("role").asText()).isEqualTo("user");

        // The invited employee shows up in the roster with status "invited".
        mockMvc.perform(get("/api/companies/members")
                        .header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.email == '" + invitedEmail + "')].status")
                        .value(org.hamcrest.Matchers.contains("invited")));

        // Logging in before claiming the invite fails with an "invited" hint
        // (the frontend watches for that word and switches to sign-up).
        MvcResult earlyLogin = postJson("/api/auth/login",
                Map.of("email", invitedEmail, "password", "password123"), null);
        assertThat(earlyLogin.getResponse().getStatus()).isEqualTo(403);
        assertThat(json(earlyLogin).path("error").asText()).contains("invited");

        // Registering with the invited email claims the account and keeps the company.
        MvcResult claimed = postJson("/api/auth/register",
                Map.of("name", "Bob", "email", invitedEmail, "password", "password123"), null);
        assertThat(claimed.getResponse().getStatus()).isEqualTo(200);
        JsonNode claimedUser = json(claimed).path("user");
        assertThat(claimedUser.path("status").asText()).isEqualTo("active");
        assertThat(claimedUser.path("role").asText()).isEqualTo("user");
        assertThat(claimedUser.path("companyId").isNumber()).isTrue();
        assertThat(claimedUser.path("companyName").asText()).isEqualTo("Invite Co");

        // Bob can now log in normally.
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("email", invitedEmail, "password", "password123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.status").value("active"));
    }
}
