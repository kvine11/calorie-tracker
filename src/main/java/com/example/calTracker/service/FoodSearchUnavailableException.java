package com.example.calTracker.service;

// FatSecret failed: unreachable, timed out, rejected our credentials, or sent
// back something unreadable. ApiExceptionHandler maps it to 502 Bad Gateway —
// the problem is upstream, not in this server and not in the request.
public class FoodSearchUnavailableException extends RuntimeException {

    public FoodSearchUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
