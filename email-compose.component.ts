import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from "@angular/core";
import { FormsModule } from "@angular/forms";
import * as XLSX from "xlsx";
import { ChipsDetail } from "../../services/chips.service";

@Component({
  selector: "app-email-compose",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./email-compose.component.html",
  styleUrl: "./email-compose.component.scss"
})
export class EmailComposeComponent implements OnInit, OnChanges {
  @Input() selectedControl?: ChipsDetail;
  @Input() teamControls: ChipsDetail[] = [];
  @Output() close = new EventEmitter<void>();

  toEmail = "";
  controlType = "";
  subject = "";
  body = "";

  ngOnInit(): void {
    if (this.selectedControl) {
      this.initializeComposeState(this.selectedControl, this.teamControls);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes["selectedControl"] || changes["teamControls"]) && this.selectedControl) {
      this.initializeComposeState(this.selectedControl, this.teamControls);
    }
  }

  sendEmail(): void {
    alert("Send action is mocked for now.");
  }

  downloadAttachment(): void {
    if (!this.teamControls.length) {
      alert("No team records available for attachment generation.");
      return;
    }

    this.downloadTeamControlsWorkbook(this.teamControls, this.selectedControl?.TEAM_NAME || "Team");
  }

  cancel(): void {
    this.close.emit();
  }

  private initializeComposeState(selectedControl: ChipsDetail, teamControls: ChipsDetail[]): void {
    this.selectedControl = selectedControl;
    this.teamControls = teamControls;
    this.toEmail = String((selectedControl as Record<string, unknown>)["TEAM_EMAIL_ID"] ?? "");
    this.controlType = selectedControl.CTRL_TYPE || "";
    this.subject = `Action Required: ${this.controlType} Controls - ${selectedControl.TEAM_NAME || "Team"}`;
    this.body = this.buildEmailBody(this.controlType, selectedControl.TEAM_NAME || "Team");
  }

  private buildEmailBody(controlType: string, _teamName: string): string {
    return [
      "Hi Team,",
      "",
      `Please find below the details for ${controlType || "selected"} controls.`,
      "",
      "Kindly review and take necessary actions.",
      "",
      "Regards,",
      "Controls Team"
    ].join("\n");
  }

  private downloadTeamControlsWorkbook(teamControls: ChipsDetail[], teamName: string): void {
    const worksheetData = teamControls.map((control) => ({
      Number: control.CTRL_NUMBER,
      Control: control.CTRL_TITLE,
      Type: control.CTRL_TYPE,
      Description: control.CTRL_DESCRIPTION,
      Evidence: control.CTRL_EVIDENCE,
      Comments: control.CTRL_OFFICER_COMMENTS,
      Team: control.TEAM_NAME,
      TeamEmail: (control as Record<string, unknown>)["TEAM_EMAIL_ID"] ?? "",
      Status: control.STATUS,
      Sent: control.EMAIL_SENT_FLAG,
      Accepted: control.ACCEPTANCE_FLAG
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Controls");
    XLSX.writeFile(workbook, `${this.sanitizeFileSegment(teamName)}_Controls.xlsx`);
  }

  private sanitizeFileSegment(value: string): string {
    return String(value || "Team").replace(/[\\/:*?"<>|]+/g, "_").trim() || "Team";
  }
}
