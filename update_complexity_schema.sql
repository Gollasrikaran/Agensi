-- Add complexity_level to the skills table
ALTER TABLE skills ADD COLUMN complexity_level INT DEFAULT 1;

-- Update existing skills to have complexity level 1 if they are null
UPDATE skills SET complexity_level = 1 WHERE complexity_level IS NULL;
