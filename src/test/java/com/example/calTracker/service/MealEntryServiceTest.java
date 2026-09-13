package com.example.calTracker.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.time.LocalDate;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.calTracker.model.MealEntry;
import com.example.calTracker.model.MealEntryCreateRequest;
import com.example.calTracker.model.MealEntryUpdateRequest;

// Business rules with the repository mocked out: macro rescaling, null-means-
// unknown, and not-found handling.
@ExtendWith(MockitoExtension.class)
class MealEntryServiceTest {

    private static final LocalDate SEP_8 = LocalDate.of(2026, 9, 8);

    @Mock
    private MealEntryRepository mealEntryRepository;

    @InjectMocks
    private MealEntryService mealEntryService;

    @Test
    void addNeverAssignsAnIdAndTrimsTheName() {
        given(mealEntryRepository.save(any())).willAnswer(invocation -> invocation.getArgument(0));

        MealEntry saved = mealEntryService.addMealEntry(
                new MealEntryCreateRequest("  Oats  ", 300, SEP_8, 10.0, 54.0, 5.0));

        // 0 is what tells save() to INSERT rather than UPDATE.
        assertThat(saved.getId()).isZero();
        assertThat(saved.getName()).isEqualTo("Oats");
    }

    @Test
    void doublingCaloriesDoublesEveryKnownMacro() {
        MealEntry existing = new MealEntry(7, "Steak & Rice Bowl", 320, 41.0, 19.0, 9.0, SEP_8);
        given(mealEntryRepository.findById(7L)).willReturn(Optional.of(existing));
        given(mealEntryRepository.save(any())).willAnswer(invocation -> invocation.getArgument(0));

        MealEntry updated = mealEntryService.updateMealEntry(7, new MealEntryUpdateRequest("Steak & Rice Bowl", 640, SEP_8));

        assertThat(updated.getCalories()).isEqualTo(640);
        assertThat(updated.getCarbs()).isEqualTo(82.0);
        assertThat(updated.getProtein()).isEqualTo(38.0);
        assertThat(updated.getFats()).isEqualTo(18.0);
    }

    @Test
    void unknownMacrosStayUnknownWhenCaloriesChange() {
        MealEntry existing = new MealEntry(7, "Leftovers", 400, null, null, null, SEP_8);
        given(mealEntryRepository.findById(7L)).willReturn(Optional.of(existing));
        given(mealEntryRepository.save(any())).willAnswer(invocation -> invocation.getArgument(0));

        MealEntry updated = mealEntryService.updateMealEntry(7, new MealEntryUpdateRequest("Leftovers", 200, SEP_8));

        assertThat(updated.getProtein()).isNull();
        assertThat(updated.getCarbs()).isNull();
        assertThat(updated.getFats()).isNull();
    }

    @Test
    void updatingAMissingMealThrowsNotFound() {
        given(mealEntryRepository.findById(999L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> mealEntryService.updateMealEntry(999, new MealEntryUpdateRequest("Ghost", 1, SEP_8)))
                .isInstanceOf(MealNotFoundException.class);
    }

    @Test
    void deletingAMissingMealThrowsNotFoundAndDeletesNothing() {
        given(mealEntryRepository.existsById(999L)).willReturn(false);

        assertThatThrownBy(() -> mealEntryService.deleteMealEntry(999))
                .isInstanceOf(MealNotFoundException.class);
        verify(mealEntryRepository, never()).deleteById(any());
    }
}
