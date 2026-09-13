package com.example.calTracker.controller;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import com.example.calTracker.service.FoodSearchUnavailableException;
import com.example.calTracker.service.MealNotFoundException;

// One place that decides what every error looks like on the wire. All responses
// are RFC 9457 problem+json: {type, title, status, detail, instance}.
//
// Extending ResponseEntityExceptionHandler covers Spring MVC's own failures —
// malformed JSON, a bad date in the path, a missing query param, a failed @Valid
// — with correct 4xx statuses. The methods below add this app's own exceptions.
@RestControllerAdvice
public class ApiExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler(MealNotFoundException.class)
    ProblemDetail handleMealNotFound(MealNotFoundException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setTitle("Meal not found");
        return problem;
    }

    @ExceptionHandler(FoodSearchUnavailableException.class)
    ProblemDetail handleFoodSearchUnavailable(FoodSearchUnavailableException ex) {
        // The cause is logged, not returned: upstream error text can include
        // details about our credentials that a client has no business seeing.
        logger.warn("Food search failed: " + ex.getMessage(), ex.getCause());
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_GATEWAY, "Food search is unavailable right now. You can still log the meal by hand.");
        problem.setTitle("Food search unavailable");
        return problem;
    }

    // The default body for a failed @Valid only says "Invalid request content."
    // This adds which fields failed and why, e.g. {"errors": {"name": "must not be blank"}}.
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        Map<String, String> errors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(error -> errors.putIfAbsent(error.getField(), error.getDefaultMessage()));

        ProblemDetail problem = ex.getBody();
        problem.setDetail("Some fields are invalid.");
        problem.setProperty("errors", errors);
        return handleExceptionInternal(ex, problem, headers, status, request);
    }
}
