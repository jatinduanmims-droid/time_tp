import { of } from 'rxjs';
import { convertToParamMap } from '@angular/router';

import { JatinDashboardComponent } from './Jatin_dashboard';
import { EmailDetail } from '../services/email.service';

describe('JatinDashboardComponent dashboard drilldown', () => {
  let component: JatinDashboardComponent;

  const mockEmailService = {
    getBatchEmails: jasmine.createSpy().and.returnValue(of([]))
  };

  const mockRoute = {
    queryParamMap: of(convertToParamMap({}))
  } as any;

  const mockRouter = {
    navigate: jasmine.createSpy('navigate')
  } as any;

  const createEmail = (
    rowId: number,
    receivedDate: string,
    operation: string,
    classification: string,
    slaDate: string,
    slaMet: 'Y' | 'N'
  ): EmailDetail => ({
    ROW_ID: rowId,
    EMAIL_RECEIVEDTIME: `${receivedDate}T10:00:00.000Z`,
    OPERATION: operation,
    EMAIL_CLASSIFICATION: classification,
    SLA_DATE: `${slaDate}T00:00:00.000Z`,
    SLAMEET: slaMet,
    SLA_MET: slaMet
  } as EmailDetail);

  beforeEach(() => {
    component = new JatinDashboardComponent(mockEmailService as any, mockRoute, mockRouter);
  });

  it('limits KPI cards and charts to the drilldown date', () => {
    component.batchEmails = [
      createEmail(1, '2026-03-29', 'Amendment', 'Urgent', '2026-03-30', 'Y'),
      createEmail(2, '2026-03-29', 'Issuance', 'Normal', '2026-03-31', 'N'),
      createEmail(3, '2026-03-28', 'Cancellation', 'Urgent', '2026-03-29', 'N')
    ];

    component.dashboardDrilldownDate = '2026-03-29';
    component.targetDate = new Date('2026-03-29T00:00:00.000Z');

    (component as any).calculateKpis();
    (component as any).buildCharts();

    expect(component.totalToday).toBe(2);
    expect(component.urgentToday).toBe(1);
    expect(component.amendmentsToday).toBe(1);
    expect(component.issuanceToday).toBe(1);
    expect(component.cancellationToday).toBe(0);
    expect(component.due24).toBe(1);
    expect(component.due48).toBe(1);
    expect(component.overdue).toBe(0);
    expect(component.slaMet).toBe(1);
    expect(component.slaBreach).toBe(1);
    expect(component.chartSlaMet).toBe(1);
    expect(component.chartSlaBreach).toBe(1);
    expect(component.slaTrendData.labels).toEqual(['29 Mar']);
  });
});
