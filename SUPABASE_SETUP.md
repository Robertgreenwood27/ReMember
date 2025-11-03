# 🔐 Setting Up Supabase for Memory Jogger

This guide will walk you through setting up cloud sync and authentication for Memory Jogger using Supabase.

## Why Supabase?

- ✅ **Unlimited storage** - No more localStorage limits
- ✅ **Multi-device sync** - Access your memories anywhere
- ✅ **Built-in authentication** - Secure user accounts
- ✅ **Real-time capabilities** - Future features like collaboration
- ✅ **Free tier** - 500MB database, 50,000 monthly active users

## Step-by-Step Setup

### 1. Create a Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub or email

### 2. Create a New Project

1. Click "New Project"
2. Choose an organization (or create one)
3. Fill in project details:
   - **Name**: Memory Jogger (or your choice)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to you
4. Click "Create new project"
5. Wait 2-3 minutes for setup to complete

### 3. Run the Database Schema

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click "New query"
3. Copy the contents of `supabase/schema.sql` from the project
4. Paste into the SQL editor
5. Click "Run" (or press Ctrl/Cmd + Enter)
6. You should see success messages for all tables and policies created

### 4. Get Your API Keys

1. In your Supabase dashboard, go to **Settings** → **API**
2. Find these two values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (long string starting with `eyJ...`)

### 5. Configure Environment Variables

1. In your Memory Jogger project root, create `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` and add your values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. Save the file

### 6. Restart Your Development Server

```bash
# Stop the server (Ctrl+C)
# Start it again
npm run dev
```

### 7. Configure Email Settings (Optional but Recommended)

By default, Supabase sends emails for:
- Email verification on signup
- Magic link login
- Password reset

To customize email templates:

1. Go to **Authentication** → **Email Templates**
2. Customize the templates as desired
3. Add your email domain (if using custom emails)

For development, the default configuration works fine!

### 8. Test the Setup

1. Open `http://localhost:3000`
2. You should see a "Sign In to Sync" button in the top right
3. Click it and create an account
4. Verify your email (check spam if needed)
5. Sign in and start writing memories!

## Understanding the Data Flow

### Without Supabase (Default)
```
Write Memory → localStorage → Your Browser
```

### With Supabase
```
Write Memory → Supabase Database → Cloud (accessible anywhere)
```

### Hybrid Mode (Best for offline support)
```
Write Memory → localStorage + Supabase → Sync when online
```

## Features You Get

### Authentication
- ✅ Email/password signup and login
- ✅ Magic link (passwordless) login
- ✅ Email verification
- ✅ Secure password reset
- ✅ Session management

### Data Storage
- ✅ Unlimited entries and anchors
- ✅ Automatic backups
- ✅ Multi-device sync
- ✅ Row-level security (users can only see their own data)

### Future-Ready
- 🔜 Real-time updates
- 🔜 Collaboration features
- 🔜 Advanced search
- 🔜 Data analytics

## Migrating Existing Data

If you already have memories in localStorage:

1. Sign up and sign in to your new account
2. Go to **Settings** page
3. Click "Sync Local to Cloud"
4. Your localStorage data will be uploaded to Supabase
5. Optionally clear localStorage after confirming sync

## Security & Privacy

Memory Jogger + Supabase provides:

- **Row-Level Security (RLS)**: Users can only access their own data
- **Encrypted connections**: All data transmitted over HTTPS
- **Secure authentication**: Industry-standard JWT tokens
- **No data sharing**: Your memories are private by default
- **GDPR compliant**: Supabase follows European privacy standards

## Database Structure

Your data is stored in two tables:

### `entries` table
- id (UUID)
- user_id (references auth.users)
- date (timestamp)
- anchor (text)
- text (text)
- nouns (text array)
- is_private (boolean)
- phase (text, optional)

### `nodes` table
- id (UUID)
- user_id (references auth.users)
- word (text)
- connections (text array)
- count (integer)

## Cost Considerations

### Free Tier (Hobby)
- 500 MB database space
- 50,000 monthly active users
- 2 GB bandwidth
- 50 MB file storage
- Unlimited API requests

**Estimated capacity**: ~50,000+ memories with typical usage

### Paid Tiers
Starting at $25/month if you exceed free tier limits.

For personal journaling, the free tier should be more than sufficient for years of daily writing!

## Troubleshooting

### "Failed to fetch" error
- Check that your Supabase project is running
- Verify your API keys in `.env.local`
- Restart your dev server

### Can't sign up or sign in
- Check your email for verification link
- Verify your Supabase project URL is correct
- Check browser console for error messages

### Data not syncing
- Ensure you're signed in (check top right)
- Try the manual sync in Settings
- Check Supabase dashboard for error logs

### Email not arriving
- Check spam/junk folder
- Verify email settings in Supabase dashboard
- Try using magic link instead

## Advanced Configuration

### Custom Email Domain

1. Go to **Authentication** → **Email Settings**
2. Add your custom SMTP settings
3. Verify your domain

### OAuth Providers (GitHub, Google, etc.)

1. Go to **Authentication** → **Providers**
2. Enable desired providers
3. Add OAuth credentials
4. Update sign-in page to include OAuth buttons

### Database Backups

Supabase automatically backs up your database daily (on paid plans) or weekly (on free tier).

To create manual backups:
1. Go to **Database** → **Backups**
2. Click "Create backup"

## Next Steps

Once Supabase is set up, you can:

1. ✅ Access memories from multiple devices
2. ✅ Never worry about localStorage limits
3. ✅ Share your Memory Jogger with friends (each has own account)
4. ✅ Build additional features (search, analytics, etc.)
5. ✅ Export your data anytime from Settings

---

**Questions?** Check the [Supabase Documentation](https://supabase.com/docs) or the Memory Jogger README for more info!
