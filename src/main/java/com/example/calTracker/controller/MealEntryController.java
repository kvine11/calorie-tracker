package com.example.calTracker.controller;

import java.net.URI;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.example.calTracker.model.MealEntry;
import com.example.calTracker.model.MealEntryCreateRequest;
import com.example.calTracker.model.MealEntryUpdateRequest;
import com.example.calTracker.service.MealEntryService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/meals")
public class MealEntryController {

    // A year of meals is the most one request can ask for. There used to be an
    // unfiltered GET /api/meals that returned every meal ever logged.
    static final long MAX_RANGE_DAYS = 366;

    private final MealEntryService mealEntryService;

    public MealEntryController(MealEntryService mealEntryService) {
        this.mealEntryService = mealEntryService;
    }

    // GET /api/meals?from=2026-09-06&to=2026-09-12 (both inclusive)
    @GetMapping(params = { "from", "to" })
    public List<MealEntry> getMealEntriesBetween(@RequestParam LocalDate from, @RequestParam LocalDate to) {
        if (from.isAfter(to)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "'from' must be on or before 'to'.");
        }
        if (ChronoUnit.DAYS.between(from, to) >= MAX_RANGE_DAYS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A range can cover at most " + MAX_RANGE_DAYS + " days.");
        }
        return mealEntryService.getMealEntriesBetween(from, to);
    }

    @GetMapping("/date/{date}")
    public List<MealEntry> getMealEntriesByDate(@PathVariable LocalDate date) {
        return mealEntryService.getMealEntriesByDate(date);
    }

    @GetMapping("/{id}")
    public MealEntry getMealEntry(@PathVariable long id) {
        return mealEntryService.getMealEntry(id);
    }

    // 201 Created, with the saved meal (including its new id) as the body and
    // its URL in the Location header. @Valid rejects a bad body with a 400
    // before this method runs.
    @PostMapping
    public ResponseEntity<MealEntry> addMealEntry(@Valid @RequestBody MealEntryCreateRequest request) {
        MealEntry saved = mealEntryService.addMealEntry(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(saved.getId())
                .toUri();
        return ResponseEntity.created(location).body(saved);
    }

    // The id comes from the URL only — the request body has no id field at all.
    @PutMapping("/{id}")
    public MealEntry updateMealEntry(@PathVariable long id, @Valid @RequestBody MealEntryUpdateRequest request) {
        return mealEntryService.updateMealEntry(id, request);
    }

    // 204 No Content: it worked, and there's nothing left to send back.
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMealEntry(@PathVariable long id) {
        mealEntryService.deleteMealEntry(id);
    }
}
