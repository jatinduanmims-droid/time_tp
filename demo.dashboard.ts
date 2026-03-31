import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

// KPI cards in the control rows render from this shape.
// HOW TO EDIT KPI CARDS:
// - To rename a KPI label in the UI, change `label`
// - To change the number shown, change `value`
// - To change the helper text under the number, change `note`
// - To add one more KPI card, add another object to the `stats` array for that control
// - If clicked calendar days should change the KPI cards, edit `getDisplayStats()`
interface ControlStat {
  label: string;
  value: string;
  note: string;
}

// Each control shown on the right panel is driven from this local demo model.
// DATA SOURCE NOTE:
// - Data is currently mocked in this file itself; there is no API/service call yet.
// - To map a control from another `.ts` file, keep the control id here and then:
//   1. create a helper function that returns KPIs in plain object form
//   2. call that helper inside `getDisplayStats()`
//   3. call that helper inside `getDayStatus()` if pass/fail should depend on those KPIs
interface DashboardControl {
  id: string;
  name: string;
  statusLabel: string;
  statusColor: string;
  statusBg: string;
  stats: ControlStat[];
  calendarEntries: Array<{
    day: number;
    status: 'passed' | 'failed';
  }>;
}

interface DashboardCategory {
  key: 'favourite' | 'trade' | 'credit' | 'supply';
  name: string;
  accent: string;
  controls: DashboardControl[];
}

@Component({
  selector: 'app-demo-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './demo.dashboard.html',
  styleUrls: ['./demo.dashboard.scss']
})
export class DemoDashboardComponent {
  // Snapshot label shown in the header pill.
  readonly snapshotLabel = 'Snapshot: 30 Mar 2026';

  // T-1 summaries are calculated relative to this date.
  // Change this if you want the left-panel T-1 status counts to point to another snapshot day.
  private readonly snapshotDate = new Date(2026, 2, 30);

  // Calendar view for each child starts from this month.
  // Month index is zero-based: 2 = March.
  private readonly defaultCalendarMonth = new Date(2026, 2, 1);

  // DEMO DATA SOURCE:
  // All category / control / KPI data is currently mocked locally in this file.
  // HOW TO ADD A NEW CONTROL:
  // - Add a new object inside the correct category's `controls` array
  // - Give it a unique `id`
  // - Add default `stats` for the normal non-selected state
  // - If it needs a special KPI source, also update `getDisplayStats()` and `getDayStatus()`
  // HOW TO ADD KPI DATA FROM ANOTHER `.ts` FILE:
  // - Use Incoming Requests or Supply Chain below as the pattern to follow
  readonly categories: DashboardCategory[] = [
    {
      key: 'favourite',
      name: 'Favourite',
      accent: 'var(--favourite)',
      controls: []
    },
    {
      key: 'trade',
      name: 'Trade Control',
      accent: 'var(--trade)',
      controls: [
        {
          id: 'incoming-requests-management',
          name: 'Incoming Requests Management Control',
          statusLabel: 'Stable',
          statusColor: 'var(--success)',
          statusBg: 'rgba(32, 116, 80, 0.12)',
          stats: [
            { label: 'Pass Rate', value: '98%', note: '30 day average' },
            { label: 'Open Items', value: '12', note: 'Awaiting action' },
            { label: 'Fails', value: '2', note: 'This month' }
          ],
          calendarEntries: [
            { day: 3, status: 'passed' },
            { day: 5, status: 'failed' },
            { day: 10, status: 'passed' },
            { day: 15, status: 'failed' },
            { day: 22, status: 'passed' }
          ]
        },
        {
          id: 'evergreen-cancellations',
          name: 'Evergreen Cancellations Control',
          statusLabel: 'Watchlist',
          statusColor: 'var(--warn)',
          statusBg: 'rgba(197, 143, 25, 0.14)',
          stats: [
            { label: 'Cancelled', value: '7', note: 'This week' },
            { label: 'Exceptions', value: '2', note: 'Pending review' },
            { label: 'Recovery', value: '91%', note: 'Processed on time' }
          ],
          calendarEntries: [
            { day: 4, status: 'passed' },
            { day: 7, status: 'failed' },
            { day: 13, status: 'passed' },
            { day: 20, status: 'failed' },
            { day: 27, status: 'passed' }
          ]
        },
        {
          id: 'documents-checking-sblc',
          name: 'Documents Checking Deadline Follow up on SBLC',
          statusLabel: 'Needs Focus',
          statusColor: '#a93e3e',
          statusBg: 'rgba(217, 108, 108, 0.15)',
          stats: [
            { label: 'Due Soon', value: '14', note: 'Within 48 hours' },
            { label: 'Escalations', value: '4', note: 'Supervisor queue' },
            { label: 'Pass Rate', value: '84%', note: 'Below target' }
          ],
          calendarEntries: [
            { day: 2, status: 'passed' },
            { day: 11, status: 'failed' },
            { day: 17, status: 'passed' },
            { day: 23, status: 'failed' }
          ]
        },
        {
          id: 'documents-checking-lc',
          name: 'Documents Checking Deadline Follow up on L/C',
          statusLabel: 'Stable',
          statusColor: 'var(--success)',
          statusBg: 'rgba(32, 116, 80, 0.12)',
          stats: [
            { label: 'Checked', value: '26', note: 'Current batch' },
            { label: 'Open Cases', value: '9', note: 'Need follow-up' },
            { label: 'Failures', value: '1', note: 'Month to date' }
          ],
          calendarEntries: [
            { day: 6, status: 'passed' },
            { day: 12, status: 'passed' },
            { day: 18, status: 'failed' },
            { day: 26, status: 'passed' }
          ]
        }
      ]
    },
    {
      key: 'credit',
      name: 'Credit Control',
      accent: 'var(--credit)',
      controls: [
        {
          id: 'market-facility-validation',
          name: 'Market Facility Validation',
          statusLabel: 'Stable',
          statusColor: 'var(--success)',
          statusBg: 'rgba(32, 116, 80, 0.12)',
          stats: [
            { label: 'Validated', value: '45', note: 'Current cycle' },
            { label: 'Pending', value: '5', note: 'Need review' },
            { label: 'Failures', value: '1', note: 'Month to date' }
          ],
          calendarEntries: [
            { day: 1, status: 'passed' },
            { day: 9, status: 'failed' },
            { day: 18, status: 'passed' }
          ]
        },
        {
          id: 'renewed-deals-validation',
          name: 'Renewed Deals Validation',
          statusLabel: 'Watchlist',
          statusColor: 'var(--warn)',
          statusBg: 'rgba(197, 143, 25, 0.14)',
          stats: [
            { label: 'Renewals', value: '19', note: 'Current batch' },
            { label: 'Pending', value: '3', note: 'Need maker check' },
            { label: 'Failures', value: '2', note: 'Month to date' }
          ],
          calendarEntries: [
            { day: 6, status: 'failed' },
            { day: 12, status: 'passed' },
            { day: 21, status: 'failed' }
          ]
        },
        {
          id: 'legal-entity-validation',
          name: 'Legal Entity Validation',
          statusLabel: 'Needs Focus',
          statusColor: '#a93e3e',
          statusBg: 'rgba(217, 108, 108, 0.15)',
          stats: [
            { label: 'Matched', value: '101', note: 'Aligned records' },
            { label: 'Mismatch', value: '30', note: 'Require review' },
            { label: 'Empty', value: '11', note: 'Missing records' }
          ],
          calendarEntries: [
            { day: 4, status: 'failed' },
            { day: 16, status: 'failed' },
            { day: 19, status: 'passed' },
            { day: 24, status: 'failed' }
          ]
        }
      ]
    },
    {
      key: 'supply',
      name: 'Supply Chain Control',
      accent: 'var(--supply)',
      controls: [
        {
          id: 'supply-chain-financing',
          name: 'Supply Chain Financing',
          statusLabel: 'Stable',
          statusColor: 'var(--success)',
          statusBg: 'rgba(32, 116, 80, 0.12)',
          stats: [
            { label: 'Invoices', value: '214', note: 'Current month' },
            { label: 'Clients', value: '19', note: 'Active accounts' },
            { label: 'Failures', value: '2', note: 'Month to date' }
          ],
          calendarEntries: [
            { day: 8, status: 'failed' },
            { day: 14, status: 'passed' },
            { day: 28, status: 'failed' }
          ]
        }
      ]
    }
  ];

  selectedControlByCategory: Record<string, string> = Object.fromEntries(
    this.categories.map((category) => [category.key, category.controls[0]?.id ?? ''])
  );

  // LEFT PANEL / RIGHT PANEL STATE:
  // - `activeCategoryKey` decides which parent control is open on the right panel.
  // - `activeControlId` is used for row highlight / active child context.
  activeCategoryKey: DashboardCategory['key'] = 'trade';
  activeControlId = this.selectedControlByCategory['trade'];

  // Stores whether the active parent is filtered to show only T-1 passed/failed children.
  activeStatusFilterByCategory: Record<string, 'passed' | 'failed' | null> = {};

  // Saved favourites shown under the Favourite parent card.
  // If you want a different default favourite set, change the starting ids here.
  favoriteControlIds = new Set<string>(['incoming-requests-management']);

  // Stores the clicked calendar day per child so KPIs can drill into that selected date.
  selectedCalendarDayByControl: Record<string, number | null> = {};

  // Stores the visible month per child calendar.
  // This is what powers Previous / Next month navigation.
  viewedMonthByControl: Record<string, string> = Object.fromEntries(
    this.categories.flatMap((category) =>
      category.controls.map((control) => [control.id, this.getMonthKey(this.defaultCalendarMonth)])
    )
  );

  // Called when a user clicks a parent card.
  // This resets the T-1 filter for that parent and shows all of its children again.
  selectControl(categoryKey: DashboardCategory['key']): void {
    this.activeCategoryKey = categoryKey;
    this.activeStatusFilterByCategory[categoryKey] = null;
    this.activeControlId = this.getVisibleControls(this.getActiveCategory())[0]?.id ?? this.selectedControlByCategory[categoryKey];
  }

  // Called when user clicks T-1 Failed / T-1 Passed under a parent card.
  // It filters the right-side control list to only the matching controls for that parent.
  // HOW TO EDIT:
  // - To change what "yesterday" means, edit `getTMinusOneDate()`
  // - To stop syncing the calendar selection when the filter is clicked, edit this function
  filterCategoryByStatus(categoryKey: DashboardCategory['key'], status: 'passed' | 'failed'): void {
    this.activeCategoryKey = categoryKey;
    this.activeStatusFilterByCategory[categoryKey] = status;

    const snapshotMonthKey = this.getMonthKey(this.snapshotDate);
    const tMinusOneDay = this.getTMinusOneDate().getDate();
    const category = this.categories.find((item) => item.key === categoryKey) ?? this.categories[0];

    // Map the T-1 parent filter to each child calendar so the UI and KPI drill-down
    // both point to the same day/context the moment the filter is clicked.
    category.controls.forEach((control) => {
      this.viewedMonthByControl[control.id] = snapshotMonthKey;

      this.selectedCalendarDayByControl[control.id] =
        this.getTMinusOneStatus(control) === status ? tMinusOneDay : null;
    });

    const visibleControls = this.getVisibleControls(
      category
    );

    this.activeControlId = visibleControls[0]?.id ?? this.selectedControlByCategory[categoryKey];
  }

  handleControlChange(categoryKey: DashboardCategory['key']): void {
    this.activeCategoryKey = categoryKey;
    this.activeControlId = this.selectedControlByCategory[categoryKey];
  }

  // Toggles a control inside/outside the Favourite parent section.
  // This is the main function to update if favourite behavior changes later
  // (for example: persisting favourites to local storage or backend).
  toggleFavorite(controlId: string): void {
    if (this.favoriteControlIds.has(controlId)) {
      this.favoriteControlIds.delete(controlId);
    } else {
      this.favoriteControlIds.add(controlId);
    }

    if (this.activeCategoryKey === 'favourite' && !this.favoriteControlIds.has(controlId)) {
      this.activeControlId = this.getVisibleControls(this.getActiveCategory())[0]?.id ?? '';
    }
  }

  isFavorite(controlId: string): boolean {
    return this.favoriteControlIds.has(controlId);
  }

  // Returns the selected child for a parent card.
  // Kept as a safe helper so UI has a predictable fallback.
  getSelectedControl(category: DashboardCategory): DashboardControl | undefined {
    return category.controls.find(
      (control) => control.id === this.selectedControlByCategory[category.key]
    ) ?? category.controls[0];
  }

  getActiveCategory(): DashboardCategory {
    return this.categories.find((category) => category.key === this.activeCategoryKey) ?? this.categories[0];
  }

  getAllControls(): DashboardControl[] {
    return this.categories
      .filter((category) => category.key !== 'favourite')
      .flatMap((category) => category.controls);
  }

  // Main filter used by the right panel list.
  // If no T-1 filter is active, all controls of the selected parent are shown.
  // HOW TO EDIT:
  // - To change Favourite behavior, edit the `category.key === 'favourite'` block
  // - To change filter logic, edit the final `return` statement in this function
  getVisibleControls(category: DashboardCategory): DashboardControl[] {
    // Favourite is a virtual parent.
    // It does not own its own dataset; it reuses controls saved from the real categories.
    if (category.key === 'favourite') {
      return this.getAllControls().filter((control) => this.favoriteControlIds.has(control.id));
    }

    const statusFilter = this.activeStatusFilterByCategory[category.key];

    if (!statusFilter) {
      return category.controls;
    }

    return category.controls.filter((control) => this.getTMinusOneStatus(control) === statusFilter);
  }

  getActiveFilterLabel(): string {
    // This label is what shows in the right-side header pill above the controls list.
    // If you want to rename UI text like "Saved favourites" or "All children", change it here.
    if (this.activeCategoryKey === 'favourite') {
      return 'Saved favourites';
    }

    const statusFilter = this.activeStatusFilterByCategory[this.activeCategoryKey];

    if (!statusFilter) {
      return 'All children';
    }

    return statusFilter === 'failed' ? 'T-1 Failed children' : 'T-1 Passed children';
  }

  getActiveControl(): DashboardControl {
    const activeCategory = this.getActiveCategory();

    return activeCategory.controls.find(
      (control) => control.id === this.activeControlId
    ) ?? activeCategory.controls[0];
  }

  getActiveCategoryAccent(): string {
    return this.getActiveCategory().accent;
  }

  // Legacy helper kept for spec compatibility.
  // The current layout no longer renders chart bars.
  getMaxChartValue(points?: Array<{ value: number }>): number {
    if (!points?.length) {
      return 1;
    }

    return Math.max(...points.map((point) => point.value), 1);
  }

  // Called when a user clicks any day in the calendar.
  // Clicking the same day again clears the selection and restores default KPIs.
  selectCalendarDay(controlId: string, day: number): void {
    this.selectedCalendarDayByControl[controlId] =
      this.selectedCalendarDayByControl[controlId] === day ? null : day;
  }

  // Double-clicking a calendar day resets the child back to the snapshot/current date context.
  // It also brings the visible calendar month back to the snapshot month if needed.
  resetCalendarToCurrentDate(controlId: string): void {
    // "Current date" in this demo means `snapshotDate`, not the machine's live today date.
    // Update this if you later want the calendar reset to use real current date instead.
    this.viewedMonthByControl[controlId] = this.getMonthKey(this.snapshotDate);
    this.selectedCalendarDayByControl[controlId] = this.snapshotDate.getDate();
  }

  // Moves the child calendar backward/forward by month.
  // This supports previous months and previous years automatically.
  shiftCalendarMonth(controlId: string, delta: number): void {
    const viewedMonth = this.getViewedMonth(controlId);
    viewedMonth.setMonth(viewedMonth.getMonth() + delta);
    viewedMonth.setDate(1);

    this.viewedMonthByControl[controlId] = this.getMonthKey(viewedMonth);
    this.selectedCalendarDayByControl[controlId] = null;
  }

  // Visible month label shown between Previous / Next buttons.
  getMonthLabel(controlId: string): string {
    return this.getViewedMonth(controlId).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  }

  // KPI DRILL-DOWN:
  // - If no calendar day is selected, show the default control KPI cards from `control.stats`
  // - If a day is selected, replace those cards with day-specific summary information
  // HOW TO ADD KPI MAPPING FROM ANOTHER `.ts` FILE:
  // - Add a new `if (control.id === 'your-control-id') { ... }` block in this function
  // - Inside that block, call a helper function that returns the KPI fields you need
  // - Return an array of `ControlStat` objects for the cards you want to show
  // CURRENT EXAMPLES:
  // - `incoming-requests-management` maps from Jatin_dashboard-style KPI fields
  // - `supply-chain-financing` maps from invoice-loan.ts style KPI fields
  getDisplayStats(control: DashboardControl): ControlStat[] {
    const selectedDay = this.selectedCalendarDayByControl[control.id];

    if (!selectedDay) {
      return control.stats;
    }

    const viewedMonth = this.getViewedMonth(control.id);

    if (control.id === 'incoming-requests-management') {
      // ORIGINAL-FILE MAPPING:
      // Incoming Requests Management Control is mapped to Jatin_dashboard-style KPI fields.
      // HOW TO EDIT:
      // - To change source values, edit `getIncomingRequestsJatinKpis()`
      // - To change which KPI cards appear for failed/passed days, edit the returned arrays here
      const jatinKpis = this.getIncomingRequestsJatinKpis(
        viewedMonth.getFullYear(),
        viewedMonth.getMonth(),
        selectedDay
      );
      const selectedDateLabel = `${selectedDay} ${viewedMonth.toLocaleDateString('en-US', { month: 'short' })} ${viewedMonth.getFullYear()}`;

      if (jatinKpis.slaPercentage < 100) {
        return [
          { label: 'Selected Day', value: selectedDateLabel, note: 'Mapped from jatin-dashboard' },
          { label: 'SLA Failed Count', value: `${jatinKpis.slaBreach}`, note: 'Derived from slaBreach' },
          { label: 'SLA Pass Count', value: `${jatinKpis.slaMet}`, note: 'Derived from slaMet' },
          { label: 'SLA Health', value: `${jatinKpis.slaPercentage}%`, note: 'Below 100%, treated as failed' }
        ];
      }

      return [
        { label: 'Selected Day', value: selectedDateLabel, note: 'Mapped from jatin-dashboard' },
        { label: 'SLA Pass Count', value: `${jatinKpis.slaMet}`, note: 'Derived from slaMet' },
        { label: 'SLA Health', value: `${jatinKpis.slaPercentage}%`, note: 'Healthy day' },
        { label: 'Urgent Requests', value: `${jatinKpis.urgentToday}`, note: 'Mapped from urgentToday' }
      ];
    }

    if (control.id === 'supply-chain-financing') {
      // ORIGINAL-FILE MAPPING:
      // Supply Chain Financing is mapped to invoice-loan.ts style KPI fields.
      // HOW TO EDIT:
      // - To change source values, edit `getSupplyChainInvoiceLoanKpis()`
      // - To change which KPI cards show for failed/passed days, edit this block
      const invoiceLoanKpis = this.getSupplyChainInvoiceLoanKpis(
        viewedMonth.getFullYear(),
        viewedMonth.getMonth(),
        selectedDay
      );
      const selectedDateLabel = `${selectedDay} ${viewedMonth.toLocaleDateString('en-US', { month: 'short' })} ${viewedMonth.getFullYear()}`;

      if (invoiceLoanKpis.reconPercentage < 100) {
        return [
          { label: 'Selected Day', value: selectedDateLabel, note: 'Mapped from invoice-loan.ts' },
          { label: 'Recon Failed', value: `${invoiceLoanKpis.reconFailed}`, note: 'Mapped from reconFailed' },
          { label: 'Recon Passed', value: `${invoiceLoanKpis.reconPassed}`, note: 'Mapped from reconPassed' },
          { label: 'Recon %', value: `${invoiceLoanKpis.reconPercentage}%`, note: 'Below 100%, treated as failed' }
        ];
      }

      return [
        { label: 'Selected Day', value: selectedDateLabel, note: 'Mapped from invoice-loan.ts' },
        { label: 'Total Invoices', value: `${invoiceLoanKpis.totalInvoices}`, note: 'Mapped from totalInvoices' },
        { label: 'Total Clients', value: `${invoiceLoanKpis.totalClients}`, note: 'Mapped from totalClients' },
        { label: 'Recon %', value: `${invoiceLoanKpis.reconPercentage}%`, note: 'Mapped from reconPercentage' }
      ];
    }

    const status = this.getDayStatus(control, viewedMonth.getFullYear(), viewedMonth.getMonth(), selectedDay);
    const outcome = status === 'failed' ? 'Failed' : 'Passed';
    const outcomeDetail = status === 'failed' ? 'Requires review' : 'Processed successfully';
    const impactValue = status === 'failed' ? `${(selectedDay % 3) + 1} cases` : `${(selectedDay % 4) + 2} items`;
    const impactNote = status === 'failed' ? 'Flagged on selected day' : 'Cleared on selected day';
    const shortMonth = viewedMonth.toLocaleDateString('en-US', { month: 'short' });
    const year = viewedMonth.getFullYear();

    return [
      { label: 'Selected Day', value: `${selectedDay} ${shortMonth} ${year}`, note: 'Calendar drill-down' },
      { label: 'Status', value: outcome, note: outcomeDetail },
      { label: 'Impact', value: impactValue, note: impactNote }
    ];
  }

  // Builds the full visible month grid.
  // Every day is intentionally given a Passed/Failed status in the current demo,
  // so the calendar does not show plain neutral dates inside the active month.
  // HOW TO EDIT:
  // - To make more days neutral, edit `getDayStatus()` and/or `isFutureDate()`
  // - To change which day gets selected in the UI, edit `selectedCalendarDayByControl`
  getCalendarDays(control: DashboardControl): Array<{
    label: string;
    muted: boolean;
    fail: boolean;
    passed: boolean;
    today: boolean;
    clickable: boolean;
    future: boolean;
    selected: boolean;
    dayNumber: number | null;
  }> {
    const viewedMonth = this.getViewedMonth(control.id);
    const totalDays = new Date(viewedMonth.getFullYear(), viewedMonth.getMonth() + 1, 0).getDate();
    const startOffset = (new Date(viewedMonth.getFullYear(), viewedMonth.getMonth(), 1).getDay() + 6) % 7;
    const selectedDay = this.selectedCalendarDayByControl[control.id];
    const cells = Array.from({ length: startOffset }, () => ({
      label: '',
      muted: true,
      fail: false,
      passed: false,
      today: false,
      clickable: false,
      future: false,
      selected: false,
      dayNumber: null
    }));

    for (let day = 1; day <= totalDays; day += 1) {
      const future = this.isFutureDate(viewedMonth, day);
      const status = future
        ? null
        : this.getDayStatus(control, viewedMonth.getFullYear(), viewedMonth.getMonth(), day);

      cells.push({
        label: String(day),
        muted: false,
        fail: status === 'failed',
        passed: status === 'passed',
        today: this.isToday(viewedMonth, day),
        clickable: !future,
        future,
        selected: selectedDay === day,
        dayNumber: day
      });
    }

    return cells;
  }

  // Summary badges at the top of the calendar use this count for the currently viewed month.
  // HOW TO EDIT:
  // - To show all-time counts instead of visible-month counts, change this function
  // - To show selected-range counts, apply a different date filter here
  getStatusCount(control: DashboardControl, status: 'passed' | 'failed'): number {
    const viewedMonth = this.getViewedMonth(control.id);
    const totalDays = new Date(viewedMonth.getFullYear(), viewedMonth.getMonth() + 1, 0).getDate();
    let count = 0;

    for (let day = 1; day <= totalDays; day += 1) {
      if (this.isFutureDate(viewedMonth, day)) {
        continue;
      }

      if (this.getDayStatus(control, viewedMonth.getFullYear(), viewedMonth.getMonth(), day) === status) {
        count += 1;
      }
    }

    return count;
  }

  // T-1 summary shown under each parent card uses this count.
  getTMinusOneCount(category: DashboardCategory, status: 'passed' | 'failed'): number {
    if (category.key === 'favourite') {
      return this.getVisibleControls(category).length;
    }

    return category.controls.filter((control) => this.getTMinusOneStatus(control) === status).length;
  }

  // Reads the month currently being shown for one specific child calendar.
  private getViewedMonth(controlId: string): Date {
    const monthKey = this.viewedMonthByControl[controlId] ?? this.getMonthKey(this.defaultCalendarMonth);
    const [year, month] = monthKey.split('-').map(Number);

    return new Date(year, month - 1, 1);
  }

  // Stores month navigation state in a compact YYYY-MM format.
  private getMonthKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  // DEMO STATUS GENERATOR:
  // For now, pass/fail per day is generated deterministically from the control id + date.
  // This makes month navigation work across older/newer months without requiring backend data yet.
  // HOW TO ADD PASS/FAIL LOGIC FROM ANOTHER `.ts` FILE:
  // - Add a new `if (control.id === 'your-control-id')` block near the top
  // - Call a helper function that returns the KPI values you need
  // - Return `'passed'` or `'failed'` based on your business rule
  // Replace this function with real historical status data when API data is available.
  private getDayStatus(control: DashboardControl, year: number, monthIndex: number, day: number): 'passed' | 'failed' {
    if (control.id === 'incoming-requests-management') {
      // Jatin-dashboard mapping rule:
      // Anything below 100% SLA Health is treated as failed.
      // To change that business rule later, edit the return condition below.
      const jatinKpis = this.getIncomingRequestsJatinKpis(year, monthIndex, day);
      return jatinKpis.slaPercentage === 100 ? 'passed' : 'failed';
    }

    if (control.id === 'supply-chain-financing') {
      // Invoice-loan mapping rule:
      // Anything below 100% Recon % is treated as failed.
      // To change that business rule later, edit the return condition below.
      const invoiceLoanKpis = this.getSupplyChainInvoiceLoanKpis(year, monthIndex, day);
      return invoiceLoanKpis.reconPercentage === 100 ? 'passed' : 'failed';
    }

    const threshold = control.statusLabel === 'Needs Focus'
      ? 34
      : control.statusLabel === 'Watchlist'
        ? 24
        : 14;
    const seed = this.hashValue(`${control.id}-${year}-${monthIndex + 1}-${day}`);

    return seed % 100 < threshold ? 'failed' : 'passed';
  }

  // T-1 badges under each parent card are derived from the day before `snapshotDate`.
  private getTMinusOneStatus(control: DashboardControl): 'passed' | 'failed' {
    const tMinusOne = this.getTMinusOneDate();

    return this.getDayStatus(control, tMinusOne.getFullYear(), tMinusOne.getMonth(), tMinusOne.getDate());
  }

  private getTMinusOneDate(): Date {
    const tMinusOne = new Date(this.snapshotDate);
    tMinusOne.setDate(this.snapshotDate.getDate() - 1);

    return tMinusOne;
  }

  // Highlights "today" in the demo calendar.
  // Right now this is fixed to the snapshot month for demo purposes.
  private isToday(viewedMonth: Date, day: number): boolean {
    return viewedMonth.getFullYear() === this.snapshotDate.getFullYear()
      && viewedMonth.getMonth() === this.snapshotDate.getMonth()
      && day === this.snapshotDate.getDate();
  }

  // Future dates should stay neutral/unavailable because the day has not happened yet.
  private isFutureDate(viewedMonth: Date, day: number): boolean {
    const candidate = new Date(viewedMonth.getFullYear(), viewedMonth.getMonth(), day);

    return candidate.getTime() > this.snapshotDate.getTime();
  }

  // Small deterministic hash used by `getDayStatus()` to make demo month data repeatable.
  private hashValue(input: string): number {
    return Array.from(input).reduce((total, char, index) => total + char.charCodeAt(0) * (index + 1), 0);
  }

  // Preview/original demo mapping for the control linked to Jatin_dashboard KPIs.
  // The rule is:
  // - SLA Health (`slaPercentage`) = 100 -> passed
  // - SLA Health (`slaPercentage`) < 100 -> failed
  // HOW TO REUSE THIS PATTERN:
  // - Create a helper like this for your other `.ts` file
  // - Return KPI values in plain object form
  // - Reuse that helper in both `getDisplayStats()` and `getDayStatus()`
  private getIncomingRequestsJatinKpis(year: number, monthIndex: number, day: number): {
    totalToday: number;
    urgentToday: number;
    slaPercentage: number;
    slaMet: number;
    slaBreach: number;
  } {
    // This is demo seed data for the original dashboard.
    // Replace these values with real Jatin_dashboard service data when API integration is ready.
    // To manually change a specific day's KPI result, edit/add a date in `presetByDate` below.
    const presetByDate: Record<string, { totalToday: number; urgentToday: number; slaPercentage: number }> = {
      '2026-03-26': { totalToday: 22, urgentToday: 2, slaPercentage: 100 },
      '2026-03-27': { totalToday: 18, urgentToday: 1, slaPercentage: 100 },
      '2026-03-28': { totalToday: 26, urgentToday: 4, slaPercentage: 96 },
      '2026-03-29': { totalToday: 31, urgentToday: 5, slaPercentage: 92 },
      '2026-03-30': { totalToday: 24, urgentToday: 3, slaPercentage: 100 }
    };
    const dateKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const baseKpis = presetByDate[dateKey] ?? (() => {
      const seed = this.hashValue(`incoming-requests-management-${dateKey}`);
      const totalToday = 18 + (seed % 14);
      const urgentToday = 1 + (seed % 5);
      const slaPercentage = seed % 6 === 0 ? 96 : 100;

      return { totalToday, urgentToday, slaPercentage };
    })();
    const slaMet = Math.round((baseKpis.totalToday * baseKpis.slaPercentage) / 100);
    const slaBreach = Math.max(baseKpis.totalToday - slaMet, 0);

    return {
      ...baseKpis,
      slaMet,
      slaBreach
    };
  }

  // Demo/original mapping for Supply Chain Financing based on invoice-loan.ts analytics.
  // The rule is:
  // - Recon % (`reconPercentage`) = 100 -> passed
  // - Recon % (`reconPercentage`) < 100 -> failed
  // HOW TO EDIT:
  // - To add/remove KPI fields from this source, update the return type and returned object
  // - To manually change a specific day's KPI result, edit/add a date in `presetByDate`
  private getSupplyChainInvoiceLoanKpis(year: number, monthIndex: number, day: number): {
    totalInvoices: number;
    totalClients: number;
    reconPassed: number;
    reconFailed: number;
    reconPercentage: number;
  } {
    // This is demo seed data for the original dashboard.
    // Replace these values with real invoice-loan analytics when API/service integration is ready.
    const presetByDate: Record<string, {
      totalInvoices: number;
      totalClients: number;
      reconPassed: number;
      reconFailed: number;
      reconPercentage: number;
    }> = {
      '2026-03-26': { totalInvoices: 205, totalClients: 18, reconPassed: 188, reconFailed: 17, reconPercentage: 92 },
      '2026-03-27': { totalInvoices: 208, totalClients: 18, reconPassed: 191, reconFailed: 17, reconPercentage: 92 },
      '2026-03-28': { totalInvoices: 214, totalClients: 19, reconPassed: 195, reconFailed: 19, reconPercentage: 91 },
      '2026-03-29': { totalInvoices: 216, totalClients: 19, reconPassed: 197, reconFailed: 19, reconPercentage: 91 },
      '2026-03-30': { totalInvoices: 220, totalClients: 20, reconPassed: 220, reconFailed: 0, reconPercentage: 100 }
    };
    const dateKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    if (presetByDate[dateKey]) {
      return presetByDate[dateKey];
    }

    const seed = this.hashValue(`supply-chain-financing-${dateKey}`);
    const totalInvoices = 180 + (seed % 45);
    const totalClients = 14 + (seed % 8);
    const reconPercentage = seed % 5 === 0 ? 88 : 100;
    const reconPassed = Math.round((totalInvoices * reconPercentage) / 100);
    const reconFailed = Math.max(totalInvoices - reconPassed, 0);

    return {
      totalInvoices,
      totalClients,
      reconPassed,
      reconFailed,
      reconPercentage
    };
  }
}
