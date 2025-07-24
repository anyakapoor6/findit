-- Check the current get_user_matches function to see how it orders results
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'get_user_matches'; 