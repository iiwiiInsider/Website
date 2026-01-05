# Testing Locally

Use these quick checks to verify OAuth and email delivery.

1) Start the dev server
- npm install
- npm run dev

2) Check env var presence
- Open: http://localhost:3000/api/env-check
- Response shows which providers and Gmail are configured (booleans).

3) Test sending a welcome email
- If `GMAIL_CONFIGURED` is true, call:
  - GET http://localhost:3000/api/test-email?to=you@example.com
- Response: {ok:true, message: "Sent test welcome email to ..."}
- Check the inbox of `you@example.com` for the welcome email.

4) Test Sign-in flow
- Visit http://localhost:3000/login and click "Sign in with Google".
- After successful login you should be redirected to `/market`.
- The server console will log `Welcome email sent` with the messageId if Gmail was configured successfully.

Troubleshooting
- If Google sign-in fails, re-check your OAuth client settings in Google Cloud Console and ensure `http://localhost:3000/api/auth/callback/google` is listed as an authorized redirect.
- For Gmail, generate an App Password (requires 2FA) and set it in `GMAIL_APP_PASSWORD`.
- If you need, I can help walk through creating the Google credentials and a Gmail App Password step-by-step.
