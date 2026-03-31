import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DemoDashboardComponent } from './demo.dashboard';

describe('DemoDashboardComponent', () => {
  let component: DemoDashboardComponent;
  let fixture: ComponentFixture<DemoDashboardComponent>;
  let today: Date;
  let yesterday: Date;

  const monthKey = (date: Date): string => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const dateLabel = (date: Date): string => date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  beforeEach(async () => {
    today = new Date();
    today.setHours(0, 0, 0, 0);
    yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    await TestBed.configureTestingModule({
      imports: [DemoDashboardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DemoDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Default state:
  // The first Trade control is selected on initial load.
  it('should initialize with the first trade control selected', () => {
    expect(component.activeControlId).toBe('incoming-requests-management');
  });

  it('should return the active control', () => {
    const activeControl = component.getActiveControl();

    expect(activeControl).toBeTruthy();
    expect(activeControl.id).toBe('incoming-requests-management');
  });

  it('should update active control when category selection changes', () => {
    component.selectedControlByCategory['trade'] = 'evergreen-cancellations';

    component.handleControlChange('trade');

    expect(component.activeControlId).toBe('evergreen-cancellations');
  });

  it('should return a fallback chart max value when chart points are missing', () => {
    expect(component.getMaxChartValue(undefined)).toBe(1);
    expect(component.getMaxChartValue([])).toBe(1);
  });

  it('should show SLA failed and pass counts for a failed incoming requests day', () => {
    const control = component.getActiveControl();
    component.viewedMonthByControl[control.id] = '2026-03';

    component.selectCalendarDay(control.id, 29);

    expect(component.getDisplayStats(control)[0].value).toBe('29 Mar 2026');
    expect(component.getDisplayStats(control)[1].label).toBe('SLA Failed Count');
    expect(component.getDisplayStats(control)[2].label).toBe('SLA Pass Count');
  });

  it('should show SLA pass count for a passed incoming requests day', () => {
    const control = component.getActiveControl();
    component.viewedMonthByControl[control.id] = '2026-03';

    component.selectCalendarDay(control.id, 30);

    expect(component.getDisplayStats(control)[0].value).toBe('30 Mar 2026');
    expect(component.getDisplayStats(control)[1].label).toBe('SLA Pass Count');
  });

  it('should show invoice-loan recon KPIs for a failed supply chain day', () => {
    component.selectControl('supply');
    const control = component.getActiveControl();
    component.viewedMonthByControl[control.id] = '2026-03';

    component.selectCalendarDay(control.id, 29);

    expect(component.getDisplayStats(control)[0].value).toBe('29 Mar 2026');
    expect(component.getDisplayStats(control)[1].label).toBe('Recon Failed');
    expect(component.getDisplayStats(control)[2].label).toBe('Recon Passed');
  });

  it('should move the calendar month backward', () => {
    const control = component.getActiveControl();
    const expected = new Date(today.getFullYear(), today.getMonth() - 1, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });

    component.shiftCalendarMonth(control.id, -1);

    expect(component.getMonthLabel(control.id)).toBe(expected);
  });

  it('should filter the active category by failed-yesterday controls', () => {
    component.filterCategoryByStatus('trade', 'failed');

    expect(component.getActiveFilterLabel()).toBe('Failed Yesterday controls');
    expect(component.getVisibleControls(component.getActiveCategory()).length).toBeGreaterThan(0);
  });

  it('should map the failed-yesterday filter to the calendar selection', () => {
    component.filterCategoryByStatus('trade', 'failed');

    const control = component.getVisibleControls(component.getActiveCategory())[0];
    const currentMonthLabel = today.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });

    expect(component.getMonthLabel(control.id)).toBe(currentMonthLabel);
    expect(component.getDisplayStats(control)[0].value).toBe(dateLabel(yesterday));
  });

  it('should add a control to favourites', () => {
    component.toggleFavorite('evergreen-cancellations');
    component.selectControl('favourite');

    expect(component.isFavorite('evergreen-cancellations')).toBeTrue();
    expect(component.getVisibleControls(component.getActiveCategory()).some((control) => control.id === 'evergreen-cancellations')).toBeTrue();
  });

  it('should keep future dates neutral in the current month', () => {
    const control = component.getActiveControl();
    component.viewedMonthByControl[control.id] = monthKey(today);
    const futureDay = component.getCalendarDays(control).find((day) => day.dayNumber === today.getDate() + 1);

    expect(futureDay?.future).toBeTrue();
    expect(futureDay?.clickable).toBeFalse();
    expect(futureDay?.fail).toBeFalse();
    expect(futureDay?.passed).toBeFalse();
  });

  it('should reset to the current system date on calendar reset', () => {
    const control = component.getActiveControl();

    component.shiftCalendarMonth(control.id, -1);
    component.resetCalendarToCurrentDate(control.id);

    expect(component.getMonthLabel(control.id)).toBe(today.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    }));
    expect(component.getDisplayStats(control)[0].value).toBe(dateLabel(today));
  });
});
