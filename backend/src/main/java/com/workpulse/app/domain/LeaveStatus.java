package com.workpulse.app.domain;

import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Optional;

/** Lifecycle of a leave request. */
public enum LeaveStatus {
    PENDING("pending"),
    APPROVED("approved"),
    REJECTED("rejected");

    private final String json;

    LeaveStatus(String json) {
        this.json = json;
    }

    @JsonValue
    public String toJson() {
        return json;
    }

    /** Case-insensitive lookup used when parsing the review request body. */
    public static Optional<LeaveStatus> fromApi(String value) {
        if (value == null) {
            return Optional.empty();
        }
        for (LeaveStatus status : values()) {
            if (status.json.equalsIgnoreCase(value.trim())) {
                return Optional.of(status);
            }
        }
        return Optional.empty();
    }
}
