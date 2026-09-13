package com.example.calTracker.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.calTracker.model.MealEntry;
import com.example.calTracker.model.MealEntryCreateRequest;
import com.example.calTracker.model.MealEntryUpdateRequest;

@Service
public class MealEntryService {

    private final MealEntryRepository mealEntryRepository;

    public MealEntryService(MealEntryRepository mealEntryRepository) {
        this.mealEntryRepository = mealEntryRepository;
    }

    @Transactional(readOnly = true)
    public MealEntry getMealEntry(long id) {
        return mealEntryRepository.findById(id).orElseThrow(() -> new MealNotFoundException(id));
    }

    @Transactional(readOnly = true)
    public List<MealEntry> getMealEntriesByDate(LocalDate date) {
        return mealEntryRepository.findByDateOrderByIdAsc(date);
    }

    @Transactional(readOnly = true)
    public List<MealEntry> getMealEntriesBetween(LocalDate from, LocalDate to) {
        return mealEntryRepository.findByDateBetweenOrderByDateAscIdAsc(from, to);
    }

    // Returns the saved entity so the controller can send back the id the
    // database just assigned. The id is never set here: it stays 0, which is
    // how save() knows this is an insert.
    @Transactional
    public MealEntry addMealEntry(MealEntryCreateRequest request) {
        MealEntry mealEntry = new MealEntry();
        mealEntry.setName(request.name().trim());
        mealEntry.setCalories(request.calories());
        mealEntry.setDate(request.date());
        mealEntry.setProtein(request.protein());
        mealEntry.setCarbs(request.carbs());
        mealEntry.setFats(request.fats());
        return mealEntryRepository.save(mealEntry);
    }

    // One transaction around the read and the write, so nothing can change the
    // row between loading it and saving the rescaled version.
    @Transactional
    public MealEntry updateMealEntry(long id, MealEntryUpdateRequest request) {
        MealEntry existingMealEntry = mealEntryRepository.findById(id)
                .orElseThrow(() -> new MealNotFoundException(id));

        double ratio = 1.0;

        if (existingMealEntry.getCalories() != 0) {
            ratio = (double) request.calories() / (double) existingMealEntry.getCalories();
        }

        existingMealEntry.setProtein(scale(existingMealEntry.getProtein(), ratio));
        existingMealEntry.setCarbs(scale(existingMealEntry.getCarbs(), ratio));
        existingMealEntry.setFats(scale(existingMealEntry.getFats(), ratio));
        existingMealEntry.setCalories(request.calories());
        existingMealEntry.setName(request.name().trim());
        existingMealEntry.setDate(request.date());

        return mealEntryRepository.save(existingMealEntry);
    }

    // deleteById on a missing id is a silent no-op in Spring Data, so the client
    // would get a success for deleting nothing. Checking first makes it a 404.
    @Transactional
    public void deleteMealEntry(long id) {
        if (!mealEntryRepository.existsById(id)) {
            throw new MealNotFoundException(id);
        }
        mealEntryRepository.deleteById(id);
    }

    private static Double scale(Double macro, double ratio) {
        if (macro == null) {
            return null;
        }
        return Math.round(macro * ratio * 100.0) / 100.0; // Round to 2 decimal places
    }

}
