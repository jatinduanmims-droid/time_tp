// src/app/components/email-detail/email-detail.component.ts
import { Component, Input, OnChanges, Output, SimpleChanges, EventEmitter } from '@angular/core';
import { EmailService, EmailDetail } from '../services/email.service';
import { FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { MatListModule } from '@angular/material/list';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../confirmation-dialog.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SlaResultDialogComponent } from '../sla-result-dialog.component';

@Component({
  selector: 'app-email-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatRadioModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    FormsModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    MatDialogModule,
    ConfirmationDialogComponent,
    SlaResultDialogComponent
  ],
  templateUrl: './email-detail.component.html',
  styleUrls: ['./email-detail.component.scss']
})
export class EmailDetailComponent implements OnChanges {

  @Input() rowId?: number;
  @Input() control: string = 'all';
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<number>();

  email: EmailDetail[] = [];
  form: FormGroup;
  currentStep = 2;
  showChain = false;
  referenceNumber = '';

  constructor(
    private emailsrv: EmailService,
    private dialog: MatDialog,
    fb: FormBuilder
  ) {
    this.form = fb.group({
      priorityFlag: [''],
      comments: [''],
      referenceNumber: [''],
      slaFlag: ['']
    });
  }

  slaDateFilter = (d: Date | null): boolean => {
    if (!d || !this.firstDetail?.EMAIL_RECEIVEDTIME) return false;
    const received = new Date(this.firstDetail.EMAIL_RECEIVEDTIME);
    return d >= received;
  };

  ngOnChanges(changes: SimpleChanges) {
    if (changes['rowId'] && this.rowId) {
      this.loadDetail(this.rowId, this.control);
    }
  }

  get firstDetail(): EmailDetail | undefined {
    return this.email[0];
  }

  private normalizeSla(value: unknown): 'Y' | 'N' {
    return String(value ?? '').trim().toUpperCase() === 'Y' ? 'Y' : 'N';
  }

  onClose(): void {
    this.close.emit();
  }

  private emitSavedRow(rowId?: number): void {
    if (rowId) {
      this.saved.emit(rowId);
    }
  }

  loadDetail(id: number, control: string) {
    this.emailsrv.getEmailDetail(id, control).subscribe(data => {

      this.email = data;
      console.log(data);

      this.form.patchValue({
        priorityFlag: data[0].EMAIL_CLASSIFICATION,
        comments: data[0].COMMENTS ?? '',
        slaFlag: this.normalizeSla((data[0] as any).SLAMET ?? (data[0] as any).SLA_MET)
      });

      const payload: any = data;

      const allApproved: boolean = Array.isArray(payload)
        ? payload.every((row: any) => row.WIPSTATUS === 'APPROV')
        : payload.WIPSTATUS === 'APPROV';

      this.currentStep = allApproved ? 3 : 2;
    });
  }

  onSave() {

    if (!this.rowId) return;

    const { priorityFlag, comments } = this.form.value;
    const slaFlag = this.normalizeSla(this.form.value.slaFlag ?? this.firstDetail?.SLAMET);
    const userSlaFlag = this.normalizeSla(this.firstDetail?.SLAMET);

    this.emailsrv.updateClassification(
      this.rowId,
      priorityFlag,
      comments,
      slaFlag,
      userSlaFlag
    ).subscribe({
      next: () => {
        if (this.firstDetail) {
          (this.firstDetail as any).SLAMET = slaFlag;
          (this.firstDetail as any).SLA_MET = slaFlag;
        }
        this.form.patchValue({ slaFlag });
        this.emitSavedRow(this.rowId);
        alert('Record saved successfully');
      },
      error: (err) => {
        console.error('Save failed', err);
        alert('Failed to save record. See console for details.');
      }
    });
  }

  // SLA Checkbox handling
  onSlacheckboxChange(event: any, detail: any) {

    const previous = this.normalizeSla(detail.SLAMET ?? detail.SLA_MET);
    const isChecked = event.checked;

    const flagValue = isChecked ? 'Y' : 'N';
    const action = isChecked ? 'save SLA' : 'make it as SLA breach';

    const message = `This will ${action} with reference ${detail.LC_REFERENCE_NUMBER}. Are you sure you want to save it?`;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: message
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {

      if (confirmed) {

        const { priorityFlag, comments } = this.form.value;

        this.emailsrv.updateClassification(
          detail.ROW_ID,
          priorityFlag,
          comments,
          flagValue,
          previous
        ).subscribe({

          next: () => {

            alert(
              isChecked
                ? 'SLA flag saved successfully'
                : 'SLA breach saved successfully'
            );

            detail.SLAMET = flagValue;
            detail.SLA_MET = flagValue;
            this.form.patchValue({ slaFlag: flagValue });
            this.emitSavedRow(detail.ROW_ID);
          },

          error: err => {
            console.error('Failed to save SLA flag', err);
            detail.SLAMET = previous;
            detail.SLA_MET = previous;
            if (event && event.source) {
              event.source.checked = previous === 'Y';
            }
          }

        });

      } else {

        detail.SLAMET = previous;

        if (event && event.source) {
          event.source.checked = previous === 'Y';
        }

        this.email = this.email.map(e => e);
      }

    });
  }

  saveReference() {

    if (!this.rowId) return;

    const referenceNumber = this.form.get('referenceNumber')?.value;

    this.emailsrv.updateReference(
      this.rowId,
      referenceNumber
    ).subscribe({

      next: (data: EmailDetail[]) => {

        this.email = this.email.map(orig => ({
          ...orig,
          ...(data[1] ?? {})
        }));

        this.form.patchValue({ referenceNumber: '' });
        this.emitSavedRow(this.rowId);

        alert('Reference saved and details refreshed');

      },

      error: err => {

        console.error('Failed to save reference', err);
        alert('Could not save reference - see console for details.');

      }

    });
  }

  startRequest() {}

}
