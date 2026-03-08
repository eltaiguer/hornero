# Hornero UX/UI Design Instructions — M2–M7

> Reference for implementing all UI components across milestones. Builds on the existing design system: custom Tailwind components, mobile-first layout, blue-600 primary, no external component library.

---

## Design System Foundation (Existing — Do Not Change)

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `blue-600` (#2563eb) | Buttons, links, active nav, FAB, progress bars |
| Primary hover | `blue-700` (#1d4ed8) | Button hover states |
| Success | `green-600` (#16a34a) | Positive balances, settlement CTA, budget on-track |
| Danger | `red-600` (#dc2626) | Delete buttons, negative balances, over-budget |
| Warning | `amber-700` (#b45309) | Budget approaching threshold |
| Text primary | `gray-900` (#111827) | Headings, body text |
| Text secondary | `gray-500` (#6b7280) | Captions, hints, empty states |
| Text tertiary | `gray-400` (#9ca3af) | Placeholder text |
| Border | `gray-200` (#e5e7eb) | Card borders, dividers |
| Surface | `gray-50` (#f9fafb) | Subtle backgrounds, alternating rows |
| Background | `white` / `var(--background)` | Page background |

### Typography

| Element | Classes |
|---------|---------|
| Page title | `text-2xl font-bold` |
| Section heading | `text-lg font-semibold` |
| Card title | `text-base font-semibold` or `text-sm font-semibold` |
| Body | default (16px) |
| Label | `text-sm font-medium` |
| Caption / hint | `text-xs text-gray-500` |
| Error | `text-sm text-red-600` |
| Amount (large) | `text-2xl font-bold tabular-nums` |
| Amount (inline) | `text-sm font-medium tabular-nums` |

### Spacing

| Context | Value |
|---------|-------|
| Page padding | `p-6` |
| Section gap | `space-y-6` |
| Card internal | `p-4` |
| Form field gap | `space-y-4` |
| List item gap | `space-y-2` or `space-y-3` |
| Label to input | `mt-1` |
| Grid gap | `gap-3` or `gap-4` |

### Component Primitives

**Card**:
```
rounded-md border p-4
```

**Input**:
```
mt-1 block w-full rounded-md border px-3 py-2
```

**Primary button**:
```
rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50
```

**Secondary button**:
```
rounded-md border px-3 py-2 text-sm font-medium hover:bg-gray-50
```

**Danger button**:
```
rounded-md border border-red-300 px-4 py-2 text-red-700 hover:bg-red-50
```

**Page container**:
```
mx-auto max-w-2xl p-6 pb-20 md:pb-6
```

---

## M2: Expenses Core

### Expense Form (`expense-form.tsx`)

**Layout**: Single-column form inside a card. Max-width `max-w-2xl`.

```
┌──────────────────────────────────────┐
│  ← Back          Add Expense         │
├──────────────────────────────────────┤
│                                      │
│  Amount                              │
│  ┌──────────────────────────────┐    │
│  │ $ 0.00                       │    │
│  └──────────────────────────────┘    │
│                                      │
│  Description                         │
│  ┌──────────────────────────────┐    │
│  │ e.g. Groceries at Costco     │    │
│  └──────────────────────────────┘    │
│                                      │
│  Date                                │
│  ┌──────────────────────────────┐    │
│  │ 2024-03-07                   │    │
│  └──────────────────────────────┘    │
│                                      │
│  Category                            │
│  ┌──────────────────────────────┐    │
│  │ 🛒 Groceries            ▼   │    │
│  └──────────────────────────────┘    │
│                                      │
│  Split Method                        │
│  ┌────────┐┌────────┐┌────────┐     │
│  │ Equal  ││ Income ││ Custom │     │
│  └────────┘└────────┘└────────┘     │
│                                      │
│  ┌─ Split Preview ────────────────┐  │
│  │  👤 Jose        $50.00  (50%) │  │
│  │  👤 Partner     $50.00  (50%) │  │
│  └────────────────────────────────┘  │
│                                      │
│  Notes (optional)                    │
│  ┌──────────────────────────────┐    │
│  │                              │    │
│  └──────────────────────────────┘    │
│                                      │
│  ┌──────────────────────────────┐    │
│  │        Save Expense          │    │
│  └──────────────────────────────┘    │
│                                      │
└──────────────────────────────────────┘
```

**Specific instructions**:

- **Amount input**: Use `type="number"` with `step="0.01"` and `min="0"`. Left-align the `$` symbol as a prefix inside the input using a wrapper div with `relative` positioning and `pl-7` on the input. The `$` sits in `absolute left-3 top-1/2 -translate-y-1/2 text-gray-500`.
- **Split method selector**: Use a **segmented control** — three adjacent buttons inside a `flex rounded-md border` container. Active tab: `bg-blue-600 text-white`. Inactive: `bg-white text-gray-700 hover:bg-gray-50`. Each button takes `flex-1 px-3 py-2 text-sm font-medium text-center`. Labels: "Equal", "By Income", "Custom".
- **Split preview**: Appears below the split method selector inside a `rounded-md bg-gray-50 p-3` container. Each member row is `flex items-center justify-between py-1`. Show member name on left, dollar amount + percentage on right. Use `tabular-nums` for amounts. When split method is "Custom", each row gets an inline `<input type="number">` for the percentage (right-aligned, `w-20 text-right`).
- **Category select**: Render as a native `<select>`. Each `<option>` shows `emoji + name` (e.g., "🛒 Groceries"). Group default categories first, then custom ones separated by an `<optgroup label="Custom">`.
- **Date input**: Default to today's date. Use native `<input type="date">`.
- **Notes**: `<textarea>` with `rows={2}`, optional field.
- **Save button**: Full-width primary button at bottom. Show "Saving..." with `disabled:opacity-50` while submitting.
- **Edit mode**: Same form, pre-filled. Button text changes to "Update Expense". Show a secondary "Delete" danger button below it (not inline — separate row).

### Expense List (`expense-list.tsx`)

**Layout**: Scrollable list of expense cards.

```
┌──────────────────────────────────────┐
│  Expenses                    Filter ↓│
├──────────────────────────────────────┤
│                                      │
│  ┌────────────────────────────────┐  │
│  │ 🛒 Groceries at Costco        │  │
│  │ Mar 7 · Jose paid             │  │
│  │                      $125.40  │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ 🏠 Rent - March               │  │
│  │ Mar 1 · Partner paid          │  │
│  │                    $1,800.00  │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ ⚡ Electric bill               │  │
│  │ Feb 28 · Jose paid            │  │
│  │                      $142.30  │  │
│  └────────────────────────────────┘  │
│                                      │
│           Load more...               │
└──────────────────────────────────────┘
```

**Specific instructions**:

- **Each expense card**: `rounded-md border p-3`. Use `flex` layout. Left side: emoji + description on first line (`text-sm font-medium`), date + payer on second line (`text-xs text-gray-500`). Right side: amount, right-aligned, `text-sm font-semibold tabular-nums`. The category emoji sits inline with the description, no separate chip needed.
- **Date formatting**: Use relative-style short dates: "Today", "Yesterday", "Mar 7", "Feb 28". For older items use "Jan 15, 2024".
- **Payer display**: "{FirstName} paid" in the subtitle line.
- **Swipe interaction** (mobile): Left-swipe reveals two action buttons: blue "Edit" and red "Delete". Implement with `translateX` CSS transform on touch events. Desktop: show Edit/Delete on hover as icon buttons at the right edge of each card.
- **Pull-to-refresh** (mobile): Existing component — reuse the same pattern.
- **Empty state**: Centered text: "No expenses yet" (`text-sm text-gray-500`). Below it, a secondary button: "Add your first expense".
- **Pagination**: "Load more" text button at list bottom (`text-sm text-blue-600 font-medium`), not infinite scroll. Show total count at top: "24 expenses" (`text-xs text-gray-500`).

### Expense Filters (`expense-filters.tsx`)

**Layout**: Collapsible filter panel, toggled by a "Filter" button in the page header.

```
┌──────────────────────────────────────┐
│  Date range                          │
│  ┌────────────┐  ┌────────────┐     │
│  │ From       │  │ To         │     │
│  └────────────┘  └────────────┘     │
│                                      │
│  Category          Paid by           │
│  ┌────────────┐  ┌────────────┐     │
│  │ All      ▼ │  │ All      ▼ │     │
│  └────────────┘  └────────────┘     │
│                                      │
│  Amount range                        │
│  ┌────────────┐  ┌────────────┐     │
│  │ Min $      │  │ Max $      │     │
│  └────────────┘  └────────────┘     │
│                                      │
│  ┌──────────┐  ┌──────────────┐     │
│  │  Reset   │  │ Apply Filters│     │
│  └──────────┘  └──────────────┘     │
└──────────────────────────────────────┘
```

**Specific instructions**:

- **Toggle**: The "Filter" button in the page header is a secondary button with a funnel icon (use text "Filter ↓" or an SVG). When filters are active, show a blue dot indicator or change text to "Filtered (3)".
- **Panel**: Slides down below the header with `space-y-4` internal spacing. Wrap in a `rounded-md border bg-gray-50 p-4` container.
- **Two-column rows**: Use `grid grid-cols-2 gap-3` for side-by-side fields (date range, category+payer, amount range).
- **Reset button**: Secondary style, left-aligned. "Apply Filters" button: primary style, right-aligned. Both in a `flex justify-between` row.
- **Active filter indicator**: When any filter is set, show a small count badge on the Filter toggle button.

### Split Preview (`split-preview.tsx`)

**Specific instructions**:

- Container: `rounded-md bg-gray-50 p-3 space-y-1`.
- Header: `text-xs font-medium text-gray-500 uppercase tracking-wide` — "Split breakdown".
- Each member row: `flex items-center justify-between py-1.5`.
  - Left: Member name (`text-sm`).
  - Right: `$XX.XX` in `text-sm font-medium tabular-nums` + `(XX%)` in `text-xs text-gray-500 ml-1`.
- For "Custom" mode: Replace the right side with an editable percentage input (`w-16 text-right rounded border px-2 py-1 text-sm`) followed by a `%` label. Show the computed dollar amount below it in `text-xs text-gray-500`.
- **Validation feedback**: If custom percentages don't sum to 100, show a red text below the preview: "Percentages must add up to 100% (currently XX%)".

### Category Manager (`category-manager.tsx`)

```
┌──────────────────────────────────────┐
│  Categories                  + Add   │
├──────────────────────────────────────┤
│                                      │
│  Default Categories                  │
│  ┌────────────────────────────────┐  │
│  │ 🛒 Groceries                  │  │
│  │ 🏠 Housing                    │  │
│  │ ⚡ Utilities                   │  │
│  │ 🚗 Transport                  │  │
│  │ 🍽️ Dining Out                 │  │
│  │ 🎬 Entertainment              │  │
│  │ 🏥 Health                     │  │
│  │ 👕 Clothing                   │  │
│  │ 📁 Other                      │  │
│  └────────────────────────────────┘  │
│                                      │
│  Custom Categories                   │
│  ┌────────────────────────────────┐  │
│  │ 🐕 Pets            Edit  Del  │  │
│  │ ✈️ Travel           Edit  Del  │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌─ Add Category ─────────────────┐  │
│  │  Name: [____________]         │  │
│  │  Emoji: [📁]   Color: [■]    │  │
│  │        [Cancel]  [Save]       │  │
│  └────────────────────────────────┘  │
│                                      │
└──────────────────────────────────────┘
```

**Specific instructions**:

- **Default categories**: Listed with emoji + name. No edit/delete allowed (dimmed controls or no controls shown). `text-sm text-gray-400` label "Default" if needed.
- **Custom categories**: Same list style but with "Edit" (blue text button) and "Delete" (red text button) at the right of each row. Use `text-xs font-medium` for these action links.
- **Add/Edit form**: Inline form that appears at the bottom of the list (or replaces the row being edited). Fields: Name (`input type="text"`), Emoji (`input type="text"` with `w-16 text-center text-lg`), Color (`input type="color"` with `w-10 h-10 rounded cursor-pointer border-0`). Keep the form compact — use a single row grid: `grid grid-cols-[1fr_4rem_3rem] gap-2 items-end`.
- **Category row**: `flex items-center justify-between py-2 border-b last:border-b-0`. Left: emoji + name with a small colored dot (`w-3 h-3 rounded-full inline-block`) matching the category color before the name.

---

## M3: Balances & Settlement

### Balance Card (`balance-card.tsx`)

```
┌──────────────────────────────────────┐
│           Household Balance          │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  Jose                         │  │
│  │  You are owed          +$245  │  │
│  │  ████████████████░░░░░        │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  Partner                      │  │
│  │  You owe               -$245  │  │
│  │  ░░░░░████████████████████    │  │
│  └────────────────────────────────┘  │
│                                      │
└──────────────────────────────────────┘
```

**Specific instructions**:

- **Container**: Section with heading "Household Balance" (`text-lg font-semibold`).
- **Per-member card**: `rounded-md border p-4`. Member name in `text-sm font-medium`. Balance amount in `text-2xl font-bold tabular-nums` — green (`text-green-600`) for positive (owed money), red (`text-red-600`) for negative (owes money).
- **Balance label**: "You are owed" for positive, "You owe" for negative, "Settled up" for zero. `text-sm text-gray-500`.
- **Balance bar** (optional visual): A thin horizontal bar (`h-1.5 rounded-full`) showing the relative balance. Green fill for positive, red fill for negative. Container: `bg-gray-100 rounded-full`. This is a subtle addition, not critical.
- **Zero state**: When all settled, show a green checkmark icon + "All settled up!" in `text-green-600 font-medium` centered in the card.

### Simplified Debts (`simplified-debts.tsx`)

```
┌──────────────────────────────────────┐
│  Who owes whom                       │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  Partner → Jose               │  │
│  │            $245.00             │  │
│  │        [ Settle Up ]          │  │
│  └────────────────────────────────┘  │
│                                      │
└──────────────────────────────────────┘
```

**Specific instructions**:

- **Debt card**: `rounded-md border p-4 text-center`. Shows "A → B" with an arrow character or `→` entity. Names in `font-medium`. Amount large: `text-xl font-bold tabular-nums mt-1`.
- **Settle Up button**: Primary button below the amount (`mt-3`). Opens the settle-up form.
- **Arrow direction**: The person who **owes** is on the left, the person **owed** is on the right. Use "pays" as the verb: "Partner pays Jose".
- **Multiple debts** (3+ members): Stack vertically with `space-y-3`.
- **All settled**: Replace with a `rounded-md border border-green-200 bg-green-50 p-4` card: checkmark + "Everyone is settled up!" in `text-green-700 font-medium`.

### Settle Up Form (`settle-up-form.tsx`)

**Specific instructions**:

- **Modal or inline expansion**: When user taps "Settle Up" on a debt card, expand a form below the card (push content down, don't overlay). Alternatively, navigate to a dedicated settle page.
- **Fields**: Amount (pre-filled with debt amount, editable), Note (optional textarea, `rows={2}`).
- **Receiver display**: Show "Paying {ReceiverName}" as a static label above the form, not an editable field.
- **Buttons**: "Record Payment" (primary, full-width), "Cancel" (secondary text button above it).
- **Confirmation**: After submission, briefly show a green success banner: "Payment of $XX recorded" with a checkmark.

### Settlement History (`settlement-history.tsx`)

```
┌──────────────────────────────────────┐
│  Settlement History                  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  Mar 5 · Partner → Jose       │  │
│  │  $245.00                      │  │
│  │  "Settling February expenses" │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  Feb 3 · Jose → Partner       │  │
│  │  $180.00                      │  │
│  └────────────────────────────────┘  │
│                                      │
└──────────────────────────────────────┘
```

**Specific instructions**:

- **List layout**: `space-y-2`. Each item: `rounded-md border p-3`.
- **Row layout**: Date + direction on first line (`text-xs text-gray-500`). Amount on second line (`text-sm font-semibold tabular-nums`). Optional note on third line in `text-xs text-gray-500 italic`.
- **Direction format**: "Jose → Partner" where left is payer, right is receiver.
- **Empty state**: "No settlements yet" centered text.

### Balances Page Layout

```
┌──────────────────────────────────────┐
│  Balances                            │
├──────────────────────────────────────┤
│                                      │
│  [Balance Cards - per member]        │
│                                      │
│  [Simplified Debts + Settle Up]      │
│                                      │
│  ── Settlement History ─────────     │
│                                      │
│  [Settlement list]                   │
│                                      │
└──────────────────────────────────────┘
```

- Sections separated by `space-y-6`. Settlement History section uses a `border-t pt-6 mt-6` divider.

---

## M4: Budgets

### Budget Overview Page

```
┌──────────────────────────────────────┐
│  Budgets         ◀ Mar 2024 ▶       │
├──────────────────────────────────────┤
│                                      │
│  Overall: $1,240 / $2,500 (50%)     │
│  ████████████░░░░░░░░░░░░░          │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ 🛒 Groceries                  │  │
│  │ $320 of $500 · 64%            │  │
│  │ ██████████████░░░░░░░         │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ 🏠 Housing           ⚠ 85%   │  │
│  │ $1,700 of $2,000 · 85%       │  │
│  │ ██████████████████████░░░     │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ 🍽️ Dining Out         🔴 110% │  │
│  │ $220 of $200 · 110%          │  │
│  │ ██████████████████████████ !! │  │
│  └────────────────────────────────┘  │
│                                      │
│  + Set Budget for Category           │
│                                      │
└──────────────────────────────────────┘
```

### Budget Progress Bar (`budget-progress-bar.tsx`)

**Specific instructions**:

- **Container**: `rounded-md border p-4 space-y-2`.
- **Header row**: `flex items-center justify-between`. Left: emoji + category name (`text-sm font-medium`). Right: alert badge if applicable.
- **Progress text**: `text-xs text-gray-500` — "$320 of $500 · 64%".
- **Progress bar**: Container `h-2 rounded-full bg-gray-100 overflow-hidden`. Fill bar inside with dynamic width via `style={{ width: \`${percentage}%\` }}`.
  - **Color thresholds**:
    - 0–79%: `bg-blue-600` (normal)
    - 80–99%: `bg-amber-500` (warning)
    - 100%+: `bg-red-500` (over budget)
  - Clamp visual width at 100% even when value exceeds it.
- **Alert badge**: At the right of the header row.
  - 80–99%: amber pill badge `rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-medium` — "⚠ 85%".
  - 100%+: red pill badge `rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-medium` — "🔴 110%".

### Budget Alert Banner (`budget-alert.tsx`)

**Specific instructions**:

- Shown at the top of the budgets page (and optionally on the dashboard) when any category exceeds 80%.
- **Warning (80–99%)**: `rounded-md border border-amber-200 bg-amber-50 p-3`. Text: "⚠ {Category} is at {X}% of budget" in `text-sm text-amber-800`.
- **Over budget (100%+)**: `rounded-md border border-red-200 bg-red-50 p-3`. Text: "🔴 {Category} is over budget by ${amount}" in `text-sm text-red-800`.
- **Multiple alerts**: Stack vertically with `space-y-2`. If more than 3, show first 2 and a "and X more..." link.

### Budget Form (`budget-form.tsx`)

**Specific instructions**:

- **Inline form**: Appears at the bottom of the budget list, or as a replacement for the "+ Set Budget" button.
- **Fields**: Category (select dropdown, only categories without a budget for the current month), Amount (`type="number"`, `min="0"`, `step="0.01"`).
- **Month/Year**: Show current month/year as a static display with `◀ ▶` navigation arrows to change month. Arrows: secondary icon buttons (`rounded p-1 hover:bg-gray-100`).
- **Save**: Primary button "Set Budget". If editing existing, "Update Budget" + a red "Remove Budget" text link.

### Month Navigation

- **Display**: `text-base font-semibold` showing "March 2024".
- **Arrows**: Left/right arrow buttons flanking the month. `rounded p-1 hover:bg-gray-100 text-gray-600`.
- **Layout**: `flex items-center justify-center gap-2` centered in the page header area.

---

## M5: Recurring Expenses

### Recurring Expense List (`recurring-expense-list.tsx`)

```
┌──────────────────────────────────────┐
│  Recurring Expenses          + Add   │
├──────────────────────────────────────┤
│                                      │
│  ┌────────────────────────────────┐  │
│  │ 🏠 Rent                       │  │
│  │ $1,800 · Monthly              │  │
│  │ Next: Apr 1    ● Active       │  │
│  │                [⏸] [✏️] [🗑]  │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ ⚡ Electric Bill     ⏸ Paused  │  │
│  │ $~140 · Monthly               │  │
│  │ Next: —                       │  │
│  │                [▶] [✏️] [🗑]   │  │
│  └────────────────────────────────┘  │
│                                      │
└──────────────────────────────────────┘
```

**Specific instructions**:

- **Card layout**: `rounded-md border p-4 space-y-2`. Same style as expense cards but with additional metadata.
- **Line 1**: Emoji + description (`text-sm font-medium`).
- **Line 2**: Amount + frequency (`text-xs text-gray-500`). Format frequency as "Monthly", "Weekly", "Daily", "Yearly".
- **Line 3**: "Next: {date}" in `text-xs text-gray-500`. Status badge on the right.
  - **Active**: `rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium` — "● Active"
  - **Paused**: `rounded-full bg-gray-100 text-gray-600 px-2 py-0.5 text-xs font-medium` — "⏸ Paused"
- **Action buttons** (line 4, right-aligned): Small icon-style buttons.
  - Pause/Resume: `rounded p-1.5 hover:bg-gray-100 text-gray-500`. Show ⏸ when active, ▶ when paused.
  - Edit: `rounded p-1.5 hover:bg-blue-50 text-blue-600`.
  - Delete: `rounded p-1.5 hover:bg-red-50 text-red-600`.
- **Paused card**: Apply `opacity-60` to the entire card to visually de-emphasize.
- **Empty state**: "No recurring expenses set up" + "Add your first recurring expense" button.

### Recurring Expense Form (`recurring-expense-form.tsx`)

**Specific instructions**:

- **Extends the Expense Form** with these additional fields below the split method:
  - **Frequency**: Segmented control (same style as split method selector) with options: "Daily", "Weekly", "Monthly", "Yearly". Default to "Monthly".
  - **Start Date**: `<input type="date">`. Label: "Starts on". Default to today.
  - **End Date**: `<input type="date">`. Label: "Ends on (optional)". When empty, show helper text: "Runs indefinitely" in `text-xs text-gray-500`.
- **Submit button**: "Create Recurring Expense" (primary). Edit mode: "Update Recurring Expense".
- **Form title**: "New Recurring Expense" / "Edit Recurring Expense".

---

## M6: Insights & Reports

### Insights Page Layout

**Container**: Use `max-w-4xl` for the insights page (wider than other pages to fit charts).

```
┌──────────────────────────────────────────────┐
│  Insights                  ◀ Mar 2024 ▶      │
├──────────────────────────────────────────────┤
│                                              │
│  ┌─ Monthly Summary ──────────────────────┐  │
│  │  Total Spent        vs Last Month      │  │
│  │  $2,340             ▲ 12%              │  │
│  │                     vs Budget: 85%     │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌─ By Category ──┐ ┌─ Spending Trend ────┐  │
│  │   [Donut       │ │  [Line Chart        │  │
│  │    Chart]      │ │   6 months]         │  │
│  │                │ │                     │  │
│  └────────────────┘ └─────────────────────┘  │
│                                              │
│  ┌─ By Member ────────────────────────────┐  │
│  │  [Bar Chart - per member spend]        │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌─ Budget vs Actual ─────────────────────┐  │
│  │  [Grouped Bar Chart]                   │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌─ Top Expenses ─────────────────────────┐  │
│  │  1. Rent                   $1,800.00   │  │
│  │  2. Groceries (Costco)       $245.20   │  │
│  │  3. Electric Bill            $142.30   │  │
│  │  4. Dinner at Restaurant      $89.50   │  │
│  │  5. Gas                       $62.00   │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │        📥 Export as CSV              │    │
│  └──────────────────────────────────────┘    │
│                                              │
└──────────────────────────────────────────────┘
```

### Monthly Summary Card (`monthly-summary-card.tsx`)

**Specific instructions**:

- **Container**: `rounded-md border p-4`.
- **Total spent**: `text-3xl font-bold tabular-nums` — the primary number.
- **vs Last Month**: Right-aligned or below the total. Show percentage change with arrow: "▲ 12%" in `text-green-600` if spending decreased (good), "▲ 12%" in `text-red-600` if increased (bad — spending more). Use `text-sm font-medium`.
  - Arrow: ▲ for increase, ▼ for decrease. Green = good (less spending), Red = bad (more spending). This is inverted from typical — for expenses, down is good.
- **vs Budget**: `text-sm text-gray-500` — "85% of monthly budget used".

### Charts General Instructions

All charts use `recharts`. Wrap each chart in a `rounded-md border p-4` card with a section heading.

- **Chart card header**: `text-sm font-semibold mb-3`.
- **Responsive sizing**: Use `<ResponsiveContainer width="100%" height={X}>` where X varies by chart type.
- **Color palette for categories**: Use the category's own `color` field from the database. Fallback palette: `['#2563eb', '#16a34a', '#dc2626', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#6b7280']`.
- **Tooltip**: Use recharts default tooltip. Customize formatter to show `$` prefix and 2 decimal places.
- **Loading state**: `rounded-md border p-4 text-sm text-gray-500` — "Loading chart...".
- **No data state**: Same container, centered text: "Not enough data to display" in `text-sm text-gray-400`.
- **Chart text**: Use `text-xs` (12px) for axis labels and legend text.

### Category Donut Chart (`category-donut-chart.tsx`)

- **Chart type**: `<PieChart>` with `<Pie>` (innerRadius 50, outerRadius 80).
- **Height**: 200px.
- **Legend**: Below the chart, horizontal wrap. Each item: colored dot + category name + amount. Use `text-xs`.
- **Center label**: Optionally show total amount in the donut hole using a custom `<text>` element.

### Spending Trend Chart (`spending-trend-chart.tsx`)

- **Chart type**: `<LineChart>` with `<Line type="monotone">`.
- **Height**: 200px.
- **X-axis**: Month abbreviations ("Jan", "Feb", "Mar"...).
- **Y-axis**: Dollar amounts, auto-scaled.
- **Line color**: `blue-600` (#2563eb).
- **Data points**: Show dots on each month (`dot={{ r: 3 }}`).
- **Area fill**: Optional light blue fill below the line (`<Area fillOpacity={0.1}>`).
- **Duration**: Default 6 months. Offer a small toggle: "6M / 12M" as two text buttons.

### Member Breakdown Chart (`member-breakdown-chart.tsx`)

- **Chart type**: `<BarChart>` with horizontal bars.
- **Height**: 120px (for 2 members), scales with member count.
- **Bar color**: `blue-600` for all members, or use distinct colors per member.
- **Labels**: Member name on Y-axis, dollar amount at end of bar.

### Budget vs Actual Chart (`budget-vs-actual-chart.tsx`)

- **Chart type**: `<BarChart>` with grouped bars.
- **Height**: 250px.
- **Bar colors**: Budget = `gray-300` (lighter), Actual = category color or `blue-600`.
- **X-axis**: Category names (truncated if long).
- **Reference line**: At 100% budget line if showing percentages.

### Top Expenses (`top-expenses-list.tsx`)

- **Not a chart** — a simple ranked list.
- **Layout**: `space-y-1`. Each row: `flex items-center justify-between py-2 border-b last:border-b-0`.
- **Left**: Rank number (`text-sm text-gray-400 w-6`), emoji + description (`text-sm`).
- **Right**: Amount in `text-sm font-semibold tabular-nums`.
- **Show 5 items** by default.

### Export Button (`export-button.tsx`)

- **Placement**: Bottom of insights page.
- **Style**: Full-width secondary button: `rounded-md border px-4 py-3 text-sm font-medium hover:bg-gray-50 w-full`.
- **Label**: "📥 Export as CSV" (emoji in label is acceptable here).
- **Before export**: Show a date range picker (two date inputs in a `flex gap-2` row). Default to current month.
- **On click**: Trigger CSV download. Show brief "Downloading..." state on the button.

### Charts Responsive Layout

- **Desktop** (md+): Two charts side-by-side using `grid md:grid-cols-2 gap-4` for the Category Donut + Spending Trend pair.
- **Mobile**: All charts stack vertically, full-width, `space-y-4`.

---

## M7: Polish & PWA

### Receipt Photo Upload

**On the Expense Form**:

- **Placement**: Below the Notes field, above the Save button.
- **Upload area**: `rounded-md border-2 border-dashed border-gray-300 p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors`.
- **Empty state text**: "📷 Add receipt photo" in `text-sm text-gray-500`. Below: "Tap to take photo or choose file" in `text-xs text-gray-400`.
- **Input**: Hidden `<input type="file" accept="image/*" capture="environment">` triggered by clicking the area.
- **Preview**: Once uploaded, replace the dashed area with the photo thumbnail (`rounded-md overflow-hidden max-h-48 object-cover w-full`). Overlay a small "✕" remove button at top-right: `absolute top-1 right-1 rounded-full bg-black/50 text-white w-6 h-6 flex items-center justify-center`.

**On the Expense Detail view**:

- **Thumbnail**: Show receipt image at bottom of the detail card, full-width, `rounded-md max-h-64 object-cover`. Tap to open full-size in a simple lightbox overlay (dark background + centered image + close button).

### Loading Skeletons

**Skeleton pattern**: Use `animate-pulse` with gray placeholder blocks.

- **Expense list skeleton**: 3 placeholder cards, each `rounded-md border p-3`. Inside: `h-4 bg-gray-200 rounded w-3/4` for title, `h-3 bg-gray-200 rounded w-1/2 mt-2` for subtitle, `h-4 bg-gray-200 rounded w-16 mt-2 ml-auto` for amount.
- **Balance card skeleton**: `rounded-md border p-4`. Inside: `h-4 bg-gray-200 rounded w-1/3`, `h-8 bg-gray-200 rounded w-1/4 mt-2`, `h-1.5 bg-gray-200 rounded-full w-full mt-3`.
- **Chart skeleton**: `rounded-md border p-4 h-[200px]`. Inside: centered `h-24 w-24 bg-gray-200 rounded-full` (for donut) or `h-full w-full bg-gray-200 rounded` (for bar/line).
- **Apply to**: Expense list, balance page, budget page, insights page. Each page's `loading.tsx` exports the relevant skeleton.

### Bottom Navigation Bar (`mobile-bottom-nav.tsx`)

Already exists. For M7, update the navigation items:

| Icon | Label | Route |
|------|-------|-------|
| 🏠 | Home | `/household` |
| 💰 | Expenses | `/household/expenses` |
| 📊 | Budgets | `/household/budgets` |
| 📈 | Insights | `/household/insights` |

**Specific instructions**:

- **Container**: `fixed inset-x-0 bottom-0 z-40 border-t bg-white md:hidden`.
- **Grid**: `grid grid-cols-4`.
- **Each item**: `flex flex-col items-center py-2 text-xs`. Active: `font-semibold text-blue-700`. Inactive: `text-gray-600`.
- **Safe area**: Add `pb-[env(safe-area-inset-bottom)]` for notched phones.

### Quick-Add FAB

Already exists. Keep as-is:

- **Position**: `fixed bottom-20 right-4 z-30 md:bottom-6`.
- **Style**: `rounded-full bg-blue-600 text-white w-14 h-14 flex items-center justify-center shadow-lg hover:bg-blue-700 active:scale-95 transition-transform`.
- **Label**: "+" in `text-2xl font-light`.
- **Behavior**: Navigates to `/household/expenses/new`.

### Responsive Breakpoints Summary

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Default (mobile) | <640px | Single column, bottom nav visible, FAB visible, stacked forms |
| `sm:` | ≥640px | Minor adjustments (inline flex for some rows) |
| `md:` | ≥768px | Bottom nav hidden, 2-column grids for filters/charts, wider padding |
| `lg:` | ≥1024px | Not used (app stays within max-w-4xl) |

### PWA Manifest & Meta Tags

- **Theme color**: `#2563eb` (blue-600) — already set.
- **Display**: `standalone`.
- **Background color**: `#ffffff`.
- **App name**: "Hornero".
- **Short name**: "Hornero".
- **Icons**: Provide 192x192 and 512x512 PNG icons with the app logo.

---

## Cross-Cutting UX Patterns

### Currency Formatting

- Always show 2 decimal places: `$1,234.56`.
- Use `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })` or equivalent.
- Align amounts right in lists using `text-right tabular-nums`.
- Large display amounts: `text-2xl font-bold tabular-nums`.

### Empty States

Every list/page must have an empty state:

| Page | Empty state text | CTA |
|------|-----------------|-----|
| Expenses | "No expenses yet" | "Add your first expense" (button) |
| Budgets | "No budgets set for this month" | "Set your first budget" (button) |
| Recurring | "No recurring expenses" | "Add a recurring expense" (button) |
| Balances | "Add some expenses to see balances" | "Go to Expenses" (link) |
| Insights | "Not enough data yet" | "Add expenses to see insights" (text) |
| Settlements | "No settlements recorded" | — |

Style: `text-center py-8`. Text in `text-sm text-gray-500`. CTA as a secondary button or blue text link below.

### Error States

- **Form validation**: Inline below each field, `text-sm text-red-600 mt-1`.
- **API errors**: Top-of-form banner: `rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800`.
- **Network errors**: Same banner style: "Something went wrong. Please try again."
- **Retry pattern**: Show error message + "Try Again" secondary button.

### Success Feedback

- **After create/update**: Navigate back to the list with a brief success state (optimistic UI update — the new item appears in the list immediately).
- **After delete**: Item removed from list with no confirmation modal — use swipe-to-delete with an "Undo" toast if possible. Otherwise, confirm deletion with a simple `window.confirm()` dialog before deleting.
- **Settlement recorded**: Green success banner at top of page, auto-dismisses after 3 seconds.

### Accessibility Checklist

- All form inputs have associated `<label>` with `htmlFor`.
- All icon-only buttons have `aria-label`.
- Color is never the only indicator (always pair with text/icon).
- Focus styles: Use Tailwind default `focus:ring-2 focus:ring-blue-500 focus:ring-offset-2` on interactive elements.
- Touch targets: Minimum 44x44px on mobile (ensured by `py-2 px-3` minimum on buttons).
- Screen reader text: Use `sr-only` class for visually hidden labels.
