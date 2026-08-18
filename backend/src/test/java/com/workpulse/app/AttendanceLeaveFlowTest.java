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

import java.time.LocalDate;
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
class AttendanceLeaveFlowTest {

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

    private String register(String name, String email, String password) throws Exception {
        MvcResult result = postJson("/api/auth/register",
                Map.of("name", name, "email", email, "password", password), null);
        assertThat(result.getResponse().getStatus()).isEqualTo(200);
        return json(result).path("token").asText();
    }

    /**
     * Sets up admin + employee in one company.
     *
     * @return [adminToken, employeeToken, employeeId]
     */
    private Object[] adminAndEmployee() throws Exception {
        String admin = register("Admin", uniqueEmail("admin"), "password123");
        MvcResult created = postJson("/api/companies", Map.of("name", "Flow Co"), admin);
        assertThat(created.getResponse().getStatus()).isEqualTo(200);

        String employeeEmail = uniqueEmail("carol");
        postJson("/api/companies/members",
                Map.of("name", "Carol Worker", "email", employeeEmail), admin);
        String employee = register("Carol", employeeEmail, "password123");
        long employeeId = json(mockMvc.perform(get("/api/auth/me")
                .header("Authorization", "Bearer " + employee)).andReturn())
                .path("id").asLong();
        return new Object[]{admin, employee, employeeId};
    }

    @Test
    void clockInAndOutWithDuplicatesRejected() throws Exception {
        Object[] setup = adminAndEmployee();
        String admin = (String) setup[0];
        String employee = (String) setup[1];
        long employeeId = (Long) setup[2];

        String today = LocalDate.now().toString();

        // Clock in works and opens a shift.
        MvcResult in = postJson("/api/attendance/clock-in", Map.of("date", today), employee);
        assertThat(in.getResponse().getStatus()).isEqualTo(200);
        JsonNode record = json(in);
        assertThat(record.path("date").asText()).isEqualTo(today);
        assertThat(record.path("clockOut").isMissingNode()).isTrue();

        // Double clock-in conflicts.
        MvcResult doubleIn = postJson("/api/attendance/clock-in", Map.of("date", today), employee);
        assertThat(doubleIn.getResponse().getStatus()).isEqualTo(409);

        // Clock out closes the shift; a second clock-out conflicts.
        MvcResult out = postJson("/api/attendance/clock-out", Map.of("date", today), employee);
        assertThat(out.getResponse().getStatus()).isEqualTo(200);
        assertThat(json(out).path("clockOut").isNumber()).isTrue();
        MvcResult doubleOut = postJson("/api/attendance/clock-out", Map.of("date", today), employee);
        assertThat(doubleOut.getResponse().getStatus()).isEqualTo(409);

        // Clocking out without clocking in is a 404.
        String tomorrow = LocalDate.now().plusDays(1).toString();
        MvcResult noIn = postJson("/api/attendance/clock-out", Map.of("date", tomorrow), employee);
        assertThat(noIn.getResponse().getStatus()).isEqualTo(404);

        // Bad date format is rejected.
        MvcResult badDate = postJson("/api/attendance/clock-in", Map.of("date", "not-a-date"), employee);
        assertThat(badDate.getResponse().getStatus()).isEqualTo(400);

        // Admin sees the punch in the day view, with the employee's name.
        mockMvc.perform(get("/api/attendance/day")
                        .param("date", today)
                        .header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Carol"))
                .andExpect(jsonPath("$[0].email").exists());

        // Admin can fetch the employee's history directly.
        mockMvc.perform(get("/api/attendance/member/" + employeeId)
                        .header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        // A company member can view the shared day view too.
        mockMvc.perform(get("/api/attendance/day")
                        .param("date", today)
                        .header("Authorization", "Bearer " + employee))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void leaveApplicationAndAdminReview() throws Exception {
        Object[] setup = adminAndEmployee();
        String admin = (String) setup[0];
        String employee = (String) setup[1];
        long employeeId = (Long) setup[2];

        LocalDate start = LocalDate.now().plusDays(2);
        LocalDate end = start.plusDays(3);

        // Applying for leave creates a pending request.
        MvcResult applied = postJson("/api/leaves",
                Map.of("type", "annual", "startDate", start.toString(),
                        "endDate", end.toString(), "reason", "Family time"),
                employee);
        assertThat(applied.getResponse().getStatus()).isEqualTo(200);
        JsonNode leave = json(applied);
        assertThat(leave.path("status").asText()).isEqualTo("pending");
        assertThat(leave.path("type").asText()).isEqualTo("annual");
        long leaveId = leave.path("id").asLong();

        // Employee sees it in their own list; the admin list is forbidden to them.
        mockMvc.perform(get("/api/leaves/my")
                        .header("Authorization", "Bearer " + employee))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
        mockMvc.perform(get("/api/leaves")
                        .header("Authorization", "Bearer " + employee))
                .andExpect(status().isForbidden());

        // Employees can't add members either.
        MvcResult notAdmin = postJson("/api/companies/members",
                Map.of("name", "Sneaky", "email", uniqueEmail("sneaky")), employee);
        assertThat(notAdmin.getResponse().getStatus()).isEqualTo(403);

        // Admin sees the request with the employee's name.
        mockMvc.perform(get("/api/leaves")
                        .header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Carol"));

        // Invalid input is rejected.
        MvcResult badType = postJson("/api/leaves",
                Map.of("type", "sabbatical", "startDate", start.toString(),
                        "endDate", end.toString(), "reason", "Whatever"),
                employee);
        assertThat(badType.getResponse().getStatus()).isEqualTo(400);
        MvcResult badRange = postJson("/api/leaves",
                Map.of("type", "sick", "startDate", end.toString(),
                        "endDate", start.toString(), "reason", "Backwards"),
                employee);
        assertThat(badRange.getResponse().getStatus()).isEqualTo(400);

        // Admin approves with a note.
        MvcResult reviewed = postJson("/api/leaves/" + leaveId + "/review",
                Map.of("status", "approved", "note", "Enjoy your time off!"), admin);
        assertThat(reviewed.getResponse().getStatus()).isEqualTo(200);
        JsonNode reviewedLeave = json(reviewed);
        assertThat(reviewedLeave.path("status").asText()).isEqualTo("approved");
        assertThat(reviewedLeave.path("reviewNote").asText()).isEqualTo("Enjoy your time off!");
        assertThat(reviewedLeave.path("reviewedAt").isNumber()).isTrue();

        // A second review conflicts.
        MvcResult again = postJson("/api/leaves/" + leaveId + "/review",
                Map.of("status", "rejected"), admin);
        assertThat(again.getResponse().getStatus()).isEqualTo(409);

        // Admin can pull the employee's leave history.
        mockMvc.perform(get("/api/leaves/member/" + employeeId)
                        .header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].status").value("approved"));

        // An admin from another company cannot see or review this request.
        String otherAdmin = register("Other", uniqueEmail("other"), "password123");
        postJson("/api/companies", Map.of("name", "Other Co"), otherAdmin);
        mockMvc.perform(get("/api/leaves/member/" + employeeId)
                        .header("Authorization", "Bearer " + otherAdmin))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/api/leaves/" + leaveId + "/review")
                        .header("Authorization", "Bearer " + otherAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "rejected"))))
                .andExpect(status().isNotFound());
    }
}
