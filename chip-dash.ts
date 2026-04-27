import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { HttpErrorResponse } from "@angular/common/http";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Table, TableModule } from "primeng/table";
import { ChipsService, ChipsDetail, CreateChipsDetailPayload } from "./chips.service";
import { AddChipRecordComponent } from "./add-chip-record.component";
import { ChipRecordDetailComponent } from "./chip-record-detail.component";
import { EmailTeamComposeComponent } from "./email-team-compose.component";

@Component({
  selector: "app-chip-dash",
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, AddChipRecordComponent, ChipRecordDetailComponent, EmailTeamComposeComponent],
  templateUrl: "./chip-dash.html",
  styleUrl: "./chip-dash.scss"
})
export class ChipDash implements OnInit {
  @ViewChild("dt") dataTable?: Table;
  @ViewChild("uploadInput") uploadInput?: ElementRef<HTMLInputElement>;

  today = new Date();
  uploadedFiles: File[] = [];
  reportGenerated = false;
  isDragActive = false;

  activeFilter: string = "total";
  selectedTypeView: string = "total";
  selectedTeamView: string = "total";

  cols: Array<{ field: string; header: string; align?: "center" }> = [
    { field: "CTRL_NUMBER", header: "Number" },
    { field: "CTRL_TITLE", header: "Control" },
    { field: "CTRL_TYPE", header: "Type" },
    { field: "CTRL_DESCRIPTION", header: "Description" },
    { field: "CTRL_EVIDENCE", header: "Evidence" },
    { field: "CTRL_OFFICER_COMMENTS", header: "Comments" },
    { field: "TEAM_NAME", header: "Team" },
    { field: "STATUS", header: "Status", align: "center" },
    { field: "EMAIL_SENT_FLAG", header: "Sent", align: "center" },
    { field: "ACCEPTANCE_FLAG", header: "Accepted", align: "center" }
  ];
  globalFilterFields: string[] = this.cols.map((col) => col.field);

  controls: ChipsDetail[] = [];
  displayedControls: ChipsDetail[] = [];
  selectedDetailControl?: ChipsDetail;
  isEmailTeamModalOpen = false;
  isAddRecordModalOpen = false;
  isSavingRecord = false;
  addRecordError = "";
  loading: boolean = false;

  totalControls: number = 0;
  completedCount: number = 0;
  pendingCount: number = 0;
  byType: Record<string, number> = {};
  uniqueControlTypes: string[] = [];
  uniqueTeamNames: string[] = [];

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
        this.applyControlsState(data);
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
        this.uniqueTeamNames = [];
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
    this.selectedTypeView = filter.startsWith("type:") ? filter.replace("type:", "") : "total";
    this.selectedTeamView = filter.startsWith("team:") ? filter.replace("team:", "") : "total";

    if (filter === "total") {
      this.displayedControls = this.controls;
    } else if (filter === "completed") {
      this.displayedControls = this.controls.filter((c: ChipsDetail) => this.normalizeStatus(c.STATUS) === "COMPLETED");
    } else if (filter === "pending") {
      this.displayedControls = this.controls.filter((c: ChipsDetail) => this.normalizeStatus(c.STATUS) === "PENDING");
    } else if (filter.startsWith("type:")) {
      const selectedType = filter.replace("type:", "");
      this.displayedControls = this.controls.filter((c: ChipsDetail) => (c.CTRL_TYPE || "Unknown") === selectedType);
    } else if (filter.startsWith("team:")) {
      const selectedTeam = filter.replace("team:", "");
      this.displayedControls = this.controls.filter((c: ChipsDetail) => (c.TEAM_NAME || "Unknown") === selectedTeam);
    } else {
      this.displayedControls = this.controls;
    }
  }

  onTypeViewChange(selectedType: string): void {
    if (!selectedType || selectedType === "total") {
      this.onFilter("total");
      return;
    }

    this.onFilter(`type:${selectedType}`);
  }

  onTeamViewChange(selectedTeam: string): void {
    if (!selectedTeam || selectedTeam === "total") {
      this.onFilter("total");
      return;
    }

    this.onFilter(`team:${selectedTeam}`);
  }

  openDetailModal(control: ChipsDetail): void {
    this.selectedDetailControl = control;
  }

  openEmailTeamModal(): void {
    this.isEmailTeamModalOpen = true;
  }

  closeEmailTeamModal(): void {
    this.isEmailTeamModalOpen = false;
  }

  openAddRecordModal(): void {
    this.addRecordError = "";
    this.isSavingRecord = false;
    this.isAddRecordModalOpen = true;
  }

  closeAddRecordModal(): void {
    this.isAddRecordModalOpen = false;
    this.isSavingRecord = false;
    this.addRecordError = "";
  }

  saveRecord(record: CreateChipsDetailPayload): void {
    this.isSavingRecord = true;
    this.addRecordError = "";

    this.chipsService.createChipsRecord(record).subscribe({
      next: (savedRecord: ChipsDetail) => {
        const createdRecord = this.normalizeCreatedRecord(savedRecord, record);
        this.applyControlsState([createdRecord, ...this.controls]);
        this.closeAddRecordModal();
      },
      error: (err: unknown) => {
        console.error("Error creating chips record:", err);
        this.isSavingRecord = false;
        this.addRecordError = this.formatCreateError(err);
      }
    });
  }

  closeDetailModal(): void {
    this.selectedDetailControl = undefined;
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const files = input?.files ? Array.from(input.files) : [];

    this.addUploadedFiles(files);

    if (input) {
      input.value = "";
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragActive = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragActive = false;
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragActive = false;

    const files = event.dataTransfer?.files ? Array.from(event.dataTransfer.files) : [];
    this.addUploadedFiles(files);
  }

  removeUploadedFile(index: number): void {
    this.uploadedFiles = this.uploadedFiles.filter((_, fileIndex) => fileIndex !== index);
  }

  generateReport(): void {
    if (!this.uploadedFiles.length) {
      return;
    }

    this.reportGenerated = true;
  }

  restartFlow(): void {
    this.uploadedFiles = [];
    this.reportGenerated = false;
    this.isDragActive = false;
    this.selectedDetailControl = undefined;
    this.isEmailTeamModalOpen = false;
    this.isAddRecordModalOpen = false;
    this.isSavingRecord = false;
    this.addRecordError = "";

    if (this.uploadInput) {
      this.uploadInput.nativeElement.value = "";
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

  exportToExcel(): void {
    const rows = this.getExportControls().map((control) => {
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

  private getExportControls(): ChipsDetail[] {
    const filteredRows = this.dataTable?.filteredValue as ChipsDetail[] | null | undefined;
    return filteredRows ?? this.displayedControls;
  }

  private applyControlsState(data: ChipsDetail[]): void {
    this.controls = data;

    this.totalControls = data.length;
    this.completedCount = data.filter((control: ChipsDetail) => this.normalizeStatus(control.STATUS) === "COMPLETED").length;
    this.pendingCount = data.filter((control: ChipsDetail) => this.normalizeStatus(control.STATUS) === "PENDING").length;

    this.byType = {};
    data.forEach((control: ChipsDetail) => {
      const type = control.CTRL_TYPE || "Unknown";
      this.byType[type] = (this.byType[type] || 0) + 1;
    });

    this.uniqueControlTypes = Object.keys(this.byType).sort((a, b) => a.localeCompare(b));
    this.uniqueTeamNames = Array.from(
      new Set(data.map((control: ChipsDetail) => control.TEAM_NAME || "Unknown"))
    ).sort((a, b) => a.localeCompare(b));

    this.onFilter(this.activeFilter);
  }

  private normalizeCreatedRecord(savedRecord: ChipsDetail, fallbackRecord: CreateChipsDetailPayload): ChipsDetail {
    return {
      ROW_ID: savedRecord?.ROW_ID ?? 0,
      DT_INSERT: savedRecord?.DT_INSERT ?? "",
      DT_UPDATE: savedRecord?.DT_UPDATE ?? "",
      ...fallbackRecord,
      ...savedRecord
    };
  }

  private formatCreateError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return "Unable to save the new record. Please try again.";
    }

    if (error.status === 0) {
      return "Create request could not reach the backend at localhost:8000.";
    }

    const detail =
      typeof error.error === "string"
        ? error.error
        : typeof error.error?.detail === "string"
          ? error.error.detail
          : error.message;

    return `Create failed (${error.status}): ${detail}`;
  }

  private addUploadedFiles(files: File[]): void {
    if (!files.length) {
      return;
    }

    this.uploadedFiles = [...this.uploadedFiles, ...files];
  }
}
