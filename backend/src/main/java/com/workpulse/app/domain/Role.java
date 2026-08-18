package com.workpulse.app.domain;

import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Whether a user manages a company (ADMIN) or works in one (USER).
 * Serialized to JSON as lowercase "admin" / "user" to match the frontend.
 */
public enum Role {
    ADMIN("admin"),
    USER("user");

    private final String json;

    Role(String json) {
        this.json = json;
    }

    @JsonValue
    public String toJson() {
        return json;
    }
}
