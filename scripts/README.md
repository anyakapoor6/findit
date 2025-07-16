# Database Scripts

This directory contains scripts for database setup and maintenance.

## Setup Scripts

### `setup-matches.sql`
Creates the matches table and related functions for AI-powered matching.

### `setup-match-notifications.sql`
Creates the match_notifications table for storing user notifications.

### `fix-user-matches.sql`
Fixes any orphaned matches where users no longer exist.

### `fix-no-self-matches.sql`
Removes matches where a listing is matched with itself.

## Update Scripts

### `update-notifications.sql`
Updates notification messages to be more descriptive.

### `update-old-notifications.js`
Updates existing notifications to use the new format.

## Image Embedding Scripts

### `update-existing-image-embeddings-direct.js`
**Purpose**: Generates image embeddings for all existing listings that don't have them yet.

**Usage**:
```bash
npm run update-embeddings
```

**Requirements**:
- `OPENAI_API_KEY` environment variable set
- `SUPABASE_SERVICE_ROLE_KEY` environment variable set
- `NEXT_PUBLIC_SUPABASE_URL` environment variable set

**What it does**:
1. Finds all listings that have images but no embeddings
2. Generates embeddings using OpenAI's text-embedding-3-small model
3. Updates the database with the new embeddings
4. Provides progress feedback and error handling

**Note**: This script processes listings one by one with delays to avoid overwhelming the API. For large datasets, it may take some time to complete.

### `update-existing-image-embeddings.js`
Alternative version that uses the API endpoint instead of direct OpenAI calls. Use the direct version for better performance. 