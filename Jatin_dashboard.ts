import { AfterViewInit, Component, HostListener, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmailService } from '../services/email.service';
import { EmailDetail } from '../services/email.service';
import { BaseChartDirective, NgChartsModule } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { Table, TableModule } from 'primeng/table';
import { EmailDetailComponent } from '../email-detail/email-detail.component';

@Component({
  selector: 'app-jatin-dashboard',
  standalone: true,
  imports: [CommonModule, NgChartsModule, TableModule, EmailDetailComponent],
  templateUrl: './jatin-dashboard.html',
  styleUrls: ['./jatin-dashboard.scss']
})
export class JatinDashboardComponent implements OnInit, AfterViewInit {

  @ViewChildren(BaseChartDirective) private charts!: QueryList<BaseChartDirective>;
  @ViewChild('dt') private dataTable?: Table;

  // =========================
  // DEMO STABLE DATE
  // =========================
  readonly targetDate: Date = new Date('2025-09-26');

  // =========================
  // DATA
  // =========================
  batchEmails: EmailDetail[] = [];
  displayedEmails: EmailDetail[] = [];
  activeFilter: string | null = null;
  loading = false;
  selectedRow?: EmailDetail;
  totalEmails = 0;
  tableFirst = 0;
  tableRows = 10;
  private suppressPageEvent = false;
  private pendingRestoreFirst: number | null = null;

  // =========================
  // KPI COUNTERS
  // =========================
  totalToday = 0;
  urgentToday = 0;
  amendmentsToday = 0;
  issuanceToday = 0;
  cancellationToday = 0;
  unknownToday = 0;

  due24 = 0;
  due48 = 0;
  overdue = 0;

  slaMet = 0;
  slaBreach = 0;
  slaPercentage = 0;

  // =========================
  // CHARTS
  // =========================
  slaLineData!: ChartData<'doughnut'>;
  slaLineOptions!: ChartOptions<'doughnut'>;

  slaTrendData!: ChartData<'line'>;
  slaTrendOptions!: ChartOptions<'line'>;

  dueBarData!: ChartData<'bar'>;
  dueBarOptions!: ChartOptions<'bar'>;

  // =========================
  // TABLE CONFIG
  // =========================
  cols = [
    { field: 'SENDER', header: 'Sender' },
    { field: 'OPERATION', header: 'Operation' },
    { field: 'EMAIL_RECEIVEDTIME_FMT', header: 'Received On', align: 'center' },
    { field: 'EMAIL_CLASSIFICATION', header: 'Classification' },
    { field: 'LC_REFERENCE_NUMBER', header: 'LC Ref', align: 'center' },
    { field: 'APPROVEDATE_FMT', header: 'Approval Date', align: 'center' },
    { field: 'SLA_DATE_FMT', header: 'SLA Date', align: 'center' },
    { field: 'SLAMEET', header: 'SLA Met', align: 'center' }
  ];

  constructor(private emailSrv: EmailService) {}

  private applySavedRowUpdate(event: { rowId: number; changes: Partial<EmailDetail> & Record<string, unknown> }): void {
    const normalizeUpdatedEmail = (email: EmailDetail): EmailDetail => {
      const sla = this.normalizeSlaValue(
        (email as any).SLAMEET ?? (email as any).SLAMET ?? email.SLA_MET
      );

      return {
        ...email,
        SLA_MET: sla,
        SLAMEET: sla
      } as EmailDetail;
    };

    this.batchEmails = this.batchEmails.map(email =>
      email.ROW_ID === event.rowId
        ? normalizeUpdatedEmail({ ...email, ...event.changes } as EmailDetail)
        : email
    );

    this.displayedEmails = this.displayedEmails.map(email =>
      email.ROW_ID === event.rowId
        ? normalizeUpdatedEmail({ ...email, ...event.changes } as EmailDetail)
        : email
    );

    if (this.selectedRow?.ROW_ID === event.rowId) {
      this.selectedRow = normalizeUpdatedEmail({
        ...this.selectedRow,
        ...event.changes
      } as EmailDetail);
    }

    this.calculateKpis();
    this.buildCharts();
    this.refreshChartLayout();
  }

  private normalizeSlaValue(value: unknown): 'Y' | 'N' {
    return String(value ?? '').trim().toUpperCase() === 'Y' ? 'Y' : 'N';
  }

  ngOnInit(): void {
    this.loadBatchEmails();
  }

  ngAfterViewInit(): void {
    this.refreshChartLayout();
    this.applyPaginatorState(this.tableFirst);
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.refreshChartLayout();
  }

  // =========================
  // LOAD DATA
  // =========================
  private loadBatchEmails(): void {
    this.loading = true;

    this.emailSrv.getBatchEmails().subscribe({
      next: (data: EmailDetail[]) => {

        this.batchEmails = data.map(e => ({
          ...e,
          SLA_DATE: new Date(e.SLA_DATE),
          EMAIL_RECEIVEDTIME: new Date(e.EMAIL_RECEIVEDTIME),
          APPROVEDATE: e.APPROVEDATE ? new Date(e.APPROVEDATE) : undefined,
          SLA_DATE_FMT: this.formatDate(e.SLA_DATE),
          EMAIL_RECEIVEDTIME_FMT: this.formatDate(e.EMAIL_RECEIVEDTIME),
          APPROVEDATE_FMT: e.APPROVEDATE ? this.formatDate(e.APPROVEDATE) : '',
          // Normalize SLA variants from API payload so UI and KPIs stay consistent
          SLA_MET: this.normalizeSlaValue((e as any).SLAMEET ?? (e as any).SLAMET ?? e.SLA_MET),
          SLAMEET: this.normalizeSlaValue((e as any).SLAMEET ?? (e as any).SLAMET ?? e.SLA_MET)
        } as EmailDetail));

        this.displayedEmails = [...this.batchEmails];
        this.totalEmails = this.batchEmails.length;
        this.ensureValidTablePage();
        this.restoreTablePageIfNeeded();

        this.calculateKpis();
        this.buildCharts();
        this.refreshChartLayout();

        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  // =========================
  // KPI CALCULATIONS
  // =========================
  private calculateKpis(): void {

    const target = this.targetDate.toDateString();

    this.totalToday = this.batchEmails.filter(e =>
      new Date(e.EMAIL_RECEIVEDTIME).toDateString() === target
    ).length;

    this.urgentToday = this.batchEmails.filter(e =>
      new Date(e.EMAIL_RECEIVEDTIME).toDateString() === target &&
      e.EMAIL_CLASSIFICATION === 'Urgent'
    ).length;

    this.amendmentsToday = this.batchEmails.filter(e =>
      e.OPERATION?.toLowerCase().includes('amend')
    ).length;

    this.issuanceToday = this.batchEmails.filter(e =>
      e.OPERATION?.toLowerCase().includes('issu')
    ).length;

    this.cancellationToday = this.batchEmails.filter(e =>
      e.OPERATION?.toLowerCase().includes('cancel')
    ).length;

    this.unknownToday = this.batchEmails.filter(e => {
      const op = e.OPERATION;
      return !op || op.trim() === '' || op.trim().toLowerCase() === 'none';
    }).length;

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
      this.normalizeSlaValue((e as any).SLAMEET ?? (e as any).SLAMET ?? e.SLA_MET) !== 'Y'
    ).length;

    this.slaMet = this.batchEmails.filter(e =>
      this.normalizeSlaValue((e as any).SLAMEET ?? (e as any).SLAMET ?? e.SLA_MET) === 'Y'
    ).length;
    this.slaBreach = this.batchEmails.filter(e =>
      this.normalizeSlaValue((e as any).SLAMEET ?? (e as any).SLAMET ?? e.SLA_MET) !== 'Y'
    ).length;

    const totalSla = this.slaMet + this.slaBreach;
    this.slaPercentage = totalSla
      ? Math.round((this.slaMet / totalSla) * 100)
      : 0;
  }

  // =========================
  // BUILD CHARTS
  // =========================
  private buildCharts(): void {

    // SLA Doughnut
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

    // SLA Trend: last 7 available dates (up to targetDate)
    const trendMap = new Map<string, { date: Date; met: number; breach: number }>();

    this.batchEmails
      .filter(e => new Date(e.EMAIL_RECEIVEDTIME) <= this.targetDate)
      .forEach(e => {
        const d = new Date(e.EMAIL_RECEIVEDTIME);
        d.setHours(0, 0, 0, 0);
        const key = d.toISOString().slice(0, 10);

        if (!trendMap.has(key)) {
          trendMap.set(key, { date: d, met: 0, breach: 0 });
        }

        const point = trendMap.get(key)!;
        const sla = this.normalizeSlaValue((e as any).SLAMEET ?? (e as any).SLAMET ?? e.SLA_MET);
        if (sla === 'Y') point.met += 1;
        if (sla !== 'Y') point.breach += 1;
      });

    let trendPoints = Array.from(trendMap.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(-7);

    if (!trendPoints.length) {
      trendPoints = [{ date: new Date(this.targetDate), met: 0, breach: 0 }];
    }

    this.slaTrendData = {
      labels: trendPoints.map(p => p.date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })),
      datasets: [
        {
          label: 'SLA Met',
          data: trendPoints.map(p => p.met),
          borderColor: '#2e7d32',
          backgroundColor: 'rgba(46, 125, 50, 0.15)',
          pointRadius: 3,
          pointHoverRadius: 4,
          tension: 0.35
        },
        {
          label: 'SLA Breach',
          data: trendPoints.map(p => p.breach),
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

    // Due Bar (unchanged)
    this.dueBarData = {
      labels: ['Due 24h', 'Due 48h', 'Overdue'],
      datasets: [
        { data: [this.due24, this.due48, this.overdue], label: 'Requests' }
      ]
    };

    this.dueBarOptions = {
      responsive: true,
      maintainAspectRatio: false
    };
  }

  // =========================
  // FILTER LOGIC
  // =========================
  onFilter(type: string): void {

    this.activeFilter = type;
    const target = this.targetDate.toDateString();

    this.displayedEmails = this.batchEmails.filter(e => {

      switch (type) {

        case 'total':
          return true;

        case 'urgent':
          return new Date(e.EMAIL_RECEIVEDTIME).toDateString() === target &&
                 e.EMAIL_CLASSIFICATION === 'Urgent';

        case 'amendment':
          return e.OPERATION?.toLowerCase().includes('amend');

        case 'issuance':
          return e.OPERATION?.toLowerCase().includes('issu');

        case 'cancellation':
          return e.OPERATION?.toLowerCase().includes('cancel');

        case 'unknown':
          const op = e.OPERATION;
          return !op || op.trim() === '' || op.trim().toLowerCase() === 'none';

        case 'due24':
          const d24 = new Date(this.targetDate);
          d24.setDate(d24.getDate() + 1);
          return new Date(e.SLA_DATE).toDateString() === d24.toDateString();

        case 'due48':
          const d48 = new Date(this.targetDate);
          d48.setDate(d48.getDate() + 2);
          return new Date(e.SLA_DATE).toDateString() === d48.toDateString();

        case 'overdue':
          return new Date(e.SLA_DATE) < this.targetDate &&
                 this.normalizeSlaValue((e as any).SLAMEET ?? (e as any).SLAMET ?? e.SLA_MET) !== 'Y';

        default:
          return true;
      }
    });

    this.totalEmails = this.displayedEmails.length;
    this.ensureValidTablePage();
  }

  clearFilter(): void {
    this.activeFilter = null;
    this.displayedEmails = [...this.batchEmails];
    this.totalEmails = this.displayedEmails.length;
    this.ensureValidTablePage();
  }

  openDetail(row: EmailDetail): void {
    this.selectedRow = row;
  }

  handleSavedRow(event: { rowId: number; changes: Partial<EmailDetail> & Record<string, unknown> }): void {
    this.applySavedRowUpdate(event);
  }

  closeDetail(): void {
    this.selectedRow = undefined;
  }

  handlePage(event: any): void {
    if (this.suppressPageEvent || (this.loading && this.pendingRestoreFirst !== null)) {
      return;
    }
    this.tableFirst = event.first ?? 0;
    this.tableRows = event.rows ?? this.tableRows;
  }

  private ensureValidTablePage(): void {
    if (this.tableRows <= 0) {
      this.tableRows = 10;
    }

    const maxFirst = this.totalEmails > 0
      ? Math.floor((this.totalEmails - 1) / this.tableRows) * this.tableRows
      : 0;

    if (this.tableFirst > maxFirst) {
      this.tableFirst = maxFirst;
    }

    this.applyPaginatorState(this.tableFirst);
  }

  private restoreTablePageIfNeeded(): void {
    if (this.pendingRestoreFirst === null) {
      return;
    }

    const desiredFirst = this.pendingRestoreFirst;
    this.pendingRestoreFirst = null;

    const maxFirst = this.totalEmails > 0
      ? Math.floor((this.totalEmails - 1) / this.tableRows) * this.tableRows
      : 0;
    const restoredFirst = Math.min(desiredFirst, maxFirst);

    this.suppressPageEvent = true;
    this.applyPaginatorState(restoredFirst);
    setTimeout(() => {
      this.applyPaginatorState(restoredFirst);
    }, 0);
    setTimeout(() => {
      this.applyPaginatorState(restoredFirst);
      this.suppressPageEvent = false;
    }, 120);
  }

  private applyPaginatorState(first: number): void {
    this.tableFirst = first;
    if (this.dataTable) {
      this.dataTable.rows = this.tableRows;
      this.dataTable.first = first;
    }
  }

  private refreshChartLayout(): void {
    // Run twice to handle route/layout settling before chart sizing locks in.
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
    return new Date(value).toLocaleDateString('en-GB');
  }
}
