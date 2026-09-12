package com.example.calTracker.controller;

import static org.hamcrest.Matchers.endsWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.example.calTracker.model.MealEntry;
import com.example.calTracker.service.MealEntryService;
import com.example.calTracker.service.MealNotFoundException;

// The HTTP contract only: status codes, bodies, validation, error shape. The
// service is a mock, so no database is involved and these run in milliseconds.
@WebMvcTest(MealEntryController.class)
class MealEntryControllerTest {

    private static final LocalDate SEP_8 = LocalDate.of(2026, 9, 8);

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private MealEntryService mealEntryService;

    @Test
    void createReturns201WithTheSavedMealAndItsLocation() throws Exception {
        given(mealEntryService.addMealEntry(any()))
                .willReturn(new MealEntry(42, "Steak & Rice Bowl", 320, 41.0, 19.0, 9.0, SEP_8));

        mockMvc.perform(post("/api/meals")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name": "Steak & Rice Bowl", "calories": 320, "date": "2026-09-08",
                         "protein": 19, "carbs": 41, "fats": 9}
                        """))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", endsWith("/api/meals/42")))
                .andExpect(jsonPath("$.id").value(42))
                .andExpect(jsonPath("$.date").value("2026-09-08"));
    }

    @Test
    void createWithInvalidFieldsIs400AndNamesEachField() throws Exception {
        mockMvc.perform(post("/api/meals")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name": "  ", "calories": -5}
                        """))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.errors.name").exists())
                .andExpect(jsonPath("$.errors.calories").exists())
                .andExpect(jsonPath("$.errors.date").exists());

        verifyNoInteractions(mealEntryService);
    }

    @Test
    void malformedJsonIs400() throws Exception {
        mockMvc.perform(post("/api/meals")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\": "))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(mealEntryService);
    }

    @Test
    void updateReturnsTheUpdatedMeal() throws Exception {
        given(mealEntryService.updateMealEntry(eq(42L), any()))
                .willReturn(new MealEntry(42, "Steak & Rice Bowl", 480, 61.5, 28.5, 13.5, SEP_8));

        mockMvc.perform(put("/api/meals/42")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name": "Steak & Rice Bowl", "calories": 480, "date": "2026-09-08"}
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.calories").value(480))
                .andExpect(jsonPath("$.protein").value(28.5));
    }

    @Test
    void updatingAMissingMealIs404ProblemDetail() throws Exception {
        given(mealEntryService.updateMealEntry(eq(999L), any())).willThrow(new MealNotFoundException(999));

        mockMvc.perform(put("/api/meals/999")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name": "Ghost", "calories": 100, "date": "2026-09-08"}
                        """))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.title").value("Meal not found"))
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void deleteReturns204() throws Exception {
        mockMvc.perform(delete("/api/meals/42"))
                .andExpect(status().isNoContent());

        verify(mealEntryService).deleteMealEntry(42);
    }

    @Test
    void deletingAMissingMealIs404() throws Exception {
        willThrow(new MealNotFoundException(999)).given(mealEntryService).deleteMealEntry(999);

        mockMvc.perform(delete("/api/meals/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void rangeReturnsTheMealsBetweenBothDates() throws Exception {
        given(mealEntryService.getMealEntriesBetween(SEP_8, SEP_8.plusDays(6)))
                .willReturn(List.of(new MealEntry(1, "Oats", 300, null, null, null, SEP_8)));

        mockMvc.perform(get("/api/meals").param("from", "2026-09-08").param("to", "2026-09-14"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Oats"));
    }

    @Test
    void rangeWithFromAfterToIs400() throws Exception {
        mockMvc.perform(get("/api/meals").param("from", "2026-09-14").param("to", "2026-09-08"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(mealEntryService);
    }

    @Test
    void rangeLongerThanAYearIs400() throws Exception {
        mockMvc.perform(get("/api/meals").param("from", "2025-01-01").param("to", "2026-09-08"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void listingEveryMealWithoutARangeIsNoLongerAllowed() throws Exception {
        mockMvc.perform(get("/api/meals"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void anInvalidDateInThePathIs400() throws Exception {
        mockMvc.perform(get("/api/meals/date/not-a-date"))
                .andExpect(status().isBadRequest());
    }
}
