import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf, NgFor, DatePipe } from '@angular/common';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { CreditControls, InvoiceLoan as InvoiceLoanRecord } from '../../services/credit-controls';

@Component({
  selector: 'app-invoice-loan',
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    NgFor,
    TableModule,
    DialogModule,
    DatePipe
  ],
  templateUrl: './invoice-loan.html',
  styleUrl: './invoice-loan.scss'
})
export class InvoiceLoanComponent implements OnInit {

  invoiceLoans: InvoiceLoanRecord[] = [];
  loading = true;

  totalRecords = 0;
  tableRows = 20;
  tableFirst = 0;

  // 🔥 Popup state
  selectedRow: any = null;
  displayDialog = false;

  cols = [
    { field: 'INVOICE_REF_NO', header: 'Invoice Ref', align: 'center' },
    { field: 'EFFECTIVE_DATE', header: 'Effective Date', type: 'date', align: 'center' },
    { field: 'INVOICE_FILE_NAME', header: 'Invoice File', align: 'center' },
    { field: 'INVOICE_MATURITY_DATE', header: 'Inv Maturity', type: 'date', align: 'center' },
    { field: 'LOAN_REFERENCE', header: 'Loan Ref', align: 'center' },
    { field: 'LOAN_FILE_NAME', header: 'Loan File', align: 'center' },
    { field: 'LOAN_MATURITY_DATE', header: 'Loan Maturity', type: 'date', align: 'center' }
  ];

  constructor(private credit: CreditControls) {}

  ngOnInit(): void {
    this.fetchInvoiceLoans();
  }

  fetchInvoiceLoans(): void {
    this.loading = true;

    this.credit.getInvoiceLoanReport().subscribe({
      next: (data) => {
        this.invoiceLoans = data;
        this.totalRecords = data.length;
        this.loading = false;
      },
      error: (err) => {
        console.error('Invoice loan load error', err);
        this.loading = false;
      }
    });
  }

  handlePage(event: any): void {
    this.tableFirst = event.first;
    this.tableRows = event.rows;
  }

  clearFilter(): void {
    this.fetchInvoiceLoans();
  }

  // 🔥 Row click handler
  openRow(row: any): void {
    this.selectedRow = row;
    this.displayDialog = true;
  }
}