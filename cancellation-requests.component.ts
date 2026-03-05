import { AfterViewInit, Component, HostListener, OnInit, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective, NgChartsModule } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { TableModule } from 'primeng/table';
import { map } from 'rxjs/operators';
import { EmailService } from '../../services/email.service';
import { EmailDetail } from '../../services/email.service';
import { EmailDetailComponent } from '../email-detail/email-detail.component';
import { StatsService } from '../../services/stats.service';
import { EmailStatsComponent } from '../email-stats/email-stats.component';

@Component({
  selector: 'app-cancellation-requests',
  imports: [
    CommonModule,
    EmailStatsComponent,
    NgChartsModule,
    TableModule,
    EmailDetailComponent
  ],
  templateUrl: './cancellation-requests.component.html',
  styleUrl: './cancellation-requests.component.scss'
})
export class CancellationRequests implements OnInit, AfterViewInit {

  @ViewChildren(BaseChartDirective) private charts!: QueryList<BaseChartDirective>;

  constructor(
    public stats: StatsService,
    private emailSrv: EmailService
  ) {}

  readonly targetDate: Date = new Date('2026-02-18');

  batchEmails: EmailDetail[] = [];
  displayedEmails: EmailDetail[] = [];
  activeFilter: string | null = null;
  loading = false;
  selectedRow?: EmailDetail;
  totalEmails = 0;

  totalToday = 0;
  urgentToday = 0;
  due24 = 0;
  due48 = 0;
  overdue = 0;
  slaMet = 0;
  slaBreach = 0;
  slaPercentage = 0;

  slaLineData!: ChartData<'doughnut'>;
  slaLineOptions!: ChartOptions<'doughnut'>;

  slaTrendData!: ChartData<'line'>;
  slaTrendOptions!: ChartOptions<'line'>;

  cols = [
    { field: 'SENDER', header: 'Sender' },
    { field: 'OPERATION', header: 'Operation' },
    { field: 'EMAIL_RECEIVEDTIME_FMT', header: 'Received On', align: 'center' },
    { field: 'EMAIL_CLASSIFICATION', header: 'Classification' },
    { field: 'LC_REFERENCE_NUMBER', header: 'Reference Number', align: 'center' },
    { field: 'EVG_CNC_CONTROL_FLAG', header: 'Evergreen Flag', align: 'center' },
    { field: 'SLA_DATE_FMT', header: 'SLA Date', align: 'center' },
    { field: 'SLAMEET', header: 'SLA Met', align: 'center' }
  ];

  ngOnInit(): void {
    this.loadBatchCancellations();

    this.emailSrv.rowIdFilter$.subscribe((ids: number[]) => {
      if (ids && ids.length) {
        this.applyRowIdFilter(ids);
      } else {
        this.displayedEmails = [...this.batchEmails];
        this.totalEmails = this.displayedEmails.length;
      }
    });
  }

  ngAfterViewInit(): void {
    this.refreshChartLayout();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.refreshChartLayout();
  }

  private loadBatchCancellations(): void {
    this.loading = true;

    this.emailSrv.getBatchCancellations()
      .pipe(
        map((data: EmailDetail[]) =>
          data.map(email => ({
            ...email,
            SLA_DATE: new Date(email.SLA_DATE),
            EMAIL_RECEIVEDTIME: new Date(email.EMAIL_RECEIVEDTIME),
            APPROVEDATE: email.APPROVEDATE ? new Date(email.APPROVEDATE) : undefined,
            SLA_DATE_FMT: this.formatDate(email.SLA_DATE),
            EMAIL_RECEIVEDTIME_FMT: this.formatDate(email.EMAIL_RECEIVEDTIME),
            APPROVEDATE_FMT: email.APPROVEDATE ? this.formatDate(email.APPROVEDATE) : '',
            SLAMEET: (email as any).SLAMEET ?? email.SLA_MET ?? ''
          } as EmailDetail))
        )
      )
      .subscribe({
        next: (data) => {
          this.batchEmails = data;
          this.displayedEmails = [...data];
          this.totalEmails = data.length;

          this.calculateKpis();
          this.buildCharts();
          this.refreshChartLayout();

          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load batch emails', err);
          this.loading = false;
        }
      });
  }

  private calculateKpis(): void {
    const target = this.targetDate.toDateString();

    this.totalToday = this.batchEmails.filter(e =>
      new Date(e.EMAIL_RECEIVEDTIME).toDateString() === target
    ).length;

    this.urgentToday = this.batchEmails.filter(e =>
      new Date(e.EMAIL_RECEIVEDTIME).toDateString() === target &&
      e.EMAIL_CLASSIFICATION === 'Urgent'
    ).length;

    const d24 = new Date(this.targetDate);
    d24.setDate(d24.getDate() + 1);

    const d48 = new Date(this.targetDate);
    d48.setDate(d48.getDate() + 2);

    this.due24 = this.batchEmails.filter(e =>
      new Date(e.SLA_DATE).toDateString() === d24.toDateString()
    ).length;

    this.due48 = this.batchEmails.filter(e =>
      new Date(e.SLA_DATE).toDateString() === d48.toDateString()
    ).length;

    this.overdue = this.batchEmails.filter(e =>
      new Date(e.SLA_DATE) < this.targetDate &&
      e.SLA_MET !== 'Y'
    ).length;

    this.slaMet = this.batchEmails.filter(e => e.SLA_MET === 'Y').length;
    this.slaBreach = this.batchEmails.filter(e => e.SLA_MET === 'N').length;

    const totalSla = this.slaMet + this.slaBreach;
    this.slaPercentage = totalSla ? Math.round((this.slaMet / totalSla) * 100) : 0;
  }

  private buildCharts(): void {
    this.slaLineData = {
      labels: ['SLA Met', 'SLA Breach'],
      datasets: [{
        data: [this.slaMet, this.slaBreach],
        backgroundColor: ['#2e7d32', '#e0e0e0'],
        borderWidth: 0
      }]
    };

    this.slaLineOptions = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '78%',
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      }
    };

    const trendMap = new Map<string, { date: Date; evergreen: number; nonEvergreen: number }>();

    this.batchEmails
      .filter(e => new Date(e.EMAIL_RECEIVEDTIME) <= this.targetDate)
      .forEach(e => {
        const d = new Date(e.EMAIL_RECEIVEDTIME);
        d.setHours(0, 0, 0, 0);
        const key = d.toISOString().slice(0, 10);

        if (!trendMap.has(key)) {
          trendMap.set(key, { date: d, evergreen: 0, nonEvergreen: 0 });
        }

        const point = trendMap.get(key)!;
        if (e.EVG_CNC_CONTROL_FLAG === 'Y') point.evergreen += 1;
        if (e.EVG_CNC_CONTROL_FLAG === 'N') point.nonEvergreen += 1;
      });

    let trendPoints = Array.from(trendMap.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(-7);

    if (!trendPoints.length) {
      trendPoints = [{ date: new Date(this.targetDate), evergreen: 0, nonEvergreen: 0 }];
    }

    this.slaTrendData = {
      labels: trendPoints.map(p => p.date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })),
      datasets: [
        {
          label: 'Evergreen',
          data: trendPoints.map(p => p.evergreen),
          borderColor: '#2e7d32',
          backgroundColor: 'rgba(46, 125, 50, 0.15)',
          pointRadius: 3,
          pointHoverRadius: 4,
          tension: 0.35
        },
        {
          label: 'Non-Evergreen',
          data: trendPoints.map(p => p.nonEvergreen),
          borderColor: '#c62828',
          backgroundColor: 'rgba(198, 40, 40, 0.12)',
          pointRadius: 3,
          pointHoverRadius: 4,
          tension: 0.35
        }
      ]
    };

    this.slaTrendOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top' },
        tooltip: { enabled: true }
      },
      scales: {
        x: {
          grid: { display: false }
        },
        y: {
          beginAtZero: true,
          ticks: { precision: 0 }
        }
      }
    };
  }

  onFilter(type: string): void {
    this.activeFilter = type;
    const target = this.targetDate.toDateString();

    this.displayedEmails = this.batchEmails.filter(e => {
      switch (type) {
        case 'urgent':
          return new Date(e.EMAIL_RECEIVEDTIME).toDateString() === target &&
                 e.EMAIL_CLASSIFICATION === 'Urgent';

        case 'due24': {
          const d24 = new Date(this.targetDate);
          d24.setDate(d24.getDate() + 1);
          return new Date(e.SLA_DATE).toDateString() === d24.toDateString();
        }

        case 'due48': {
          const d48 = new Date(this.targetDate);
          d48.setDate(d48.getDate() + 2);
          return new Date(e.SLA_DATE).toDateString() === d48.toDateString();
        }

        case 'overdue':
          return new Date(e.SLA_DATE) < this.targetDate && e.SLA_MET !== 'Y';

        default:
          return true;
      }
    });

    this.totalEmails = this.displayedEmails.length;
  }

  handleStatClick(
    type:
      | 'totalToday'
      | 'total'
      | 'urgent'
      | 'amendments'
      | 'issuance'
      | 'sla1'
      | 'sla2'
      | 'cancellation'
      | 'unknown'
      | 'evergreen'
      | 'nonevergreencancellation'
  ): void {
    const target = this.targetDate.toDateString();

    const predicates: Record<string, (e: EmailDetail) => boolean> = {
      totalToday: e => new Date(e.EMAIL_RECEIVEDTIME).toDateString() === target,
      total: () => true,
      urgent: e =>
        new Date(e.EMAIL_RECEIVEDTIME).toDateString() === target &&
        e.EMAIL_CLASSIFICATION === 'Urgent',
      evergreen: e =>
        new Date(e.EMAIL_RECEIVEDTIME).toDateString() === target &&
        !(
          e.OPERATION?.toLowerCase() === 'cancel' ||
          e.OPERATION?.toLowerCase() === 'cancellation'
        ) &&
        e.EVG_CNC_CONTROL_FLAG === 'Y',
      nonevergreencancellation: e =>
        new Date(e.EMAIL_RECEIVEDTIME).toDateString() === target &&
        (
          e.OPERATION?.toLowerCase() === 'cancel' ||
          e.OPERATION?.toLowerCase() === 'cancellation'
        ) &&
        e.EVG_CNC_CONTROL_FLAG === 'N',
      sla1: e => {
        const d = new Date(this.targetDate);
        d.setDate(d.getDate() + 1);
        return new Date(e.SLA_DATE).toDateString() === d.toDateString();
      },
      sla2: e => {
        const d = new Date(this.targetDate);
        d.setDate(d.getDate() + 2);
        return new Date(e.SLA_DATE).toDateString() === d.toDateString();
      }
    };

    this.activeFilter = type;
    this.displayedEmails = predicates[type]
      ? this.batchEmails.filter(predicates[type])
      : [...this.batchEmails];
    this.totalEmails = this.displayedEmails.length;
  }

  clearFilter(): void {
    this.activeFilter = null;
    this.emailSrv.emitRowIdFilter([]);
    this.displayedEmails = [...this.batchEmails];
    this.totalEmails = this.displayedEmails.length;
  }

  openDetail(row: EmailDetail): void {
    this.selectedRow = row;
  }

  closeDetail(): void {
    this.selectedRow = undefined;
    this.loadBatchCancellations();
  }

  handlePage(_event: any): void {
    // Reserved for pagination hooks.
  }

  private applyRowIdFilter(ids: number[]): void {
    const idSet = new Set(ids);

    this.displayedEmails = this.batchEmails.filter(email => idSet.has(email.ROW_ID));

    this.displayedEmails.sort(
      (a, b) => ids.indexOf(a.ROW_ID) - ids.indexOf(b.ROW_ID)
    );

    this.totalEmails = this.displayedEmails.length;
  }

  private refreshChartLayout(): void {
    setTimeout(() => {
      this.charts?.forEach(chart => {
        chart.chart?.resize();
        chart.update();
      });
    }, 0);

    setTimeout(() => {
      this.charts?.forEach(chart => {
        chart.chart?.resize();
        chart.update();
      });
    }, 180);
  }

  private formatDate(value: string | Date): string {
    const d = new Date(value);
    const day = d.getUTCDate().toString().padStart(2, '0');
    const month = d.toLocaleString('en-us', { month: 'short' }).toUpperCase();
    const year = d.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
  }
}
