# Installation

This guide will help you set up the SportRadar development environment.

## Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** >= 10.0.0
- **Git**

## Clone the Repository

```bash
git clone https://github.com/sportradar/sportradar.git
cd sportradar
```

## Install Dependencies

```bash
pnpm install
```

This will install all dependencies for all apps and packages in the monorepo.

## Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Configure the following environment variables:

```env
# Supabase (from `supabase start` output)
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key

# Mapbox
VITE_MAPBOX_ACCESS_TOKEN=your-mapbox-token
```

### Getting API Keys

#### Mapbox Access Token

1. Create an account at [mapbox.com](https://www.mapbox.com/)
2. Navigate to your account's [Access Tokens page](https://account.mapbox.com/access-tokens/)
3. Create a new token or use the default public token

#### Supabase Keys

When running Supabase locally, the keys are provided in the output of `supabase start`. See the [Development Guide](/docs/getting-started/development) for details.

## Verify Installation

Run the development server to verify everything is working:

```bash
pnpm dev:spectator
```

The app should be available at [http://localhost:5173](http://localhost:5173).
