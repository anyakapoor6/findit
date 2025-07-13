-- Create match_notifications table for tracking notification history
CREATE TABLE IF NOT EXISTS match_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  matched_listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('match_found', 'match_updated')),
  sent_via TEXT NOT NULL CHECK (sent_via IN ('web', 'email', 'sms')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_match_notifications_user_id ON match_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_match_notifications_match_id ON match_notifications(match_id);
CREATE INDEX IF NOT EXISTS idx_match_notifications_sent_at ON match_notifications(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_match_notifications_read_at ON match_notifications(read_at);

-- Function to get unread notification count for a user
CREATE OR REPLACE FUNCTION get_unread_match_notifications_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM match_notifications
    WHERE user_id = user_uuid AND read_at IS NULL
  );
END;
$$ LANGUAGE plpgsql;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_match_notifications_read(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE match_notifications
  SET read_at = NOW()
  WHERE user_id = user_uuid AND read_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to get notification statistics for a user
CREATE OR REPLACE FUNCTION get_match_notification_stats(user_uuid UUID)
RETURNS TABLE (
  total_notifications INTEGER,
  unread_notifications INTEGER,
  web_notifications INTEGER,
  email_notifications INTEGER,
  sms_notifications INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_notifications,
    COUNT(*) FILTER (WHERE read_at IS NULL)::INTEGER as unread_notifications,
    COUNT(*) FILTER (WHERE sent_via = 'web')::INTEGER as web_notifications,
    COUNT(*) FILTER (WHERE sent_via = 'email')::INTEGER as email_notifications,
    COUNT(*) FILTER (WHERE sent_via = 'sms')::INTEGER as sms_notifications
  FROM match_notifications
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql; 