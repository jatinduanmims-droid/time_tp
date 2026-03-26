import { Component, OnInit } from '@angular/core';
import { CreditControls, MCAAtlas2Report } from './services/credit-controls';

import { MatIconModule } from '@angular/material/icon';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-mca-atlas2-recon',
  templateUrl: './mca-atlas2-recon.html',
  styleUrls: ['./mca-atlas2-recon.scss'],
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatIconModule,
    MatCardModule,
    MultiSelectModule,
    TableModule,
    InputTextModule,
    ButtonModule,
    TooltipModule
  ]
})
export class MCAAtlas2Recon implements OnInit {

  readonly snapshotDate = new Date();
  readonly flagField = 'COMPARE_COUNTRY_OF_BUSINESS';

  allLegalEntities: MCAAtlas2Report[] = [];
  displayedLegalEntities: MCAAtlas2Report[] = [];
  loading = true;
  totalRecords = 0;
  selectedLegalEntity: MCAAtlas2Report | null = null;
  activeFilter: string | null = null;

  emptyInA2Count = 0;
  differentCount = 0;
  bothEmptyCount = 0;
  matchCount = 0;

  visibleCols: any[] = [
    { field: 'RMPM_ID', header: 'Legal Entity Id', align: 'left' },
    { field: 'DECIDED_COUNTRY_OF_BUSINESS', header: 'Country of Business', align: 'center' },
    { field: 'CURRENT_INDUSTRIES', header: 'Industries', align: 'left' },
    { field: 'CURRENT_COUNTERPARTY_RATING', header: 'Current CP Rating', align: 'center' },
    { field: 'LINK_TO_REQUEST', header: 'Link to Request', align: 'center' },
    { field: 'PROPOSED_COUNTERPARTY_RATING', header: 'Proposed CP Rating', align: 'center' },
    { field: 'GROUP_NAME', header: 'Group', align: 'left' },
    { field: 'LEGAL_ENTITY_NAME', header: 'Legal Entity', align: 'left' },
    { field: 'COMPARE_COUNTRY_OF_BUSINESS', header: 'Flag', align: 'left' }
  ];

  constructor(private cc: CreditControls) {}

  ngOnInit(): void {
    this.fetchData();
  }

  /** Pull the whole view from the FastAPI endpoint */
  fetchData(): void {
    this.loading = true;

    this.cc.getMCAAtlas2Report().subscribe({
      next: (data) => {
        this.allLegalEntities = data;
        this.displayedLegalEntities = [...data];
        this.totalRecords = data.length;
        this.calculateKpis();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load MCA-Atlas2 data', err);
        this.loading = false;
      }
    });
  }

  private normalizeFlagValue(row: MCAAtlas2Report): string {
    return String((row as Record<string, unknown>)[this.flagField] ?? '')
      .trim()
      .toUpperCase();
  }

  private calculateKpis(): void {
    this.emptyInA2Count = this.getCountByFlag('EMPTY IN A2');
    this.differentCount = this.getCountByFlag('DIFFERENT');
    this.bothEmptyCount = this.getCountByFlag('BOTH EMPTY');
    this.matchCount = this.getCountByFlag('MATCH');
  }

  private getCountByFlag(flag: string): number {
    return this.allLegalEntities.filter(row => this.normalizeFlagValue(row) === flag).length;
  }

  onFilter(flag: string): void {
    this.activeFilter = flag;
    this.displayedLegalEntities = this.allLegalEntities.filter(
      row => this.normalizeFlagValue(row) === flag
    );
    this.totalRecords = this.displayedLegalEntities.length;
  }

  clearFilter(): void {
    this.activeFilter = null;
    this.displayedLegalEntities = [...this.allLegalEntities];
    this.totalRecords = this.displayedLegalEntities.length;
  }

  // -------------------------------
  // Row detail helpers
  // -------------------------------

  openDetail(row: MCAAtlas2Report) {
    this.selectedLegalEntity = row;
  }

  closeDetail() {
    this.selectedLegalEntity = null;
  }

  // -------------------------------
  // STATUS handling
  // -------------------------------

  saveStatus(row: any) {
    this.cc.updateFacilityStatus(row.RMPM_ID, row.STATUS).subscribe(() => {
      row._originalStatus = row.STATUS;
      row.isEditing = false;
    });
  }

  cancelEdit(row: any) {
    row.STATUS = row._originalStatus;
    row.isEditing = false;
  }

  // -------------------------------
  // COMMENTS handling
  // -------------------------------

  saveComment(row: any) {
    // For now keeping local (no API)
    row._originalComments = row.USER_COMMENTS;
    row.isEditingComments = false;
  }

  cancelCommentEdit(row: any) {
    row.USER_COMMENTS = row._originalComments;
    row.isEditingComments = false;
  }
}
