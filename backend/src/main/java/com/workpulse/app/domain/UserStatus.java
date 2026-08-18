package com.workpulse.app.domain;

import com.fasterxml.jackson.annotation.JsonValue;

/**
 * ACTIVE users have set a password and signed in at least once.
 * INVITED users were added by an admin (name + email) and join automatically
 * the first time they create an account with that email.
 */
public enum UserStatus {
    ACTIVE("active"),
    INVITED("invited");

    private final String json;

    UserStatus(String json) {
        this.json = json;
    }

    @JsonValue
    public String toJson() {
        return json;
    }
}
