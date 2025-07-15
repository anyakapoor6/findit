-- Update old notifications to have correct type field
-- This script ensures all notifications have the proper type for routing

-- First, let's see what we're working with
SELECT 
  COUNT(*) as total_notifications,
  COUNT(CASE WHEN type IS NULL THEN 1 END) as without_type,
  COUNT(CASE WHEN type IS NOT NULL THEN 1 END) as with_type
FROM notifications;

-- Show current type distribution
SELECT 
  type,
  COUNT(*) as count
FROM notifications 
WHERE type IS NOT NULL
GROUP BY type
ORDER BY count DESC;

-- Update notifications without type field
-- Default to 'claim_on_listing' for notifications without type
UPDATE notifications 
SET type = 'claim_on_listing'
WHERE type IS NULL;

-- Update notifications based on message content for more accurate typing
-- Claims that were accepted
UPDATE notifications 
SET type = 'claim_'
WHERE type = 'claim_on_listing' 
  AND message ILIKE '%accepted%';

-- Claims that were rejected  
UPDATE notifications 
SET type = 'claim_rejected'
WHERE type = 'claim_on_listing' 
  AND message ILIKE '%rejected%';

-- Claims that were submitted
UPDATE notifications 
SET type = 'claim_submitted'
WHERE type = 'claim_on_listing' 
  AND (message ILIKE '%submitted%' OR message ILIKE '%new claim%');

-- Claims with status updates
UPDATE notifications 
SET type = 'claim_update'
WHERE type = 'claim_on_listing' 
  AND (message ILIKE '%update%' OR message ILIKE '%status%');

-- Show final distribution
SELECT 
  type,
  COUNT(*) as count
FROM notifications 
GROUP BY type
ORDER BY count DESC;

-- Verify all notifications now have a type
SELECT 
  COUNT(*) as total_notifications,
  COUNT(CASE WHEN type IS NULL THEN 1 END) as still_without_type,
  COUNT(CASE WHEN type IS NOT NULL THEN 1 END) as with_type
FROM notifications; 