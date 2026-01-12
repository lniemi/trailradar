# @sportradar/ui

Shared UI components for SportRadar applications.

## Installation

This package is included in the monorepo. Import directly:

```typescript
import { Button, Card } from '@sportradar/ui'
```

## Components

### Button

A styled button component.

```tsx
import { Button } from '@sportradar/ui'

function Example() {
  return (
    <Button onClick={() => console.log('clicked')}>
      Click Me
    </Button>
  )
}
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | 'primary' \| 'secondary' \| 'ghost' | 'primary' | Button style variant |
| size | 'sm' \| 'md' \| 'lg' | 'md' | Button size |
| disabled | boolean | false | Disable button |
| onClick | () => void | - | Click handler |
| children | ReactNode | - | Button content |

### Card

A container component with styling.

```tsx
import { Card } from '@sportradar/ui'

function Example() {
  return (
    <Card>
      <h2>Card Title</h2>
      <p>Card content goes here.</p>
    </Card>
  )
}
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| className | string | - | Additional CSS classes |
| children | ReactNode | - | Card content |

## Styling

Components use Tailwind CSS classes internally. You can extend styles using the `className` prop:

```tsx
<Card className="bg-blue-100 border-2">
  Custom styled card
</Card>
```

## Development

### Adding New Components

1. Create component in `packages/ui/src/components/`
2. Export from `packages/ui/src/index.ts`
3. Add TypeScript types as needed

### Building

```bash
pnpm --filter @sportradar/ui build
```
