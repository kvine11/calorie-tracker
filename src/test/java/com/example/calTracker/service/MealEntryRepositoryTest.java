package com.example.calTracker.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDate;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;

import com.example.calTracker.model.MealEntry;

// Runs against real Postgres (caltracker_test), migrated by Flyway — not an
// in-memory stand-in, which would accept SQL and constraints Postgres rejects.
// @DataJpaTest rolls each test's transaction back, so tests can't see each
// other's rows.
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class MealEntryRepositoryTest {

    private static final LocalDate SEP_7 = LocalDate.of(2026, 9, 7);
    private static final LocalDate SEP_8 = LocalDate.of(2026, 9, 8);
    private static final LocalDate SEP_9 = LocalDate.of(2026, 9, 9);
    private static final LocalDate SEP_10 = LocalDate.of(2026, 9, 10);

    @Autowired
    private MealEntryRepository repository;

    @Test
    void findByDateReturnsOnlyThatDayInTheOrderMealsWereLogged() {
        repository.save(meal("Lunch", 600, SEP_8));
        repository.save(meal("Someone else's day", 100, SEP_9));
        repository.save(meal("Afternoon snack", 150, SEP_8));

        assertThat(repository.findByDateOrderByIdAsc(SEP_8))
                .extracting(MealEntry::getName)
                .containsExactly("Lunch", "Afternoon snack");
    }

    @Test
    void rangeIncludesBothEndsAndIsOrderedByDateThenLoggingOrder() {
        repository.save(meal("Dinner on the 9th", 700, SEP_9));
        repository.save(meal("Too early", 100, SEP_7));
        repository.save(meal("Breakfast on the 8th", 300, SEP_8));
        repository.save(meal("Too late", 100, SEP_10));
        repository.save(meal("Late snack on the 8th", 200, SEP_8));

        assertThat(repository.findByDateBetweenOrderByDateAscIdAsc(SEP_8, SEP_9))
                .extracting(MealEntry::getName)
                .containsExactly("Breakfast on the 8th", "Late snack on the 8th", "Dinner on the 9th");
    }

    // These two prove V2__meal_constraints.sql actually ran: the rules are
    // enforced by the database itself, whatever the Java code does.
    @Test
    void theDatabaseRejectsAMealWithNoDate() {
        assertThatThrownBy(() -> repository.saveAndFlush(meal("Undated", 100, null)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void theDatabaseRejectsNegativeCalories() {
        assertThatThrownBy(() -> repository.saveAndFlush(meal("Impossible", -1, SEP_8)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    private static MealEntry meal(String name, int calories, LocalDate date) {
        return new MealEntry(0, name, calories, null, null, null, date);
    }
}
