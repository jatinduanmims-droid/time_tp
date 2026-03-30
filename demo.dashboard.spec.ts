import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DemoDashboardComponent } from './demo.dashboard';

describe('DemoDashboardComponent', () => {
  let component: DemoDashboardComponent;
  let fixture: ComponentFixture<DemoDashboardComponent>;

  beforeEach(async () => {
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
  // The first Trade child is selected on initial load.
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

  it('should update KPI stats when a calendar day is selected', () => {
    const control = component.getActiveControl();

    component.selectCalendarDay(control.id, 5);

    expect(component.getDisplayStats(control)[0].value).toBe('5 Mar 2026');
    expect(component.getDisplayStats(control)[1].value).toBe('Passed');
  });

  it('should move the calendar month backward', () => {
    const control = component.getActiveControl();

    component.shiftCalendarMonth(control.id, -1);

    expect(component.getMonthLabel(control.id)).toBe('February 2026');
  });

  it('should filter the active category by T-1 failed controls', () => {
    component.filterCategoryByStatus('trade', 'failed');

    expect(component.getActiveFilterLabel()).toBe('T-1 Failed children');
    expect(component.getVisibleControls(component.getActiveCategory()).length).toBeGreaterThan(0);
  });

  it('should map the T-1 filter to the calendar selection', () => {
    component.filterCategoryByStatus('trade', 'failed');

    const control = component.getVisibleControls(component.getActiveCategory())[0];

    expect(component.getMonthLabel(control.id)).toBe('March 2026');
    expect(component.getDisplayStats(control)[0].value).toBe('29 Mar 2026');
  });

  it('should add a control to favourites', () => {
    component.toggleFavorite('evergreen-cancellations');
    component.selectControl('favourite');

    expect(component.isFavorite('evergreen-cancellations')).toBeTrue();
    expect(component.getVisibleControls(component.getActiveCategory()).some((control) => control.id === 'evergreen-cancellations')).toBeTrue();
  });

  it('should keep future dates neutral in the snapshot month', () => {
    const control = component.getActiveControl();
    const futureDay = component.getCalendarDays(control).find((day) => day.dayNumber === 31);

    expect(futureDay?.future).toBeTrue();
    expect(futureDay?.clickable).toBeFalse();
    expect(futureDay?.fail).toBeFalse();
    expect(futureDay?.passed).toBeFalse();
  });

  it('should reset to the snapshot date on calendar reset', () => {
    const control = component.getActiveControl();

    component.shiftCalendarMonth(control.id, -1);
    component.resetCalendarToCurrentDate(control.id);

    expect(component.getMonthLabel(control.id)).toBe('March 2026');
    expect(component.getDisplayStats(control)[0].value).toBe('30 Mar 2026');
  });
});
