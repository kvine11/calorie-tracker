package com.example.calTracker;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

// Boots the whole application against caltracker_test: Flyway migrates it, then
// Hibernate validates the entities against the result. A migration that doesn't
// match an entity fails here, not at runtime.
@SpringBootTest
@ActiveProfiles("test")
class CalTrackerApplicationTests {

	@Test
	void contextLoads() {
	}

}
