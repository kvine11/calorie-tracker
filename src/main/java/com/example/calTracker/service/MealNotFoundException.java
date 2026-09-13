package com.example.calTracker.service;

// Thrown when an id doesn't match any meal. ApiExceptionHandler turns it into a
// 404 — before this existed, orElseThrow() threw NoSuchElementException, which
// surfaced as a 500 and told the client the server was broken.
public class MealNotFoundException extends RuntimeException {

    public MealNotFoundException(long id) {
        super("No meal with id " + id + ".");
    }
}
