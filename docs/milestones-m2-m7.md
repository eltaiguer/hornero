# Hornero Milestones M2–M7 — TDD Implementation Plans

> Builds on the M1 Foundation already implemented: NextAuth v5, Prisma (SQLite), Vitest, service-layer architecture, Zod validation. All milestones follow the same TDD pattern (test → implement → refactor) and the same layering (schema → validation → service → API route → component → page → integration test).

---

## M2: Expenses Core

**Goal**: Add, edit, delete expenses with category assignment and split logic (equal, proportional, custom). Filterable expense list.

### Phase 0: Schema Changes

Extend `prisma/schema.prisma` with:

```
model Category {
  id           String    @id @default(cuid())
  householdId  String
  name         String
  color        String    @default("#6B7280")
  emoji        String    @default("📁")
  isDefault    Boolean   @default(false)
  household    Household @relation(fields: [householdId], references: [id], onDelete: Cascade)
  expenses     Expense[]
  @@unique([householdId, name])
}

model Expense {
  id              String         @id @default(cuid())
  householdId     String
  payerId         String
  amount          Float
  description     String
  date            DateTime
  categoryId      String
  splitMethod     String         // "equal" | "proportional" | "custom"
  splitConfig     String?        // JSON string for custom splits e.g. {"userId1": 60, "userId2": 40}
  notes           String?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  household       Household      @relation(fields: [householdId], references: [id], onDelete: Cascade)
  payer           User           @relation(fields: [payerId], references: [id])
  category        Category       @relation(fields: [categoryId], references: [id])
  splits          ExpenseSplit[]
}

model ExpenseSplit {
  id          String  @id @default(cuid())
  expenseId   String
  userId      String
  amountOwed  Float
  settled     Boolean @default(false)
  expense     Expense @relation(fields: [expenseId], references: [id], onDelete: Cascade)
  user        User    @relation(fields: [userId], references: [id])
  @@unique([expenseId, userId])
}
```

**Tests** (`src/__tests__/integration/schema-m2.test.ts`):
- Create category for household, enforce unique name per household
- Create expense with payer + category, cascade delete with household
- Create expense splits, enforce unique user per expense

### Phase 1: Validation Schemas

| Test File | Implementation File |
|---|---|
| `src/lib/validations/__tests__/category.test.ts` | `src/lib/validations/category.ts` |
| `src/lib/validations/__tests__/expense.test.ts` | `src/lib/validations/expense.ts` |

**Schemas**:
- `createCategorySchema` — name (1–50 chars), color (hex), emoji
- `createExpenseSchema` — amount (> 0), description (1–200), date, categoryId, splitMethod (enum), splitConfig (optional JSON)
- `updateExpenseSchema` — partial version
- `expenseFilterSchema` — dateFrom, dateTo, categoryId, payerId, minAmount, maxAmount (all optional)

### Phase 2: Service Layer

| Test File | Implementation File |
|---|---|
| `src/services/__tests__/category.service.test.ts` | `src/services/category.service.ts` |
| `src/services/__tests__/expense.service.test.ts` | `src/services/expense.service.ts` |
| `src/services/__tests__/split.service.test.ts` | `src/services/split.service.ts` |

**Key functions**:
- `seedDefaultCategories(householdId)` — create the 9 default categories; called when household is created
- `createCategory(householdId, input)` / `updateCategory` / `deleteCategory`
- `getCategories(householdId)` — list all
- `createExpense(householdId, input, payerId)` — validate, create expense + compute splits in transaction
- `updateExpense(expenseId, input)` — recompute splits
- `deleteExpense(expenseId)`
- `getExpenses(householdId, filters)` — paginated, filtered
- `getExpenseById(id)` — with splits + payer + category
- `calculateSplits(amount, splitMethod, members, splitConfig?)` — pure function:
  - `equal`: amount / memberCount
  - `proportional`: weighted by salary (falls back to equal if no salaries)
  - `custom`: uses splitConfig percentages, validates they sum to 100

**Split calculation is the critical business logic** — test thoroughly:
- Equal with 2, 3 members; rounding (cents)
- Proportional with different salaries, with zero/null salaries
- Custom with valid/invalid percentages
- Edge: single member, amount = 0

### Phase 3: API Routes

| Test File | Implementation File |
|---|---|
| `src/app/api/households/[id]/categories/__tests__/route.test.ts` | `src/app/api/households/[id]/categories/route.ts` |
| `src/app/api/households/[id]/expenses/__tests__/route.test.ts` | `src/app/api/households/[id]/expenses/route.ts` |
| `src/app/api/households/[id]/expenses/[expenseId]/__tests__/route.test.ts` | `src/app/api/households/[id]/expenses/[expenseId]/route.ts` |

- `GET /api/households/:id/categories` — list
- `POST /api/households/:id/categories` — create (owner only)
- `GET /api/households/:id/expenses` — list with query filters
- `POST /api/households/:id/expenses` — create (any member)
- `GET /api/households/:id/expenses/:expenseId` — detail with splits
- `PATCH /api/households/:id/expenses/:expenseId` — update (payer or owner)
- `DELETE /api/households/:id/expenses/:expenseId` — delete (payer or owner)

### Phase 4: UI Components

| Test File | Implementation File |
|---|---|
| `src/components/expense/__tests__/expense-form.test.tsx` | `src/components/expense/expense-form.tsx` |
| `src/components/expense/__tests__/expense-list.test.tsx` | `src/components/expense/expense-list.tsx` |
| `src/components/expense/__tests__/split-preview.test.tsx` | `src/components/expense/split-preview.tsx` |
| `src/components/expense/__tests__/expense-filters.test.tsx` | `src/components/expense/expense-filters.tsx` |
| `src/components/category/__tests__/category-manager.test.tsx` | `src/components/category/category-manager.tsx` |

- **ExpenseForm**: amount, description, date picker, category select, split method select, split preview
- **SplitPreview**: shows per-member breakdown before saving ("You owe $X, Partner owes $Y")
- **ExpenseList**: scrollable list with category chips, amount, payer, date
- **ExpenseFilters**: date range, category dropdown, payer dropdown, amount range
- **CategoryManager**: add/edit/delete categories with color/emoji

### Phase 5: Pages

- `src/app/(dashboard)/household/expenses/page.tsx` — expense list with filters + add button
- `src/app/(dashboard)/household/expenses/new/page.tsx` — expense form
- `src/app/(dashboard)/household/expenses/[expenseId]/page.tsx` — expense detail/edit
- `src/app/(dashboard)/household/categories/page.tsx` — category management

### Phase 6: Integration Test

`src/__tests__/integration/expense-lifecycle.test.ts` — Create household with 2 members, set salaries, add expense with each split method, verify splits computed correctly, edit expense, delete expense.

### Estimated Tests: ~50–60

---

## M3: Balances & Settlement

**Goal**: Running net balance between members, simplified debt view, settle-up flow, settlement history.

### Phase 0: Schema Changes

```
model Settlement {
  id           String   @id @default(cuid())
  householdId  String
  payerId      String   // person paying the debt
  receiverId   String   // person receiving payment
  amount       Float
  date         DateTime @default(now())
  note         String?
  household    Household @relation(fields: [householdId], references: [id], onDelete: Cascade)
  payer        User      @relation("SettlementPayer", fields: [payerId], references: [id])
  receiver     User      @relation("SettlementReceiver", fields: [receiverId], references: [id])
}
```

### Phase 1: Validation Schemas

- `createSettlementSchema` — receiverId, amount (> 0), note (optional)

### Phase 2: Service Layer

| Test File | Implementation File |
|---|---|
| `src/services/__tests__/balance.service.test.ts` | `src/services/balance.service.ts` |
| `src/services/__tests__/settlement.service.test.ts` | `src/services/settlement.service.ts` |

**Key functions**:
- `calculateBalances(householdId)` — aggregate all expense splits + settlements into a net position per member. Returns `{ userId, balance }[]` where positive = owed money, negative = owes money.
- `getSimplifiedDebts(householdId)` — compute minimum transfers to settle all debts. For 2 members this is trivial; for N members use the min-cash-flow algorithm.
- `createSettlement(householdId, payerId, input)` — record a payment
- `getSettlements(householdId)` — list with payer/receiver details

**Critical logic tests**:
- 2 members, one pays all expenses → other owes half
- Multiple expenses, different payers → net balance correct
- Settlement partially reduces balance
- Settlement fully settles → balance is 0
- Simplified debts with 3 members

### Phase 3: API Routes

- `GET /api/households/:id/balances` — current balances + simplified debts
- `POST /api/households/:id/settlements` — record settlement
- `GET /api/households/:id/settlements` — settlement history

### Phase 4: UI Components

- **BalanceCard**: per-member net position with color (green=owed, red=owes)
- **SimplifiedDebts**: "A pays B $120" cards
- **SettleUpForm**: amount input, select receiver, confirm
- **SettlementHistory**: chronological list

### Phase 5: Pages

- `src/app/(dashboard)/household/balances/page.tsx` — balance view + settle up + history

### Phase 6: Integration Test

Full flow: 2 members, add 3 expenses (different payers), verify balances, settle up, verify reduced balance.

### Estimated Tests: ~30–35

---

## M4: Budgets

**Goal**: Monthly budgets per category with progress tracking and alerts.

### Phase 0: Schema Changes

```
model Budget {
  id           String   @id @default(cuid())
  householdId  String
  categoryId   String
  month        Int      // 1-12
  year         Int
  amount       Float
  household    Household @relation(fields: [householdId], references: [id], onDelete: Cascade)
  category     Category  @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  @@unique([householdId, categoryId, month, year])
}
```

### Phase 1: Validation Schemas

- `createBudgetSchema` — categoryId, month (1–12), year, amount (> 0)
- `updateBudgetSchema` — amount only

### Phase 2: Service Layer

| Test File | Implementation File |
|---|---|
| `src/services/__tests__/budget.service.test.ts` | `src/services/budget.service.ts` |

**Key functions**:
- `setBudget(householdId, input)` — upsert budget for category+month+year
- `getBudgets(householdId, month, year)` — all budgets for a month
- `getBudgetProgress(householdId, month, year)` — joins budgets with actual expense totals per category. Returns `{ categoryId, categoryName, budgetAmount, actualSpent, percentage }[]`
- `checkBudgetAlerts(householdId)` — returns categories at 80% or 100%+

### Phase 3: API Routes

- `GET /api/households/:id/budgets?month=&year=` — budgets with progress
- `POST /api/households/:id/budgets` — set/update budget
- `DELETE /api/households/:id/budgets/:budgetId` — remove budget

### Phase 4: UI Components

- **BudgetProgressBar**: category name, progress bar, "$320 of $500 spent — 64%"
- **BudgetForm**: category select, amount input, month/year picker
- **BudgetOverview**: grid of all category budgets for current month
- **BudgetAlert**: banner when category exceeds 80%/100%

### Phase 5: Pages

- `src/app/(dashboard)/household/budgets/page.tsx` — budget overview + add/edit

### Phase 6: Integration Test

Set budgets, add expenses across categories, verify progress calculations, verify alert thresholds.

### Estimated Tests: ~25–30

---

## M5: Recurring Expenses

**Goal**: Define expense templates that auto-create on schedule via cron.

### Phase 0: Schema Changes

```
model RecurringExpense {
  id              String    @id @default(cuid())
  householdId     String
  payerId         String
  amount          Float
  description     String
  categoryId      String
  splitMethod     String
  splitConfig     String?
  frequency       String    // "daily" | "weekly" | "monthly" | "yearly"
  nextDueDate     DateTime
  endDate         DateTime?
  active          Boolean   @default(true)
  createdAt       DateTime  @default(now())
  household       Household @relation(fields: [householdId], references: [id], onDelete: Cascade)
  payer           User      @relation(fields: [payerId], references: [id])
  category        Category  @relation(fields: [categoryId], references: [id])
}
```

### Phase 1: Validation Schemas

- `createRecurringExpenseSchema` — amount, description, categoryId, splitMethod, frequency (enum), startDate, endDate (optional)
- `updateRecurringExpenseSchema` — partial; includes ability to update `active` (pause/resume)

### Phase 2: Service Layer

| Test File | Implementation File |
|---|---|
| `src/services/__tests__/recurring.service.test.ts` | `src/services/recurring.service.ts` |

**Key functions**:
- `createRecurringExpense(householdId, payerId, input)` — validate, set nextDueDate from startDate
- `updateRecurringExpense(id, input)` — edit series (future occurrences)
- `pauseRecurringExpense(id)` / `resumeRecurringExpense(id)`
- `deleteRecurringExpense(id)`
- `getRecurringExpenses(householdId)` — list active + paused
- `processDueExpenses()` — **the cron logic**: find all active recurring expenses where `nextDueDate <= now()`, create a real Expense + splits for each, advance `nextDueDate` based on frequency, deactivate if past `endDate`
- `advanceNextDueDate(current, frequency)` — pure function: add 1 day/week/month/year

**Critical tests for `processDueExpenses`**:
- Creates expense on due date
- Advances nextDueDate correctly for each frequency
- Does not create if not yet due
- Deactivates when past endDate
- Skips paused templates
- Handles multiple due expenses in one run
- Idempotent — running twice doesn't double-create

### Phase 3: API Routes

- `GET /api/households/:id/recurring` — list
- `POST /api/households/:id/recurring` — create
- `PATCH /api/households/:id/recurring/:recurringId` — update/pause/resume
- `DELETE /api/households/:id/recurring/:recurringId` — delete
- `POST /api/cron/recurring` — cron endpoint (protected by secret header)

### Phase 4: UI Components

- **RecurringExpenseForm**: same as ExpenseForm + frequency select + start/end dates
- **RecurringExpenseList**: list with status badge (active/paused), next due date, frequency
- **RecurringExpenseActions**: pause/resume/delete buttons

### Phase 5: Pages

- `src/app/(dashboard)/household/recurring/page.tsx` — list + add
- `src/app/api/cron/recurring/route.ts` — Vercel cron handler

### Phase 6: Integration Test

Create recurring expense, simulate cron run, verify expense + splits created, verify nextDueDate advanced, simulate again — no duplicate.

### Estimated Tests: ~30–35

---

## M6: Insights & Reports

**Goal**: Charts, monthly summary, spending breakdowns, CSV export.

### Phase 1: Service Layer (no new schema)

| Test File | Implementation File |
|---|---|
| `src/services/__tests__/insights.service.test.ts` | `src/services/insights.service.ts` |
| `src/services/__tests__/export.service.test.ts` | `src/services/export.service.ts` |

**Key functions**:
- `getMonthlySummary(householdId, month, year)` — total spent, vs last month (% change), vs budget
- `getSpendingByCategory(householdId, month, year)` — `{ category, amount, percentage }[]` for donut chart
- `getSpendingTrend(householdId, months)` — monthly totals over last N months for line chart
- `getMemberBreakdown(householdId, month, year)` — per-member spend totals
- `getTopExpenses(householdId, month, year, limit)` — biggest expenses
- `getBudgetVsActual(householdId, month, year)` — side-by-side data
- `exportExpensesCsv(householdId, dateFrom, dateTo)` — generates CSV string

All are **read-only aggregation queries** — test with seeded expense data.

### Phase 2: API Routes

- `GET /api/households/:id/insights/summary?month=&year=`
- `GET /api/households/:id/insights/by-category?month=&year=`
- `GET /api/households/:id/insights/trend?months=`
- `GET /api/households/:id/insights/by-member?month=&year=`
- `GET /api/households/:id/insights/top-expenses?month=&year=`
- `GET /api/households/:id/export?from=&to=` — returns CSV

### Phase 3: UI Components

Install `recharts` as dependency.

- **MonthlySummaryCard**: total, change vs last month, vs budget
- **CategoryDonutChart**: recharts PieChart
- **SpendingTrendChart**: recharts LineChart (6–12 months)
- **MemberBreakdownChart**: recharts BarChart
- **TopExpensesList**: simple ranked list
- **BudgetVsActualChart**: recharts grouped BarChart
- **ExportButton**: date range picker + download

### Phase 4: Pages

- `src/app/(dashboard)/household/insights/page.tsx` — all charts + export

### Phase 5: Integration Test

Seed expenses across 3 months + 2 members, verify all aggregation queries return correct numbers.

### Estimated Tests: ~25–30

---

## M7: Polish & PWA

**Goal**: PWA manifest, push notifications, receipt photos, performance tuning.

### Phase 0: PWA Setup

- Add `next-pwa` or manual service worker
- Create `manifest.json`: app name, icons, theme color, display: standalone
- Add `<meta>` tags for mobile: viewport, apple-mobile-web-app-capable, theme-color

### Phase 1: Receipt Photos

Extend Expense schema:
```
model Expense {
  ...
  receiptUrl  String?   // path in local storage or cloud bucket
}
```

- `uploadReceipt(expenseId, file)` — store file, update expense.receiptUrl
- UI: camera/file input on expense form, thumbnail on expense detail
- Storage: local `public/uploads/` for dev, cloud bucket (S3/Supabase Storage) for prod

### Phase 2: Push Notifications (opt-in)

- Service worker subscription
- Budget alert notifications (80% / 100% thresholds)
- Payment reminder notifications
- Settings toggle to enable/disable

### Phase 3: Performance

- Add `loading.tsx` skeletons for dashboard and expense list
- Implement `Suspense` boundaries around data-fetching sections
- Add pagination to expense list (cursor-based)
- Optimize Prisma queries with `select` to avoid over-fetching
- Add `next/dynamic` for chart components (client-only, heavy libs)

### Phase 4: Mobile UX

- Bottom navigation bar (Home, Expenses, Budget, Insights)
- FAB (Floating Action Button) for quick-add expense
- Pull-to-refresh on expense list
- Swipe-to-delete/edit on expense items
- Responsive layouts verified at 375px, 768px, 1280px

### Estimated Tests: ~15–20 (mostly component rendering + PWA manifest validation)

---

## Summary

| Milestone | Focus | New Models | Est. Tests |
|-----------|-------|-----------|------------|
| **M1** (done) | Foundation | User, Household, Member, Invite | 88 |
| **M2** | Expenses Core | Category, Expense, ExpenseSplit | ~55 |
| **M3** | Balances | Settlement | ~30 |
| **M4** | Budgets | Budget | ~25 |
| **M5** | Recurring | RecurringExpense | ~30 |
| **M6** | Insights | (none — read-only) | ~25 |
| **M7** | Polish & PWA | (Expense.receiptUrl) | ~15 |
| **Total** | | | **~270** |

## Architecture Principles (carried from M1)

1. **Service layer = testability boundary** — all business logic in `src/services/`, routes are thin auth wrappers
2. **Mocked Prisma for unit tests, real SQLite for integration** — fast TDD loop + correctness
3. **Double validation** — Zod in client forms (UX) + services (safety)
4. **TDD order** — schema → validation → service → API → component → page → integration
5. **Incremental schema** — each milestone adds models without breaking prior ones
