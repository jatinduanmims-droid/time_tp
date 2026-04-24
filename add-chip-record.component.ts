import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CreateChipsDetailPayload } from "./chips.service";

@Component({
  selector: "app-add-chip-record",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./add-chip-record.component.html",
  styleUrl: "./add-chip-record.component.scss"
})
export class AddChipRecordComponent {
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<CreateChipsDetailPayload>();

  draft = this.createEmptyRecord();

  get isFormValid(): boolean {
    return [
      this.draft.CTRL_NUMBER,
      this.draft.CTRL_TITLE,
      this.draft.CTRL_TYPE,
      this.draft.TEAM_NAME,
      this.draft.STATUS
    ].every((value) => String(value || "").trim().length > 0);
  }

  cancel(): void {
    this.close.emit();
  }

  submit(): void {
    if (!this.isFormValid) {
      return;
    }

    this.save.emit({
      ...this.draft,
      CTRL_NUMBER: this.normalizeNumber(this.draft.CTRL_NUMBER),
      CTRL_TITLE: this.normalize(this.draft.CTRL_TITLE),
      CTRL_TYPE: this.normalize(this.draft.CTRL_TYPE),
      CTRL_DESCRIPTION: this.normalize(this.draft.CTRL_DESCRIPTION),
      CTRL_EVIDENCE: this.normalize(this.draft.CTRL_EVIDENCE),
      CTRL_OFFICER_COMMENTS: this.normalize(this.draft.CTRL_OFFICER_COMMENTS),
      TEAM_NAME: this.normalize(this.draft.TEAM_NAME),
      TEAM_EMAIL_ID: this.normalize(this.draft.TEAM_EMAIL_ID),
      EMAIL_BODY: this.normalize(this.draft.EMAIL_BODY),
      EMAIL_SUBJECT: this.normalize(this.draft.EMAIL_SUBJECT),
      STATUS: this.normalize(this.draft.STATUS),
      EMAIL_SENT_FLAG: this.normalizeFlag(this.draft.EMAIL_SENT_FLAG),
      ACCEPTANCE_FLAG: this.normalizeFlag(this.draft.ACCEPTANCE_FLAG),
      EVIDENCE_FILE_NAME: this.normalize(this.draft.EVIDENCE_FILE_NAME),
      EVIDENCE_PROVIDER_COMMENT: this.normalize(this.draft.EVIDENCE_PROVIDER_COMMENT)
    } as CreateChipsDetailPayload);
  }

  private createEmptyRecord(): CreateChipsDetailPayload {
    return {
      CTRL_NUMBER: 0,
      CTRL_TITLE: "",
      CTRL_TYPE: "",
      CTRL_DESCRIPTION: "",
      CTRL_EVIDENCE: "",
      CTRL_OFFICER_COMMENTS: "",
      TEAM_NAME: "",
      TEAM_EMAIL_ID: "",
      EMAIL_BODY: "",
      EMAIL_SUBJECT: "",
      STATUS: "PENDING",
      EMAIL_SENT_FLAG: "N",
      ACCEPTANCE_FLAG: "N",
      EVIDENCE_FILE_NAME: "",
      EVIDENCE_PROVIDER_COMMENT: ""
    } as CreateChipsDetailPayload;
  }

  private normalize(value: unknown): string {
    return String(value || "").trim();
  }

  private normalizeNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private normalizeFlag(value: unknown): string {
    return this.normalize(value).toUpperCase() === "Y" ? "Y" : "N";
  }
}
