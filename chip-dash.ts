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
  selectedView: string = "total";

  cols: Array<{ field: string; header: string; align?: "center" }> = [
    { field: "CTRL_NUMBER", header: "#" },
    { field: "CTRL_TITLE", header: "Control Title" },
    { field: "CTRL_TYPE", header: "Type" },
    { field: "CTRL_DESCRIPTION", header: "Description" },
    { field: "CTRL_EVIDENCE", header: "Evidence" },
    { field: "CTRL_OFFICER_COMMENTS", header: "Officer Comments" },
    { field: "TEAM_NAME", header: "Team Name" },
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
  uniqueControlTypes: string[] = [];

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
        this.uniqueControlTypes = Object.keys(this.byType).sort((a, b) => a.localeCompare(b));

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
        this.uniqueControlTypes = [];
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
    this.selectedView = filter.startsWith("type:") ? filter.replace("type:", "") : "total";

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

  onViewChange(selectedType: string): void {
    if (!selectedType || selectedType === "total") {
      this.onFilter("total");
      return;
    }

    this.onFilter(`type:${selectedType}`);
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

  exportToExcel(): void {
    const rows = this.displayedControls.map((control) => {
      const exportRow: Record<string, string | number> = {};

      this.cols.forEach((col) => {
        const value = (control as Record<string, unknown>)[col.field];
        exportRow[col.header] = value == null ? "" : String(value);
      });

      return exportRow;
    });

    const tableHeaders = this.cols.map((col) => `<th>${this.escapeHtml(col.header)}</th>`).join("");
    const tableRows = rows
      .map((row) => {
        const cells = this.cols
          .map((col) => `<td>${this.escapeHtml(String(row[col.header] ?? ""))}</td>`)
          .join("");

        return `<tr>${cells}</tr>`;
      })
      .join("");

    const worksheetHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:x="urn:schemas-microsoft-com:office:excel"
            xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="UTF-8">
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>CHIPS Controls</x:Name>
                  <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
        </head>
        <body>
          <table>
            <thead><tr>${tableHeaders}</tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([worksheetHtml], {
      type: "application/vnd.ms-excel;charset=utf-8;"
    });

    const fileName = `chips-controls-${this.formatDateForFileName(new Date())}.xls`;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = fileName;
    anchor.click();

    URL.revokeObjectURL(url);
  }

  getColumnClass(field: string): string {
    if (field === "CTRL_NUMBER") return "number-col";
    if (field === "STATUS") return "status-col";
    if (field === "EMAIL_SENT_FLAG" || field === "ACCEPTANCE_FLAG") return "flag-col";
    if (field === "CTRL_TYPE" || field === "TEAM_NAME") return "medium-col";
    if (field === "CTRL_DESCRIPTION" || field === "CTRL_EVIDENCE" || field === "CTRL_OFFICER_COMMENTS") {
      return "wide-col";
    }
    return "";
  }

  private formatDateForFileName(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
}
