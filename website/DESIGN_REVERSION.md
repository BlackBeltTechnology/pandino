# Design Reversion Documentation

This document outlines the changes made to revert design modifications that are not related to fonts or colors in the Pandino documentation website.

## Summary of Changes

### 1. CSS Modifications

The CSS file (`/src/css/custom.css`) has been modified to:

- **Keep**:
  - Font imports and typography variables
  - Color variables for both light and dark modes
  - Background and content colors
  - Menu colors (hover and active states)
  - Card and container colors
  - Basic styling for code blocks to ensure proper font display

- **Remove**:
  - Custom border radius values
  - Shadow effects
  - Transition effects
  - Custom menu styling (including the "edgy" menu styling)
  - Custom chevron styling
  - Custom styling for cards, buttons, admonitions, tabs, etc.
  - Custom scrollbar styling
  - Custom markdown content styling
  - Custom API reference styling

### 2. Docusaurus Configuration

No changes were made to `docusaurus.config.js` as all modifications there were either:
- Related to colors (color mode settings, syntax highlighting themes)
- Added functionality rather than purely design changes (search component, theme toggle)
- Content changes rather than design changes (footer structure)

## Backup Files

A backup of the original CSS file with all design changes has been created at:
- `/src/css/custom.css.backup`

## Testing Instructions

To test the reverted design:

1. Navigate to the website directory:
   ```bash
   cd website
   ```

2. Start the development server:
   ```bash
   npm run start
   ```

3. Verify that:
   - The website uses the custom fonts (Inter for text, JetBrains Mono for code)
   - The color scheme is maintained (indigo-based for light mode, dark blue with lighter indigo for dark mode)
   - The design elements (borders, shadows, transitions, etc.) have reverted to the default Docusaurus styling
   - The menu no longer has the "manly" and "edgy" appearance (square corners, sharp borders, etc.)
   - The chevrons in the menu have reverted to the default Docusaurus styling

## Potential Adjustments

If any issues are found during testing:

1. **Missing Functionality**: If any functionality is broken due to the removal of certain CSS, consider adding minimal styling to restore functionality without reintroducing design changes.

2. **Font Display Issues**: If fonts are not displaying correctly, check that the font import and basic typography variables are properly set.

3. **Color Inconsistencies**: If colors appear inconsistent, verify that all color variables are properly defined in both light and dark mode sections.

## Restoration

If needed, the original design can be restored by:

1. Replacing the current CSS file with the backup:
   ```bash
   cp /src/css/custom.css.backup /src/css/custom.css
   ```

2. Restarting the development server to apply the changes.
