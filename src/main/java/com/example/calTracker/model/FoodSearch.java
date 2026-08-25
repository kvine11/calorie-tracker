package com.example.calTracker.model;

public class FoodSearch {
    private String foodName;
    private int calories;



    public FoodSearch(String foodName, int calories) {
        this.foodName = foodName;
        this.calories = calories;

    }

    // Getters and setters
    public String getFoodName() {
        return foodName;
    }

    public void setFoodName(String foodName) {
        this.foodName = foodName;
    }

    public int getCalories() {
        return calories;
    }

    public void setCalories(int calories) {
        this.calories = calories;
    }

}
