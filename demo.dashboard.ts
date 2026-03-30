import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

// KPI cards in the child rows render from this shape.
// If you want different KPI labels/values/notes, update the `stats` arrays below
// or adjust `getDisplayStats()` for calendar-driven drill-down behavior.
interface ControlStat {
  label: string;
  value: string;
  note: string;
}

// Each child control shown on the right panel is driven from this local demo model.
// Data is currently mocked in this file itself; there is no API/service call yet.
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
  // All category / child / KPI data is currently mocked locally in this file.
  // When real backend data becomes available, this is the section to replace with API data mapping.
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
  // It filters the right-side child list to only the matching children for that parent.
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

  // Toggles a child inside/outside the Favourite parent section.
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
  // If no T-1 filter is active, all children of the selected parent are shown.
  getVisibleControls(category: DashboardCategory): DashboardControl[] {
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
  // - If no calendar day is selected, show the default child KPI cards from `control.stats`.
  // - If a day is selected, replace those cards with day-specific summary information.
  getDisplayStats(control: DashboardControl): ControlStat[] {
    const selectedDay = this.selectedCalendarDayByControl[control.id];

    if (!selectedDay) {
      return control.stats;
    }

    const viewedMonth = this.getViewedMonth(control.id);
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
  // For now, pass/fail per day is generated deterministically from the child id + date.
  // This makes month navigation work across older/newer months without requiring backend data yet.
  // Replace this function with real historical status data when API data is available.
  private getDayStatus(control: DashboardControl, year: number, monthIndex: number, day: number): 'passed' | 'failed' {
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
}
