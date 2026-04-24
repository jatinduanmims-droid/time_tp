import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from "@angular/core";
import { FormsModule } from "@angular/forms";
import * as XLSX from "xlsx";
import { ChipsDetail } from "./chips.service";

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

  get attachmentFileName(): string {
    return `${this.sanitizeFileSegment(this.selectedControl?.TEAM_NAME || "Team")}_Controls.xlsx`;
  }

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
    if (!this.teamControls.length) {
      alert("No team records available for attachment generation.");
      return;
    }

    const attachmentFile = this.buildTeamControlsAttachment(this.teamControls, this.selectedControl?.TEAM_NAME || "Team");

    const mockEmailPayload = {
      to: this.toEmail,
      controlType: this.controlType,
      subject: this.subject,
      body: this.body,
      attachments: [
        {
          fileName: attachmentFile.name,
          size: attachmentFile.size,
          mimeType: attachmentFile.type
        }
      ]
    };

    console.log("Mock email send payload:", mockEmailPayload);
    alert(`Mock send prepared with attachment: ${attachmentFile.name}`);
  }

  downloadAttachment(): void {
    if (!this.teamControls.length) {
      alert("No team records available for attachment generation.");
      return;
    }

    const workbook = this.buildTeamControlsWorkbook(this.teamControls);
    XLSX.writeFile(workbook, this.attachmentFileName);
  }

  cancel(): void {
    this.close.emit();
  }

  private initializeComposeState(selectedControl: ChipsDetail, teamControls: ChipsDetail[]): void {
    const teamName = selectedControl.TEAM_NAME || "Unknown";

    this.selectedControl = selectedControl;
    this.teamControls = this.filterControlsByTeam(teamControls, teamName);
    this.toEmail = String((selectedControl as Record<string, unknown>)["TEAM_EMAIL_ID"] ?? "");
    this.controlType = selectedControl.CTRL_TYPE || "";
    this.subject = `Action Required: ${this.controlType} Controls - ${teamName}`;
    this.body = this.buildEmailBody(this.controlType, teamName);
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

  private buildTeamControlsAttachment(teamControls: ChipsDetail[], teamName: string): File {
    const workbook = this.buildTeamControlsWorkbook(teamControls);
    const workbookArray = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

    return new File([workbookArray], `${this.sanitizeFileSegment(teamName)}_Controls.xlsx`, {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
  }

  private buildTeamControlsWorkbook(teamControls: ChipsDetail[]): XLSX.WorkBook {
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
    return workbook;
  }

  private sanitizeFileSegment(value: string): string {
    return String(value || "Team").replace(/[\\/:*?"<>|]+/g, "_").trim() || "Team";
  }

  private filterControlsByTeam(teamControls: ChipsDetail[], teamName: string): ChipsDetail[] {
    return teamControls.filter((control) => (control.TEAM_NAME || "Unknown") === teamName);
  }
}
