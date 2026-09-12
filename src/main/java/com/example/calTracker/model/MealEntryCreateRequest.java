package com.example.calTracker.model;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

// The body of POST /api/meals — everything a client may say about a new meal,
// and nothing else. POST used to bind straight onto the MealEntry entity, which
// meant a body carrying "id": 5 made save() treat it as an update: it overwrote
// meal 5, or threw when no meal 5 existed (the same insert-vs-update trap as the
// v2 AtomicLong bug). There is no id here, so only the database ever assigns one.
//
// Macros are optional: null means "unknown" (typed by hand), not zero.
public record MealEntryCreateRequest(
        @NotBlank @Size(max = 255) String name,
        @NotNull @PositiveOrZero Integer calories,
        @NotNull LocalDate date,
        @PositiveOrZero Double protein,
        @PositiveOrZero Double carbs,
        @PositiveOrZero Double fats) {
}
