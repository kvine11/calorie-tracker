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
        mealEntryRepository.save(updatedMealEntry);
    }

    public void deleteMealEntry(long id) {
        mealEntryRepository.deleteById(id);
    }
    
}
