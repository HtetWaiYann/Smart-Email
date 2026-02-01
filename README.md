# Smart Email

A modern email management application built with Next.js that leverages AI-powered features to help you organize, summarize, and manage your emails more efficiently.

## 🚀 Overview

Smart Email is an intelligent email management system that integrates with Gmail to provide AI-powered categorization, summarization, and smart reply suggestions. Built with modern web technologies and designed for productivity.

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router) with Server Actions
- **Database:** PostgreSQL with Prisma ORM
- **Language:** TypeScript
- **Authentication:** Google OAuth2 (Gmail API)
- **Data Fetching:** TanStack Query (React Query)
- **Styling:** Tailwind CSS

## ✨ Features

### Version 1 (Current)

1. **Google Login** - Secure authentication using Google OAuth2
2. **Async Emails** - Efficient email fetching and management
3. **Email Categorization** - AI-powered email categorization using MCP
4. **Email Summary** - Automatic email summarization using MCP
5. **One Tab Replay (AI Suggestions)** - Smart reply suggestions using MCP

### Version 2 (Planned)

1. **Live Inbox Updates** - Real-time email updates using Pub/Sub
2. **Auto Meeting Detection** - Automatically detect meetings and add to calendar (MCP)
3. **Auto Reply Tones** - Customizable reply tones (friendly, professional, short, custom presets)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- Node.js 20+ and npm/yarn/pnpm
- PostgreSQL database
- Google Cloud Project with Gmail API enabled
- Google OAuth2 credentials

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd smart-email
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/smart_email"

# Google OAuth2
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/callback/google"

# Next.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# MCP Configuration (if applicable)
MCP_API_KEY="your-mcp-api-key"
```

### 4. Set up the database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed the database
npx prisma db seed
```

### 5. Run the development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 📁 Project Structure

```
smart-email/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── prisma/               # Prisma schema and migrations
├── public/                # Static assets
├── .env.local            # Environment variables (not committed)
└── package.json          # Dependencies
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🔐 Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs
6. Copy the Client ID and Client Secret to your `.env.local` file

## 📝 Database Schema

The project uses Prisma for database management. The schema is defined in `prisma/schema.prisma`. Run migrations to set up the database structure.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is private and proprietary.

## 🗺️ Roadmap

- [x] Version 1: Core features (Google login, email fetching, categorization, summarization, AI suggestions)
- [ ] Version 2: Live updates, meeting detection, auto-reply tones

---