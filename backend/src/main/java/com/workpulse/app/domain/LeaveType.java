package com.workpulse.app.domain;

import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Optional;

/** Kinds of time off an employee can request. */
public enum LeaveType {
    ANNUAL("annual"),
    SICK("sick"),
    PERSONAL("personal"),
    UNPAID("unpaid"),
    OTHER("other");

    private final String json;

    LeaveType(String json) {
        this.json = json;
    }

    @JsonValue
    public String toJson() {
        return json;
    }

    /** Case-insensitive lookup used when parsing the request body. */
    public static Optional<LeaveType> fromApi(String value) {
        if (value == null) {
            return Optional.empty();
        }
        for (LeaveType type : values()) {
            if (type.json.equalsIgnoreCase(value.trim())) {
                return Optional.of(type);
            }
        }
        return Optional.empty();
    }
}
