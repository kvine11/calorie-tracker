package com.example.calTracker.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.example.calTracker.model.FoodSearch;
import com.example.calTracker.service.FoodSearchService.FoodEntry;

// FatSecret's nutrition arrives as one free-text string, so the parsing is where
// this feature breaks if their format shifts. No HTTP here — just the parser.
class FoodSearchServiceTest {

    @Test
    void readsCaloriesAndAllThreeMacros() {
        FoodSearch food = parse("Chicken Breast",
                "Per 100g - Calories: 165kcal | Fat: 3.57g | Carbs: 0.00g | Protein: 31.02g");

        assertThat(food.getFoodName()).isEqualTo("Chicken Breast");
        assertThat(food.getCalories()).isEqualTo(165);
        assertThat(food.getFats()).isEqualTo(3.57);
        assertThat(food.getProtein()).isEqualTo(31.02);
        // Zero is a real value ("chicken has no carbs"), distinct from unknown.
        assertThat(food.getCarbs()).isEqualTo(0.0);
    }

    @Test
    void keepsTheServingTheNumbersDescribe() {
        FoodSearch weight = parse("Chicken Breast",
                "Per 100g - Calories: 165kcal | Fat: 3.57g | Carbs: 0.00g | Protein: 31.02g");
        FoodSearch measure = parse("Apple Juice", "Per 1 cup - Calories: 114kcal | Carbs: 28g");
        FoodSearch vague = parse("Protein Bar", "Per 1 serving - Calories: 210kcal | Protein: 20g");

        assertThat(weight.getServing()).isEqualTo("100g");
        assertThat(measure.getServing()).isEqualTo("1 cup");
        assertThat(vague.getServing()).isEqualTo("1 serving");
    }

    // A hyphen inside the portion must not end it early — the match runs to
    // " - Calories:", not to the first dash it meets.
    @Test
    void readsAServingThatContainsItsOwnHyphen() {
        FoodSearch food = parse("Trail Mix", "Per 1 pre-packed scoop - Calories: 180kcal | Fat: 11g");

        assertThat(food.getServing()).isEqualTo("1 pre-packed scoop");
        assertThat(food.getCalories()).isEqualTo(180);
    }

    // Unknown, not guessed: the dropdown shows no portion rather than a wrong one.
    @Test
    void servingIsNullWhenTheDescriptionDoesNotOpenWithOne() {
        FoodSearch food = parse("Mystery Snack", "Calories: 90kcal | Carbs: 12g");

        assertThat(food.getServing()).isNull();
        assertThat(food.getCalories()).isEqualTo(90);
    }

    @Test
    void aMacroThatIsntListedIsNullNotZero() {
        FoodSearch food = parse("Apple Juice", "Per 1 cup - Calories: 114kcal | Carbs: 28g");

        assertThat(food.getCarbs()).isEqualTo(28.0);
        assertThat(food.getProtein()).isNull();
        assertThat(food.getFats()).isNull();
    }

    @Test
    void anEntryWithoutCaloriesIsSkipped() {
        FoodEntry entry = new FoodEntry("Mystery", "Per serving - Fat: 2g", "Generic", null);

        assertThat(FoodSearchService.toFoodSearch(entry)).isEmpty();
    }

    @Test
    void anEntryWithNoDescriptionIsSkippedRatherThanCrashing() {
        FoodEntry entry = new FoodEntry("Mystery", null, "Generic", null);

        assertThat(FoodSearchService.toFoodSearch(entry)).isEmpty();
    }

    private static FoodSearch parse(String name, String description) {
        return FoodSearchService.toFoodSearch(new FoodEntry(name, description, "Generic", null)).orElseThrow();
    }
}
