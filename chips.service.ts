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
