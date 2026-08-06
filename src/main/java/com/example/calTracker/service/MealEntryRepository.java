package com.example.calTracker.service;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.calTracker.model.MealEntry;



public interface MealEntryRepository extends JpaRepository<MealEntry, Long> {
    
}
