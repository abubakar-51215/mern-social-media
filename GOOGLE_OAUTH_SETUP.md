# Google OAuth Setup Guide

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. Create OAuth 2.0 Credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:5000/auth/google/callback`
   - Add authorized JavaScript origins:
     - `http://localhost:3000`
     - `http://localhost:5000`
   - Click "Create"

5. Copy your Client ID and Client Secret

## Step 2: Update Backend .env File

Open `Backend/.env` and replace the placeholder values:

```
GOOGLE_CLIENT_ID=your_actual_google_client_id
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret
SESSION_SECRET=any_random_string_for_session_security
```

## Step 3: Restart Backend Server

```bash
cd Backend
npm run dev
```

## Step 4: Test Google OAuth

1. Start the frontend: `cd Frontend && npm start`
2. Go to http://localhost:3000
3. Click "Continue with Google"
4. You should be redirected to Google login
5. After successful login, you'll be redirected back to the dashboard

## Troubleshooting

- Make sure both frontend (port 3000) and backend (port 5000) are running
- Check that MongoDB is running
- Verify the redirect URI in Google Console matches exactly: `http://localhost:5000/auth/google/callback`
- Check browser console for any errors
