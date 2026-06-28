# DayLister — Feature: Header with Theme Toggle

## Changes Made

### New Files

1. **src/components/AppHeader.tsx**
   - Created a header component displaying "DayLister" on the left
   - Includes a theme toggle button (Sun/Moon icon) aligned to the right
   - Accepts `isDark` and `onToggleTheme` props

### Modified Files

2. **src/App.tsx**
   - Added `isDark` state to track light/dark theme
   - Wrapped the app in Ant Design's `ConfigProvider` with theme algorithm switching (`theme.darkAlgorithm` / `theme.defaultAlgorithm`)
   - Used Ant Design's `Layout` to structure the page (Header + Content)
   - Passed theme toggle props to `AppHeader`

## How It Works

- Clicking the Sun/Moon button in the header toggles between light and dark themes
- The theme change is applied globally via Ant Design's `ConfigProvider`
- The header is fixed at 56px height with flexbox layout (title left, button right)

---

# DayLister — Select All Batch Operations

Added a "select all" checkbox and batch action bar to the task list.

## Changes

**TodoList.tsx** (`src/components/TodoList.tsx`):
- Added `selectedIds` state (`Set<number>`) to track selected tasks
- Added computed `allSelected` (all filtered items selected) and `indeterminate` (some selected) states
- Added `toggleSelectAll` — selects/deselects all currently filtered items
- Added `deleteSelected` — batch deletes all selected items
- Added `toggleSelectedComplete` — batch toggles completion of selected items (all done → mark active, any active → mark done)
- Inserted a select-all bar between the filter row and the task list card with:
  - **Select all checkbox** — tri-state (checked / indeterminate / unchecked) based on selection state
  - **Selection count** ("N selected") shown when items are selected
  - **Mark done / Mark active** button — batch toggles completion
  - **Delete** button — batch removes selected items
  - Bar highlights with a blue background when items are selected
