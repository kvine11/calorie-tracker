-- Rules the API has always assumed but the database never enforced. A meal with
-- no date can't appear on any day, and one with no name can't be displayed.
ALTER TABLE meal_entries ALTER COLUMN name SET NOT NULL;
ALTER TABLE meal_entries ALTER COLUMN date SET NOT NULL;

-- Macros stay nullable on purpose: NULL means "unknown" (a meal typed by hand),
-- and a CHECK passes on NULL, so these only reject negative numbers.
ALTER TABLE meal_entries ADD CONSTRAINT meal_entries_calories_non_negative CHECK (calories >= 0);
ALTER TABLE meal_entries ADD CONSTRAINT meal_entries_protein_non_negative CHECK (protein >= 0);
ALTER TABLE meal_entries ADD CONSTRAINT meal_entries_carbs_non_negative CHECK (carbs >= 0);
ALTER TABLE meal_entries ADD CONSTRAINT meal_entries_fats_non_negative CHECK (fats >= 0);

-- Every read in the app is by day or by a range of days.
CREATE INDEX idx_meal_entries_date ON meal_entries (date);
