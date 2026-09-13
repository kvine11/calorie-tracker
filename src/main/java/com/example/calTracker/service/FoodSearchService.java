package com.example.calTracker.service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClient;

import com.example.calTracker.model.FoodSearch;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;

@Service
public class FoodSearchService {

    // Compiled once. Pattern.compile is comparatively expensive, and the old
    // code ran it for every result of every search.
    private static final Pattern CALORIES = Pattern.compile("Calories:\\s*(\\d+)kcal");
    private static final Pattern CARBS = macroPattern("Carbs");
    private static final Pattern PROTEIN = macroPattern("Protein");
    private static final Pattern FAT = macroPattern("Fat");

    // The portion the rest of the numbers describe. Anchored on " - Calories:"
    // rather than the first dash, so a serving is read correctly even when the
    // text around it varies. Reluctant group: stop at the first such marker.
    private static final Pattern SERVING = Pattern.compile("^Per\\s+(.+?)\\s+-\\s+Calories:");

    // Refresh a little before FatSecret says the token expires, so a request
    // that starts just before the deadline doesn't arrive just after it.
    private static final Duration TOKEN_EXPIRY_MARGIN = Duration.ofSeconds(60);

    // The frontend never shows more than about ten suggestions.
    private static final int MAX_RESULTS = 10;

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
            @JsonProperty("brand_name") String brandName) {

    }

    record Foods(
            @JsonProperty("food") @JsonFormat(with = JsonFormat.Feature.ACCEPT_SINGLE_VALUE_AS_ARRAY) List<FoodEntry> food) {

    }

    record SearchResponse(
            @JsonProperty("foods") Foods foods) {

    }

    // The injected builder already carries the connect/read timeouts from
    // spring.http.clients.* in application.properties.
    public FoodSearchService(@Value("${fatsecret.client-id}") String clientId,
            @Value("${fatsecret.client-secret}") String clientSecret,
            RestClient.Builder restClientBuilder) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.restClient = restClientBuilder.build();
    }

    public List<FoodSearch> searchFood(String query) {
        try {
            String token = getValidAccessToken();

            SearchResponse response = restClient.get()
                    .uri("https://platform.fatsecret.com/rest/foods/search/v1?search_expression={query}&max_results={max}&format=json",
                            query, MAX_RESULTS)
                    .headers(headers -> headers.setBearerAuth(token))
                    .retrieve()
                    .body(SearchResponse.class);

            // FatSecret leaves out the "food" key entirely when nothing matches.
            // A miss is an empty list, never an error: "no matches, log it by
            // hand" is a normal path through the app.
            if (response == null || response.foods() == null || response.foods().food() == null) {
                return List.of();
            }

            List<FoodSearch> results = new ArrayList<>();
            for (FoodEntry entry : response.foods().food()) {
                toFoodSearch(entry).ifPresent(results::add);
            }
            return results;
        } catch (RestClientException ex) {
            // Covers timeouts, connection failures, 4xx/5xx from FatSecret and
            // unreadable bodies. Drop the token too: if it was revoked early,
            // the next search should fetch a fresh one rather than fail again.
            invalidateToken();
            throw new FoodSearchUnavailableException("FatSecret request failed", ex);
        }
    }

    // FatSecret puts nutrition in one human-readable string, e.g.
    // "Per 100g - Calories: 165kcal | Fat: 3.57g | Carbs: 0.00g | Protein: 31.02g".
    // Static and package-private so the parsing can be tested without HTTP.
    // Empty when calories can't be read — a result without them can't be logged.
    static Optional<FoodSearch> toFoodSearch(FoodEntry entry) {
        String description = entry.foodDescription();
        if (entry.foodName() == null || description == null) {
            return Optional.empty();
        }

        Matcher calories = CALORIES.matcher(description);
        if (!calories.find()) {
            return Optional.empty();
        }

        return Optional.of(new FoodSearch(
                entry.foodName(),
                parseServing(description),
                Integer.parseInt(calories.group(1)),
                parseMacro(description, CARBS),
                parseMacro(description, PROTEIN),
                parseMacro(description, FAT)));
    }

    // Null rather than a guess when the description doesn't open with a portion:
    // the dropdown then says nothing about serving size instead of a wrong thing.
    private static String parseServing(String description) {
        Matcher matcher = SERVING.matcher(description);
        return matcher.find() ? matcher.group(1) : null;
    }

    // synchronized: two searches arriving together with an expired token would
    // otherwise both request a new one.
    private synchronized String getValidAccessToken() {
        if (accessToken == null || Instant.now().isAfter(tokenExpirationTime)) {
            MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
            formData.add("grant_type", "client_credentials");
            formData.add("scope", "basic");

            TokenResponse response = restClient.post()
                    .uri("https://oauth.fatsecret.com/connect/token")
                    .headers(headers -> {
                        headers.setBasicAuth(clientId, clientSecret);
                        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
                    })
                    .body(formData)
                    .retrieve()
                    .body(TokenResponse.class);

            if (response == null || response.accessToken() == null) {
                throw new FoodSearchUnavailableException("FatSecret returned no access token", null);
            }

            this.accessToken = response.accessToken();
            this.tokenExpirationTime = Instant.now()
                    .plusSeconds(response.expiresIn())
                    .minus(TOKEN_EXPIRY_MARGIN);
        }
        return accessToken;
    }

    private synchronized void invalidateToken() {
        accessToken = null;
    }

    private static Pattern macroPattern(String macro) {
        return Pattern.compile(macro + ":\\s*(\\d+(?:\\.\\d+)?)g");
    }

    private static Double parseMacro(String description, Pattern pattern) {
        Matcher matcher = pattern.matcher(description);
        return matcher.find() ? Double.parseDouble(matcher.group(1)) : null;
    }

}
