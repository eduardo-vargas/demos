---
name: react-spectrum-s2
description: Build accessible UI with React Spectrum S2 (Spectrum 2) components and style macros. Never use CSS files.
license: Apache-2.0
compatibility: React projects with @react-spectrum/s2
metadata:
  author: Adobe
  version: 1.2.0
  category: frontend-design-system
---

# React Spectrum S2 (Spectrum 2)

React Spectrum S2 is Adobe's implementation of the Spectrum 2 design system in React. It provides accessible, adaptive, high-quality UI components with a focus on styling through build-time macros instead of CSS files.

## Core Principles

### 1. NEVER Use CSS Files

**CRITICAL**: React Spectrum S2 uses style macros that run at build time. NEVER create or use traditional CSS/SCSS/CSS-in-JS files.

```tsx
// ✅ CORRECT - Use style macro
import { style } from '@react-spectrum/s2/style' with { type: 'macro' };

<div className={style({ backgroundColor: 'red-400', color: 'white' })}>Content</div>;

// ❌ WRONG - Never use CSS files
import './styles.css';
```

### 2. Icons MUST Use `iconStyle` for Colors

**CRITICAL**: When coloring icons, you MUST use `iconStyle` with pre-defined style variables. The macro evaluates at build time and cannot handle dynamic expressions.

```tsx
// ✅ CORRECT
import { iconStyle } from '@react-spectrum/s2/style' with { type: 'macro' };
import ThumbUp from '@react-spectrum/s2/icons/ThumbUp';

const activeStyle = iconStyle({ color: 'positive' });
const inactiveStyle = iconStyle({ color: 'gray' });

<ThumbUp styles={isActive ? activeStyle : inactiveStyle} />;

// ❌ WRONG - UNSAFE_style doesn't work for icons
<ThumbUp UNSAFE_style={{ color: 'var(--spectrum-positive-content-color-default)' }} />;
```

### 3. Use Native Component Props First

Before reaching for style macros, check if the component has native props for what you need:

```tsx
// ✅ CORRECT - Use native styles prop
<Button styles={style({marginStart: 8})}>Edit</Button>

// ✅ CORRECT - Use native variant/style props
<Button variant="accent" style="fill">Save</Button>
```

### 4. Package Import

Always import from `@react-spectrum/s2`:

```tsx
// ✅ CORRECT
import { Button, TextField, Dialog } from '@react-spectrum/s2';
import { style } from '@react-spectrum/s2/style' with { type: 'macro' };

// ❌ WRONG
import { Button } from '@adobe/react-spectrum';
```

## Installation & Setup (Vite)

### 1. Install Package

```bash
npm install @react-spectrum/s2
```

### 2. Configure Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import macros from 'unplugin-parcel-macros';

export default defineConfig({
  plugins: [
    macros.vite(), // Must be first!
    react(),
  ],
  build: {
    target: ['es2022'],
    cssMinify: 'lightningcss',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (/macro-(.*)\.css$/.test(id) || /@react-spectrum\/s2\/.*\.css$/.test(id)) {
            return 's2-styles';
          }
        },
      },
    },
  },
});
```

### 3. Setup Provider

```tsx
// App.tsx or root component
import { Provider } from '@react-spectrum/s2';

function App() {
  return <Provider locale="en-US">{/* Your app */}</Provider>;
}
```

### 4. Locale Optimization (Optional)

```bash
npm install @react-aria/optimize-locales-plugin
```

```typescript
// vite.config.ts
import optimizeLocales from '@react-aria/optimize-locales-plugin';

export default defineConfig({
  plugins: [
    {
      ...optimizeLocales.vite({
        locales: ['en-US', 'es-ES', 'fr-FR'], // Your supported locales
      }),
      enforce: 'pre',
    },
  ],
});
```

## Style Macro Usage

### Basic Styling

```tsx
import { style } from '@react-spectrum/s2/style' with { type: 'macro' };

const cardStyle = style({
  backgroundColor: 'gray-100',
  padding: 16,
  borderRadius: 8,
  display: 'flex',
  gap: 8,
});

<div className={cardStyle}>Content</div>;
```

### Conditional Styles

**IMPORTANT**: Ternary operators are NOT supported inside the `style()` macro. Instead, use template literals with separate style calls:

```tsx
// ❌ WRONG - ternaries don't work inside macro
const styles = style({
  backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)',
});

// ✅ CORRECT - use template literals with separate style calls
const styles = `${style({
  baseProperty: 'value',
})} ${
  colorScheme === 'dark'
    ? style({ backgroundColor: '[rgba(0,0,0,0.3)]', boxShadow: '[0 -8px 30px rgba(0,0,0,0.5)]' })
    : style({
        backgroundColor: '[rgba(255,255,255,0.3)]',
        boxShadow: '[0 -8px 30px rgba(0,0,0,0.15)]',
      })
}`;
```

```tsx
// Responsive breakpoints
const styles = style({
  padding: {
    default: 8,
    lg: 32,
    '@media (min-width: 2560px)': 64,
  },
});

// Runtime conditions (variants)
const styles = style({
  backgroundColor: {
    variant: {
      primary: 'accent',
      secondary: 'neutral',
    },
  },
});

<div className={styles({ variant: 'primary' })} />;

// Boolean conditions
const styles = style({
  backgroundColor: {
    default: 'gray-100',
    isSelected: 'gray-900',
    isDisabled: 'gray-400',
  },
});

<div className={styles({ isSelected: true, isDisabled: false })} />;

// UI state conditions (with React Aria Components)
import { Checkbox } from 'react-aria-components';

<Checkbox
  className={style({
    backgroundColor: {
      default: 'gray-100',
      isHovered: 'gray-200',
      isPressed: 'gray-300',
      isSelected: 'gray-900',
    },
  })}
/>;
```

### Reusing Styles

```tsx
// Same file - spread objects
const horizontalStack = {
  display: 'flex',
  alignItems: 'center',
  columnGap: 8,
} as const;

const styles = style({
  ...horizontalStack,
  columnGap: 4, // Override
});

// Separate file - create utility functions
// style-utils.ts
export function horizontalStack(gap: number) {
  return {
    display: 'flex',
    alignItems: 'center',
    columnGap: gap,
  } as const;
}

// component.tsx
import { horizontalStack } from './style-utils' with { type: 'macro' };
const styles = style({
  ...horizontalStack(4),
});
```

### Focus Ring Utility

```tsx
import { style, focusRing } from '@react-spectrum/s2/style' with { type: 'macro' };

const buttonStyle = style({
  ...focusRing(),
  padding: 8,
});
```

### CSS Variables

```tsx
const parentStyle = style({
  '--rowBackgroundColor': {
    type: 'backgroundColor',
    value: 'gray-400',
  },
});

const childStyle = style({
  backgroundColor: '--rowBackgroundColor',
});
```

### Supported Properties in Style Macro

**Full CSS support** including:

- Layout: `display`, `flexDirection`, `alignItems`, `justifyContent`, `gap`, etc.
- Spacing: `padding`, `margin`, `paddingStart`, `marginTop`, etc.
- Sizing: `width`, `height`, `minWidth`, `maxHeight`, etc.
- Colors: `backgroundColor`, `color`, `borderColor`, etc.
- Typography: `fontSize`, `fontWeight`, `lineHeight`, `textAlign`, etc.
- Borders: `borderWidth`, `borderRadius`, `borderStyle`, etc.
- Position: `position`, `top`, `left`, `zIndex`, etc.

### Limited Properties in Component `styles` Prop

Only layout/spacing/sizing on Spectrum components:

- `margin`, `marginStart`, `marginEnd`, `marginTop`, `marginBottom`, `marginX`, `marginY`
- `width`, `minWidth`, `maxWidth`
- `flexGrow`, `flexShrink`, `flexBasis`, `justifySelf`, `alignSelf`, `order`
- `gridArea`, `gridRow`, `gridColumn`, etc.
- `position`, `top`, `bottom`, `zIndex`, `inset`, etc.
- `visibility`

## Component Categories & Usage

### Buttons & Actions

#### Button

```tsx
import {Button} from '@react-spectrum/s2';

// Variants: accent, primary, secondary, negative
// Styles: fill, outline
<Button variant="accent" style="fill" onPress={() => {}}>
  Save
</Button>

// With icon
import {Bell} from '@react-spectrum/s2/icons';
<Button variant="primary">
  <Bell />
  <Text>Notifications</Text>
</Button>

// Icon only (requires aria-label)
<Button variant="accent" aria-label="Ring for service">
  <Bell />
</Button>

// Pending state
<Button isPending={isPending} onPress={handlePress}>
  Submit
</Button>

// Static color (for colored backgrounds)
<Button variant="primary" staticColor="white" style="fill">
  Save
</Button>
```

#### ActionButton

For secondary actions or toolbar buttons.

```tsx
import { ActionButton } from '@react-spectrum/s2';

<ActionButton onPress={() => {}}>
  <Edit />
  <Text>Edit</Text>
</ActionButton>;
```

### Forms

#### TextField

```tsx
import {TextField} from '@react-spectrum/s2';

// Basic
<TextField
  label="Email"
  value={value}
  onChange={setValue}
/>

// With validation
<TextField
  label="Email"
  type="email"
  isRequired
  validationBehavior="native"
  description="Enter your email address"
  errorMessage="Please enter a valid email"
/>

// Quiet variant
<TextField label="Search" isQuiet />

// With icon
import {Search} from '@react-spectrum/s2/icons';
<TextField label="Search" icon={<Search />} />

// Controlled
const [value, setValue] = useState('');
<TextField
  label="Name"
  value={value}
  onChange={setValue}
/>

// Uncontrolled
<TextField label="Name" defaultValue="John" />
```

#### Checkbox

```tsx
import {Checkbox} from '@react-spectrum/s2';

<Checkbox isSelected={checked} onChange={setChecked}>
  Accept terms
</Checkbox>

// Disabled
<Checkbox isDisabled>Option</Checkbox>

// Indeterminate
<Checkbox isIndeterminate>Select all</Checkbox>
```

#### CheckboxGroup

```tsx
import { CheckboxGroup, Checkbox } from '@react-spectrum/s2';

<CheckboxGroup label="Permissions" value={selected} onChange={setSelected}>
  <Checkbox value="read">Read</Checkbox>
  <Checkbox value="write">Write</Checkbox>
  <Checkbox value="delete">Delete</Checkbox>
</CheckboxGroup>;
```

#### RadioGroup

```tsx
import { RadioGroup, Radio } from '@react-spectrum/s2';

<RadioGroup label="Size" value={size} onChange={setSize}>
  <Radio value="small">Small</Radio>
  <Radio value="medium">Medium</Radio>
  <Radio value="large">Large</Radio>
</RadioGroup>;
```

#### Switch

```tsx
import { Switch } from '@react-spectrum/s2';

<Switch isSelected={enabled} onChange={setEnabled}>
  Enable notifications
</Switch>;
```

#### NumberField

```tsx
import { NumberField } from '@react-spectrum/s2';

<NumberField
  label="Quantity"
  value={quantity}
  onChange={setQuantity}
  minValue={0}
  maxValue={100}
  step={1}
/>;
```

#### TextArea

```tsx
import { TextArea } from '@react-spectrum/s2';

<TextArea label="Description" value={description} onChange={setDescription} rows={4} />;
```

#### SearchField

```tsx
import { SearchField } from '@react-spectrum/s2';

<SearchField label="Search" value={query} onChange={setQuery} onSubmit={handleSearch} />;
```

### Collections

#### Table (TableView)

```tsx
import {TableView, TableHeader, TableBody, Column, Row, Cell} from '@react-spectrum/s2';

<TableView aria-label="Products">
  <TableHeader>
    <Column key="name">Name</Column>
    <Column key="price">Price</Column>
    <Column key="stock">Stock</Column>
  </TableHeader>
  <TableBody>
    {products.map(product => (
      <Row key={product.id}>
        <Cell>{product.name}</Cell>
        <Cell>${product.price}</Cell>
        <Cell>{product.stock}</Cell>
      </Row>
    ))}
  </TableBody>
</TableView>

// With selection
<TableView
  aria-label="Products"
  selectionMode="multiple"
  selectedKeys={selectedKeys}
  onSelectionChange={setSelectedKeys}
>
  {/* ... */}
</TableView>
```

#### ListView

```tsx
import { ListView, Item } from '@react-spectrum/s2';

<ListView
  aria-label="Files"
  items={files}
  selectionMode="multiple"
  selectedKeys={selectedKeys}
  onSelectionChange={setSelectedKeys}
>
  {item => <Item>{item.name}</Item>}
</ListView>;
```

#### Menu

```tsx
import { Menu, MenuItem, MenuTrigger, ActionButton } from '@react-spectrum/s2';

<MenuTrigger>
  <ActionButton>
    <More />
  </ActionButton>
  <Menu onAction={handleAction}>
    <MenuItem key="edit">Edit</MenuItem>
    <MenuItem key="duplicate">Duplicate</MenuItem>
    <MenuItem key="delete">Delete</MenuItem>
  </Menu>
</MenuTrigger>;
```

#### Picker (Select/Dropdown)

```tsx
import { Picker, Item } from '@react-spectrum/s2';

<Picker label="Status" selectedKey={status} onSelectionChange={setStatus}>
  <Item key="active">Active</Item>
  <Item key="inactive">Inactive</Item>
  <Item key="pending">Pending</Item>
</Picker>;
```

#### ComboBox (Autocomplete)

```tsx
import { ComboBox, Item } from '@react-spectrum/s2';

<ComboBox
  label="Country"
  items={countries}
  inputValue={inputValue}
  onInputChange={setInputValue}
  onSelectionChange={setSelected}
>
  {item => <Item key={item.code}>{item.name}</Item>}
</ComboBox>;
```

#### TagGroup

```tsx
import { TagGroup, Tag } from '@react-spectrum/s2';

<TagGroup label="Tags" items={tags} onRemove={handleRemove}>
  {item => <Tag>{item.name}</Tag>}
</TagGroup>;
```

### Overlays

#### Dialog

```tsx
import {Dialog, DialogTrigger, Button, Heading, Content} from '@react-spectrum/s2';

<DialogTrigger>
  <Button>Open Dialog</Button>
  <Dialog>
    <Heading>Confirm Delete</Heading>
    <Content>
      Are you sure you want to delete this item?
    </Content>
    <ButtonGroup>
      <Button variant="secondary">Cancel</Button>
      <Button variant="negative" onPress={handleDelete}>Delete</Button>
    </ButtonGroup>
  </Dialog>
</DialogTrigger>

// Controlled
<Dialog isOpen={isOpen} onOpenChange={setIsOpen}>
  {/* ... */}
</Dialog>
```

#### AlertDialog

```tsx
import { AlertDialog, DialogTrigger, Button } from '@react-spectrum/s2';

<DialogTrigger>
  <Button variant="negative">Delete</Button>
  <AlertDialog
    variant="destructive"
    title="Delete file?"
    primaryActionLabel="Delete"
    secondaryActionLabel="Cancel"
    onPrimaryAction={handleDelete}
  >
    This action cannot be undone.
  </AlertDialog>
</DialogTrigger>;
```

#### Tooltip

```tsx
import { TooltipTrigger, Tooltip, ActionButton } from '@react-spectrum/s2';

<TooltipTrigger>
  <ActionButton aria-label="Edit">
    <Edit />
  </ActionButton>
  <Tooltip>Edit item</Tooltip>
</TooltipTrigger>;
```

#### ContextualHelp

```tsx
import { ContextualHelp, Heading, Content, TextField } from '@react-spectrum/s2';

<TextField
  label="Password"
  contextualHelp={
    <ContextualHelp>
      <Heading>Password Requirements</Heading>
      <Content>Must be at least 8 characters long and include numbers.</Content>
    </ContextualHelp>
  }
/>;
```

### Navigation

#### Tabs

```tsx
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@react-spectrum/s2';

<Tabs>
  <TabList>
    <Tab id="overview">Overview</Tab>
    <Tab id="details">Details</Tab>
    <Tab id="settings">Settings</Tab>
  </TabList>
  <TabPanels>
    <TabPanel id="overview">{/* Overview content */}</TabPanel>
    <TabPanel id="details">{/* Details content */}</TabPanel>
    <TabPanel id="settings">{/* Settings content */}</TabPanel>
  </TabPanels>
</Tabs>;
```

#### Breadcrumbs

```tsx
import { Breadcrumbs, Breadcrumb } from '@react-spectrum/s2';

<Breadcrumbs>
  <Breadcrumb>
    <Link href="/">Home</Link>
  </Breadcrumb>
  <Breadcrumb>
    <Link href="/products">Products</Link>
  </Breadcrumb>
  <Breadcrumb>Details</Breadcrumb>
</Breadcrumbs>;
```

#### Link

```tsx
import {Link} from '@react-spectrum/s2';

<Link href="/about">Learn more</Link>

// With client-side routing (configured in Provider)
<Link href="/dashboard">Dashboard</Link>
```

#### Disclosure (Accordion Item)

```tsx
import {Disclosure, DisclosureTitle, DisclosurePanel} from '@react-spectrum/s2';

<Disclosure>
  <DisclosureTitle>Section 1</DisclosureTitle>
  <DisclosurePanel>
    Content for section 1
  </DisclosurePanel>
</Disclosure>

// Multiple disclosures
<div>
  <Disclosure id="section1">
    <DisclosureTitle>Section 1</DisclosureTitle>
    <DisclosurePanel>Content 1</DisclosurePanel>
  </Disclosure>
  <Disclosure id="section2">
    <DisclosureTitle>Section 2</DisclosureTitle>
    <DisclosurePanel>Content 2</DisclosurePanel>
  </Disclosure>
</div>
```

### Date & Time

#### DatePicker

```tsx
import {DatePicker} from '@react-spectrum/s2';
import {parseDate} from '@internationalized/date';

<DatePicker
  label="Event date"
  value={date}
  onChange={setDate}
/>

// With min/max
<DatePicker
  label="Event date"
  minValue={parseDate('2026-01-01')}
  maxValue={parseDate('2026-12-31')}
/>
```

#### DateRangePicker

```tsx
import { DateRangePicker } from '@react-spectrum/s2';

<DateRangePicker label="Trip dates" value={dateRange} onChange={setDateRange} />;
```

#### Calendar

```tsx
import { Calendar } from '@react-spectrum/s2';

<Calendar aria-label="Event date" value={date} onChange={setDate} />;
```

#### TimeField

```tsx
import { TimeField } from '@react-spectrum/s2';

<TimeField label="Event time" value={time} onChange={setTime} />;
```

### Color

#### ColorPicker

```tsx
import { ColorPicker } from '@react-spectrum/s2';

<ColorPicker label="Color" value={color} onChange={setColor} />;
```

#### ColorField

```tsx
import { ColorField } from '@react-spectrum/s2';

<ColorField label="Background color" value={color} onChange={setColor} />;
```

#### ColorArea, ColorSlider, ColorWheel

Available for advanced color selection UIs.

### Status & Feedback

#### ProgressBar

```tsx
import {ProgressBar} from '@react-spectrum/s2';

<ProgressBar label="Loading..." value={progress} />

// Indeterminate
<ProgressBar label="Processing..." isIndeterminate />
```

#### ProgressCircle

```tsx
import {ProgressCircle} from '@react-spectrum/s2';

<ProgressCircle aria-label="Loading..." value={progress} />
<ProgressCircle aria-label="Loading..." isIndeterminate />
```

#### Meter

```tsx
import { Meter } from '@react-spectrum/s2';

<Meter label="Storage" value={75} />;
```

#### InlineAlert

```tsx
import {InlineAlert, Heading, Content} from '@react-spectrum/s2';

<InlineAlert variant="info">
  <Heading>Information</Heading>
  <Content>This is an informational message.</Content>
</InlineAlert>

// Variants: info, positive, notice, negative
<InlineAlert variant="negative">
  <Heading>Error</Heading>
  <Content>Something went wrong.</Content>
</InlineAlert>
```

#### Badge

```tsx
import { Badge } from '@react-spectrum/s2';

<Badge variant="positive">Active</Badge>;

// Variants: neutral, positive, negative, notice, informative
```

#### Toast

```tsx
// Toast notifications are typically managed through a toast provider
// Check React Spectrum docs for full toast implementation
```

### Icons

React Spectrum offers a collection of icons that can be imported from `@react-spectrum/s2/icons`.

#### Icon Import

```tsx
import { Button, Text } from '@react-spectrum/s2';
import { Search } from '@react-spectrum/s2/icons';

<Button>
  <Search />
  <Text>Search</Text>
</Button>;
```

#### Icon Style - **MANDATORY FOR COLORS**

**CRITICAL**: Icons MUST use `iconStyle` for colors. The macro evaluates at build time, so you MUST pre-define separate style variables for each color variant:

```tsx
// ✅ CORRECT - Pre-defined style variables at module level
import { iconStyle } from '@react-spectrum/s2/style' with { type: 'macro' };
import ThumbUp from '@react-spectrum/s2/icons/ThumbUp';

// Define static styles at module level (outside component)
const thumbUpActiveStyle = iconStyle({ color: 'positive' });
const thumbUpInactiveStyle = iconStyle({ color: 'gray' });

function VoteButton({ isActive }) {
  return <ThumbUp styles={isActive ? thumbUpActiveStyle : thumbUpInactiveStyle} />;
}
```

```tsx
// ❌ WRONG - Dynamic expressions inside iconStyle
function VoteButton({ isActive }) {
  return (
    // This will FAIL - macro can't evaluate isActive at build time
    <ThumbUp styles={iconStyle({ color: isActive ? 'positive' : 'gray' })} />
  );
}
```

```tsx
// ❌ WRONG - UNSAFE_style for icons
function VoteButton({ isActive }) {
  return (
    // This is WRONG - icons must use iconStyle
    <ThumbUp UNSAFE_style={{ color: 'var(--spectrum-positive-content-color-default)' }} />
  );
}
```

#### Icon Colors (via iconStyle)

| Color         | Use Case                              |
| ------------- | ------------------------------------- |
| `positive`    | Success, upvotes, positive actions    |
| `negative`    | Error, downvotes, destructive actions |
| `accent`      | Primary actions, highlights           |
| `neutral`     | Default state, secondary elements     |
| `gray`        | Inactive, disabled, neutral elements  |
| `informative` | Info, help icons                      |
| `notice`      | Warnings, alerts                      |

#### Icon Sizes

| Size | Pixels         |
| ---- | -------------- |
| `XS` | 14px           |
| `S`  | 16px           |
| `M`  | 20px (default) |
| `L`  | 22px           |
| `XL` | 26px           |

#### Voting Button Pattern

For vote buttons (upvote/downvote), use this pattern:

```tsx
import { ActionButton, Text } from '@react-spectrum/s2';
import ThumbUp from '@react-spectrum/s2/icons/ThumbUp';
import ThumbDown from '@react-spectrum/s2/icons/ThumbDown';
import { iconStyle } from '@react-spectrum/s2/style' with { type: 'macro' };

// Pre-defined styles (module level, outside component)
const upVoteActiveStyle = iconStyle({ color: 'positive' });
const upVoteInactiveStyle = iconStyle({ color: 'gray' });
const downVoteActiveStyle = iconStyle({ color: 'negative' });
const downVoteInactiveStyle = iconStyle({ color: 'gray' });

function VoteButtons({ upvotes, downvotes, userVote, onVote }) {
  const isUpvoted = userVote === 'up';
  const isDownvoted = userVote === 'down';

  return (
    <>
      <ActionButton aria-label="upvote" aria-pressed={isUpvoted}>
        <ThumbUp styles={isUpvoted ? upVoteActiveStyle : upVoteInactiveStyle} />
        <Text UNSAFE_style={{ color: 'var(--spectrum-neutral-subdued-content-color-default)' }}>
          {upvotes}
        </Text>
      </ActionButton>
      <ActionButton aria-label="downvote" aria-pressed={isDownvoted}>
        <ThumbDown styles={isDownvoted ? downVoteActiveStyle : downVoteInactiveStyle} />
        <Text UNSAFE_style={{ color: 'var(--spectrum-neutral-subdued-content-color-default)' }}>
          {downvotes}
        </Text>
      </ActionButton>
    </>
  );
}
```

**Key rules:**

1. Icon colors change based on state (positive for upvoted, negative for downvoted, gray for inactive)
2. Vote count text ALWAYS uses `neutral-subdued` - it never changes color
3. Define style variables at module level, not inside the component
4. Use `aria-pressed` for accessibility on toggle buttons

### Content & Layout

#### Heading

```tsx
import {Heading} from '@react-spectrum/s2';

<Heading level={1}>Page Title</Heading>
<Heading level={2}>Section Title</Heading>
```

#### Text

```tsx
import { Text } from '@react-spectrum/s2';

<Text>Body text</Text>;
```

#### Divider

```tsx
import {Divider} from '@react-spectrum/s2';

<Divider />

// Orientation
<Divider orientation="vertical" />
```

#### Image

```tsx
import { Image } from '@react-spectrum/s2';

<Image src="/photo.jpg" alt="Description" />;
```

#### Avatar

```tsx
import { Avatar } from '@react-spectrum/s2';

<Avatar src="/avatar.jpg" alt="User name" />;
```

## Common Patterns

### Form with Validation

```tsx
import { Form, TextField, Button, ButtonGroup } from '@react-spectrum/s2';

<Form validationBehavior="native" onSubmit={handleSubmit}>
  <TextField
    label="Email"
    name="email"
    type="email"
    isRequired
    description="Enter your work email"
  />
  <TextField label="Password" name="password" type="password" isRequired minLength={8} />
  <ButtonGroup>
    <Button type="submit" variant="accent">
      Sign In
    </Button>
    <Button type="reset" variant="secondary">
      Clear
    </Button>
  </ButtonGroup>
</Form>;
```

### Data Table with Selection

```tsx
import { TableView, TableHeader, TableBody, Column, Row, Cell } from '@react-spectrum/s2';

function DataTable() {
  const [selectedKeys, setSelectedKeys] = useState(new Set());

  return (
    <TableView
      aria-label="Users"
      selectionMode="multiple"
      selectedKeys={selectedKeys}
      onSelectionChange={setSelectedKeys}
    >
      <TableHeader>
        <Column key="name">Name</Column>
        <Column key="email">Email</Column>
        <Column key="role">Role</Column>
      </TableHeader>
      <TableBody>
        {users.map(user => (
          <Row key={user.id}>
            <Cell>{user.name}</Cell>
            <Cell>{user.email}</Cell>
            <Cell>{user.role}</Cell>
          </Row>
        ))}
      </TableBody>
    </TableView>
  );
}
```

### Modal with Form

```tsx
import {
  Dialog,
  DialogTrigger,
  Button,
  Heading,
  Content,
  TextField,
  ButtonGroup,
} from '@react-spectrum/s2';

function CreateUserDialog() {
  return (
    <DialogTrigger>
      <Button variant="accent">Create User</Button>
      <Dialog>
        {({ close }) => (
          <>
            <Heading>Create New User</Heading>
            <Content>
              <Form
                onSubmit={e => {
                  e.preventDefault();
                  handleSubmit();
                  close();
                }}
              >
                <TextField label="Name" name="name" isRequired />
                <TextField label="Email" name="email" type="email" isRequired />
                <ButtonGroup>
                  <Button onPress={close} variant="secondary">
                    Cancel
                  </Button>
                  <Button type="submit" variant="accent">
                    Create
                  </Button>
                </ButtonGroup>
              </Form>
            </Content>
          </>
        )}
      </Dialog>
    </DialogTrigger>
  );
}
```

### Custom Layout with Style Macro

```tsx
import { style } from '@react-spectrum/s2/style' with { type: 'macro' };
import { Button, Heading, Text } from '@react-spectrum/s2';

const containerStyle = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: 24,
  backgroundColor: 'gray-100',
  borderRadius: 8,
});

const headerStyle = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

function Card() {
  return (
    <div className={containerStyle}>
      <div className={headerStyle}>
        <Heading level={3}>Card Title</Heading>
        <Button variant="primary" style="outline">
          Action
        </Button>
      </div>
      <Text>Card content goes here</Text>
    </div>
  );
}
```

## Accessibility Best Practices

1. **Always provide labels**: Use `label` prop or `aria-label` for all inputs
2. **Use semantic HTML**: Components render proper ARIA roles automatically
3. **Keyboard navigation**: All components support keyboard navigation by default
4. **Focus management**: Use `autoFocus` sparingly, typically only on dialogs
5. **Required fields**: Use `isRequired` and `necessityIndicator` props
6. **Error messages**: Provide specific `errorMessage` for validation failures
7. **Loading states**: Use `isPending` on buttons, `isIndeterminate` on progress
8. **Tooltips for icons**: Icon-only buttons need `aria-label`

## Internationalization (i18n)

### Configure Locale

```tsx
import { Provider } from '@react-spectrum/s2';

<Provider locale={userLocale}>
  <App />
</Provider>;
```

### Localize Strings

All user-facing strings should be localized:

```tsx
// Use your i18n library
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <TextField
      label={t('form.email')}
      description={t('form.emailHelp')}
      errorMessage={t('form.emailError')}
    />
  );
}
```

### Date/Number Formatting

React Spectrum automatically formats dates and numbers based on the locale:

```tsx
import { DatePicker } from '@react-spectrum/s2';

// Automatically formats based on Provider locale
<DatePicker label="Date" value={date} onChange={setDate} />;
```

## Migration from V3

If migrating from React Spectrum v3:

1. **Update imports**: Change from `@adobe/react-spectrum` to `@react-spectrum/s2`
2. **Replace style props**: Convert `UNSAFE_className` and dimension props to `style()` macro or `styles` prop
3. **Update variants**: Some component variants have changed (check docs)
4. **Remove CSS files**: Delete all CSS imports and convert to style macros
5. **Test thoroughly**: Spectrum 2 is a major rewrite with breaking changes

Use the official codemod for automated migration:

```bash
npx @react-spectrum/codemods s1-to-s2
```

## Performance Tips

1. **Bundle CSS properly**: Follow the Vite config to bundle all S2 CSS together
2. **Use Lightning CSS**: Configure `cssMinify: 'lightningcss'` for smaller bundles
3. **Optimize locales**: Include only needed locales with the optimize plugin
4. **Memo heavy components**: Wrap expensive components in `React.memo`
5. **Lazy load dialogs**: Use `React.lazy` for dialog content

## Troubleshooting

### Macro not working

- Ensure `unplugin-parcel-macros` is first in Vite plugins
- Check `with {type: 'macro'}` syntax in import
- Verify you're on Node 18+ and using ES modules

### Styles not applying

- Check if you're mixing CSS files with style macros (don't!)
- Verify Lightning CSS is configured
- Ensure `s2-styles` bundle is being created

### Build errors

- Make sure `target: ['es2022']` is set in Vite config
- Check that macro imports use `with {type: 'macro'}` syntax
- Verify all dependencies are up to date

## Additional Resources

- Official docs: https://react-spectrum.adobe.com/
- Style macro reference: https://react-spectrum.adobe.com/styling
- Component docs: https://react-spectrum.adobe.com/react-spectrum/
- GitHub: https://github.com/adobe/react-spectrum
- Discord: https://discord.gg/spectrum

## DRY Principles & Centralized Config

When multiple components need the same data (themes, constants, options), create a centralized config file:

```typescript
// src/config/myConfig.ts
export type MyType = 'option1' | 'option2' | 'option3';

export const MY_CONFIG: Record<MyType, string[]> = {
  option1: ['#color1', '#color2'],
  option2: ['#color3', '#color4'],
  option3: ['#color5', '#color6'],
};

export const MY_OPTIONS = Object.entries(MY_CONFIG).map(([id, value]) => ({
  id: id as MyType,
  label: id.charAt(0).toUpperCase() + id.slice(1),
  value,
}));

// Re-export from components that need backward compatibility
export { MyType, MY_CONFIG };
```

Then import from the config file everywhere it's needed - never duplicate the data.

## When to Use This Skill

Use this skill when:

- Building UI components with React Spectrum S2
- Styling components (always use style macros, never CSS files)
- Need to know which component to use for a use case
- Setting up a new React Spectrum project with Vite
- Implementing accessible forms, tables, dialogs, or navigation
- Working with dates, colors, or collections
- Need internationalization support
- Questions about component props or patterns

Do not use CSS files. Always use the style macro for styling.

## Error Boundaries & Enterprise Patterns

### Error Boundaries

React Spectrum apps should have error boundaries to prevent component crashes from bringing down the entire app.

```tsx
// src/components/ErrorBoundary/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';
import { Button, IllustratedMessage, Heading, Content } from '@react-spectrum/s2';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('Error caught:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <IllustratedMessage>
          <Heading level={2}>Something went wrong</Heading>
          <Content>
            <p>An error occurred while loading this section.</p>
            {import.meta.env.DEV && this.state.error && (
              <code style={{ padding: 12, backgroundColor: 'var(--spectrum-gray-100)' }}>
                {this.state.error.message}
              </code>
            )}
            <Button variant="secondary" onPress={this.handleReset}>
              Try Again
            </Button>
          </Content>
        </IllustratedMessage>
      );
    }
    return this.props.children;
  }
}
```

### Wrap Routes with ErrorBoundary

In your App.tsx, wrap routes to prevent page crashes:

```tsx
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <Routes>
      <ErrorBoundary>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* ... more routes */}
      </ErrorBoundary>
    </Routes>
  );
}
```

### Toast Notifications

Use ToastQueue for user feedback - it integrates with React Spectrum:

```tsx
import { ToastQueue } from '@react-spectrum/s2';

// Success toast
ToastQueue.positive('Changes saved successfully', { timeout: 3000 });

// Error toast
ToastQueue.negative('Failed to save changes', { timeout: 5000 });

// Warning toast
ToastQueue.negative('Session expiring in 60s', { timeout: 2000 });
```

### Loading States

Always show loading states for async operations:

```tsx
// ✅ CORRECT - Loading state
if (loading) return <Loading />;

// ✅ CORRECT - Error boundary
if (error) {
  return <IllustratedMessage>
    <Heading>Error loading data</Heading>
    <Button onPress={refetch}>Try Again</Button>
  </IllustratedMessage>;
}
```
