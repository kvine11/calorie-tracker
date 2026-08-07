package com.example.calTracker.model;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonCreator;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "meal_entries")
public class MealEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    private String name;
    private int calories;

    @Column(name = "date")
    private LocalDate date;


    public MealEntry() {
    }

    // Jackson would otherwise auto-detect this as the JSON-binding constructor,
    // and fail on POST bodies that omit "id" (which is intentional — the server
    // assigns it). Disabling that keeps this constructor for internal Java use
    // (e.g. seeding sample data) while JSON deserialization uses MealEntry() + setters.
    @JsonCreator(mode = JsonCreator.Mode.DISABLED)
    public MealEntry(long id, String name, int calories, LocalDate date) {
        this.id = id;
        this.name = name;
        this.calories = calories;
        this.date = date;
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public int getCalories() {
        return calories;
    }

    public void setCalories(int calories) {
        this.calories = calories;
    }
}
