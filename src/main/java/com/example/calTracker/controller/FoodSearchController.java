package com.example.calTracker.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.calTracker.model.FoodSearch;
import com.example.calTracker.service.FoodSearchService;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@RestController
@RequestMapping("/api/meals")
public class FoodSearchController {
    private final FoodSearchService foodSearchService;

    public FoodSearchController(FoodSearchService foodSearchService) {
        this.foodSearchService = foodSearchService;
    }

    // Constraints directly on a @RequestParam are checked by Spring MVC's
    // built-in method validation: a blank or absurdly long query is a 400 and
    // never costs a FatSecret call.
    @GetMapping("/search")
    public List<FoodSearch> searchFood(@RequestParam @NotBlank @Size(max = 100) String query) {
        return foodSearchService.searchFood(query.trim());
    }
}
