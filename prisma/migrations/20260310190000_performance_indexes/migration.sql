CREATE INDEX IF NOT EXISTS "household_members_userId_idx"
ON "household_members"("userId");

CREATE INDEX IF NOT EXISTS "expenses_householdId_date_id_idx"
ON "expenses"("householdId", "date", "id");

CREATE INDEX IF NOT EXISTS "recurring_expenses_householdId_active_nextDueDate_idx"
ON "recurring_expenses"("householdId", "active", "nextDueDate");
