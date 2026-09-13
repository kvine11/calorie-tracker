package com.example.calTracker.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.calTracker.model.MealEntry;

public interface MealEntryRepository extends JpaRepository<MealEntry, Long> {

    // "OrderByIdAsc" is part of the derived query, so the SQL gets an ORDER BY.
    // Without one, Postgres may return a day's rows in any order — and the
    // frontend colours each ring arc by its position in this list, so an edit
    // could shuffle the colours. Ids increase as meals are logged, so this is
    // the order they were entered.
    List<MealEntry> findByDateOrderByIdAsc(LocalDate date);

    // "Between" is inclusive at both ends: from <= date <= to.
    List<MealEntry> findByDateBetweenOrderByDateAscIdAsc(LocalDate from, LocalDate to);
}
