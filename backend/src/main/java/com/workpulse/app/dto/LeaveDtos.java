package com.workpulse.app.dto;

import com.workpulse.app.domain.LeaveRequest;
import com.workpulse.app.domain.LeaveStatus;
import com.workpulse.app.domain.LeaveType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Leave-related request and response payloads. */
public final class LeaveDtos {

    private LeaveDtos() {
    }

    public record CreateLeaveRequest(
            @NotBlank(message = "Leave type is required") String type,
            @NotBlank(message = "Start date is required") String startDate,
            @NotBlank(message = "End date is required") String endDate,
            @NotBlank(message = "Reason is required")
            @Size(max = 500, message = "Reason must be 500 characters or fewer")
            String reason) {
    }

    public record ReviewLeaveRequest(
            @NotBlank(message = "Status is required") String status,
            @Size(max = 300, message = "Note must be 300 characters or fewer")
            String note) {
    }

    /** Matches the {@code LeaveRequest} interface in the frontend. */
    public record LeaveDto(
            Long id,
            Long userId,
            String startDate,
            String endDate,
            LeaveType type,
            String reason,
            LeaveStatus status,
            String reviewNote,
            long createdAt,
            Long reviewedAt,
            String name,
            String email) {

        public static LeaveDto from(LeaveRequest leave) {
            return new LeaveDto(
                    leave.getId(),
                    leave.getUser().getId(),
                    leave.getStartDate(),
                    leave.getEndDate(),
                    leave.getType(),
                    leave.getReason(),
                    leave.getStatus(),
                    leave.getReviewNote(),
                    leave.getCreatedAt(),
                    leave.getReviewedAt(),
                    leave.getUser().getName(),
                    leave.getUser().getEmail());
        }
    }
}
