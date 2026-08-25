package com.example.calTracker.controller;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.calTracker.model.FoodSearch;
import com.example.calTracker.service.FoodSearchService;

@RestController
@CrossOrigin(originPatterns = "http://localhost:*")
public class FoodSearchController {
    private final FoodSearchService foodSearchService;

    public FoodSearchController(FoodSearchService foodSearchService) {
        this.foodSearchService = foodSearchService;
    }

    @GetMapping("/api/search")
    public List<FoodSearch> searchFood(@RequestParam String query) {
        return foodSearchService.searchFood(query);
    }
}
