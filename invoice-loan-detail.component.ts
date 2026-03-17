import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule, DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { TableModule } from 'primeng/table';

export type InvoiceLoanDetailRecord = {
  INVOICE_REF_NO?: string;
  LOAN_REFERENCE?: string;
  INVOICE_MATURITY_DATE?: string | Date | null;
  LOAN_MATURITY_DATE?: string | Date | null;
  CONFIRMED_NET_DISCOUNT?: string | number | null;
  PURCHASE_PRICE?: string | number | null;
  DISCOUNT_DATE?: string | Date | null;
  EFFECTIVE_DATE?: string | Date | null;
  INV_LOAN_REF_CHECK?: string | null;
  MATURITY_DATE_CHECK?: string | null;
  PRICE_CHECK?: string | null;
  EFFE_DISC_DATE_CHECK?: string | null;
  EFF_DISC_DATE_CHECK?: string | null;
};

type PairFlagField =
  | 'INV_LOAN_REF_CHECK'
  | 'MATURITY_DATE_CHECK'
  | 'PRICE_CHECK'
  | 'EFFE_DISC_DATE_CHECK'
  | 'EFF_DISC_DATE_CHECK';

type DetailColumn = {
  field: keyof InvoiceLoanDetailRecord;
  header: string;
  type?: 'date';
  pairFlag?: PairFlagField;
};

@Component({
  selector: 'app-invoice-loan-detail',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, NgClass, TableModule, DatePipe],
  templateUrl: './invoice-loan-detail.component.html',
  styleUrl: './invoice-loan-detail.component.css'
})
export class InvoiceLoanDetailComponent implements OnChanges {
  @Input() visible = false;
  @Input() clientName = '';
  @Input() fileReceivedDate: string | null = null;
  @Input() invoiceFileName = '';
  @Input() loanFileName = '';
  @Input() records: InvoiceLoanDetailRecord[] = [];
  @Output() close = new EventEmitter<void>();

  detailRows: InvoiceLoanDetailRecord[] = [];
  totalRecords = 0;
  rowsPerPage = 10;
  first = 0;

  cols: DetailColumn[] = [
    { field: 'INVOICE_REF_NO', header: 'Invoice Ref No', pairFlag: 'INV_LOAN_REF_CHECK' },
    { field: 'LOAN_REFERENCE', header: 'Loan Reference', pairFlag: 'INV_LOAN_REF_CHECK' },
    { field: 'INVOICE_MATURITY_DATE', header: 'Invoice Maturity Date', type: 'date', pairFlag: 'MATURITY_DATE_CHECK' },
    { field: 'LOAN_MATURITY_DATE', header: 'Loan Maturity Date', type: 'date', pairFlag: 'MATURITY_DATE_CHECK' },
    { field: 'CONFIRMED_NET_DISCOUNT', header: 'Confirmed Net Discount', pairFlag: 'PRICE_CHECK' },
    { field: 'PURCHASE_PRICE', header: 'Purchase Price', pairFlag: 'PRICE_CHECK' },
    { field: 'DISCOUNT_DATE', header: 'Discount Date', type: 'date', pairFlag: 'EFFE_DISC_DATE_CHECK' },
    { field: 'EFFECTIVE_DATE', header: 'Effective Date', type: 'date', pairFlag: 'EFFE_DISC_DATE_CHECK' }
  ];

  // Rebuild the paginated detail data whenever the parent opens the modal or changes the selected row.
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['records'] || changes['visible']) {
      this.detailRows = [...this.records];
      this.totalRecords = this.detailRows.length;
      this.first = 0;
    }
  }

  // Emit close so the parent component can hide the modal and clear the current selection.
  onClose(): void {
    this.close.emit();
  }

  // Keep the paginator state in sync with the PrimeNG table inside the modal.
  handlePage(event: { first: number; rows: number }): void {
    this.first = event.first;
    this.rowsPerPage = event.rows;
  }

  // Convert the database flag into a simple pass/fail style hook for both cells in the same pair.
  getPairClass(row: InvoiceLoanDetailRecord, pairFlag?: PairFlagField): string {
    if (!pairFlag) {
      return '';
    }

    const flagValue = this.getPairFlagValue(row, pairFlag);
    return flagValue === 'Y' ? 'pair-match' : 'pair-mismatch';
  }

  // Count rows where every database comparison flag says the record is matched.
  get matchedRows(): number {
    return this.detailRows.filter((row) => this.isFullyMatched(row)).length;
  }

  // Count rows where at least one comparison flag says the record is mismatched.
  get mismatchedRows(): number {
    return this.totalRecords - this.matchedRows;
  }

  // Treat a record as fully matched only when all four backend comparison flags are Y.
  private isFullyMatched(row: InvoiceLoanDetailRecord): boolean {
    return this.getPairFlagValue(row, 'INV_LOAN_REF_CHECK') === 'Y'
      && this.getPairFlagValue(row, 'MATURITY_DATE_CHECK') === 'Y'
      && this.getPairFlagValue(row, 'PRICE_CHECK') === 'Y'
      && this.getPairFlagValue(row, 'EFFE_DISC_DATE_CHECK') === 'Y';
  }

  // Read the backend flag for a pair and support either effective/discount field spelling used by the API.
  private getPairFlagValue(row: InvoiceLoanDetailRecord, pairFlag: PairFlagField): 'Y' | 'N' {
    if (pairFlag === 'EFFE_DISC_DATE_CHECK' || pairFlag === 'EFF_DISC_DATE_CHECK') {
      return this.normalizeFlag(row.EFFE_DISC_DATE_CHECK ?? row.EFF_DISC_DATE_CHECK);
    }

    return this.normalizeFlag(row[pairFlag]);
  }

  // Normalize Y/N style database flags so the UI stays consistent even if casing varies.
  private normalizeFlag(value: unknown): 'Y' | 'N' {
    const normalized = String(value ?? '').trim().toUpperCase();
    return normalized === 'Y'
      || normalized === 'YES'
      || normalized === 'TRUE'
      || normalized === '1'
      || normalized === 'MATCH'
      ? 'Y'
      : 'N';
  }
}
