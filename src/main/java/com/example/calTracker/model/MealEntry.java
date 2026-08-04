package com.example.calTracker.model;


public class MealEntry {


    private long id;
    private String name;
    private int calories;


    public MealEntry() {
    }

    public MealEntry(long id, String name, int calories) {
        this.id = id;
        this.name = name;
        this.calories = calories;
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

    public int getCalories() {
        return calories;
    }

    public void setCalories(int calories) {
        this.calories = calories;
    }
}
