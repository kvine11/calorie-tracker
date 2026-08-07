package com.example.calTracker.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.calTracker.model.MealEntry;



public interface MealEntryRepository extends JpaRepository<MealEntry, Long> {

    List<MealEntry> findByDate(LocalDate date);
    
}
