import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ChipsDetail } from "../../services/chips.service";

type ChipRecordFormValue = ChipsDetail & {
  TEAM_EMAIL_ID: string;
};

@Component({
  selector: "app-add-chip-record",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./add-chip-record.component.html",
  styleUrl: "./add-chip-record.component.scss"
})
export class AddChipRecordComponent {
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<ChipRecordFormValue>();

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
      CTRL_NUMBER: this.normalize(this.draft.CTRL_NUMBER),
      CTRL_TITLE: this.normalize(this.draft.CTRL_TITLE),
      CTRL_TYPE: this.normalize(this.draft.CTRL_TYPE),
      CTRL_DESCRIPTION: this.normalize(this.draft.CTRL_DESCRIPTION),
      CTRL_EVIDENCE: this.normalize(this.draft.CTRL_EVIDENCE),
      CTRL_OFFICER_COMMENTS: this.normalize(this.draft.CTRL_OFFICER_COMMENTS),
      TEAM_NAME: this.normalize(this.draft.TEAM_NAME),
      TEAM_EMAIL_ID: this.normalize(this.draft.TEAM_EMAIL_ID),
      STATUS: this.normalize(this.draft.STATUS),
      EMAIL_SENT_FLAG: this.normalizeFlag(this.draft.EMAIL_SENT_FLAG),
      ACCEPTANCE_FLAG: this.normalizeFlag(this.draft.ACCEPTANCE_FLAG)
    } as ChipRecordFormValue);
  }

  private createEmptyRecord(): ChipRecordFormValue {
    return {
      CTRL_NUMBER: "",
      CTRL_TITLE: "",
      CTRL_TYPE: "",
      CTRL_DESCRIPTION: "",
      CTRL_EVIDENCE: "",
      CTRL_OFFICER_COMMENTS: "",
      TEAM_NAME: "",
      TEAM_EMAIL_ID: "",
      STATUS: "PENDING",
      EMAIL_SENT_FLAG: "N",
      ACCEPTANCE_FLAG: "N"
    } as ChipRecordFormValue;
  }

  private normalize(value: unknown): string {
    return String(value || "").trim();
  }

  private normalizeFlag(value: unknown): string {
    return this.normalize(value).toUpperCase() === "Y" ? "Y" : "N";
  }
}
