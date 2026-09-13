package com.example.calTracker.model;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

// The body of PUT /api/meals/{id}. No macros: they aren't edited directly —
// the service rescales the stored ones to match the new calories — so the
// request doesn't pretend to accept values it would ignore.
public record MealEntryUpdateRequest(
        @NotBlank @Size(max = 255) String name,
        @NotNull @PositiveOrZero Integer calories,
        @NotNull LocalDate date) {
}
