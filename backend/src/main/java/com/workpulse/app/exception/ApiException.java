package com.workpulse.app.exception;

import org.springframework.http.HttpStatus;

/**
 * An error that should reach the client as-is: the HTTP status and a
 * human-readable message rendered as {@code { "error": "..." }}.
 */
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
