# MT5 Trading Bot Dashboard - Design Guidelines

## Design Approach: Professional Trading Platform

**Reference Framework**: Drawing inspiration from TradingView, Interactive Brokers, and modern fintech dashboards (Stripe, Robinhood). Focus on data clarity, quick decision-making, and professional aesthetics.

**Design System Foundation**: Material Design principles for data-heavy interfaces with emphasis on clear hierarchy and real-time data visualization.

---

## Typography System

**Font Stack**: 
- Primary: 'Inter' (Google Fonts) - clean, readable for data
- Monospace: 'JetBrains Mono' for numbers, code, metrics

**Hierarchy**:
- Page Headers: text-3xl font-bold
- Section Headers: text-xl font-semibold
- Data Labels: text-sm font-medium uppercase tracking-wide
- Metric Values: text-2xl font-bold (monospace)
- Body Text: text-base
- Small Data: text-sm (monospace for numbers)

---

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, and 8 for consistent rhythm (p-4, m-6, gap-8, etc.)

**Grid Structure**:
- Dashboard: 3-column layout on desktop (sidebar navigation + main content + metrics panel)
- Mobile: Single column stack
- Container: max-w-7xl for main content areas

**Responsive Breakpoints**:
- Mobile-first approach
- Sidebar collapses to hamburger menu on mobile
- Metrics panel moves below main content on tablets

---

## Component Library

### Navigation & Layout

**Sidebar Navigation** (Left, 240px width):
- Logo/branding at top
- Primary navigation items with icons
- Status indicator (MT5 connection status)
- User profile section at bottom
- Active state with subtle background highlight

**Top Bar**:
- Breadcrumb navigation
- Account balance display (real-time)
- Quick actions (Start/Stop Trading toggle)
- Notification bell icon

### Dashboard Components

**Metrics Cards**:
- Grid layout (grid-cols-1 md:grid-cols-2 lg:grid-cols-4)
- Each card: white background, rounded-lg, p-6
- Structure: Label (small, muted) → Value (large, bold, monospace) → Trend indicator (icon + percentage)
- Key metrics: Total P/L, Win Rate, Active Strategies, Current Drawdown

**Trading Journal Section**:
- Table layout with fixed header
- Columns: Timestamp, Strategy, Action, Symbol, P/L, Notes
- Alternating row backgrounds for readability
- Expandable rows for detailed insights
- Pagination at bottom

**Strategy Management Panel**:
- Card-based layout for each strategy
- Strategy card includes: Name, Status badge, Last run timestamp, Performance metrics
- Action buttons: Edit, Backtest, Activate/Deactivate
- "Upload New Strategy" button prominently placed

**Backtesting Interface**:
- Split view: Configuration form (left) + Results chart (right)
- Form inputs: Date range pickers, strategy selector, symbol input
- Results display: Line chart for equity curve + metrics grid below
- Export results button

**Live Trading Control Panel**:
- Prominent Start/Stop button with confirmation modal
- Real-time order log (scrollable list)
- Current positions table
- Risk parameters display

### Forms & Inputs

**MT5 Configuration Form**:
- Clean form layout with labels above inputs
- Input fields: border, rounded, p-3
- "Test Connection" button after credential fields
- Success/error feedback with icons and messages

**Standard Form Elements**:
- Labels: text-sm font-medium mb-2
- Inputs: border rounded-lg p-3 focus:ring-2
- Dropdowns: Native select styling enhanced with icons
- Checkboxes/Toggles: Use toggle switches for on/off states

### Data Visualization

**Charts** (using Chart.js or Plotly):
- Equity curves: Line charts with gradient fills
- Performance comparisons: Bar charts
- Win/loss distribution: Donut charts
- Consistent chart styling across dashboard

### Status & Feedback

**Connection Status Badge**:
- Green (Connected) / Red (Disconnected) / Yellow (Connecting)
- Positioned in sidebar and top bar

**Alert/Notification System**:
- Toast notifications for trade executions
- Banner alerts for system warnings
- Color coding: Success (green), Warning (yellow), Error (red), Info (blue)

**Loading States**:
- Skeleton screens for data loading
- Spinner for button actions
- Progress bars for backtesting

---

## Page-Specific Layouts

### Dashboard Home
- 4-column metrics grid at top
- Trading journal table (main section)
- Active strategies sidebar panel

### Strategy Manager
- Header with "Upload Strategy" CTA
- Strategy cards in 2-3 column grid
- Each card shows mini performance chart

### Backtesting Lab
- Two-panel layout (50/50 split on desktop)
- Left: Configuration form with collapsible sections
- Right: Results visualization with tabs (Chart / Metrics / Logs)

### Settings Page
- Tabbed interface (MT5 Config / Risk Parameters / ML Settings / API Keys)
- Each tab: single-column form layout, max-w-2xl centered

---

## Interaction Patterns

- Real-time data: Auto-refresh indicators (subtle pulse animation)
- Critical actions: Confirmation modals (Stop Trading, Delete Strategy)
- Forms: Inline validation with instant feedback
- Tables: Sortable columns, row hover highlight
- No excessive animations - focus on data clarity

---

## Accessibility

- Sufficient contrast ratios for all text
- Keyboard navigation for all interactive elements
- Screen reader labels for icon-only buttons
- Focus indicators on all form fields
- ARIA labels for dynamic content updates