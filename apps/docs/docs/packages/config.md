# @sportradar/config

Shared configuration files for SportRadar applications.

## Overview

This package provides shared ESLint and Tailwind CSS configurations for consistency across all apps and packages.

## ESLint Configuration

### Usage

In your package's ESLint config:

```javascript
// eslint.config.js
import baseConfig from '@sportradar/config/eslint'

export default [
  ...baseConfig,
  // Your custom rules
]
```

### Included Rules

The base configuration includes:
- TypeScript support
- React rules
- Import sorting
- Accessibility rules

## Tailwind CSS Configuration

### Usage

In your package's Tailwind config:

```javascript
// tailwind.config.js
import baseConfig from '@sportradar/config/tailwind'

export default {
  ...baseConfig,
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    // Include shared UI package
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
}
```

### Included Configuration

- Custom color palette
- Typography scale
- Spacing scale
- Animation utilities

## TypeScript Configuration

For TypeScript configuration, see [@sportradar/typescript-config](/docs/packages/config#typescript-config).

### Base Config

```json
// tsconfig.json
{
  "extends": "@sportradar/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "./dist"
  },
  "include": ["src"]
}
```

### React Config

```json
// tsconfig.json
{
  "extends": "@sportradar/typescript-config/react.json",
  "compilerOptions": {
    "outDir": "./dist"
  },
  "include": ["src"]
}
```
