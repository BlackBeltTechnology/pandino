# Menu Style Changes

This document outlines the changes made to the menu styling in the Pandino documentation website to create a more "manly" and "edgy" appearance, replacing the previous "bubbly" style.

## Summary of Changes

### 1. Removed Rounded Corners

- Changed menu item border-radius from `0.375rem` to `0`
- Added a new CSS variable `--ifm-menu-border-radius: 0;` to ensure consistency
- Applied this variable to all menu-related elements (`.menu__link`, `.dropdown__link`, `.navbar__item`)
- Reduced global border-radius values for a more angular overall appearance:
  - `--ifm-global-radius: 0.5rem` → `0.25rem`
  - `--ifm-button-border-radius: 0.375rem` → `0.125rem`
  - `--ifm-code-border-radius: 0.25rem` → `0.125rem`

### 2. Added Angular Design Elements

- Added left borders to menu items:
  - Base state: `border-left: 2px solid transparent;`
  - Hover state: `border-left-color: var(--ifm-color-primary-dark);`
  - Active state: `border-left: 3px solid var(--ifm-color-primary);`

- Added right borders using pseudo-elements:
  - Hover state: `width: 2px; background-color: var(--ifm-color-primary-lighter);`
  - Active state: `width: 3px; background-color: var(--ifm-color-primary-darker);`

- Added sharp shadows:
  - Created new variables: `--ifm-menu-shadow-active: 0 0 1px rgba(0, 0, 0, 0.3);` for light mode and `--ifm-menu-shadow-active: 0 0 1px rgba(255, 255, 255, 0.2);` for dark mode
  - Applied these shadows to hover and active states

### 3. Sharpened Transitions

- Changed transitions from smooth to more abrupt:
  - `transition: all 0.2s ease;` → `transition: all 0.15s linear;`

### 4. Consistent Styling Across Components

- Applied the same angular styling to:
  - Main sidebar menu items
  - Table of contents links
  - Dropdown menus
  - Navbar items

### 5. Dark Mode Compatibility

- Added specific dark mode adjustments to ensure consistent appearance:
  - Customized right border colors for better contrast in dark mode
  - Adjusted shadows for better visibility in dark mode

## Visual Changes

The menu items now have:
- Square corners instead of rounded corners
- Sharp left and right borders that appear on hover and active states
- More abrupt transitions between states
- Subtle but sharp shadows
- A consistent angular appearance across both light and dark modes

## Design Philosophy

The new menu design follows a more "manly" and "edgy" aesthetic by:
- Favoring straight lines and sharp angles over curves and rounded corners
- Using borders and shadows to create defined edges
- Implementing more abrupt, less smooth transitions
- Creating a strong visual hierarchy with clear state indicators
- Maintaining a robust, angular appearance in both light and dark modes

These changes transform the previous "bubbly" menu style into a more angular, edgy design that maintains functionality while providing a more masculine aesthetic.
