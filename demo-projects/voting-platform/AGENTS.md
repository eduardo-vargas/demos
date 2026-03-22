# Agent Instructions

## Package Manager

**This project uses `pnpm` - NOT npm, NOT yarn.**

All commands must use `pnpm`:
- `pnpm install` 
- `pnpm dev`
- `pnpm build`
- `pnpm deploy`

## Development Workflow

**CRITICAL RULES:**
1. **NEVER deploy without testing locally first**
2. **NEVER auto-deploy - ALWAYS ask user for confirmation first**
3. **Use `pnpm` NOT `npm`**

### Workflow:
1. Make code changes
2. Run `pnpm dev` to test locally
3. Verify changes work correctly in browser
4. **STOP AND ASK USER: "Ready to deploy?"**
5. **ONLY after user confirms:** run `pnpm build && pnpm deploy`

## React Spectrum (Spectrum 2)

When working with React Spectrum components, reference the documentation at:
`opencode/agent/react-spectrum-docs.txt`

This file contains plain-text markdown documentation for all React Spectrum S2 components and can help answer questions about component usage, APIs, and best practices.

### Styling Rules

**CRITICAL: Always use S2 style macros - NEVER edit styles.css**

1. **Import the style macro:**
   ```tsx
   import { style } from '@react-spectrum/s2/style' with { type: 'macro' };
   ```

2. **Use it for all styling:**
   ```tsx
   <div className={style({ padding: 16, backgroundColor: 'base' })} />
   <Card styles={style({ margin: 8 })} />
   ```

3. **NEVER add custom CSS rules to styles.css**
4. **NEVER use inline styles (style={{...}}) - use style macro instead**
5. **Use Spectrum design tokens** - colors like `'base'`, `'neutral'`, `'accent'`, spacing, etc.

The only exception is the lightningcss color inheritance fix already in styles.css - do not remove or modify it.
