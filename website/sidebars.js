/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  // By default, Docusaurus generates a sidebar from the docs folder structure
  tutorialSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      items: ['intro', 'installation', 'quick-start'],
    },
    {
      type: 'category',
      label: 'Core Concepts',
      items: [
        'core-concepts/service-registry',
        'core-concepts/bundle-system',
        'core-concepts/dynamic-dependencies',
        'core-concepts/event-system',
        'core-concepts/configuration-management',
      ],
    },
    {
      type: 'category',
      label: 'Design Patterns',
      items: [
        'design-patterns/extender-pattern',
        'design-patterns/whiteboard-pattern',
        'design-patterns/fragment-pattern',
      ],
    },
    {
      type: 'category',
      label: 'Packages',
      items: [
        'packages/pandino',
        'packages/react-hooks',
        'packages/decorators',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'api/core-interfaces',
        'api/built-in-services',
        'api/decorators',
        'api/react-hooks',
      ],
    },
  ],
};

module.exports = sidebars;
