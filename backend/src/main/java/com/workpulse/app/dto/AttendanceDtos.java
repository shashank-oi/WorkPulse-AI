package com.workpulse.app.dto;

import com.workpulse.app.domain.AttendanceRecord;
import jakarta.validation.constraints.NotBlank;

/** Attendance-related request and response payloads. */
public final class AttendanceDtos {

    private AttendanceDtos() {
    }

    public record ClockRequest(
            @NotBlank(message = "Date is required") String date) {
    }

    /** Matches the {@code AttendanceRecord} interface in the frontend. */
    public record AttendanceDto(
            Long id,
            Long userId,
            String date,
            long clockIn,
            Long clockOut,
            String name,
            String email) {

        public static AttendanceDto from(AttendanceRecord record) {
            return new AttendanceDto(
                    record.getId(),
                    record.getUser().getId(),
                    record.getDate(),
                    record.getClockIn(),
                    record.getClockOut(),
                    record.getUser().getName(),
                    record.getUser().getEmail());
        }
    }
}
