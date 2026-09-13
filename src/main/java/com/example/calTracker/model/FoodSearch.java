package com.example.calTracker.model;

public class FoodSearch {
    private String foodName;
    // The portion the calories and macros describe, as FatSecret words it:
    // "100g", "1 cup", "1 serving". Null when their description doesn't say.
    // Never persisted — it exists so the dropdown can't imply that 165 kcal is
    // a whole chicken breast when it is 165 kcal per 100 grams.
    private String serving;
    private int calories;
    private Double carbs;
    private Double protein;
    private Double fats;

    public FoodSearch(String foodName, String serving, int calories, Double carbs, Double protein, Double fats) {
        this.foodName = foodName;
        this.serving = serving;
        this.calories = calories;
        this.carbs = carbs;
        this.protein = protein;
        this.fats = fats;

    }

    // Getters and setters
    public String getFoodName() {
        return foodName;
    }

    public void setFoodName(String foodName) {
        this.foodName = foodName;
    }

    public String getServing() {
        return serving;
    }

    public void setServing(String serving) {
        this.serving = serving;
    }

    public int getCalories() {
        return calories;
    }

    public void setCalories(int calories) {
        this.calories = calories;
    }

    public Double getCarbs() {
        return carbs;
    }

    public void setCarbs(Double carbs) {
        this.carbs = carbs;
    }

    public Double getProtein() {
        return protein;
    }

    public void setProtein(Double protein) {
        this.protein = protein;
    }

    public Double getFats() {
        return fats;
    }

    public void setFats(Double fats) {
        this.fats = fats;
    }

}
