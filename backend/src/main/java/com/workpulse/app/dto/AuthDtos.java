package com.workpulse.app.dto;

import com.workpulse.app.domain.Role;
import com.workpulse.app.domain.User;
import com.workpulse.app.domain.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Auth-related request and response payloads. The response shapes mirror the
 * TypeScript types in the React app (src/lib/api.ts).
 */
public final class AuthDtos {

    private AuthDtos() {
    }

    public record RegisterRequest(
            @NotBlank(message = "Name is required")
            @Size(max = 60, message = "Name must be 60 characters or fewer")
            String name,

            @NotBlank(message = "Email is required")
            @Email(message = "Enter a valid email address")
            @Size(max = 120, message = "Email must be 120 characters or fewer")
            String email,

            @NotBlank(message = "Password is required")
            @Size(min = 6, max = 100, message = "Password must be at least 6 characters")
            String password) {
    }

    public record LoginRequest(
            @NotBlank(message = "Email is required") String email,
            @NotBlank(message = "Password is required") String password) {
    }

    public record AuthResponse(String token, UserDto user) {
    }

    /** Matches the {@code User} interface in the frontend. */
    public record UserDto(
            Long id,
            String name,
            String email,
            Role role,
            UserStatus status,
            Long companyId,
            String companyName,
            String companyCode,
            long joinedAt) {

        public static UserDto from(User user) {
            var company = user.getCompany();
            return new UserDto(
                    user.getId(),
                    user.getName(),
                    user.getEmail(),
                    user.getRole(),
                    user.getStatus(),
                    company == null ? null : company.getId(),
                    company == null ? null : company.getName(),
                    company == null ? null : company.getCode(),
                    user.getJoinedAt());
        }
    }
}
