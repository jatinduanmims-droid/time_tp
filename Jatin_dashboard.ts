import { AfterViewInit, Component, HostListener, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmailService } from '../services/email.service';
import { EmailDetail } from '../services/email.service';
import { BaseChartDirective, NgChartsModule } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { Table, TableModule } from 'primeng/table';
import { EmailDetailComponent } from '../email-detail/email-detail.component';
import { ActivatedRoute, Router } from '@angular/router';

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
  targetDate: Date = new Date();

  // =========================
  // DATA
  // =========================
  batchEmails: EmailDetail[] = [];
  displayedEmails: EmailDetail[] = [];
  dashboardDrilldownDate: string | null = null;
  activeFilter: string | null = null;
  activeTableAction: 'scoring' | 'graph' | 'report' | 'export' = 'scoring';
  graphDate: string | null = null;
  reportDate: string | null = null;
  openCalendar: 'graph' | 'report' | null = null;
  graphCalendarMonth: Date = this.startOfMonth(new Date());
  reportCalendarMonth: Date = this.startOfMonth(new Date());
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
  chartSlaMet = 0;
  chartSlaBreach = 0;
  chartSlaPercentage = 0;

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

  constructor(
    private emailSrv: EmailService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  get isGraphMode(): boolean {
    return this.activeTableAction === 'graph';
  }

  get graphDateDisplay(): string {
    if (!this.graphDate) {
      return 'No date selected';
    }

    const parsed = new Date(this.graphDate);
    return Number.isNaN(parsed.getTime())
      ? this.graphDate
      : parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  get chartContextSummary(): string {
    if (!this.isGraphMode) {
      return '+12 from yesterday';
    }

    const count = this.displayedEmails.length;
    return `${count} request${count === 1 ? '' : 's'} for ${this.graphDateDisplay}`;
  }

  get calendarWeekdays(): string[] {
    return ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  }

  get graphCalendarLabel(): string {
    return this.graphCalendarMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  }

  get reportCalendarLabel(): string {
    return this.reportCalendarMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  }

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
    this.rebuildTableActionView();
    this.buildCharts();
    this.refreshChartLayout();
  }

  private normalizeSlaValue(value: unknown): 'Y' | 'N' {
    return String(value ?? '').trim().toUpperCase() === 'Y' ? 'Y' : 'N';
  }

  ngOnInit(): void {
    // Dashboard drilldown support:
    // when `demo.dashboard` opens this page with `?date=YYYY-MM-DD`,
    // we use that date as the target date and filter the table to that day.
    this.route.queryParamMap.subscribe((params) => {
      const dateParam = params.get('date');

      this.dashboardDrilldownDate = dateParam;
      if (dateParam) {
        const parsed = new Date(dateParam);
        if (!Number.isNaN(parsed.getTime())) {
          parsed.setHours(0, 0, 0, 0);
          this.targetDate = parsed;
        }
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        this.targetDate = today;
      }

      this.applyDashboardDateFilter();

      if (this.batchEmails.length) {
        this.calculateKpis();
        this.rebuildTableActionView();
        this.buildCharts();
        this.refreshChartLayout();
      }
    });

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
        this.applyDashboardDateFilter();
        this.ensureValidTablePage();
        this.restoreTablePageIfNeeded();

        this.calculateKpis();
        this.rebuildTableActionView();
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
    const sourceRows = this.getDrilldownRows();

    const target = this.targetDate.toDateString();

    this.totalToday = sourceRows.filter(e =>
      new Date(e.EMAIL_RECEIVEDTIME).toDateString() === target
    ).length;

    this.urgentToday = sourceRows.filter(e =>
      new Date(e.EMAIL_RECEIVEDTIME).toDateString() === target &&
      e.EMAIL_CLASSIFICATION === 'Urgent'
    ).length;

    this.amendmentsToday = sourceRows.filter(e =>
      new Date(e.EMAIL_RECEIVEDTIME).toDateString() === target &&
      e.OPERATION?.toLowerCase().includes('amend')
    ).length;

    this.issuanceToday = sourceRows.filter(e =>
      new Date(e.EMAIL_RECEIVEDTIME).toDateString() === target &&
      e.OPERATION?.toLowerCase().includes('issu')
    ).length;

    this.cancellationToday = sourceRows.filter(e =>
      new Date(e.EMAIL_RECEIVEDTIME).toDateString() === target &&
      e.OPERATION?.toLowerCase().includes('cancel')
    ).length;

    this.unknownToday = sourceRows.filter(e => {
      if (new Date(e.EMAIL_RECEIVEDTIME).toDateString() !== target) {
        return false;
      }
      const op = e.OPERATION;
      return !op || op.trim() === '' || op.trim().toLowerCase() === 'none';
    }).length;

    const d24 = new Date(this.targetDate);
    d24.setDate(d24.getDate() + 1);

    const d48 = new Date(this.targetDate);
    d48.setDate(d48.getDate() + 2);

    this.due24 = sourceRows.filter(e =>
      new Date(e.EMAIL_RECEIVEDTIME).toDateString() === target &&
      new Date(e.SLA_DATE).toDateString() === d24.toDateString()
    ).length;

    this.due48 = sourceRows.filter(e =>
      new Date(e.EMAIL_RECEIVEDTIME).toDateString() === target &&
      new Date(e.SLA_DATE).toDateString() === d48.toDateString()
    ).length;

    this.overdue = sourceRows.filter(e =>
      new Date(e.EMAIL_RECEIVEDTIME).toDateString() === target &&
      new Date(e.SLA_DATE) < this.targetDate &&
      this.normalizeSlaValue((e as any).SLAMEET ?? (e as any).SLAMET ?? e.SLA_MET) !== 'Y'
    ).length;

    this.slaMet = sourceRows.filter(e =>
      new Date(e.EMAIL_RECEIVEDTIME).toDateString() === target &&
      this.normalizeSlaValue((e as any).SLAMEET ?? (e as any).SLAMET ?? e.SLA_MET) === 'Y'
    ).length;
    this.slaBreach = sourceRows.filter(e =>
      new Date(e.EMAIL_RECEIVEDTIME).toDateString() === target &&
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
    const chartRows = this.getChartRows();
    this.chartSlaMet = chartRows.filter(e =>
      this.normalizeSlaValue((e as any).SLAMEET ?? (e as any).SLAMET ?? e.SLA_MET) === 'Y'
    ).length;
    this.chartSlaBreach = chartRows.filter(e =>
      this.normalizeSlaValue((e as any).SLAMEET ?? (e as any).SLAMET ?? e.SLA_MET) !== 'Y'
    ).length;

    const chartTotalSla = this.chartSlaMet + this.chartSlaBreach;
    this.chartSlaPercentage = chartTotalSla
      ? Math.round((this.chartSlaMet / chartTotalSla) * 100)
      : 0;

    // SLA Doughnut
    this.slaLineData = {
      labels: ['SLA Met', 'SLA Breach'],
      datasets: [{
        data: [this.chartSlaMet, this.chartSlaBreach],
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

    if (this.isGraphMode) {
      this.slaTrendData = {
        labels: ['Amendment', 'Issuance', 'Cancellation', 'Urgent', 'Unknown'],
        datasets: [
          {
            label: this.graphDateDisplay,
            data: [
              chartRows.filter(e => e.OPERATION?.toLowerCase().includes('amend')).length,
              chartRows.filter(e => e.OPERATION?.toLowerCase().includes('issu')).length,
              chartRows.filter(e => e.OPERATION?.toLowerCase().includes('cancel')).length,
              chartRows.filter(e => e.EMAIL_CLASSIFICATION === 'Urgent').length,
              chartRows.filter(e => {
                const op = e.OPERATION;
                return !op || op.trim() === '' || op.trim().toLowerCase() === 'none';
              }).length
            ],
            borderColor: '#2d6dbd',
            backgroundColor: 'rgba(45, 109, 189, 0.16)',
            pointBackgroundColor: '#2d6dbd',
            pointBorderColor: '#ffffff',
            pointRadius: 4,
            pointHoverRadius: 5,
            tension: 0.28,
            fill: true
          }
        ]
      };
    } else {
      // Keep the non-graph trend aligned with the current drilldown scope.
      const trendMap = new Map<string, { date: Date; met: number; breach: number }>();
      const trendRows = this.getDrilldownRows();

      trendRows
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
    }

    this.slaTrendOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 360,
        easing: 'easeOutQuart'
      },
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
    this.rebuildTableActionView();
    this.buildCharts();
  }

  clearFilter(): void {
    this.activeFilter = null;
    this.applyDashboardDateFilter();
    this.rebuildTableActionView();
    this.buildCharts();
    this.ensureValidTablePage();

    if (this.dashboardDrilldownDate) {
      this.dashboardDrilldownDate = null;
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { date: null },
        queryParamsHandling: 'merge'
      });
    }
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

  setTableAction(action: 'scoring' | 'graph' | 'report' | 'export'): void {
    this.activeTableAction = action;

    if (action === 'graph') {
      const latestDate = this.findLatestAvailableGraphDate();
      if (latestDate) {
        this.graphDate = latestDate;
        this.graphCalendarMonth = this.startOfMonth(new Date(latestDate));
      }
      this.openCalendar = this.openCalendar === 'graph' ? null : 'graph';
    }

    if (action === 'report') {
      if (!this.reportDate) {
        this.reportDate = this.getSelectedReportDate(this.getRowsForCurrentFilter());
      }
      if (this.reportDate) {
        this.reportCalendarMonth = this.startOfMonth(new Date(this.reportDate));
      }
      this.openCalendar = this.openCalendar === 'report' ? null : 'report';
    }

    if (action !== 'graph' && action !== 'report') {
      this.openCalendar = null;
    }

    this.rebuildTableActionView();
    this.buildCharts();
    this.refreshChartLayout();
  }

  downloadReport(): void {
    const baseRows = this.getRowsForCurrentFilter();
    const selectedDate = this.getSelectedReportDate(baseRows);
    if (!selectedDate) {
      return;
    }

    const reportRows = baseRows
      .filter(email => this.getEmailDateKey(email) === selectedDate)
      .sort((a, b) => new Date(b.EMAIL_RECEIVEDTIME).getTime() - new Date(a.EMAIL_RECEIVEDTIME).getTime());

    const blob = new Blob(
      [this.buildExcelReportHtml(reportRows, selectedDate)],
      { type: 'application/vnd.ms-excel;charset=utf-8;' }
    );

    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `jatin-dashboard-report-${selectedDate}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  }

  selectGraphCalendarDate(date: string): void {
    this.graphDate = date;
    this.graphCalendarMonth = this.startOfMonth(new Date(date));
    this.openCalendar = null;
    this.rebuildTableActionView();
    this.buildCharts();
    this.refreshChartLayout();
  }

  selectReportCalendarDate(date: string): void {
    this.reportDate = date;
    this.reportCalendarMonth = this.startOfMonth(new Date(date));
    this.openCalendar = null;
    this.downloadReport();
  }

  changeCalendarMonth(type: 'graph' | 'report', delta: number): void {
    const source = type === 'graph' ? this.graphCalendarMonth : this.reportCalendarMonth;
    const shifted = new Date(source);
    shifted.setMonth(shifted.getMonth() + delta);

    if (type === 'graph') {
      this.graphCalendarMonth = this.startOfMonth(shifted);
      return;
    }

    this.reportCalendarMonth = this.startOfMonth(shifted);
  }

  getCalendarDays(type: 'graph' | 'report'): Array<{
    date: string;
    day: number;
    inMonth: boolean;
    selected: boolean;
    hasData: boolean;
  }> {
    const month = type === 'graph' ? this.graphCalendarMonth : this.reportCalendarMonth;
    const selectedDate = type === 'graph' ? this.graphDate : this.reportDate;
    const monthStart = new Date(month);
    const gridStart = new Date(monthStart);
    gridStart.setDate(1 - gridStart.getDay());
    const rows = this.getRowsForCurrentFilter();

    return Array.from({ length: 42 }, (_, index) => {
      const current = new Date(gridStart);
      current.setDate(gridStart.getDate() + index);
      const key = this.toDateKey(current);

      return {
        date: key,
        day: current.getDate(),
        inMonth: current.getMonth() === monthStart.getMonth(),
        selected: selectedDate === key,
        hasData: rows.some(email => this.getEmailDateKey(email) === key)
      };
    });
  }

  // Apply the optional dashboard date drilldown to the main table.
  // HOW TO EDIT:
  // - If you want the dashboard drilldown to affect KPIs only and not the table, remove this filter from `displayedEmails`.
  // - If you want to filter by a different email date field, change the `EMAIL_RECEIVEDTIME` comparison here.
  // - If you want to stop the dashboard from passing a date at all, edit `getControlDrilldownRoute()` / `openControlDrilldown()`
  //   in `demo.dashboard.ts` instead of changing this page logic.
  private applyDashboardDateFilter(): void {
    if (!this.batchEmails.length) {
      this.displayedEmails = [];
      this.totalEmails = 0;
      return;
    }

    if (!this.dashboardDrilldownDate) {
      if (!this.activeFilter) {
        this.displayedEmails = [...this.batchEmails];
        this.totalEmails = this.displayedEmails.length;
      }
      return;
    }

    this.displayedEmails = this.batchEmails.filter((email) => {
      const receivedDate = new Date(email.EMAIL_RECEIVEDTIME);
      receivedDate.setHours(0, 0, 0, 0);
      return receivedDate.toISOString().slice(0, 10) === this.dashboardDrilldownDate;
    });
    this.totalEmails = this.displayedEmails.length;
  }

  private rebuildTableActionView(): void {
    const baseRows = this.getRowsForCurrentFilter();

    if (this.activeTableAction === 'graph') {
      const latestDate = this.findLatestAvailableGraphDate(baseRows);
      if (!this.graphDate || !baseRows.some(email => this.getEmailDateKey(email) === this.graphDate)) {
        this.graphDate = latestDate;
      }

      const graphRows = this.graphDate
        ? baseRows.filter(email => this.getEmailDateKey(email) === this.graphDate)
        : baseRows;

      this.displayedEmails = [...graphRows].sort((a, b) =>
        new Date(b.EMAIL_RECEIVEDTIME).getTime() - new Date(a.EMAIL_RECEIVEDTIME).getTime()
      );
      this.totalEmails = this.displayedEmails.length;
    } else {
      this.displayedEmails = [...baseRows];
      this.totalEmails = this.displayedEmails.length;
      this.graphDate = null;
    }

    this.ensureValidTablePage();
  }

  private getChartRows(): EmailDetail[] {
    if (!this.isGraphMode) {
      return this.getDrilldownRows();
    }

    const baseRows = this.getRowsForCurrentFilter();
    const selectedDate = this.graphDate || this.findLatestAvailableGraphDate(baseRows);
    if (!selectedDate) {
      return [];
    }

    return baseRows.filter(email => this.getEmailDateKey(email) === selectedDate);
  }

  private getRowsForCurrentFilter(): EmailDetail[] {
    const baseRows = this.getDrilldownRows();

    if (!this.activeFilter) {
      return [...baseRows];
    }

    const target = this.targetDate.toDateString();

    return baseRows.filter(e => {
      switch (this.activeFilter) {
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
        case 'unknown': {
          const op = e.OPERATION;
          return !op || op.trim() === '' || op.trim().toLowerCase() === 'none';
        }
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
          return new Date(e.SLA_DATE) < this.targetDate &&
            this.normalizeSlaValue((e as any).SLAMEET ?? (e as any).SLAMET ?? e.SLA_MET) !== 'Y';
        default:
          return true;
      }
    });
  }

  private getDrilldownRows(): EmailDetail[] {
    if (!this.dashboardDrilldownDate) {
      return [...this.batchEmails];
    }

    return this.batchEmails.filter((email) => {
      const receivedDate = new Date(email.EMAIL_RECEIVEDTIME);
      receivedDate.setHours(0, 0, 0, 0);
      return receivedDate.toISOString().slice(0, 10) === this.dashboardDrilldownDate;
    });
  }

  private findLatestAvailableGraphDate(rows: EmailDetail[] = this.getRowsForCurrentFilter()): string | null {
    const dates = rows
      .map(email => this.getEmailDateKey(email))
      .filter((date): date is string => !!date)
      .sort();

    return dates.length ? dates[dates.length - 1] : null;
  }

  private getSelectedReportDate(rows: EmailDetail[]): string | null {
    if (this.reportDate && rows.some(email => this.getEmailDateKey(email) === this.reportDate)) {
      return this.reportDate;
    }

    return this.findLatestAvailableGraphDate(rows);
  }

  private getEmailDateKey(email: EmailDetail): string {
    const receivedDate = new Date(email.EMAIL_RECEIVEDTIME);
    receivedDate.setHours(0, 0, 0, 0);
    return receivedDate.toISOString().slice(0, 10);
  }

  private toDateKey(date: Date): string {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized.toISOString().slice(0, 10);
  }

  private startOfMonth(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    normalized.setDate(1);
    return normalized;
  }

  private buildExcelReportHtml(rows: EmailDetail[], reportDate: string): string {
    const generatedAt = new Date().toLocaleString('en-GB');
    const reportDateDisplay = new Date(reportDate).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    const headerCells = this.cols
      .map(col => `<th>${this.escapeHtml(col.header)}</th>`)
      .join('');

    const bodyRows = rows.map(row => {
      const cells = this.cols.map(col => {
        const rawValue = this.getReportCellValue(row, col.field);
        return `<td>${this.escapeHtml(rawValue)}</td>`;
      }).join('');

      return `<tr>${cells}</tr>`;
    }).join('');

    return `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:x="urn:schemas-microsoft-com:office:excel"
            xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="UTF-8">
          <meta name="ProgId" content="Excel.Sheet">
          <style>
            body { font-family: Calibri, Arial, sans-serif; padding: 20px; color: #23313f; }
            h1 { margin: 0 0 6px; font-size: 22px; }
            p { margin: 0 0 4px; font-size: 12px; color: #5f6f68; }
            table { border-collapse: collapse; width: 100%; margin-top: 18px; }
            th, td { border: 1px solid #d7e0dc; padding: 8px 10px; font-size: 12px; text-align: left; }
            th { background: #edf5f0; font-weight: 700; }
            tr:nth-child(even) td { background: #f8fbfa; }
          </style>
        </head>
        <body>
          <h1>Jatin Dashboard Report</h1>
          <p>Report Date: ${this.escapeHtml(reportDateDisplay)}</p>
          <p>Total Rows: ${rows.length}</p>
          <p>Generated At: ${this.escapeHtml(generatedAt)}</p>

          <table>
            <thead>
              <tr>${headerCells}</tr>
            </thead>
            <tbody>
              ${bodyRows}
            </tbody>
          </table>
        </body>
      </html>
    `;
  }

  private getReportCellValue(row: EmailDetail, field: string): string {
    if (field === 'SLAMEET') {
      return this.normalizeSlaValue((row as any)[field] ?? (row as any).SLAMET ?? row.SLA_MET) === 'Y' ? 'Yes' : 'No';
    }

    const value = (row as Record<string, unknown>)[field];
    return value == null ? '' : String(value);
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
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
