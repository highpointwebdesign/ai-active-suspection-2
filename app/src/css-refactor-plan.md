# CSS Refactoring Plan

## Issues Found

### 1. Global Styles Conflicts
- `index.css` and `styles.css` have overlapping definitions
- CSS variables not consistently used
- Mobile-first approach not followed

### 2. Fixed Positioning Problems
- Header/nav don't account for safe areas (notch, nav bars)
- Main content padding hardcoded
- Z-index values inconsistent

### 3. Button Style Duplication
- Buttons styled in 3+ different files
- Inconsistent hover states and transitions

### 4. Mobile Touch Targets
- Some buttons/links < 44px (iOS minimum)
- Missing touch feedback
- Text selection not disabled on UI controls

### 5. Responsive Breakpoints
- Using max-width (desktop-first)
- Should use min-width (mobile-first)
- Breakpoints inconsistent across files

## Recommended Fixes

### Phase 1: Consolidate Global Styles
1. Merge index.css into styles.css
2. Define comprehensive CSS variable system
3. Establish z-index scale
4. Define spacing scale (4px, 8px, 12px, 16px, 24px, 32px, 48px)

### Phase 2: Fix Layout Issues
1. Add safe-area-inset support for iOS
2. Use CSS Grid for major layout
3. Fix header/nav positioning
4. Add proper focus-visible styles

### Phase 3: Component Cleanup
1. Extract button styles to single source
2. Remove inline styles from components
3. Use CSS modules or BEM naming
4. Add proper comments

### Phase 4: Mobile Optimizations
1. Convert to mobile-first media queries
2. Ensure 44px touch targets
3. Add tap highlight colors
4. Disable text selection on UI controls
5. Test on actual devices (S24 Ultra)
