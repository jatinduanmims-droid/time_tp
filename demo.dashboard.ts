import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

type ControlStat = {
  label: string;
  value: string;
  note: string;
};

type ChartKpi = {
  label: string;
  value: string;
};

type ChartPoint = {
  label: string;
  value: number;
};

type DashboardControl = {
  id: string;
  name: string;
  shortName: string;
  source: string;
  description: string;
  statusLabel: string;
  statusColor: string;
  statusBg: string;
  stats?: ControlStat[];
  chartKpis?: ChartKpi[];
  chart?: {
    title: string;
    subtitle: string;
    points: ChartPoint[];
  };
  placeholder?: boolean;
};

type DashboardCategory = {
  key: string;
  name: string;
  note: string;
  accent: string;
  controls: DashboardControl[];
};

@Component({
  selector: 'app-demo-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './demo.dashboard.html',
  styleUrls: ['./demo.dashboard.scss']
})
export class DemoDashboardComponent {
  readonly snapshotLabel = '30 Mar 2026';

  readonly categories: DashboardCategory[] = [
    {
      key: 'trade',
      name: 'Trade Control',
      note: 'Incoming, cancellation, and deadline follow-up controls',
      accent: 'var(--trade)',
      controls: [
        {
          id: 'incoming-requests',
          name: 'Incoming Requests Management Control',
          shortName: 'Jatin-dashboard',
          source: 'EmailService.getBatchEmails()',
          description: 'Tracks request mix, urgency, and SLA health for incoming trade-control activity.',
          statusLabel: 'Healthy',
          statusColor: 'var(--success)',
          statusBg: 'rgba(32, 116, 80, 0.12)',
          stats: [
            { label: 'SLA Met', value: '86%', note: 'Health' },
            { label: 'Urgent', value: '27', note: 'Priority' },
            { label: 'Overdue', value: '12', note: 'Past SLA' }
          ],
          chartKpis: [
            { label: 'Total Requests', value: '186' },
            { label: 'Amendments', value: '54' },
            { label: 'Issuance', value: '63' }
          ],
          chart: {
            title: 'SLA Pressure Mix',
            subtitle: 'Incoming request workload',
            points: [
              { label: 'Due 24h', value: 18 },
              { label: 'Due 48h', value: 26 },
              { label: 'Overdue', value: 12 },
              { label: 'Urgent', value: 27 }
            ]
          }
        },
        {
          id: 'evergreen-cancellations',
          name: 'Evergreen Cancellations Control',
          shortName: 'Cancellation Requests',
          source: 'EmailService.getBatchCancellations()',
          description: 'Measures evergreen and non-evergreen cancellation demand with due-window visibility.',
          statusLabel: 'Watchlist',
          statusColor: 'var(--warn)',
          statusBg: 'rgba(197, 143, 25, 0.14)',
          stats: [
            { label: 'SLA Met', value: '78%', note: 'Health' },
            { label: 'Non-Evg', value: '14', note: 'Control specific' },
            { label: 'Overdue', value: '9', note: 'Past SLA' }
          ],
          chartKpis: [
            { label: 'Total Today', value: '64' },
            { label: 'Cancellation', value: '38' },
            { label: 'Urgent', value: '11' }
          ],
          chart: {
            title: 'Cancellation Pressure Mix',
            subtitle: 'Evergreen cancellation workload',
            points: [
              { label: 'Due 24h', value: 9 },
              { label: 'Due 48h', value: 13 },
              { label: 'Overdue', value: 9 },
              { label: 'Urgent', value: 11 }
            ]
          }
        },
        {
          id: 'sblc-followup',
          name: 'Documents Checking Deadline Follow up on SBLC',
          shortName: 'SBLC Follow up',
          source: 'EmailService.getBatchEmails()',
          description: 'Uses the same current dataset as the incoming requests dashboard for now.',
          statusLabel: 'Healthy',
          statusColor: 'var(--success)',
          statusBg: 'rgba(32, 116, 80, 0.12)',
          stats: [
            { label: 'SLA Met', value: '86%', note: 'Shared source' },
            { label: 'Urgent', value: '27', note: 'Shared source' },
            { label: 'Overdue', value: '12', note: 'Shared source' }
          ],
          chartKpis: [
            { label: 'Total Requests', value: '186' },
            { label: 'Amendments', value: '54' },
            { label: 'Issuance', value: '63' }
          ],
          chart: {
            title: 'SBLC Follow-up Mix',
            subtitle: 'Shared preview dataset',
            points: [
              { label: 'Due 24h', value: 18 },
              { label: 'Due 48h', value: 26 },
              { label: 'Overdue', value: 12 },
              { label: 'Urgent', value: 27 }
            ]
          }
        },
        {
          id: 'lc-followup',
          name: 'Documents Checking Deadline Follow up on L/C',
          shortName: 'L/C Follow up',
          source: 'KPI logic pending',
          description: 'Listed in the control map, KPI logic can be added later.',
          statusLabel: 'Coming Soon',
          statusColor: 'var(--ink-700)',
          statusBg: 'rgba(114, 129, 122, 0.14)',
          placeholder: true
        }
      ]
    },
    {
      key: 'credit',
      name: 'Credit Control',
      note: 'Market, renewed deals, and legal entity validation',
      accent: 'var(--credit)',
      controls: [
        {
          id: 'market-facility',
          name: 'Market Facility Validation',
          shortName: 'Market Facility',
          source: 'KPI logic pending',
          description: 'Control is kept visible, KPI wiring is still pending.',
          statusLabel: 'Coming Soon',
          statusColor: 'var(--ink-700)',
          statusBg: 'rgba(114, 129, 122, 0.14)',
          placeholder: true
        },
        {
          id: 'renewed-deals',
          name: 'Renewed Deals Validation',
          shortName: 'Renewed Deals',
          source: 'KPI logic pending',
          description: 'Control is kept visible, KPI wiring is still pending.',
          statusLabel: 'Coming Soon',
          statusColor: 'var(--ink-700)',
          statusBg: 'rgba(114, 129, 122, 0.14)',
          placeholder: true
        },
        {
          id: 'legal-entity',
          name: 'Legal Entity Validation',
          shortName: 'MCA-atlas2',
          source: 'CreditControls.getMCAAtlas2Report()',
          description: 'Tracks recon flag buckets and mismatch-driven validation work.',
          statusLabel: 'Needs Focus',
          statusColor: 'var(--warn)',
          statusBg: 'rgba(197, 143, 25, 0.14)',
          stats: [
            { label: 'Match', value: '101', note: 'Aligned' },
            { label: 'Different', value: '30', note: 'Mismatch' },
            { label: 'Empty A2', value: '11', note: 'Missing' }
          ],
          chartKpis: [
            { label: 'Both Empty', value: '8' },
            { label: 'Loaded Rows', value: '142' },
            { label: 'Mismatch Share', value: '21%' }
          ],
          chart: {
            title: 'Recon Flag Distribution',
            subtitle: 'Legal entity validation mix',
            points: [
              { label: 'Match', value: 101 },
              { label: 'Different', value: 30 },
              { label: 'Empty A2', value: 11 },
              { label: 'Both Empty', value: 8 }
            ]
          }
        }
      ]
    },
    {
      key: 'supply',
      name: 'Supply Chain Control',
      note: 'Supply-chain financing controls',
      accent: 'var(--supply)',
      controls: [
        {
          id: 'supply-chain-financing',
          name: 'Supply Chain Financing',
          shortName: 'Invoice loan',
          source: 'CreditControls.getInvoiceLoanReport()',
          description: 'Shows grouped invoice-loan counts and recon performance for supply-chain financing.',
          statusLabel: 'Stable',
          statusColor: 'var(--success)',
          statusBg: 'rgba(32, 116, 80, 0.12)',
          stats: [
            { label: 'Groups', value: '68', note: 'Summary rows' },
            { label: 'Passed', value: '49', note: 'Recon yes' },
            { label: 'Failed', value: '19', note: 'Recon no' }
          ],
          chartKpis: [
            { label: 'Invoices', value: '214' },
            { label: 'Clients', value: '19' },
            { label: 'Latest File', value: '28 Mar' }
          ],
          chart: {
            title: 'Invoice Volume Trend',
            subtitle: 'Recent grouped activity',
            points: [
              { label: '24 Mar', value: 18 },
              { label: '25 Mar', value: 24 },
              { label: '26 Mar', value: 17 },
              { label: '27 Mar', value: 31 },
              { label: '28 Mar', value: 26 }
            ]
          }
        }
      ]
    }
  ];

  selectedControlByCategory = Object.fromEntries(
    this.categories.map(category => [category.key, category.controls[0]?.id ?? ''])
  );

  activeControlId = this.categories[0]?.controls[0]?.id ?? '';

  getSelectedControl(category: DashboardCategory): DashboardControl {
    const selectedId = this.selectedControlByCategory[category.key];
    return category.controls.find(control => control.id === selectedId) ?? category.controls[0];
  }

  getActiveControl(): DashboardControl {
    for (const category of this.categories) {
      const match = category.controls.find(control => control.id === this.activeControlId);
      if (match) {
        return match;
      }
    }
    return this.categories[0].controls[0];
  }

  getActiveCategoryAccent(): string {
    const category = this.categories.find(item =>
      item.controls.some(control => control.id === this.activeControlId)
    );
    return category?.accent ?? 'var(--brand)';
  }

  getMaxChartValue(points: ChartPoint[] | undefined): number {
    if (!points?.length) {
      return 1;
    }
    return Math.max(...points.map(point => point.value), 1);
  }

  selectControl(categoryKey: string): void {
    this.activeControlId = this.selectedControlByCategory[categoryKey];
  }

  handleControlChange(categoryKey: string): void {
    this.activeControlId = this.selectedControlByCategory[categoryKey];
  }
}
