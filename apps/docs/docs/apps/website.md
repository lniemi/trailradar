# Website

The SportRadar company website.

## Overview

A marketing website for SportRadar built with React and Vite.

## Technology

- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4
- **Routing**: React Router v7

## Development

### Running the Website

```bash
pnpm dev:website
```

Opens at [http://localhost:5174](http://localhost:5174)

### Building

```bash
pnpm build:website
```

Output is generated in `apps/website/dist/`.

## Structure

```
apps/website/
├── src/
│   ├── components/    # React components
│   ├── pages/         # Page components
│   ├── App.tsx        # Router setup
│   └── main.tsx       # Entry point
├── public/            # Static assets
├── index.html         # HTML template
├── vite.config.ts     # Vite configuration
└── package.json
```

## Shared Packages

The website can use shared packages:

```typescript
import { Button, Card } from '@sportradar/ui'
import { AuthProvider } from '@sportradar/auth'
```
