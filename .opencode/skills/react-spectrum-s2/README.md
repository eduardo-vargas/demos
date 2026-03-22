# React Spectrum S2 OpenCode Skill

This skill helps OpenCode work with React Spectrum S2 (Spectrum 2) - Adobe's design system implementation in React.

## What This Skill Provides

This skill teaches OpenCode to:

1. **Never use CSS files** - React Spectrum S2 uses style macros that run at build time
2. **Use native component props first** - Before reaching for style macros, use built-in component props
3. **Apply style macros correctly** - When custom styling is needed, use the `style()` macro with proper syntax
4. **Choose the right components** - Know which component to use for forms, tables, navigation, overlays, etc.
5. **Follow accessibility best practices** - Ensure proper labels, ARIA attributes, and keyboard navigation
6. **Support internationalization** - Configure locales and format dates/numbers appropriately
7. **Setup projects correctly** - Configure Vite with the proper plugins and optimizations

## Configured For

- **Framework**: Vite (primary)
- **Component categories**: All components, with focus on:
  - Forms (TextField, Checkbox, RadioGroup, etc.)
  - Collections (Table, ListView)
  - Overlays (Dialog, Tooltip)
  - Navigation (Tabs, Breadcrumbs)
  - Buttons & Actions
- **Styling approach**: Style macro preferred, with native props as first choice
- **Localization**: Multiple languages supported

## Installation

This skill is automatically available to OpenCode when placed in:

- `.opencode/skills/react-spectrum-s2/SKILL.md` (project-local)
- `~/.config/opencode/skills/react-spectrum-s2/SKILL.md` (global)

## Usage

OpenCode will automatically discover this skill and can load it when working on React Spectrum components:

```
Can you create a form with email and password fields using React Spectrum?
```

```
I need a data table with selection support
```

```
How do I style this button to have more margin?
```

## Key Principles Taught

### 1. No CSS Files

```tsx
// ✅ CORRECT
import { style } from '@react-spectrum/s2/style' with { type: 'macro' };
<div className={style({ backgroundColor: 'red-400' })} />;

// ❌ WRONG
import './styles.css';
```

### 2. Native Props First

```tsx
// ✅ CORRECT - Use native props when available
<Button styles={style({ marginStart: 8 })}>Edit</Button>;

// Only use full style macro for custom elements
const cardStyle = style({
  backgroundColor: 'gray-100',
  padding: 16,
});
<div className={cardStyle}>Content</div>;
```

### 3. Proper Setup

The skill includes complete Vite configuration for:

- Unplugin Parcel Macros (must be first!)
- CSS optimization with Lightning CSS
- CSS bundle consolidation
- Locale optimization

## Components Covered

The skill includes usage examples for:

- **Buttons**: Button, ActionButton, ButtonGroup, ToggleButton
- **Forms**: TextField, Checkbox, RadioGroup, Switch, NumberField, TextArea, SearchField
- **Collections**: TableView, ListView, Menu, Picker, ComboBox, TagGroup
- **Overlays**: Dialog, AlertDialog, Tooltip, ContextualHelp
- **Navigation**: Tabs, Breadcrumbs, Link, Disclosure
- **Date/Time**: DatePicker, DateRangePicker, Calendar, TimeField
- **Color**: ColorPicker, ColorField, ColorArea, ColorSlider
- **Status**: ProgressBar, ProgressCircle, Meter, InlineAlert, Badge
- **Content**: Heading, Text, Divider, Image, Avatar

## Common Patterns Included

- Form with validation
- Data table with selection
- Modal dialogs with forms
- Custom layouts with style macros
- Responsive designs
- Conditional styling
- Runtime variants
- Focus ring management

## Testing the Skill

To verify the skill is loaded:

1. Start OpenCode in a project
2. Run: `/skills` or check available skills in help
3. You should see `react-spectrum-s2` listed

To test it's working:

```
Using React Spectrum S2, create a button with accent variant
```

OpenCode should create a button without using CSS files.

## Updating the Skill

To modify the skill:

1. Edit `SKILL.md` in this directory
2. OpenCode will automatically reload the updated skill
3. Test changes by asking OpenCode to perform React Spectrum tasks

## License

Apache-2.0 (matches React Spectrum license)

## Additional Resources

- React Spectrum Docs: https://react-spectrum.adobe.com/
- Style Macro Reference: https://react-spectrum.adobe.com/styling
- GitHub: https://github.com/adobe/react-spectrum
