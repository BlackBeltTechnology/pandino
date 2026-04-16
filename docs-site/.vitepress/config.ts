import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Pandino',
  description: 'OSGi-Style Modular Framework for TypeScript',
  lang: 'en-US',
  base: '/pandino/',
  cleanUrls: true,

  sitemap: {
    hostname: 'https://blackbelttechnology.github.io/pandino/',
  },

  head: [
    ['meta', { name: 'theme-color', content: '#3c8772' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'Pandino' }],
    [
      'meta',
      {
        property: 'og:title',
        content: 'Pandino - OSGi-Style Framework for TypeScript',
      },
    ],
    [
      'meta',
      {
        property: 'og:description',
        content:
          'A lightweight TypeScript framework for modular architecture with dynamic service discovery, bundle system, and declarative dependency injection.',
      },
    ],
    [
      'meta',
      {
        property: 'og:url',
        content: 'https://blackbelttechnology.github.io/pandino/',
      },
    ],
    ['meta', { name: 'twitter:card', content: 'summary' }],
    [
      'meta',
      {
        name: 'twitter:title',
        content: 'Pandino - OSGi-Style Framework for TypeScript',
      },
    ],
    [
      'meta',
      {
        name: 'twitter:description',
        content: 'A lightweight TypeScript framework for modular architecture with dynamic service discovery.',
      },
    ],
  ],

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/introduction/what-is-pandino' },
      { text: 'Concepts', link: '/concepts/services' },
      { text: 'Patterns', link: '/patterns/extender-pattern' },
      { text: 'API', link: '/api/core' },
      {
        text: 'Packages',
        items: [
          { text: '@pandino/pandino', link: '/guide/core-framework' },
          { text: '@pandino/decorators', link: '/guide/decorators' },
          { text: '@pandino/react-hooks', link: '/guide/react-hooks' },
          { text: '@pandino/rollup-bundle-plugin', link: '/guide/rollup-plugin' },
        ],
      },
    ],

    sidebar: {
      '/introduction/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is Pandino?', link: '/introduction/what-is-pandino' },
            { text: 'Getting Started', link: '/introduction/getting-started' },
            { text: 'Architecture', link: '/introduction/architecture' },
          ],
        },
      ],
      '/guide/': [
        {
          text: 'Package Guides',
          items: [
            { text: 'Core Framework', link: '/guide/core-framework' },
            { text: 'Decorators', link: '/guide/decorators' },
            { text: 'React Hooks', link: '/guide/react-hooks' },
            { text: 'Rollup Bundle Plugin', link: '/guide/rollup-plugin' },
          ],
        },
      ],
      '/concepts/': [
        {
          text: 'Core Concepts',
          items: [
            { text: 'Services', link: '/concepts/services' },
            { text: 'Bundles', link: '/concepts/bundles' },
            { text: 'Declarative Services', link: '/concepts/declarative-services' },
            { text: 'Configuration', link: '/concepts/configuration' },
            { text: 'Events', link: '/concepts/events' },
          ],
        },
      ],
      '/patterns/': [
        {
          text: 'Patterns',
          items: [
            { text: 'Extender Pattern', link: '/patterns/extender-pattern' },
            { text: 'Whiteboard Pattern', link: '/patterns/whiteboard-pattern' },
            { text: 'Fragment Pattern', link: '/patterns/fragment-pattern' },
            { text: 'Decorator Extenders', link: '/patterns/decorator-extenders' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Core', link: '/api/core' },
            { text: 'Decorators', link: '/api/decorators' },
            { text: 'React Hooks', link: '/api/react-hooks' },
            { text: 'Rollup Plugin', link: '/api/rollup-plugin' },
          ],
        },
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Basic Service', link: '/examples/basic-service' },
            { text: 'React Application', link: '/examples/react-app' },
            { text: 'Plugin System', link: '/examples/plugin-system' },
          ],
        },
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/BlackBeltTechnology/pandino' }],

    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/BlackBeltTechnology/pandino/edit/develop/docs-site/:path',
      text: 'Edit this page on GitHub',
    },

    footer: {
      message: 'Released under the Eclipse Public License 2.0.',
      copyright: 'Copyright BlackBelt Technology',
    },
  },
});
