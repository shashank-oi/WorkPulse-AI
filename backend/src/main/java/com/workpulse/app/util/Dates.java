package com.workpulse.app.util;

import com.workpulse.app.exception.ApiException;
import org.springframework.http.HttpStatus;

import java.time.DateTimeException;
import java.time.LocalDate;

/** Parsing helpers for the YYYY-MM-DD dates the API exchanges. */
public final class Dates {

    private Dates() {
    }

    /**
     * Parses and validates a YYYY-MM-DD date, throwing a 400 ApiException with
     * a friendly message when the value is missing or malformed.
     */
    public static LocalDate parse(String value) {
        if (value == null || !value.matches("\\d{4}-\\d{2}-\\d{2}")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Date must be in YYYY-MM-DD format");
        }
        try {
            return LocalDate.parse(value);
        } catch (DateTimeException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid date — use YYYY-MM-DD");
        }
    }
}
