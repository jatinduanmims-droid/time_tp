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

  it('should initialize with the first trade control selected', () => {
    expect(component.activeControlId).toBe('incoming-requests');
  });

  it('should return the active control', () => {
    const activeControl = component.getActiveControl();

    expect(activeControl).toBeTruthy();
    expect(activeControl.id).toBe('incoming-requests');
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
});
