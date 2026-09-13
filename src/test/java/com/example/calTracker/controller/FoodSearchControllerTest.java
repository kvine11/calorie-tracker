package com.example.calTracker.controller;

import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.example.calTracker.model.FoodSearch;
import com.example.calTracker.service.FoodSearchService;
import com.example.calTracker.service.FoodSearchUnavailableException;

@WebMvcTest(FoodSearchController.class)
class FoodSearchControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private FoodSearchService foodSearchService;

    @Test
    void returnsMatches() throws Exception {
        given(foodSearchService.searchFood("chicken"))
                .willReturn(List.of(new FoodSearch("Chicken Breast", 165, 0.0, 31.02, 3.57)));

        mockMvc.perform(get("/api/meals/search").param("query", "chicken"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].foodName").value("Chicken Breast"))
                .andExpect(jsonPath("$[0].calories").value(165));
    }

    @Test
    void aBlankQueryIs400AndNeverReachesFatSecret() throws Exception {
        mockMvc.perform(get("/api/meals/search").param("query", "   "))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(foodSearchService);
    }

    @Test
    void anUpstreamFailureIs502NotA500() throws Exception {
        given(foodSearchService.searchFood("chicken"))
                .willThrow(new FoodSearchUnavailableException("FatSecret request failed", null));

        mockMvc.perform(get("/api/meals/search").param("query", "chicken"))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.title").value("Food search unavailable"));
    }
}
