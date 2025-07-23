# Gmail API Setup Guide for FindIt Contact Form

This guide will help you set up Gmail API to send emails from your contact form to `finditcontact6@gmail.com`.

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable billing (required for Gmail API)

## Step 2: Enable Gmail API

1. In Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Gmail API"
3. Click on "Gmail API" and click "Enable"

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Desktop application" as the application type
4. Give it a name like "FindIt Contact Form"
5. Click "Create"
6. **Save the Client ID and Client Secret** - you'll need these

## Step 4: Get Refresh Token

1. Go to [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Click the settings icon (⚙️) in the top right
3. Check "Use your own OAuth credentials"
4. Enter your Client ID and Client Secret
5. Close settings
6. In the left panel, find "Gmail API v1" and select "https://www.googleapis.com/auth/gmail.send"
7. Click "Authorize APIs"
8. Sign in with your Gmail account (the one that will send emails)
9. Click "Exchange authorization code for tokens"
10. **Copy the Refresh Token** - you'll need this

## Step 5: Add Environment Variables

Add these to your `.env.local` file:

```env
# Gmail API Credentials
GMAIL_CLIENT_ID=your_client_id_here
GMAIL_CLIENT_SECRET=your_client_secret_here
GMAIL_REFRESH_TOKEN=your_refresh_token_here
```

## Step 6: Test the Setup

1. Start your development server: `npm run dev`
2. Test the Gmail connection: `http://localhost:3000/api/test-gmail`
3. You should see a success message with your Gmail address

## Step 7: Test Email Sending

1. Go to your contact form: `http://localhost:3000/contact`
2. Fill out the form and submit
3. Check `finditcontact6@gmail.com` for the email

## Troubleshooting

### Common Issues:

1. **"Missing Gmail API credentials"**
   - Make sure all environment variables are set correctly
   - Restart your development server after adding them

2. **"Invalid credentials"**
   - Double-check your Client ID, Client Secret, and Refresh Token
   - Make sure you copied them exactly

3. **"Access denied"**
   - Make sure you enabled the Gmail API in Google Cloud Console
   - Check that you're using the correct Gmail account

4. **"Quota exceeded"**
   - Gmail API has a limit of 1,000 emails per day (free)
   - This should be more than enough for a contact form

## Security Notes

- Keep your credentials secure and never commit them to version control
- The refresh token doesn't expire unless you revoke it
- You can revoke access in your Google Account settings if needed

## Cost

- **Free**: Up to 1,000 emails per day
- **Paid**: $0.40 per 1,000 emails after the free tier
- Perfect for contact forms and small applications 