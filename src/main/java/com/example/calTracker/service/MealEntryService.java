package com.example.calTracker.service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.stereotype.Service;

import com.example.calTracker.model.MealEntry;


@Service
public class MealEntryService {
    
    List<MealEntry> mealEntries = new ArrayList<>();
    private final AtomicLong idCounter = new AtomicLong();

    public MealEntryService() {
        // Initialize with some sample data
        mealEntries.add(new MealEntry(1, "Breakfast", 300));
        mealEntries.add(new MealEntry(2, "Lunch", 600));
        mealEntries.add(new MealEntry(3, "Dinner", 800));

        idCounter.set(mealEntries.size() + 1); // Set the counter to the next available ID
    }

    public List<MealEntry> getAllMealEntries() {
        return mealEntries;
    }

    public void addMealEntry(MealEntry mealEntry) {
        mealEntry.setId(idCounter.getAndIncrement());
        mealEntries.add(mealEntry);
    }

    public void updateMealEntry(MealEntry updatedMealEntry) {
        for (int i = 0; i < mealEntries.size(); i++) {
            if (mealEntries.get(i).getId() == updatedMealEntry.getId()) {
                mealEntries.set(i, updatedMealEntry);
                return;
            }
        }
    }

    public void deleteMealEntry(long id) {
        mealEntries.removeIf(mealEntry -> mealEntry.getId() == id);
    }
    
}
