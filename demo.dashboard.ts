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
  shortName: string;
  statusLabel: string;
  statusColor: string;
  statusBg: string;
  stats: ControlStat[];
  failureDays: number[];
}

interface DashboardCategory {
  key: 'trade' | 'credit' | 'supply';
  name: string;
  note: string;
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

  readonly categories: DashboardCategory[] = [
    {
      key: 'trade',
      name: 'Trade Control',
      note: 'Incoming requests, cancellations, and document follow-up controls',
      accent: 'var(--trade)',
      controls: [
        {
          id: 'incoming-requests-management',
          name: 'Incoming Requests Management Control',
          shortName: 'Incoming Requests',
          statusLabel: 'Stable',
          statusColor: 'var(--success)',
          statusBg: 'rgba(32, 116, 80, 0.12)',
          stats: [
            { label: 'Pass Rate', value: '98%', note: '30 day average' },
            { label: 'Open Items', value: '12', note: 'Awaiting action' },
            { label: 'Fails', value: '2', note: 'This month' }
          ],
          failureDays: [5, 15]
        },
        {
          id: 'evergreen-cancellations',
          name: 'Evergreen Cancellations Control',
          shortName: 'Evergreen Cancellations',
          statusLabel: 'Watchlist',
          statusColor: 'var(--warn)',
          statusBg: 'rgba(197, 143, 25, 0.14)',
          stats: [
            { label: 'Cancelled', value: '7', note: 'This week' },
            { label: 'Exceptions', value: '2', note: 'Pending review' },
            { label: 'Recovery', value: '91%', note: 'Processed on time' }
          ],
          failureDays: [7, 20]
        },
        {
          id: 'documents-checking-sblc',
          name: 'Documents Checking Deadline Follow up on SBLC',
          shortName: 'SBLC Follow Up',
          statusLabel: 'Needs Focus',
          statusColor: '#a93e3e',
          statusBg: 'rgba(217, 108, 108, 0.15)',
          stats: [
            { label: 'Due Soon', value: '14', note: 'Within 48 hours' },
            { label: 'Escalations', value: '4', note: 'Supervisor queue' },
            { label: 'Pass Rate', value: '84%', note: 'Below target' }
          ],
          failureDays: [11, 23]
        },
        {
          id: 'documents-checking-lc',
          name: 'Documents Checking Deadline Follow up on L/C',
          shortName: 'L/C Follow Up',
          statusLabel: 'Stable',
          statusColor: 'var(--success)',
          statusBg: 'rgba(32, 116, 80, 0.12)',
          stats: [
            { label: 'Checked', value: '26', note: 'Current batch' },
            { label: 'Open Cases', value: '9', note: 'Need follow-up' },
            { label: 'Failures', value: '1', note: 'Month to date' }
          ],
          failureDays: [18]
        }
      ]
    },
    {
      key: 'credit',
      name: 'Credit Control',
      note: 'Market, renewed deals, and legal entity validations',
      accent: 'var(--credit)',
      controls: [
        {
          id: 'market-facility-validation',
          name: 'Market Facility Validation',
          shortName: 'Market Facility',
          statusLabel: 'Stable',
          statusColor: 'var(--success)',
          statusBg: 'rgba(32, 116, 80, 0.12)',
          stats: [
            { label: 'Validated', value: '45', note: 'Current cycle' },
            { label: 'Pending', value: '5', note: 'Need review' },
            { label: 'Failures', value: '1', note: 'Month to date' }
          ],
          failureDays: [9]
        },
        {
          id: 'renewed-deals-validation',
          name: 'Renewed Deals Validation',
          shortName: 'Renewed Deals',
          statusLabel: 'Watchlist',
          statusColor: 'var(--warn)',
          statusBg: 'rgba(197, 143, 25, 0.14)',
          stats: [
            { label: 'Renewals', value: '19', note: 'Current batch' },
            { label: 'Pending', value: '3', note: 'Need maker check' },
            { label: 'Failures', value: '2', note: 'Month to date' }
          ],
          failureDays: [6, 21]
        },
        {
          id: 'legal-entity-validation',
          name: 'Legal Entity Validation',
          shortName: 'Legal Entity',
          statusLabel: 'Needs Focus',
          statusColor: '#a93e3e',
          statusBg: 'rgba(217, 108, 108, 0.15)',
          stats: [
            { label: 'Matched', value: '101', note: 'Aligned records' },
            { label: 'Mismatch', value: '30', note: 'Require review' },
            { label: 'Empty', value: '11', note: 'Missing records' }
          ],
          failureDays: [4, 16, 24]
        }
      ]
    },
    {
      key: 'supply',
      name: 'Supply Chain Control',
      note: 'Supply-chain financing monitoring',
      accent: 'var(--supply)',
      controls: [
        {
          id: 'supply-chain-financing',
          name: 'Supply Chain Financing',
          shortName: 'Supply Chain Financing',
          statusLabel: 'Stable',
          statusColor: 'var(--success)',
          statusBg: 'rgba(32, 116, 80, 0.12)',
          stats: [
            { label: 'Invoices', value: '214', note: 'Current month' },
            { label: 'Clients', value: '19', note: 'Active accounts' },
            { label: 'Failures', value: '2', note: 'Month to date' }
          ],
          failureDays: [8, 28]
        }
      ]
    }
  ];

  selectedControlByCategory: Record<string, string> = Object.fromEntries(
    this.categories.map((category) => [category.key, category.controls[0]?.id ?? ''])
  );

  activeCategoryKey: DashboardCategory['key'] = 'trade';
  activeControlId = this.selectedControlByCategory['trade'];

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

  getCalendarDays(failureDays: number[]): Array<{ label: string; muted: boolean; fail: boolean; today: boolean }> {
    const totalDays = 30;
    const startOffset = 5;
    const cells = Array.from({ length: startOffset }, () => ({
      label: '',
      muted: true,
      fail: false,
      today: false
    }));

    for (let day = 1; day <= totalDays; day += 1) {
      cells.push({
        label: String(day),
        muted: false,
        fail: failureDays.includes(day),
        today: day === 11
      });
    }

    return cells;
  }
}
