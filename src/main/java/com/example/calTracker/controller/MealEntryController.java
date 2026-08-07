package com.example.calTracker.controller;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.calTracker.model.MealEntry;
import com.example.calTracker.service.MealEntryService;

@RestController
@RequestMapping("/api/meals")
@CrossOrigin(originPatterns = "http://localhost:*")
public class MealEntryController {

    private final MealEntryService mealEntryService;

    public MealEntryController(MealEntryService mealEntryService) {
        this.mealEntryService = mealEntryService;
    }

    @GetMapping
    public List<MealEntry> getAllMealEntries() {
        return mealEntryService.getAllMealEntries();
    }

    @PostMapping
    public void addMealEntry(@RequestBody MealEntry mealEntry) {
        mealEntryService.addMealEntry(mealEntry);
    }

    @PutMapping("/{id}")
    public void updateMealEntry(@PathVariable long id, @RequestBody MealEntry updatedMealEntry) {
        updatedMealEntry.setId(id);
        mealEntryService.updateMealEntry(updatedMealEntry);
    }

    @DeleteMapping("/{id}")
    public void deleteMealEntry(@PathVariable long id) {
        mealEntryService.deleteMealEntry(id);
    }


}
