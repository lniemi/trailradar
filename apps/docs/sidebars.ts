import type { SidebarsConfig } from '@docusaurus/plugin-content-docs'

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      items: ['getting-started/installation', 'getting-started/development'],
    },
    {
      type: 'category',
      label: 'Architecture',
      items: [
        'architecture/overview',
        'architecture/monorepo-structure',
        'architecture/tech-stack',
      ],
    },
    {
      type: 'category',
      label: 'Apps',
      items: ['apps/spectator', 'apps/website'],
    },
    {
      type: 'category',
      label: 'Packages',
      items: [
        'packages/auth',
        'packages/ui',
        'packages/utils',
        'packages/config',
      ],
    },
    {
      type: 'category',
      label: 'Features',
      items: [
        'features/map-component',
        'features/simulation-system',
        'features/ar-view',
      ],
    },
  ],
}

export default sidebars
