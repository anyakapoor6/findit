-- Setup automatic matching trigger
-- This trigger will automatically call find_matches_for_listing when a new listing is inserted

-- First, drop the trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS trigger_find_matches_on_insert ON listings;

-- Create the trigger function
CREATE OR REPLACE FUNCTION trigger_find_matches()
RETURNS TRIGGER AS $$
BEGIN
    -- Call the matching function for the newly inserted listing
    PERFORM find_matches_for_listing(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER trigger_find_matches_on_insert
    AFTER INSERT ON listings
    FOR EACH ROW
    EXECUTE FUNCTION trigger_find_matches();

-- Verify the trigger was created
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_find_matches_on_insert'; 