import { Component, OnInit, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { CommonModule, NgIf, NgFor, DatePipe } from '@angular/common';
import { Table, TableModule } from 'primeng/table'; // <p-table>, <p-sortIcon>, <p-columnFilter>
import { CreditControls, InvoiceLoan as InvoiceLoanRecord } from '../../services/credit-controls';
import { InvoiceLoanDetailComponent, InvoiceLoanDetailRecord } from './invoice-loan-detail.component';
import { BaseChartDirective, NgChartsModule } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

export type InvoiceLoanSummaryRow = {
  groupKey: string;
  CLIENT_NAME: string;
  invoiceCount: number;
  FILE_RECEIVED_DATE: string | null;
  LOAN_FILE_NAME: string;
  INVOICE_FILE_NAME: string;
  MASTER_RECON_FLAG: 'Yes' | 'No';
};

@Component({
  selector: 'app-invoice-loan',
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    NgFor,
    TableModule,
    DatePipe,
    InvoiceLoanDetailComponent,
    NgChartsModule,
    FormsModule
  ],
  templateUrl: './invoice-loan.html',
  styleUrl: './invoice-loan.css'
})
export class InvoiceLoanComponent implements OnInit {
  @ViewChildren(BaseChartDirective) private charts!: QueryList<BaseChartDirective>;
  @ViewChild('dt') private dataTable?: Table;

  invoiceLoans: InvoiceLoanSummaryRow[] = [];
  rawInvoiceLoans: InvoiceLoanRecord[] = [];
  allRawInvoiceLoans: InvoiceLoanRecord[] = [];
  loading = true;
  today = new Date();
  latestReceivedDate: string | null = null;
  selectedSummaryRow?: InvoiceLoanSummaryRow;
  selectedDetailRows: InvoiceLoanDetailRecord[] = [];
  private detailRowsByGroup = new Map<string, InvoiceLoanDetailRecord[]>();
  clientOptions: string[] = ['All Clients'];
  selectedClient = 'All Clients';
  drilldownDate: string | null = null;

  totalInvoices = 0;
  totalClients = 0;
  reconPassed = 0;
  reconFailed = 0;
  latestFileDateLabel = '-';
  reconPercentage = 0;

  reconDoughnutData!: ChartData<'doughnut'>;
  reconDoughnutOptions!: ChartOptions<'doughnut'>;
  invoiceTrendData!: ChartData<'line'>;
  invoiceTrendOptions!: ChartOptions<'line'>;

  totalRecords = 0;
  tableRows = 10;   // rows per page
  tableFirst = 0;   // first row index for pagination

  cols = [
    { field: 'CLIENT_NAME', header: 'Client Name' },
    { field: 'invoiceCount', header: 'Count of Invoices', align: 'center' },
    { field: 'FILE_RECEIVED_DATE', header: 'File Received Date', type: 'date', align: 'center' },
    { field: 'LOAN_FILE_NAME', header: 'Loan File Name' },
    { field: 'INVOICE_FILE_NAME', header: 'Invoice File Name' },
    { field: 'MASTER_RECON_FLAG', header: 'Master Recon Flag', align: 'center' },
  ];

  constructor(
    private credit: CreditControls,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  // Load the invoice-loan dataset once when the page opens so both the summary grid and detail modal use the same response.
  ngOnInit(): void {
    // Drilldown date comes from the dashboard query param.
    // To remove dashboard-to-page date drilldown later, delete this subscription and the filter helpers below.
    this.route.queryParamMap.subscribe((params) => {
      this.drilldownDate = params.get('date');
      this.applyInvoiceLoanDateFilter();
    });

    this.fetchInvoiceLoans();
  }

  // Fetch the raw report data, then build grouped summary rows and a lookup map for opening drill-down details instantly.
  fetchInvoiceLoans(): void {
    this.loading = true;

    this.credit.getInvoiceLoanReport().subscribe({
      next: (data) => {
        this.allRawInvoiceLoans = data;
        this.applyInvoiceLoanDateFilter();
        this.tableFirst = 0;
        this.loading = false;
      },
      error: (err) => {
        console.error('Invoice-Loan load error', err);
        this.loading = false;
      }
    });
  }

  // Keep paginator state in sync with the main summary table exactly like the dashboard screen does.
  handlePage(event: any): void {
    this.tableFirst = event.first;
    this.tableRows = event.rows;
  }

  // Clear PrimeNG filters and return the main table to the first page without refetching data.
  clearFilter(): void {
    this.dataTable?.clear();
    this.tableFirst = 0;

    // If the page was opened from the dashboard with a specific date, Clear Filter also removes that date drilldown.
    if (this.drilldownDate) {
      this.drilldownDate = null;
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { date: null },
        queryParamsHandling: 'merge'
      });
      this.applyInvoiceLoanDateFilter();
    }
  }

  // Update the line chart whenever the user changes the client dropdown above the analytics section.
  onClientChange(): void {
    this.buildTrendChart();
    this.refreshChartLayout();
  }

  // Open the standalone detail component by passing the selected grouped row and the raw records behind it.
  openDetail(row: InvoiceLoanSummaryRow): void {
    this.selectedSummaryRow = row;
    this.selectedDetailRows = [...(this.detailRowsByGroup.get(row.groupKey) ?? [])];
  }

  // Close the standalone detail component and remove the current selection from parent state.
  closeDetail(): void {
    this.selectedSummaryRow = undefined;
    this.selectedDetailRows = [];
  }

  // Derive KPI values, dropdown options, and chart datasets from the already-fetched invoice-loan response.
  private buildAnalytics(): void {
    this.totalInvoices = this.rawInvoiceLoans.length;
    this.totalClients = new Set(
      this.invoiceLoans.map((row) => this.normalizeText(row.CLIENT_NAME)).filter(Boolean)
    ).size;
    this.reconPassed = this.invoiceLoans.filter((row) => row.MASTER_RECON_FLAG === 'Yes').length;
    this.reconFailed = this.invoiceLoans.length - this.reconPassed;
    this.latestFileDateLabel = this.latestReceivedDate ?? '-';
    this.reconPercentage = this.invoiceLoans.length
      ? Math.round((this.reconPassed / this.invoiceLoans.length) * 100)
      : 0;

    this.clientOptions = [
      'All Clients',
      ...Array.from(new Set(
        this.rawInvoiceLoans
          .map((record) => this.normalizeText(record.CLIENT_NAME))
          .filter(Boolean)
      )).sort((a, b) => a.localeCompare(b))
    ];

    if (!this.clientOptions.includes(this.selectedClient)) {
      this.selectedClient = 'All Clients';
    }

    this.buildReconChart();
    this.buildTrendChart();
    this.refreshChartLayout();
  }

  // Apply the optional dashboard date drilldown to the invoice-loan page.
  // HOW TO EDIT:
  // - If you want dashboard drilldown to filter a different field, change the `normalizeDate(record.FILE_RECEIVED_DATE)` comparison below.
  // - If you want the page to keep analytics unfiltered but only filter the table, move this logic so it only changes `invoiceLoans`.
  private applyInvoiceLoanDateFilter(): void {
    const sourceRows = this.drilldownDate
      ? this.allRawInvoiceLoans.filter((record) => this.normalizeDate(record.FILE_RECEIVED_DATE) === this.drilldownDate)
      : [...this.allRawInvoiceLoans];

    this.rawInvoiceLoans = sourceRows;
    this.invoiceLoans = this.buildSummaryRows(sourceRows);
    this.totalRecords = this.invoiceLoans.length;
    this.latestReceivedDate = this.invoiceLoans[0]?.FILE_RECEIVED_DATE ?? null;
    this.buildAnalytics();
  }

  // Build the doughnut chart that shows how many grouped rows passed or failed master recon.
  private buildReconChart(): void {
    this.reconDoughnutData = {
      labels: ['Master Recon Yes', 'Master Recon No'],
      datasets: [{
        data: [this.reconPassed, this.reconFailed],
        backgroundColor: ['#0f7a55', '#e3ebe7'],
        hoverBackgroundColor: ['#0a5c41', '#d2ddd7'],
        borderWidth: 0
      }]
    };

    this.reconDoughnutOptions = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context) => `${context.label}: ${context.parsed}`
          }
        }
      }
    };
  }

  // Build the daily invoice-count line chart for either all clients together or the single client selected in the dropdown.
  private buildTrendChart(): void {
    const filteredRecords = this.selectedClient === 'All Clients'
      ? this.rawInvoiceLoans
      : this.rawInvoiceLoans.filter((record) => this.normalizeText(record.CLIENT_NAME) === this.selectedClient);

    const countsByDate = new Map<string, number>();
    for (const record of filteredRecords) {
      const receivedDate = this.normalizeDate(record.FILE_RECEIVED_DATE);
      if (!receivedDate) {
        continue;
      }
      countsByDate.set(receivedDate, (countsByDate.get(receivedDate) ?? 0) + 1);
    }

    const labels = Array.from(countsByDate.keys()).sort((a, b) => a.localeCompare(b));
    const data = labels.map((label) => countsByDate.get(label) ?? 0);

    this.invoiceTrendData = {
      labels,
      datasets: [{
        label: 'Daily invoice count',
        data,
        borderColor: '#2d6dbd',
        backgroundColor: 'rgba(45, 109, 189, 0.12)',
        fill: true,
        tension: 0.35,
        pointRadius: 4,
        pointHoverRadius: 5,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#2d6dbd',
        pointBorderWidth: 2
      }]
    };

    this.invoiceTrendOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#5f6f68',
            maxRotation: 0
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
            color: '#5f6f68'
          },
          grid: {
            color: '#d9e4de',
            borderDash: [4, 4]
          }
        }
      }
    };
  }

  // Group the raw API rows into the six-column summary table and store the underlying raw rows for modal drill-down.
  private buildSummaryRows(data: InvoiceLoanRecord[]): InvoiceLoanSummaryRow[] {
    const groupedRows = new Map<string, { row: InvoiceLoanSummaryRow; allYes: boolean }>();
    this.detailRowsByGroup = new Map<string, InvoiceLoanDetailRecord[]>();

    for (const record of data) {
      const receivedDate = this.normalizeDate(record.FILE_RECEIVED_DATE);
      const clientName = this.normalizeText(record.CLIENT_NAME);
      const loanFileName = this.normalizeText(record.LOAN_FILE_NAME);
      const invoiceFileName = this.normalizeText(record.INVOICE_FILE_NAME);
      const key = [clientName, receivedDate ?? '', loanFileName, invoiceFileName].join('|');
      const masterReconFlag = this.isYes(record.MASTER_RECON_FLAG);

      if (!this.detailRowsByGroup.has(key)) {
        this.detailRowsByGroup.set(key, []);
      }
      this.detailRowsByGroup.get(key)!.push(record as unknown as InvoiceLoanDetailRecord);

      if (!groupedRows.has(key)) {
        groupedRows.set(key, {
          row: {
            groupKey: key,
            CLIENT_NAME: clientName,
            invoiceCount: 0,
            FILE_RECEIVED_DATE: receivedDate,
            LOAN_FILE_NAME: loanFileName,
            INVOICE_FILE_NAME: invoiceFileName,
            MASTER_RECON_FLAG: 'Yes'
          },
          allYes: true
        });
      }

      const group = groupedRows.get(key)!;
      group.row.invoiceCount += 1;
      group.allYes = group.allYes && masterReconFlag;
      group.row.MASTER_RECON_FLAG = group.allYes ? 'Yes' : 'No';
    }

    return Array.from(groupedRows.values())
      .map((group) => group.row)
      .sort((a, b) => {
        const dateCompare = (b.FILE_RECEIVED_DATE ?? '').localeCompare(a.FILE_RECEIVED_DATE ?? '');
        if (dateCompare !== 0) {
          return dateCompare;
        }

        return a.CLIENT_NAME.localeCompare(b.CLIENT_NAME);
      });
  }

  // Normalize date values into a stable yyyy-MM-dd string so grouping stays consistent even when timestamps differ.
  private normalizeDate(value: unknown): string | null {
    if (!value) {
      return null;
    }

    const parsed = new Date(String(value));
    if (Number.isNaN(parsed.getTime())) {
      return String(value);
    }

    return parsed.toISOString().slice(0, 10);
  }

  // Normalize text fields before grouping so blanks and extra spaces do not create duplicate summary rows.
  private normalizeText(value: unknown): string {
    return String(value ?? '').trim();
  }

  // Normalize Yes/No flags from the API so the group-level master recon result is reliable.
  private isYes(value: unknown): boolean {
    return String(value ?? '').trim().toLowerCase() === 'yes';
  }

  // Resize the charts after data changes so the canvas settles cleanly inside the responsive dashboard cards.
  private refreshChartLayout(): void {
    setTimeout(() => {
      this.charts?.forEach((chart) => {
        chart.chart?.resize();
        chart.update();
      });
    }, 0);
  }
}
