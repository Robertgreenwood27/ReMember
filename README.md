# 🧠 ReMind

A Self-Growing Map of Personal Memory

## Overview

Memory Jogger is a minimalist journaling web app that helps you rediscover your past through **anchors** — key nouns automatically extracted from your own writing. Each time you write, the system parses the text, surfaces new anchor words, and links them to existing ones. Over time, the result becomes an explorable graph of memories showing how moments, people, places, and emotions interconnect.

## ✨ New: Cloud Sync & Authentication

Memory Jogger now supports **optional** Supabase integration for:
- ☁️ **Cloud storage** - Unlimited memories, no localStorage limits
- 🔐 **User authentication** - Secure accounts with email/password or magic links
- 🔄 **Multi-device sync** - Access your memories anywhere
- 💾 **Automatic backups** - Never lose your data

**Works both ways**: Use it without an account (localStorage only) or sign up for cloud sync!

## Features

✨ **Anchor-Based Writing** - Start with a word, write freely, discover new connections  
🔍 **Automatic Noun Extraction** - Uses compromise.js for intelligent text parsing  
📊 **Visual Word Cloud** - See your anchors sized by frequency  
💾 **Local-First Storage** - Your data stays in your browser via localStorage  
☁️ **Optional Cloud Sync** - Supabase integration for unlimited storage and multi-device access  
🔐 **User Authentication** - Secure sign-up/sign-in with email verification  
🎨 **Minimal Design** - Distraction-free writing interface  
🌓 **Dark Mode** - Automatic dark/light theme support

## Getting Started

### Quick Start (No Setup Required)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

That's it! You can start using Memory Jogger immediately with localStorage.

### Optional: Set Up Cloud Sync

If you want unlimited storage and multi-device sync:

1. **Follow the Supabase setup guide:**
   See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions

2. **Configure environment variables:**
   ```bash
   cp .env.local.example .env.local
   # Add your Supabase credentials
   ```

3. **Restart the server:**
   ```bash
   npm run dev
   ```

4. **Sign up for an account:**
   Click "Sign In to Sync" in the top right

## How to Use

### 1. Create Your First Anchor
- On the home page, click "Create First Anchor"
- Enter a word that represents a memory (e.g., "dad", "beach", "childhood")

### 2. Write Freely
- You'll see your anchor word at the top of a blank page
- Write whatever comes to mind about that anchor
- Don't worry about structure — just write

### 3. Save and Discover
- Click "Save" when you're done
- The system extracts nouns from your writing
- These nouns become new anchors you can explore

### 4. Navigate Your Memory Map
- Return to the home page to see all your anchors
- Larger words = more frequent in your memories
- Click any anchor to write more or see previous entries

### 5. Sync Your Data (Optional)
- Sign in with your account
- Go to Settings to sync localStorage to cloud
- Access your memories from any device

## Technology Stack

- **Framework:** Next.js 15+ (App Router)
- **Styling:** Tailwind CSS
- **Parsing:** compromise.js + stopword
- **Storage:** localStorage + Supabase (optional)
- **Authentication:** Supabase Auth
- **Database:** PostgreSQL (via Supabase)
- **Language:** TypeScript

## Data Storage Options

### LocalStorage (Default)
- ✅ No setup required
- ✅ Complete privacy (never leaves your device)
- ✅ Works offline
- ⚠️ Limited to ~5-10MB
- ⚠️ Single device only

### Supabase (Optional)
- ✅ Unlimited storage
- ✅ Multi-device sync
- ✅ Automatic backups
- ✅ User authentication
- ✅ Free tier: 500MB database
- ⚠️ Requires account setup

### Best of Both Worlds
The app can work in **hybrid mode**: writes to localStorage immediately (fast), then syncs to Supabase when online. This gives you offline support plus cloud backup!

## Project Structure

```
memory-jogger/
├── app/
│   ├── page.tsx              # Home page (Anchor Cloud)
│   ├── write/page.tsx        # Write page
│   ├── login/page.tsx        # Login page
│   ├── signup/page.tsx       # Signup page
│   ├── settings/page.tsx     # Settings & data management
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── lib/
│   ├── types.ts              # TypeScript interfaces
│   ├── parser.ts             # Noun extraction logic
│   ├── storage.ts            # localStorage utilities (legacy)
│   ├── storage-supabase.ts   # Unified storage (local + cloud)
│   ├── auth-context.tsx      # Authentication provider
│   └── supabase/
│       └── client.ts         # Supabase client
├── supabase/
│   └── schema.sql            # Database schema
├── SUPABASE_SETUP.md         # Supabase configuration guide
└── package.json
```

## Commands

```bash
# Development
npm run dev

# Build for production
npm run build
npm start

# Type checking
npm run type-check
```

## Data Management

### Export Your Data

1. Go to Settings page
2. Click "Export as JSON"
3. Downloads a complete backup of your memories

### Sync Local to Cloud

1. Go to Settings page
2. Click "Sync Local to Cloud"
3. All localStorage data uploads to Supabase

### Clear Data

Open browser DevTools console:
```javascript
// Clear localStorage
localStorage.removeItem('memory-jogger-data');
```

Or use the Settings page "Clear Local Data" button.

## Future Enhancements

- 🔄 Real-time sync across devices
- 📈 **Graph Visualization** - Interactive network view with React Flow
- 🔍 **Search** - Full-text search across all memories
- 🔒 **Privacy Controls** - Mark entries as private
- 🏷️ **Life Phases** - Tag memories by era (Becoming, Growing, etc.)
- 🔗 **Smart Linking** - Automatic suggestions for related entries
- 📱 **Mobile App** - Native iOS/Android versions
- 🎨 **Themes** - Customizable color schemes
- 📊 **Analytics** - Insights about your memory patterns

## Philosophy

Memory Jogger believes in:
- **Ownership** - Your data, your device, your control (or your cloud, your choice)
- **Discovery** - Structure reveals insight without AI interpretation  
- **Simplicity** - One word, one blank page, infinite connections
- **Growth** - Your memory map expands with every entry
- **Privacy** - Optional sync means you choose where your memories live

## Security & Privacy

- **LocalStorage mode**: Data never leaves your device
- **Supabase mode**: 
  - End-to-end HTTPS encryption
  - Row-level security (you can only see your own data)
  - Industry-standard authentication
  - GDPR compliant
  - Your data is never shared or sold

## License

This is a prototype project. Feel free to adapt and extend!

## Credits

Built with Next.js, Tailwind CSS, compromise.js, and Supabase  
Concept: A self-growing map of personal memory

---

**Start writing. Start remembering. Start discovering.**
