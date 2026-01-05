# Cape Town Market — Demo

A small demo Next.js app that follows the provided mockups: landing, login/register, and a Cape Town real estate market page with search and filters.

Features
- NextAuth-based authentication with Google (and optional Apple) providers
- Sends a welcome email from `kdbburns.social@gmail.com` (configurable) to users after sign-in using nodemailer
- Redirects users to `/market` after login
- A simple UI and sample data for Cape Town real estate listings with filters

Quick start
1. Copy `.env.example` to `.env.local` and fill in the variables (Google credentials, Gmail app password, NEXTAUTH_SECRET).
2. Install deps: `npm install`
3. Run dev server: `npm run dev`

Setting up Google OAuth
1. Go to Google Cloud Console → APIs & Services → Credentials.
2. Create an OAuth 2.0 Client ID for a Web application.
3. Add `http://localhost:3000` to Authorized JavaScript origins and `http://localhost:3000/api/auth/callback/google` to Authorized redirect URIs.
4. Copy the client ID and client secret into `.env.local` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

Signing in with Apple (optional)
- Sign in with Apple requires Apple developer credentials. If you have those, set `APPLE_CLIENT_ID` and `APPLE_CLIENT_SECRET` in `.env.local`. The provider is only enabled when these are present.

Gmail for Welcome Emails
- It's recommended to use a Gmail App Password (requires 2FA). Set `GMAIL_USER=kdbburns.social@gmail.com` and `GMAIL_APP_PASSWORD` in `.env.local`.
- The app will send a "Welcome to {BUSINESS_NAME}" email to the user's email shortly after they sign in.

What to expect when testing
- Visit `/login` and click "Sign in with Google". After successful auth you'll be redirected to `/market`.
- If Gmail credentials are configured, the signing-in user should receive a welcome email from `GMAIL_USER`.

Files of interest
- `pages/login.js` — custom sign-in page and provider buttons
- `pages/market.js` — market page (Cape Town only) and filters/search
- `pages/api/auth/[...nextauth].js` — NextAuth configuration (redirect + signIn event that triggers email)
- `lib/email.js` — nodemailer helper
- `data/properties.js` — sample Cape Town property data

Next steps I can take for you
- Add a database (MongoDB) to persist users and listings
- Add a listing creation UI for sellers
- Deploy to Vercel and configure env vars/redirect URIs
- Further polish UI to match the mockups pixel-for-pixel

If you'd like, I can now test the flows locally for you and document any remaining setup steps for Google and Apple credentials.