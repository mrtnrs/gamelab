# GameLab - AI Game Platform

GameLab is a modern static site for showcasing AI-generated games with a Netflix-like discovery experience. The platform features a Supabase database integration for game management and a simple admin authentication system.

## Features

- **Game Showcase**: Browse and discover AI-generated games in a Netflix-style interface
- **Game Submission**: Users can submit their own games for review
- **Admin Management**: Simple admin interface to manage game submissions
- **Supabase Integration**: Database storage for games and images
- **Static Site Generation**: Optimized for Cloudflare Pages deployment

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Database**: Supabase
- **Authentication**: Simple admin password protection
- **Deployment**: Cloudflare Pages

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account and project

### Environment Setup

Create a `.env.local` file with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation

```bash
# Install dependencies
npm install
# or
yarn install

# Run development server
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Deployment

This project is configured for deployment on Cloudflare Pages:

1. Push your code to GitHub
2. Connect your repository to Cloudflare Pages
3. Configure the build settings:
   - Build command: `npm run build` or `yarn build`
   - Build output directory: `/out`
4. Add your environment variables in the Cloudflare Pages dashboard

## Database Schema

The Supabase database includes the following tables:

- **games**: Stores game information including title, description, image URL, etc.

## Admin Access

Access the admin area by navigating to `/admin` and logging in with your admin credentials.
