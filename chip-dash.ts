import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { TableModule } from "primeng/table";
import { ChipsService, ChipsDetail } from "../../services/chips.service";

@Component({
  selector: "app-chip-dash",
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule],
  templateUrl: "./chip-dash.html",
  styleUrl: "./chip-dash.scss"
})
export class ChipDash implements OnInit {
  today = new Date();

  activeFilter: string = "total";

  cols: Array<{ field: string; header: string; align?: "center" }> = [
    { field: "CTRL_NUMBER", header: "Control Number" },
    { field: "CTRL_TITLE", header: "Control Title" },
    { field: "CTRL_TYPE", header: "Control Type" },
    { field: "CTRL_DESCRIPTION", header: "Description" },
    { field: "CTRL_EVIDENCE", header: "Evidence" },
    { field: "CTRL_OFFICER_COMMENTS", header: "Officer Comments" },
    { field: "TEAM_NAME", header: "Team Name" },
    { field: "TEAM_EMAIL_ID", header: "Team Email" },
    { field: "STATUS", header: "Status", align: "center" },
    { field: "EMAIL_SENT_FLAG", header: "Email Sent", align: "center" },
    { field: "ACCEPTANCE_FLAG", header: "Accepted", align: "center" }
  ];
  globalFilterFields: string[] = this.cols.map((col) => col.field);

  controls: ChipsDetail[] = [];
  displayedControls: ChipsDetail[] = [];
  loading: boolean = false;

  totalControls: number = 0;
  completedCount: number = 0;
  pendingCount: number = 0;
  byType: Record<string, number> = {};

  rowsPerPage: number = 10;
  first: number = 0;

  constructor(private chipsService: ChipsService) {}

  ngOnInit(): void {
    this.loadChipsData();
  }

  loadChipsData(): void {
    this.loading = true;

    this.chipsService.getChipsData().subscribe({
      next: (data: ChipsDetail[]) => {
        this.controls = data;
        this.displayedControls = data;

        this.totalControls = data.length;
        this.completedCount = data.filter((c: ChipsDetail) => this.normalizeStatus(c.STATUS) === "COMPLETED").length;
        this.pendingCount = data.filter((c: ChipsDetail) => this.normalizeStatus(c.STATUS) === "PENDING").length;

        this.byType = {};
        data.forEach((c: ChipsDetail) => {
          const type = c.CTRL_TYPE || "Unknown";
          this.byType[type] = (this.byType[type] || 0) + 1;
        });

        this.loading = false;
      },
      error: (err: unknown) => {
        console.error("Error loading chips data:", err);
        this.loading = false;

        this.controls = [];
        this.displayedControls = [];
        this.totalControls = 0;
        this.completedCount = 0;
        this.pendingCount = 0;
        this.byType = {};
      }
    });
  }

  onPagination(event: any): void {
    this.first = event?.first ?? 0;
    this.rowsPerPage = event?.rows ?? 10;
  }

  onFilter(filter: string): void {
    this.activeFilter = filter;
    this.first = 0;

    if (filter === "total") {
      this.displayedControls = this.controls;
    } else if (filter === "completed") {
      this.displayedControls = this.controls.filter((c: ChipsDetail) => this.normalizeStatus(c.STATUS) === "COMPLETED");
    } else if (filter === "pending") {
      this.displayedControls = this.controls.filter((c: ChipsDetail) => this.normalizeStatus(c.STATUS) === "PENDING");
    } else if (filter.startsWith("type:")) {
      const selectedType = filter.replace("type:", "");
      this.displayedControls = this.controls.filter((c: ChipsDetail) => (c.CTRL_TYPE || "Unknown") === selectedType);
    } else {
      this.displayedControls = this.controls;
    }
  }

  clearFilter(): void {
    this.onFilter("total");
  }

  normalizeStatus(status: string): string {
    return (status || "").trim().toUpperCase();
  }

  getStatusClass(status: string): string {
    const statusUpper = this.normalizeStatus(status);
    if (statusUpper === "COMPLETED") return "sla-ok";
    if (statusUpper === "PENDING") return "sla-nok";
    return "sla-nok";
  }

  getIconForStatus(status: string): string {
    const statusUpper = this.normalizeStatus(status);
    if (statusUpper === "COMPLETED") return "✔";
    if (statusUpper === "PENDING") return "⏳";
    return "⚠";
  }

  getFlagClass(value: string): string {
    return this.normalizeStatus(value) === "Y" ? "flag-yes" : "flag-no";
  }

  isWideColumn(field: string): boolean {
    return [
      "CTRL_DESCRIPTION",
      "CTRL_EVIDENCE",
      "CTRL_OFFICER_COMMENTS"
    ].includes(field);
  }

  isStatusColumn(field: string): boolean {
    return ["STATUS", "EMAIL_SENT_FLAG", "ACCEPTANCE_FLAG"].includes(field);
  }
}
