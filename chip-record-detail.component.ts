import { CommonModule } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { finalize } from "rxjs/operators";
import { ChipsAttachment, ChipsDetail, ChipsService } from "./chips.service";

@Component({
  selector: "app-chip-record-detail",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./chip-record-detail.component.html",
  styleUrl: "./chip-record-detail.component.scss"
})
export class ChipRecordDetailComponent implements OnChanges {
  @Input() control?: ChipsDetail;
  @Output() close = new EventEmitter<void>();

  attachments: ChipsAttachment[] = [];
  attachmentsLoading = false;
  attachmentsError = "";
  uploadError = "";
  uploadingAttachment = false;
  deletingAttachmentId?: number;

  readonly acceptedFileTypes = ".xls,.xlsx,.pdf,.doc,.docx,.zip";

  readonly primaryFields: Array<{ label: string; key: keyof ChipsDetail }> = [
    { label: "Control Number", key: "CTRL_NUMBER" },
    { label: "Control Title", key: "CTRL_TITLE" },
    { label: "Control Type", key: "CTRL_TYPE" },
    { label: "Team", key: "TEAM_NAME" },
    { label: "Team Email", key: "TEAM_EMAIL_ID" },
    { label: "Status", key: "STATUS" },
    { label: "Email Sent", key: "EMAIL_SENT_FLAG" },
    { label: "Accepted", key: "ACCEPTANCE_FLAG" }
  ];

  readonly narrativeFields: Array<{ label: string; key: keyof ChipsDetail }> = [
    { label: "Description", key: "CTRL_DESCRIPTION" },
    { label: "Evidence", key: "CTRL_EVIDENCE" },
    { label: "Officer Comments", key: "CTRL_OFFICER_COMMENTS" },
    { label: "Email Subject", key: "EMAIL_SUBJECT" },
    { label: "Email Body", key: "EMAIL_BODY" },
    { label: "Evidence File Name", key: "EVIDENCE_FILE_NAME" },
    { label: "Evidence Provider Comment", key: "EVIDENCE_PROVIDER_COMMENT" }
  ];

  constructor(private chipsService: ChipsService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["control"] && this.control?.ROW_ID) {
      this.loadAttachments();
    }
  }

  cancel(): void {
    this.close.emit();
  }

  onAttachmentSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];

    if (!file || !this.control?.ROW_ID) {
      return;
    }

    this.uploadingAttachment = true;
    this.uploadError = "";

    this.chipsService.uploadChipsAttachment(this.control.ROW_ID, file)
      .pipe(finalize(() => {
        this.uploadingAttachment = false;
        if (input) {
          input.value = "";
        }
      }))
      .subscribe({
        next: (attachment: ChipsAttachment) => {
          this.attachments = [attachment, ...this.attachments];
        },
        error: (error: unknown) => {
          console.error("Error uploading chips attachment:", error);
          this.uploadError = this.formatAttachmentError(error, "Upload failed");
        }
      });
  }

  downloadAttachment(attachment: ChipsAttachment): void {
    if (!this.control?.ROW_ID || !attachment.FILE_ID) {
      return;
    }

    this.chipsService.downloadChipsAttachment(this.control.ROW_ID, attachment.FILE_ID).subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = attachment.ORIGINAL_FILE_NAME || `attachment-${attachment.FILE_ID}`;
        anchor.click();
        URL.revokeObjectURL(url);
      },
      error: (error: unknown) => {
        console.error("Error downloading chips attachment:", error);
        this.attachmentsError = this.formatAttachmentError(error, "Download failed");
      }
    });
  }

  deleteAttachment(attachment: ChipsAttachment): void {
    if (!this.control?.ROW_ID || !attachment.FILE_ID) {
      return;
    }

    this.deletingAttachmentId = attachment.FILE_ID;
    this.attachmentsError = "";

    this.chipsService.deleteChipsAttachment(this.control.ROW_ID, attachment.FILE_ID)
      .pipe(finalize(() => {
        this.deletingAttachmentId = undefined;
      }))
      .subscribe({
        next: () => {
          this.attachments = this.attachments.filter((item) => item.FILE_ID !== attachment.FILE_ID);
        },
        error: (error: unknown) => {
          console.error("Error deleting chips attachment:", error);
          this.attachmentsError = this.formatAttachmentError(error, "Delete failed");
        }
      });
  }

  getFieldValue(key: keyof ChipsDetail): string {
    if (!this.control) {
      return "-";
    }

    const value = this.control[key];
    return value == null || String(value).trim() === "" ? "-" : String(value);
  }

  getAttachmentName(attachment: ChipsAttachment): string {
    return attachment.ORIGINAL_FILE_NAME || attachment.STORED_FILE_NAME || `Attachment ${attachment.FILE_ID}`;
  }

  getAttachmentMeta(attachment: ChipsAttachment): string {
    const parts = [];

    if (attachment.CONTENT_TYPE) {
      parts.push(attachment.CONTENT_TYPE);
    }

    if (typeof attachment.FILE_SIZE === "number") {
      parts.push(this.formatFileSize(attachment.FILE_SIZE));
    }

    if (attachment.UPLOADED_AT) {
      parts.push(new Date(attachment.UPLOADED_AT).toLocaleString());
    }

    return parts.join(" • ");
  }

  private loadAttachments(): void {
    if (!this.control?.ROW_ID) {
      return;
    }

    this.attachmentsLoading = true;
    this.attachmentsError = "";
    this.uploadError = "";

    this.chipsService.getChipsAttachments(this.control.ROW_ID)
      .pipe(finalize(() => {
        this.attachmentsLoading = false;
      }))
      .subscribe({
        next: (attachments: ChipsAttachment[]) => {
          this.attachments = attachments;
        },
        error: (error: unknown) => {
          console.error("Error loading chips attachments:", error);
          this.attachments = [];
          this.attachmentsError = this.formatAttachmentError(error, "Attachment load failed");
        }
      });
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private formatAttachmentError(error: unknown, prefix: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return `${prefix}.`;
    }

    if (error.status === 0) {
      return `${prefix}: backend unavailable.`;
    }

    const detail =
      typeof error.error === "string"
        ? error.error
        : typeof error.error?.detail === "string"
          ? error.error.detail
          : error.message;

    return `${prefix} (${error.status}): ${detail}`;
  }
}
