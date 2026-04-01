import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CreditControls, InvoiceLoan as InvoiceLoanRecord, MCAAtlas2Report } from '../../services/credit-controls';

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
export class DemoDashboardComponent implements OnInit {
  // Snapshot label shown in the header pill.
  // LIVE DATE NOTE:
  // - This now follows the machine/system date automatically, so you do not need to update it manually every day.
  // - If you ever want to force a fixed business date instead, edit `getCurrentBusinessDate()`.
  get snapshotLabel(): string {
    return `Snapshot: ${this.formatDateLabel(this.getCurrentBusinessDate())}`;
  }

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

  // Search/filter state for the right-panel controls list.
  // HOW TO EDIT CONTROL SEARCH:
  // - The typed text in the search box lives in `controlSearchQueryByCategory`
  // - The selected multi-select chips live in `selectedControlIdsByCategory`
  // - To change suggestion matching (for example: startsWith instead of contains),
  //   edit `getControlSuggestions()`
  // - To change what happens after a suggestion is picked, edit `addControlSelection()`
  controlSearchQueryByCategory: Record<string, string> = {};
  selectedControlIdsByCategory: Record<string, string[]> = {};

  // Stores the clicked calendar day per child so KPIs can drill into that selected date.
  selectedCalendarDayByControl: Record<string, number | null> = {};

  // LIVE SUPPLY CHAIN DATA SOURCE:
  // - This map is filled from the same `CreditControls.getInvoiceLoanReport()` call used by `invoice-loan.ts`
  // - Key format is `yyyy-MM-dd`
  // - If you later need another control to use live daily data, copy this pattern:
  //   1. fetch the source once in `ngOnInit()`
  //   2. aggregate it into a date-keyed map
  //   3. read that map from `getDisplayStats()`, `getDayStatus()`, and `hasCalendarData()`
  supplyChainDailyKpisByDate = new Map<string, {
    totalInvoices: number;
    totalClients: number;
    reconPassed: number;
    reconFailed: number;
    reconPercentage: number;
  }>();

  // LIVE MCA RECON KPI SOURCE:
  // - These values come from the same `CreditControls.getMCAAtlas2Report()` source used by `mca-atlas2-recon.ts`
  // - They are current snapshot KPIs, not historical daily buckets
  // - If MCA later exposes a real report date/history field, this can be upgraded to a date-keyed map like Supply Chain
  mcaReconSnapshot = {
    matchCount: 0,
    differentCount: 0,
    emptyInA2Count: 0,
    bothEmptyCount: 0,
    totalRows: 0,
    mismatchShare: 0
  };

  // Stores the visible month per child calendar.
  // This is what powers Previous / Next month navigation.
  viewedMonthByControl: Record<string, string> = Object.fromEntries(
    this.categories.flatMap((category) =>
      category.controls.map((control) => [control.id, this.getMonthKey(this.getCurrentBusinessDate())])
    )
  );

  constructor(private credit: CreditControls) {
    this.controlSearchQueryByCategory = Object.fromEntries(
      this.categories.map((category) => [category.key, ''])
    );

    this.selectedControlIdsByCategory = Object.fromEntries(
      this.categories.map((category) => [category.key, []])
    );
  }

  // Original dashboard startup hook.
  // We now load the live invoice-loan report here so Supply Chain Financing can show real KPI values.
  ngOnInit(): void {
    this.fetchSupplyChainInvoiceLoanData();
    this.fetchMcaReconData();
  }

  // Called when a user clicks a parent card.
  // This resets the T-1 filter for that parent and shows all of its children again.
  selectControl(categoryKey: DashboardCategory['key']): void {
    this.activeCategoryKey = categoryKey;
    this.activeStatusFilterByCategory[categoryKey] = null;
    this.controlSearchQueryByCategory[categoryKey] = '';
    this.selectedControlIdsByCategory[categoryKey] = [];
    this.syncActiveControl(categoryKey);
  }

  // Called when user clicks T-1 Failed / T-1 Passed under a parent card.
  // It filters the right-side control list to only the matching controls for that parent.
  // HOW TO EDIT:
  // - To change what "yesterday" means, edit `getTMinusOneDate()`
  // - To stop syncing the calendar selection when the filter is clicked, edit this function
  filterCategoryByStatus(categoryKey: DashboardCategory['key'], status: 'passed' | 'failed'): void {
    this.activeCategoryKey = categoryKey;
    this.activeStatusFilterByCategory[categoryKey] = status;
    this.controlSearchQueryByCategory[categoryKey] = '';

    const snapshotMonthKey = this.getMonthKey(this.getCurrentBusinessDate());
    const tMinusOneDay = this.getTMinusOneDate().getDate();
    const category = this.categories.find((item) => item.key === categoryKey) ?? this.categories[0];

    // Map the T-1 parent filter to each child calendar so the UI and KPI drill-down
    // both point to the same day/context the moment the filter is clicked.
    category.controls.forEach((control) => {
      this.viewedMonthByControl[control.id] = snapshotMonthKey;

      this.selectedCalendarDayByControl[control.id] =
        this.getTMinusOneStatus(control) === status ? tMinusOneDay : null;
    });

    this.syncActiveControl(categoryKey);
  }

  handleControlChange(categoryKey: DashboardCategory['key']): void {
    this.activeCategoryKey = categoryKey;
    this.activeControlId = this.selectedControlByCategory[categoryKey];
  }

  // Search box typing handler for the controls list.
  // If you want the input to auto-select on exact match or clear suggestions on blur,
  // this is a good place to extend the behavior.
  updateControlSearch(categoryKey: DashboardCategory['key'], value: string): void {
    this.controlSearchQueryByCategory[categoryKey] = value;
  }

  // Suggestion picker for the multi-select control search.
  // This turns a suggestion into a removable chip and narrows the right panel to only those controls.
  addControlSelection(categoryKey: DashboardCategory['key'], controlId: string): void {
    const selectedIds = this.selectedControlIdsByCategory[categoryKey] ?? [];

    if (!selectedIds.includes(controlId)) {
      this.selectedControlIdsByCategory[categoryKey] = [...selectedIds, controlId];
    }

    this.controlSearchQueryByCategory[categoryKey] = '';
    this.activeCategoryKey = categoryKey;
    this.syncActiveControl(categoryKey);
  }

  // Removes one selected-control chip from the multi-select search.
  // Delete/edit this function if you later want chip removal to only affect UI, not filtering.
  removeControlSelection(categoryKey: DashboardCategory['key'], controlId: string): void {
    this.selectedControlIdsByCategory[categoryKey] = (this.selectedControlIdsByCategory[categoryKey] ?? []).filter(
      (selectedId) => selectedId !== controlId
    );

    this.syncActiveControl(categoryKey);
  }

  // Resets the right-panel search back to "all controls" for the active parent.
  // This clears both the selected chips and any partially typed query.
  clearControlSelections(categoryKey: DashboardCategory['key']): void {
    this.selectedControlIdsByCategory[categoryKey] = [];
    this.controlSearchQueryByCategory[categoryKey] = '';
    this.syncActiveControl(categoryKey);
  }

  // Returns the selected control-chip objects for the active parent.
  // The HTML uses this to render chip labels plus the remove "x" action.
  getSelectedControls(category: DashboardCategory): DashboardControl[] {
    const selectedIds = this.selectedControlIdsByCategory[category.key] ?? [];
    const sourceControls = this.getSearchSourceControls(category);

    return selectedIds
      .map((selectedId) => sourceControls.find((control) => control.id === selectedId))
      .filter((control): control is DashboardControl => !!control);
  }

  // Suggestion list shown under the search box while the user types.
  // MATCHING RULE:
  // - Right now this matches any control name containing the typed text
  // - To make it stricter/looser, edit the `includes()` check below
  // - Suggestions exclude already-selected controls so the same chip is not added twice
  getControlSuggestions(category: DashboardCategory): DashboardControl[] {
    const query = (this.controlSearchQueryByCategory[category.key] ?? '').trim().toLowerCase();

    if (!query) {
      return [];
    }

    const selectedIds = new Set(this.selectedControlIdsByCategory[category.key] ?? []);

    return this.getSearchSourceControls(category).filter((control) =>
      !selectedIds.has(control.id) && control.name.toLowerCase().includes(query)
    );
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
      // Favourite is a virtual category, so if a saved control is removed here
      // also remove it from the selected search chips for Favourite.
      this.selectedControlIdsByCategory['favourite'] = (this.selectedControlIdsByCategory['favourite'] ?? []).filter(
        (selectedId) => selectedId !== controlId
      );
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
    const controlsForCategory = this.getSearchSourceControls(category);
    const selectedIds = this.selectedControlIdsByCategory[category.key] ?? [];

    if (!selectedIds.length) {
      return controlsForCategory;
    }

    return controlsForCategory.filter((control) => selectedIds.includes(control.id));
  }

  getActiveFilterLabel(): string {
    // This label is what shows in the right-side header pill above the controls list.
    // If you want to rename UI text like "Saved favourites" or "All controls", change it here.
    if (this.activeCategoryKey === 'favourite') {
      return 'Saved favourites';
    }

    const statusFilter = this.activeStatusFilterByCategory[this.activeCategoryKey];

    if (!statusFilter) {
      return 'All controls';
    }

    return statusFilter === 'failed' ? 'Failed Yesterday controls' : 'Passed Yesterday controls';
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

  hasSelectedControls(category: DashboardCategory): boolean {
    return (this.selectedControlIdsByCategory[category.key] ?? []).length > 0;
  }

  // Count pill helper for the left-side parent cards.
  // This intentionally ignores the selected search chips so the parent counts stay stable.
  // If you want the count pill to reflect the temporary search selection instead, switch this to `getVisibleControls(category).length`.
  getCategoryControlCount(category: DashboardCategory): number {
    return this.getSearchSourceControls(category).length;
  }

  // Controls whether the "Show All" button is visible in the right-panel header.
  // HOW TO EDIT:
  // - If you want Show All only for the search chips, remove the T-1 condition here.
  // - If you want Show All hidden for Favourite too, add `category.key !== 'favourite'` here.
  shouldShowResetControls(category: DashboardCategory): boolean {
    return !!this.activeStatusFilterByCategory[category.key] || this.hasSelectedControls(category);
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

  // Double-clicking a calendar day resets the child back to the current business date context.
  // It also brings the visible calendar month back to the current business month if needed.
  resetCalendarToCurrentDate(controlId: string): void {
    // LIVE DATE RESET:
    // - This uses the real system date returned by `getCurrentBusinessDate()`.
    // - If you want the reset button/double-click to go to a fixed reporting date instead,
    //   change `getCurrentBusinessDate()` in one place rather than editing this function again.
    const currentBusinessDate = this.getCurrentBusinessDate();

    this.viewedMonthByControl[controlId] = this.getMonthKey(currentBusinessDate);
    this.selectedCalendarDayByControl[controlId] = currentBusinessDate.getDate();
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

  // Visible month label shown in the calendar header.
  getMonthLabel(controlId: string): string {
    return this.getViewedMonth(controlId).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  }

  // Month dropdown options used by the calendar header.
  // To change display language or month labels, edit the array returned here.
  getMonthOptions(): Array<{ value: number; label: string }> {
    return [
      { value: 0, label: 'January' },
      { value: 1, label: 'February' },
      { value: 2, label: 'March' },
      { value: 3, label: 'April' },
      { value: 4, label: 'May' },
      { value: 5, label: 'June' },
      { value: 6, label: 'July' },
      { value: 7, label: 'August' },
      { value: 8, label: 'September' },
      { value: 9, label: 'October' },
      { value: 10, label: 'November' },
      { value: 11, label: 'December' }
    ];
  }

  // Year dropdown options used by the calendar header.
  // To show a wider/narrower range of years, change the `- 3` / `+ 3` range here.
  getYearOptions(): number[] {
    const currentYear = this.getCurrentBusinessDate().getFullYear();

    return Array.from({ length: 7 }, (_, index) => currentYear - 3 + index);
  }

  // Reads the month number currently being shown for one control calendar.
  // Used by the month dropdown so the correct option stays selected.
  getViewedMonthIndex(controlId: string): number {
    return this.getViewedMonth(controlId).getMonth();
  }

  // Reads the year currently being shown for one control calendar.
  // Used by the year dropdown so the correct option stays selected.
  getViewedYear(controlId: string): number {
    return this.getViewedMonth(controlId).getFullYear();
  }

  // Calendar month dropdown handler.
  // If you later replace the dropdown with another UI, this is the function to swap out.
  setCalendarMonth(controlId: string, monthIndex: number): void {
    const viewedMonth = this.getViewedMonth(controlId);
    viewedMonth.setMonth(monthIndex);
    viewedMonth.setDate(1);

    this.viewedMonthByControl[controlId] = this.getMonthKey(viewedMonth);
    this.selectedCalendarDayByControl[controlId] = null;
  }

  // Calendar year dropdown handler.
  // This keeps the same month selected and only changes the year.
  setCalendarYear(controlId: string, year: number): void {
    const viewedMonth = this.getViewedMonth(controlId);
    viewedMonth.setFullYear(year);
    viewedMonth.setDate(1);

    this.viewedMonthByControl[controlId] = this.getMonthKey(viewedMonth);
    this.selectedCalendarDayByControl[controlId] = null;
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

    if (control.id === 'legal-entity-validation') {
      // ORIGINAL-FILE MCA MAPPING:
      // Legal Entity Validation is mapped to the live MCA Atlas-2 recon snapshot.
      // HOW TO EDIT:
      // - To change the live source fields, edit `fetchMcaReconData()` and `buildMcaReconSnapshot()`
      // - To change which KPI cards show on calendar click, edit the returned arrays here
      // NOTE:
      // - The MCA source currently gives us a current snapshot rather than daily history,
      //   so a clicked day still shows the same live snapshot KPIs until date-level history is available.
      const selectedDateLabel = `${selectedDay} ${viewedMonth.toLocaleDateString('en-US', { month: 'short' })} ${viewedMonth.getFullYear()}`;
      const isFailed = this.getDayStatus(control, viewedMonth.getFullYear(), viewedMonth.getMonth(), selectedDay) === 'failed';

      if (isFailed) {
        return [
          { label: 'Selected Day', value: selectedDateLabel, note: 'Using live MCA recon snapshot' },
          { label: 'Different', value: `${this.mcaReconSnapshot.differentCount}`, note: 'Mapped from DIFFERENT' },
          { label: 'Empty In A2', value: `${this.mcaReconSnapshot.emptyInA2Count}`, note: 'Mapped from EMPTY IN A2' },
          { label: 'Mismatch Share', value: `${this.mcaReconSnapshot.mismatchShare}%`, note: 'Derived from mismatch rows' }
        ];
      }

      return [
        { label: 'Selected Day', value: selectedDateLabel, note: 'Using live MCA recon snapshot' },
        { label: 'Match', value: `${this.mcaReconSnapshot.matchCount}`, note: 'Mapped from MATCH' },
        { label: 'Both Empty', value: `${this.mcaReconSnapshot.bothEmptyCount}`, note: 'Mapped from BOTH EMPTY' },
        { label: 'Loaded Rows', value: `${this.mcaReconSnapshot.totalRows}`, note: 'Current MCA recon rows' }
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
    hasData: boolean;
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
      hasData: false,
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
      const hasData = future
        ? false
        : this.hasCalendarData(control, viewedMonth.getFullYear(), viewedMonth.getMonth(), day);

      cells.push({
        label: String(day),
        muted: false,
        fail: status === 'failed',
        passed: status === 'passed',
        hasData,
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
    const monthKey = this.viewedMonthByControl[controlId] ?? this.getMonthKey(this.getCurrentBusinessDate());
    const [year, month] = monthKey.split('-').map(Number);

    return new Date(year, month - 1, 1);
  }

  // Stores month navigation state in a compact YYYY-MM format.
  private getMonthKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  // Base controls used by both the visible list and the search suggestions.
  // This keeps the search aligned with the current parent + T-1 failed/passed context.
  // If you later want suggestions to ignore the failed/passed filter, edit this helper instead of `getVisibleControls()`.
  private getSearchSourceControls(category: DashboardCategory): DashboardControl[] {
    if (category.key === 'favourite') {
      return this.getAllControls().filter((control) => this.favoriteControlIds.has(control.id));
    }

    const statusFilter = this.activeStatusFilterByCategory[category.key];

    if (!statusFilter) {
      return category.controls;
    }

    return category.controls.filter((control) => this.getTMinusOneStatus(control) === statusFilter);
  }

  // Keeps the right panel anchored to a valid visible control after filters/search chips change.
  // If the current active control disappears from the filtered list, this falls back to the first visible control.
  private syncActiveControl(categoryKey: DashboardCategory['key']): void {
    const visibleControls = this.getVisibleControls(this.categories.find((category) => category.key === categoryKey) ?? this.categories[0]);

    this.activeControlId = visibleControls[0]?.id ?? '';
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
      // For live daily rows from the invoice-loan report:
      // - Recon % = 100 -> passed
      // - Recon % < 100 -> failed
      // If there is no live day-level data yet, we fall back to the seeded demo pattern
      // so the dashboard still has a usable pass/fail state.
      const invoiceLoanKpis = this.getSupplyChainInvoiceLoanKpis(year, monthIndex, day);
      return invoiceLoanKpis.reconPercentage === 100 ? 'passed' : 'failed';
    }

    if (control.id === 'legal-entity-validation') {
      // MCA recon mapping rule:
      // We currently treat any non-zero mismatch workload as failed.
      // If the business later defines a better threshold, change this return condition.
      return this.mcaReconSnapshot.differentCount > 0 || this.mcaReconSnapshot.emptyInA2Count > 0
        ? 'failed'
        : 'passed';
    }

    const threshold = control.statusLabel === 'Needs Focus'
      ? 34
      : control.statusLabel === 'Watchlist'
        ? 24
        : 14;
    const seed = this.hashValue(`${control.id}-${year}-${monthIndex + 1}-${day}`);

    return seed % 100 < threshold ? 'failed' : 'passed';
  }

  // T-1 badges under each parent card are derived from the day before `getCurrentBusinessDate()`.
  private getTMinusOneStatus(control: DashboardControl): 'passed' | 'failed' {
    const tMinusOne = this.getTMinusOneDate();

    return this.getDayStatus(control, tMinusOne.getFullYear(), tMinusOne.getMonth(), tMinusOne.getDate());
  }

  private getTMinusOneDate(): Date {
    const currentBusinessDate = this.getCurrentBusinessDate();
    const tMinusOne = new Date(currentBusinessDate);
    tMinusOne.setDate(currentBusinessDate.getDate() - 1);

    return tMinusOne;
  }

  // Highlights the real current date in the calendar.
  // To switch back to a fixed business/reporting date later, edit `getCurrentBusinessDate()`.
  private isToday(viewedMonth: Date, day: number): boolean {
    const currentBusinessDate = this.getCurrentBusinessDate();

    return viewedMonth.getFullYear() === currentBusinessDate.getFullYear()
      && viewedMonth.getMonth() === currentBusinessDate.getMonth()
      && day === currentBusinessDate.getDate();
  }

  // Future dates should stay neutral/unavailable because the day has not happened yet.
  private isFutureDate(viewedMonth: Date, day: number): boolean {
    const candidate = new Date(viewedMonth.getFullYear(), viewedMonth.getMonth(), day);

    return candidate.getTime() > this.getCurrentBusinessDate().getTime();
  }

  // Calendar yellow-highlight helper.
  // Right now this is mainly used by Supply Chain Financing:
  // if a date exists in the live invoice-loan response, the calendar day gets a yellow "data available" style.
  // To remove that yellow state later, delete the `hasData` class binding in HTML and this helper usage in `getCalendarDays()`.
  private hasCalendarData(control: DashboardControl, year: number, monthIndex: number, day: number): boolean {
    if (control.id === 'supply-chain-financing') {
      return this.supplyChainDailyKpisByDate.has(this.getDateKey(year, monthIndex, day));
    }

    if (control.id === 'legal-entity-validation') {
      // MCA currently gives us a live snapshot rather than daily historical rows.
      // So for the dashboard calendar we highlight the current business date in yellow
      // to show "data available today" without pretending we have older day-by-day history.
      const currentBusinessDate = this.getCurrentBusinessDate();

      return year === currentBusinessDate.getFullYear()
        && monthIndex === currentBusinessDate.getMonth()
        && day === currentBusinessDate.getDate()
        && this.mcaReconSnapshot.totalRows > 0;
    }

    return false;
  }

  // CENTRAL DATE SOURCE FOR THE ORIGINAL DASHBOARD:
  // - This is the one place that decides what "today", "yesterday", the header snapshot label,
  //   the default month, and the reset-to-current-date action all mean.
  // - It now follows the machine/system date automatically, so daily/monthly rollover does not require manual edits.
  // - If business later wants the dashboard to lock to a reporting date from an API or config,
  //   replace the body of this function instead of chasing date logic across the file.
  private getCurrentBusinessDate(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return today;
  }

  // Date-label formatter used for UI text like "Snapshot: 31 Mar 2026".
  // If you want a different display format everywhere, change it here once.
  private formatDateLabel(date: Date): string {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  // Shared yyyy-MM-dd key builder for any day-level KPI map.
  // If another control later needs date-keyed live data, reuse this helper.
  private getDateKey(year: number, monthIndex: number, day: number): string {
    return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  // Small deterministic hash used by `getDayStatus()` to make demo month data repeatable.
  private hashValue(input: string): number {
    return Array.from(input).reduce((total, char, index) => total + char.charCodeAt(0) * (index + 1), 0);
  }

  // Load the same invoice-loan source already used by the dedicated Supply Chain screen.
  // This gives the dashboard live Supply Chain KPI values without duplicating backend endpoints.
  // HOW TO EDIT:
  // - If the invoice-loan service path changes, update the import at the top of this file.
  // - If the source starts returning a better business status flag, update `buildSupplyChainDailyKpis()` and `getDayStatus()`.
  private fetchSupplyChainInvoiceLoanData(): void {
    this.credit.getInvoiceLoanReport().subscribe({
      next: (rows) => {
        this.supplyChainDailyKpisByDate = this.buildSupplyChainDailyKpis(rows);
      },
      error: (err) => {
        console.error('Supply chain invoice-loan load error', err);
      }
    });
  }

  // Load the same MCA source already used by the dedicated legal-entity recon screen.
  // This keeps Legal Entity Validation aligned with the live MCA dashboard KPIs.
  // HOW TO EDIT:
  // - If the MCA source fields change, update `buildMcaReconSnapshot()`
  // - If you later get date-level MCA history, convert this snapshot object into a date-keyed map
  private fetchMcaReconData(): void {
    this.credit.getMCAAtlas2Report().subscribe({
      next: (rows) => {
        this.mcaReconSnapshot = this.buildMcaReconSnapshot(rows);
        this.applyMcaReconStatsToControl();
      },
      error: (err) => {
        console.error('MCA recon load error', err);
      }
    });
  }

  // Aggregate the raw MCA rows into the same KPI buckets shown on the dedicated MCA screen.
  private buildMcaReconSnapshot(rows: MCAAtlas2Report[]): {
    matchCount: number;
    differentCount: number;
    emptyInA2Count: number;
    bothEmptyCount: number;
    totalRows: number;
    mismatchShare: number;
  } {
    let matchCount = 0;
    let differentCount = 0;
    let emptyInA2Count = 0;
    let bothEmptyCount = 0;

    for (const row of rows) {
      const flag = this.normalizeMcaFlagValue(row);

      if (flag === 'MATCH') {
        matchCount += 1;
      } else if (flag === 'DIFFERENT') {
        differentCount += 1;
      } else if (flag === 'EMPTY IN A2') {
        emptyInA2Count += 1;
      } else if (flag === 'BOTH EMPTY') {
        bothEmptyCount += 1;
      }
    }

    const totalRows = rows.length;
    const mismatchRows = differentCount + emptyInA2Count;
    const mismatchShare = totalRows ? Math.round((mismatchRows / totalRows) * 100) : 0;

    return {
      matchCount,
      differentCount,
      emptyInA2Count,
      bothEmptyCount,
      totalRows,
      mismatchShare
    };
  }

  // Push the live MCA snapshot into the default Legal Entity Validation cards shown before a calendar date is clicked.
  private applyMcaReconStatsToControl(): void {
    const legalEntityControl = this.categories
      .flatMap((category) => category.controls)
      .find((control) => control.id === 'legal-entity-validation');

    if (!legalEntityControl) {
      return;
    }

    legalEntityControl.stats = [
      { label: 'Match', value: `${this.mcaReconSnapshot.matchCount}`, note: 'Mapped from MATCH' },
      { label: 'Different', value: `${this.mcaReconSnapshot.differentCount}`, note: 'Mapped from DIFFERENT' },
      { label: 'Empty In A2', value: `${this.mcaReconSnapshot.emptyInA2Count}`, note: 'Mapped from EMPTY IN A2' }
    ];
  }

  // Aggregate the raw invoice-loan response into one KPI object per file-received date.
  // Yellow calendar highlighting is based on the existence of a date key in this map.
  private buildSupplyChainDailyKpis(rows: InvoiceLoanRecord[]): Map<string, {
    totalInvoices: number;
    totalClients: number;
    reconPassed: number;
    reconFailed: number;
    reconPercentage: number;
  }> {
    const byDate = new Map<string, {
      totalInvoices: number;
      clients: Set<string>;
      reconPassed: number;
      reconFailed: number;
    }>();

    for (const row of rows) {
      const receivedDate = this.normalizeInvoiceLoanDate(row.FILE_RECEIVED_DATE);

      if (!receivedDate) {
        continue;
      }

      if (!byDate.has(receivedDate)) {
        byDate.set(receivedDate, {
          totalInvoices: 0,
          clients: new Set<string>(),
          reconPassed: 0,
          reconFailed: 0
        });
      }

      const bucket = byDate.get(receivedDate)!;
      bucket.totalInvoices += 1;
      bucket.clients.add(this.normalizeInvoiceLoanText(row.CLIENT_NAME));

      if (this.isInvoiceLoanYes(row.MASTER_RECON_FLAG)) {
        bucket.reconPassed += 1;
      } else {
        bucket.reconFailed += 1;
      }
    }

    return new Map(
      Array.from(byDate.entries()).map(([dateKey, bucket]) => {
        const reconPercentage = bucket.totalInvoices
          ? Math.round((bucket.reconPassed / bucket.totalInvoices) * 100)
          : 0;

        return [dateKey, {
          totalInvoices: bucket.totalInvoices,
          totalClients: bucket.clients.size,
          reconPassed: bucket.reconPassed,
          reconFailed: bucket.reconFailed,
          reconPercentage
        }];
      })
    );
  }

  // Keep the invoice-loan date parsing identical to the dedicated Supply Chain screen.
  private normalizeInvoiceLoanDate(value: unknown): string | null {
    if (!value) {
      return null;
    }

    const parsed = new Date(String(value));
    if (Number.isNaN(parsed.getTime())) {
      return String(value);
    }

    return parsed.toISOString().slice(0, 10);
  }

  // Keep invoice-loan grouping stable even when the source has blank or padded text fields.
  private normalizeInvoiceLoanText(value: unknown): string {
    return String(value ?? '').trim();
  }

  private isInvoiceLoanYes(value: unknown): boolean {
    return String(value ?? '').trim().toLowerCase() === 'yes';
  }

  // Keep MCA recon flag parsing identical to the dedicated MCA Atlas-2 screen.
  private normalizeMcaFlagValue(row: MCAAtlas2Report): string {
    return String((row as Record<string, unknown>)['COMPARE_COUNTRY_OF_BUSINESS'] ?? '')
      .trim()
      .toUpperCase();
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
    // LIVE INVOICE-LOAN MAPPING:
    // - First check whether the invoice-loan report has a real KPI bucket for this date
    // - If yes, use that live daily KPI object
    // - If not, fall back to the seeded demo data so the dashboard still works before historical coverage is complete
    const liveDailyKpis = this.supplyChainDailyKpisByDate.get(this.getDateKey(year, monthIndex, day));

    if (liveDailyKpis) {
      return liveDailyKpis;
    }

    // This is fallback demo seed data for dates that do not yet exist in the live invoice-loan response.
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
