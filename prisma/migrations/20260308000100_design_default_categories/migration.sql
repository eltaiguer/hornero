-- Align default category naming/emoji/color to design guidelines.
UPDATE "categories"
SET "name" = 'Dining Out', "emoji" = '🍽️', "color" = '#F59E0B'
WHERE "isDefault" = true AND "name" = 'Dining';

UPDATE "categories"
SET "name" = 'Clothing', "emoji" = '👕', "color" = '#A855F7'
WHERE "isDefault" = true AND "name" = 'Education';

UPDATE "categories"
SET "emoji" = '⚡', "color" = '#06B6D4'
WHERE "isDefault" = true AND "name" = 'Utilities';

UPDATE "categories"
SET "emoji" = '🏥', "color" = '#EF4444'
WHERE "isDefault" = true AND "name" = 'Health';

-- Ensure all design-default categories exist for each household.
INSERT INTO "categories" ("id", "householdId", "name", "color", "emoji", "isDefault")
SELECT md5(random()::text || clock_timestamp()::text || h."id" || c."name"), h."id", c."name", c."color", c."emoji", true
FROM "households" h
CROSS JOIN (
  VALUES
    ('Groceries', '#22C55E', '🛒'),
    ('Housing', '#8B5CF6', '🏠'),
    ('Utilities', '#06B6D4', '⚡'),
    ('Transport', '#3B82F6', '🚗'),
    ('Dining Out', '#F59E0B', '🍽️'),
    ('Entertainment', '#EC4899', '🎬'),
    ('Health', '#EF4444', '🏥'),
    ('Clothing', '#A855F7', '👕'),
    ('Other', '#6B7280', '📁')
) AS c("name", "color", "emoji")
WHERE NOT EXISTS (
  SELECT 1
  FROM "categories" existing
  WHERE existing."householdId" = h."id"
    AND existing."name" = c."name"
);
