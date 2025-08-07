# Pandino Documentation Site

This directory contains the Docusaurus-based documentation site for the Pandino project. The documentation is built using [Docusaurus 3](https://docusaurus.io/), a modern static website generator.

## Directory Structure

```
website/
├── docs/                 # Documentation markdown files
│   ├── api/              # API Reference documentation
│   ├── core-concepts/    # Core concepts documentation
│   ├── design-patterns/  # Design patterns documentation
│   ├── packages/         # Package-specific documentation
│   └── ...               # Other documentation files
├── src/                  # Source files for the website
│   ├── css/              # CSS files
│   ├── pages/            # React components for pages
│   └── components/       # Reusable React components
├── static/               # Static files (images, etc.)
│   └── img/              # Image files
├── docusaurus.config.js  # Docusaurus configuration
├── sidebars.js           # Sidebar configuration
└── package.json          # NPM package configuration
```

## Getting Started

### Prerequisites

- Node.js version >= 18.0
- npm or yarn

### Installation

```bash
# Navigate to the website directory
cd website

# Install dependencies
npm install
```

### Local Development

```bash
# Start the development server
npm run start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```bash
# Build the website
npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Deployment

#### Manual Deployment

```bash
# Deploy to GitHub Pages
npm run deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.

#### Automated Deployment

The website is automatically deployed to GitHub Pages when changes are pushed to the `develop` or `master` branches. The deployment is handled by a GitHub Actions workflow defined in `.github/workflows/deploy-website.yml`.

The workflow:
1. Triggers on pushes to `develop` or `master` branches that include changes to the `website/` or `docs/` directories
2. Sets up the build environment with Node.js and pnpm
3. Installs dependencies and builds the website
4. Deploys the built website to the `gh-pages` branch

This automated process ensures that the documentation site is always up-to-date with the latest changes in the repository.

## Adding Content

### Adding Documentation Pages

1. Create a new Markdown file in the appropriate directory under `docs/`.
2. Add front matter at the top of the file:

```md
---
sidebar_position: 1
---

# Title of the Page

Content goes here...
```

3. Update `sidebars.js` if needed to include the new page in the navigation.

### Adding Images

1. Place image files in the `static/img/` directory.
2. Reference them in your Markdown files:

```md
![Alt Text](/img/your-image.png)
```

## Customization

### Styling

- Custom CSS can be added in `src/css/custom.css`.
- Theme configuration can be modified in `docusaurus.config.js`.

### Navigation

- The top navigation bar can be configured in `docusaurus.config.js` under the `themeConfig.navbar` section.
- The sidebar navigation is configured in `sidebars.js`.

## Troubleshooting

If you encounter any issues:

1. Make sure all dependencies are installed correctly.
2. Check that your Node.js version is compatible (>= 18.0).
3. Clear the cache with `npm run clear`.
4. If you're having issues with the sidebar, ensure that all referenced documents exist in the correct locations.

## Resources

- [Docusaurus Documentation](https://docusaurus.io/docs)
- [Markdown Features](https://docusaurus.io/docs/markdown-features)
- [Pandino GitHub Repository](https://github.com/pandino/pandino)
