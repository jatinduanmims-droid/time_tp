import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface ControlStat {
  label: string;
  value: string;
  note: string;
}

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
  key: 'trade' | 'credit' | 'supply';
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
  readonly snapshotLabel = 'Snapshot: 30 Mar 2026';
  private readonly defaultCalendarMonth = new Date(2026, 2, 1);

  readonly categories: DashboardCategory[] = [
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

  activeCategoryKey: DashboardCategory['key'] = 'trade';
  activeControlId = this.selectedControlByCategory['trade'];
  selectedCalendarDayByControl: Record<string, number | null> = {};
  viewedMonthByControl: Record<string, string> = Object.fromEntries(
    this.categories.flatMap((category) =>
      category.controls.map((control) => [control.id, this.getMonthKey(this.defaultCalendarMonth)])
    )
  );

  selectControl(categoryKey: DashboardCategory['key']): void {
    this.activeCategoryKey = categoryKey;
    this.activeControlId = this.selectedControlByCategory[categoryKey];
  }

  handleControlChange(categoryKey: DashboardCategory['key']): void {
    this.activeCategoryKey = categoryKey;
    this.activeControlId = this.selectedControlByCategory[categoryKey];
  }

  getSelectedControl(category: DashboardCategory): DashboardControl | undefined {
    return category.controls.find(
      (control) => control.id === this.selectedControlByCategory[category.key]
    ) ?? category.controls[0];
  }

  getActiveCategory(): DashboardCategory {
    return this.categories.find((category) => category.key === this.activeCategoryKey) ?? this.categories[0];
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

  getMaxChartValue(points?: Array<{ value: number }>): number {
    if (!points?.length) {
      return 1;
    }

    return Math.max(...points.map((point) => point.value), 1);
  }

  selectCalendarDay(controlId: string, day: number): void {
    this.selectedCalendarDayByControl[controlId] =
      this.selectedCalendarDayByControl[controlId] === day ? null : day;
  }

  shiftCalendarMonth(controlId: string, delta: number): void {
    const viewedMonth = this.getViewedMonth(controlId);
    viewedMonth.setMonth(viewedMonth.getMonth() + delta);
    viewedMonth.setDate(1);

    this.viewedMonthByControl[controlId] = this.getMonthKey(viewedMonth);
    this.selectedCalendarDayByControl[controlId] = null;
  }

  getMonthLabel(controlId: string): string {
    return this.getViewedMonth(controlId).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  }

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

  getCalendarDays(control: DashboardControl): Array<{
    label: string;
    muted: boolean;
    fail: boolean;
    passed: boolean;
    today: boolean;
    clickable: boolean;
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
      selected: false,
      dayNumber: null
    }));

    for (let day = 1; day <= totalDays; day += 1) {
      const status = this.getDayStatus(control, viewedMonth.getFullYear(), viewedMonth.getMonth(), day);

      cells.push({
        label: String(day),
        muted: false,
        fail: status === 'failed',
        passed: status === 'passed',
        today: this.isToday(viewedMonth, day),
        clickable: true,
        selected: selectedDay === day,
        dayNumber: day
      });
    }

    return cells;
  }

  getStatusCount(control: DashboardControl, status: 'passed' | 'failed'): number {
    const viewedMonth = this.getViewedMonth(control.id);
    const totalDays = new Date(viewedMonth.getFullYear(), viewedMonth.getMonth() + 1, 0).getDate();
    let count = 0;

    for (let day = 1; day <= totalDays; day += 1) {
      if (this.getDayStatus(control, viewedMonth.getFullYear(), viewedMonth.getMonth(), day) === status) {
        count += 1;
      }
    }

    return count;
  }

  private getViewedMonth(controlId: string): Date {
    const monthKey = this.viewedMonthByControl[controlId] ?? this.getMonthKey(this.defaultCalendarMonth);
    const [year, month] = monthKey.split('-').map(Number);

    return new Date(year, month - 1, 1);
  }

  private getMonthKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private getDayStatus(control: DashboardControl, year: number, monthIndex: number, day: number): 'passed' | 'failed' {
    const threshold = control.statusLabel === 'Needs Focus'
      ? 34
      : control.statusLabel === 'Watchlist'
        ? 24
        : 14;
    const seed = this.hashValue(`${control.id}-${year}-${monthIndex + 1}-${day}`);

    return seed % 100 < threshold ? 'failed' : 'passed';
  }

  private isToday(viewedMonth: Date, day: number): boolean {
    return viewedMonth.getFullYear() === 2026 && viewedMonth.getMonth() === 2 && day === 11;
  }

  private hashValue(input: string): number {
    return Array.from(input).reduce((total, char, index) => total + char.charCodeAt(0) * (index + 1), 0);
  }
}
