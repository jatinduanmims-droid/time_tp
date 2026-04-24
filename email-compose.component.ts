import { CommonModule, Location } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import * as XLSX from "xlsx";
import { ChipsDetail } from "../../services/chips.service";

type EmailComposeNavigationState = {
  selectedControl?: ChipsDetail;
  teamControls?: ChipsDetail[];
};

@Component({
  selector: "app-email-compose",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./email-compose.component.html",
  styleUrl: "./email-compose.component.scss"
})
export class EmailComposeComponent implements OnInit {
  selectedControl?: ChipsDetail;
  teamControls: ChipsDetail[] = [];

  toEmail = "";
  controlType = "";
  subject = "";
  body = "";

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private location: Location
  ) {}

  ngOnInit(): void {
    const navigation = this.router.getCurrentNavigation();
    const state = (navigation?.extras.state ?? history.state) as EmailComposeNavigationState;

    if (state?.selectedControl) {
      this.initializeComposeState(state.selectedControl, state.teamControls ?? []);
      return;
    }

    const routeState = this.route.snapshot.paramMap.get("teamName");
    if (routeState) {
      this.toEmail = "";
      this.controlType = "";
      this.subject = `Action Required: Controls - ${routeState}`;
      this.body = this.buildEmailBody("", routeState);
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
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    this.router.navigate(["/chip-dash"]);
  }

  private initializeComposeState(selectedControl: ChipsDetail, teamControls: ChipsDetail[]): void {
    this.selectedControl = selectedControl;
    this.teamControls = teamControls;
    this.toEmail = String((selectedControl as Record<string, unknown>)["TEAM_EMAIL_ID"] ?? "");
    this.controlType = selectedControl.CTRL_TYPE || "";
    this.subject = `Action Required: ${this.controlType} Controls - ${selectedControl.TEAM_NAME || "Team"}`;
    this.body = this.buildEmailBody(this.controlType, selectedControl.TEAM_NAME || "Team");
  }

  private buildEmailBody(controlType: string, teamName: string): string {
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
