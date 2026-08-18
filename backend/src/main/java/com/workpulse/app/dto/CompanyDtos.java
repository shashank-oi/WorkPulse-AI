package com.workpulse.app.dto;

import com.workpulse.app.domain.Company;
import com.workpulse.app.domain.Role;
import com.workpulse.app.domain.User;
import com.workpulse.app.domain.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Company-related request and response payloads. */
public final class CompanyDtos {

    private CompanyDtos() {
    }

    public record CreateCompanyRequest(
            @NotBlank(message = "Company name is required")
            @Size(min = 2, max = 60, message = "Company name must be 2–60 characters")
            String name) {
    }

    public record JoinCompanyRequest(
            @NotBlank(message = "Enter the company code")
            @Size(min = 4, max = 12, message = "Company code must be 4–12 characters")
            String code) {
    }

    public record AddMemberRequest(
            @NotBlank(message = "Employee name is required")
            @Size(max = 60, message = "Name must be 60 characters or fewer")
            String name,

            @NotBlank(message = "Employee email is required")
            @Email(message = "Enter a valid email address")
            @Size(max = 120, message = "Email must be 120 characters or fewer")
            String email) {
    }

    /** Matches the {@code Company} interface in the frontend. */
    public record CompanyDto(Long id, String name, String code) {

        public static CompanyDto from(Company company) {
            return new CompanyDto(company.getId(), company.getName(), company.getCode());
        }
    }

    /** Matches the {@code Member} interface in the frontend. */
    public record MemberDto(
            Long id,
            String name,
            String email,
            Role role,
            UserStatus status,
            long joinedAt) {

        public static MemberDto from(User user) {
            return new MemberDto(
                    user.getId(),
                    user.getName(),
                    user.getEmail(),
                    user.getRole(),
                    user.getStatus(),
                    user.getJoinedAt());
        }
    }
}
