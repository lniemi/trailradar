import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/__docusaurus/debug',
    component: ComponentCreator('/__docusaurus/debug', '5ff'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/config',
    component: ComponentCreator('/__docusaurus/debug/config', '5ba'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/content',
    component: ComponentCreator('/__docusaurus/debug/content', 'a2b'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/globalData',
    component: ComponentCreator('/__docusaurus/debug/globalData', 'c3c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/metadata',
    component: ComponentCreator('/__docusaurus/debug/metadata', '156'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/registry',
    component: ComponentCreator('/__docusaurus/debug/registry', '88c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/routes',
    component: ComponentCreator('/__docusaurus/debug/routes', '000'),
    exact: true
  },
  {
    path: '/docs',
    component: ComponentCreator('/docs', '539'),
    routes: [
      {
        path: '/docs',
        component: ComponentCreator('/docs', '913'),
        routes: [
          {
            path: '/docs',
            component: ComponentCreator('/docs', '8a1'),
            routes: [
              {
                path: '/docs/apps/spectator',
                component: ComponentCreator('/docs/apps/spectator', 'c63'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/apps/website',
                component: ComponentCreator('/docs/apps/website', 'e6e'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/architecture/monorepo-structure',
                component: ComponentCreator('/docs/architecture/monorepo-structure', '17c'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/architecture/overview',
                component: ComponentCreator('/docs/architecture/overview', '833'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/architecture/tech-stack',
                component: ComponentCreator('/docs/architecture/tech-stack', '34b'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/features/ar-view',
                component: ComponentCreator('/docs/features/ar-view', 'd66'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/features/map-component',
                component: ComponentCreator('/docs/features/map-component', '06b'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/features/simulation-system',
                component: ComponentCreator('/docs/features/simulation-system', '42c'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/getting-started/development',
                component: ComponentCreator('/docs/getting-started/development', '64e'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/getting-started/installation',
                component: ComponentCreator('/docs/getting-started/installation', '267'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/intro',
                component: ComponentCreator('/docs/intro', '61d'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/packages/auth',
                component: ComponentCreator('/docs/packages/auth', 'd77'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/packages/config',
                component: ComponentCreator('/docs/packages/config', '7b1'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/packages/ui',
                component: ComponentCreator('/docs/packages/ui', '85d'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/docs/packages/utils',
                component: ComponentCreator('/docs/packages/utils', '6ae'),
                exact: true,
                sidebar: "tutorialSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/',
    component: ComponentCreator('/', 'e5f'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
