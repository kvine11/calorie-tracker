package com.example.calTracker.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import com.example.calTracker.model.FoodSearch;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;

@Service
public class FoodSearchService {

    private final RestClient restClient;
    private final String clientId;
    private final String clientSecret;

    private String accessToken;
    private Instant tokenExpirationTime;

    record TokenResponse(@JsonProperty("access_token") String accessToken, @JsonProperty("expires_in") long expiresIn) {

    }

    record FoodEntry(
            @JsonProperty("food_name") String foodName,
            @JsonProperty("food_description") String foodDescription,
            @JsonProperty("food_type") String foodType,
            @JsonProperty("brand_name") String brandName
            ) {

    }

    record Foods(
            @JsonProperty("food")
            @JsonFormat(with = JsonFormat.Feature.ACCEPT_SINGLE_VALUE_AS_ARRAY)
            List<FoodEntry> food
            ) {

    }

    record SearchResponse(
            @JsonProperty("foods") Foods foods
            ) {

    }

    @Autowired
    public FoodSearchService(@Value("${fatsecret.client-id}") String clientId,
            @Value("${fatsecret.client-secret}") String clientSecret,
            RestClient.Builder restClientBuild) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.restClient = restClientBuild.build();
    }

    private String getValidAccessToken() {
        if (accessToken == null || Instant.now().isAfter(tokenExpirationTime)) {
            MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
            formData.add("grant_type", "client_credentials");
            formData.add("scope", "basic");

            TokenResponse response = restClient.post()
                    .uri("https://oauth.fatsecret.com/connect/token")
                    .headers(headers -> {
                        headers.setBasicAuth(clientId, clientSecret);
                        headers.setContentType(org.springframework.http.MediaType.APPLICATION_FORM_URLENCODED);
                    })
                    .body(formData)
                    .retrieve()
                    .body(TokenResponse.class);

            this.accessToken = response.accessToken();
            this.tokenExpirationTime = Instant.now().plusSeconds(response.expiresIn());
        }
        return accessToken;
    }

    public List<FoodSearch> searchFood(String query) {
        String token = getValidAccessToken();

        SearchResponse response = restClient.get()
        .uri("https://platform.fatsecret.com/rest/foods/search/v1?search_expression={query}&format=json", query)
        .headers(headers -> headers.setBearerAuth(token))
        .retrieve()
        .body(SearchResponse.class);

        List<FoodSearch> results = new ArrayList<>();
        
        if(response.foods() == null || response.foods().food() == null) {
            return results;
        }
        for(FoodEntry entry : response.foods().food()) {

            Matcher matcher = Pattern.compile("Calories:\\s*(\\d+)kcal").matcher(entry.foodDescription());
            if(!matcher.find()) {
                continue;
            }
            int calories = Integer.parseInt(matcher.group(1));
            results.add(new FoodSearch(entry.foodName(), calories));
        }

        return results;
    }

}
