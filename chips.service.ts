import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface ChipsDetail {
  ROW_ID: number;
  DT_INSERT: string;
  DT_UPDATE: string;
  CTRL_NUMBER: number;
  CTRL_TITLE: string;
  CTRL_TYPE: string;
  CTRL_DESCRIPTION: string;
  CTRL_EVIDENCE: string;
  CTRL_OFFICER_COMMENTS: string;
  TEAM_NAME: string;
  TEAM_EMAIL_ID: string;
  EMAIL_BODY: string;
  EMAIL_SUBJECT: string;
  STATUS: string;
  EMAIL_SENT_FLAG: string;
  ACCEPTANCE_FLAG: string;
  EVIDENCE_FILE_NAME: string;
  EVIDENCE_PROVIDER_COMMENT: string;
  [key: string]: string | number;
}

export interface ChipsStats {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
}

export type CreateChipsDetailPayload = Omit<ChipsDetail, 'ROW_ID' | 'DT_INSERT' | 'DT_UPDATE'>;

export interface ChipsAttachment {
  FILE_ID: number;
  ROW_ID: number;
  ORIGINAL_FILE_NAME: string;
  STORED_FILE_NAME?: string;
  CONTENT_TYPE?: string;
  FILE_SIZE?: number;
  STORAGE_PATH?: string;
  UPLOADED_AT?: string;
  [key: string]: string | number | undefined;
}

@Injectable({
  providedIn: 'root'
})
export class ChipsService {
  private baseUrl = 'http://localhost:8000';

  getChipsData(): Observable<ChipsDetail[]> {
    return this.http.get<ChipsDetail[]>(`${this.baseUrl}/chips_endpoint_security`);
  }

  createChipsRecord(payload: CreateChipsDetailPayload): Observable<ChipsDetail> {
    const createRequests = [
      () => this.http.post<ChipsDetail>(`${this.baseUrl}/chips_endpoint_security`, payload),
      () => this.http.put<ChipsDetail>(`${this.baseUrl}/chips_endpoint_security`, payload),
      () => this.http.post<ChipsDetail>(`${this.baseUrl}/chips_endpoint_security/create`, payload),
      () => this.http.post<ChipsDetail>(`${this.baseUrl}/chips_endpoint_security/add`, payload),
      () => this.http.post<ChipsDetail>(`${this.baseUrl}/chips_endpoint_security/insert`, payload)
    ];

    return this.tryCreateRequests(createRequests);
  }

  getChipsAttachments(rowId: number): Observable<ChipsAttachment[]> {
    return this.http.get<ChipsAttachment[]>(`${this.baseUrl}/chips_endpoint_security/${rowId}/attachments`);
  }

  uploadChipsAttachment(rowId: number, file: File): Observable<ChipsAttachment> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    return this.http.post<ChipsAttachment>(`${this.baseUrl}/chips_endpoint_security/${rowId}/attachments`, formData);
  }

  downloadChipsAttachment(rowId: number, fileId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/chips_endpoint_security/${rowId}/attachments/${fileId}/download`, {
      responseType: 'blob'
    });
  }

  deleteChipsAttachment(rowId: number, fileId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/chips_endpoint_security/${rowId}/attachments/${fileId}`);
  }

  constructor(private http: HttpClient) {}

  private tryCreateRequests(requests: Array<() => Observable<ChipsDetail>>, index = 0): Observable<ChipsDetail> {
    const requestFactory = requests[index];

    if (!requestFactory) {
      return throwError(() => new Error('No create endpoint accepted the request.'));
    }

    return requestFactory().pipe(
      catchError((error) => {
        if (index === requests.length - 1) {
          return throwError(() => error);
        }

        return this.tryCreateRequests(requests, index + 1);
      })
    );
  }
}
