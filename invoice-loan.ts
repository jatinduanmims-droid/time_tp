import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, NgIf, NgFor, DatePipe } from '@angular/common';
import { Table, TableModule } from 'primeng/table'; // <p-table>, <p-sortIcon>, <p-columnFilter>
import { CreditControls, InvoiceLoan as InvoiceLoanRecord } from '../../services/credit-controls';
import { InvoiceLoanDetailComponent, InvoiceLoanDetailRecord } from './invoice-loan-detail.component';

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
    InvoiceLoanDetailComponent
  ],
  templateUrl: './invoice-loan.html',
  styleUrl: './invoice-loan.css'
})
export class InvoiceLoanComponent implements OnInit {
  @ViewChild('dt') private dataTable?: Table;

  invoiceLoans: InvoiceLoanSummaryRow[] = [];
  rawInvoiceLoans: InvoiceLoanRecord[] = [];
  loading = true;
  today = new Date();
  latestReceivedDate: string | null = null;
  selectedSummaryRow?: InvoiceLoanSummaryRow;
  selectedDetailRows: InvoiceLoanDetailRecord[] = [];
  private detailRowsByGroup = new Map<string, InvoiceLoanDetailRecord[]>();

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

  constructor(private credit: CreditControls) {}

  // Load the invoice-loan dataset once when the page opens so both the summary grid and detail modal use the same response.
  ngOnInit(): void {
    this.fetchInvoiceLoans();
  }

  // Fetch the raw report data, then build grouped summary rows and a lookup map for opening drill-down details instantly.
  fetchInvoiceLoans(): void {
    this.loading = true;

    this.credit.getInvoiceLoanReport().subscribe({
      next: (data) => {
        this.rawInvoiceLoans = data;
        this.invoiceLoans = this.buildSummaryRows(data);
        this.totalRecords = this.invoiceLoans.length;
        this.latestReceivedDate = this.invoiceLoans[0]?.FILE_RECEIVED_DATE ?? null;
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
}
