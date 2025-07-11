# Notification Update Scripts

This directory contains scripts to update old notifications in your database to ensure they have the correct `type` field for proper routing.

## Problem

Old notifications may be missing the `type` field or have incorrect values, which prevents them from routing correctly when clicked. The notification system expects these types:

- `claim_on_listing` - When someone submits a claim on your listing
- `claim_update` - When there's an update to a claim you submitted
- `claim_submitted` - When a new claim is submitted (legacy)
- `claim_accepted` - When your claim is accepted
- `claim_rejected` - When your claim is rejected

## Solutions

### Option 1: Node.js Script (Recommended)

The Node.js script provides detailed logging and intelligent type detection based on message content.

**Prerequisites:**
- Node.js installed
- Your `.env.local` file with Supabase credentials

**Run the script:**
```bash
cd scripts
node update-old-notifications.js
```

**What it does:**
1. Fetches all notifications from your database
2. Analyzes their current state (missing type, incorrect type, correct type)
3. Intelligently determines the correct type based on message content
4. Updates notifications that need fixing
5. Provides a detailed summary of changes

### Option 2: SQL Script

The SQL script can be run directly in your Supabase SQL editor.

**Steps:**
1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `update-notifications.sql`
4. Run the script

**What it does:**
1. Shows current notification statistics
2. Updates notifications without type field
3. Updates notifications based on message content
4. Shows final distribution

## Expected Notification Types

| Type | Description | Routes To |
|------|-------------|-----------|
| `claim_on_listing` | Someone claimed your listing | Profile → "Claims on My Listings" tab |
| `claim_update` | Update to a claim you submitted | Profile → "Claims" tab |
| `claim_submitted` | New claim submitted (legacy) | Profile → "Claims on My Listings" tab |
| `claim_accepted` | Your claim was accepted | Profile → "Claims" tab |
| `claim_rejected` | Your claim was rejected | Profile → "Claims" tab |

## Safety

Both scripts are safe to run multiple times. They only update notifications that need fixing and won't affect notifications that already have the correct type.

## Troubleshooting

If you encounter issues:

1. **Check your environment variables** - Ensure your `.env.local` file has the correct Supabase credentials
2. **Check database permissions** - Make sure your Supabase user has permission to read and update the notifications table
3. **Review the logs** - The Node.js script provides detailed logging to help identify issues

## After Running

Once you've updated your notifications:

1. Test clicking on old notifications in your app
2. Verify they route to the correct tabs in the profile page
3. Check that notification messages display correctly

All old notifications should now work properly with the current routing system! 