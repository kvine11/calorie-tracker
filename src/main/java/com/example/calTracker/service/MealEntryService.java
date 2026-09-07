package com.example.calTracker.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.calTracker.model.MealEntry;

@Service
public class MealEntryService {

    private final MealEntryRepository mealEntryRepository;

    @Autowired
    public MealEntryService(MealEntryRepository mealEntryRepository) {
        this.mealEntryRepository = mealEntryRepository;

    }

    public List<MealEntry> getAllMealEntries() {
        return mealEntryRepository.findAll();
    }

    public void addMealEntry(MealEntry mealEntry) {
        mealEntryRepository.save(mealEntry);
    }

    public void updateMealEntry(MealEntry updatedMealEntry) {
        MealEntry existingMealEntry = mealEntryRepository.findById(updatedMealEntry.getId()).orElseThrow();

        double ratio = 1.0;

        if (existingMealEntry.getCalories() != 0) {
            ratio = (double) updatedMealEntry.getCalories() / (double) existingMealEntry.getCalories();
        }

        existingMealEntry.setProtein(scale(existingMealEntry.getProtein(), ratio));
        existingMealEntry.setCarbs(scale(existingMealEntry.getCarbs(), ratio));
        existingMealEntry.setFats(scale(existingMealEntry.getFats(), ratio));
        existingMealEntry.setCalories(updatedMealEntry.getCalories());
        existingMealEntry.setName(updatedMealEntry.getName());
        existingMealEntry.setDate(updatedMealEntry.getDate());

        mealEntryRepository.save(existingMealEntry);

    }

    public void deleteMealEntry(long id) {
        mealEntryRepository.deleteById(id);
    }

    public List<MealEntry> getMealEntriesByDate(java.time.LocalDate date) {
        return mealEntryRepository.findByDate(date);
    }

    private static Double scale(Double macro, double ratio) {
        if (macro == null) {
            return null;
        }
        return Math.round(macro * ratio * 100.0) / 100.0; // Round to 2 decimal places
    }

}
