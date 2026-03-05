import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Control1V2Component } from './control1-v2.component';
import { of } from 'rxjs';
import { EmailService } from '../services/email.service';

describe('Control1V2Component', () => {
  let component: Control1V2Component;
  let fixture: ComponentFixture<Control1V2Component>;

  const mockEmailService = {
    getBatchEmails: jasmine.createSpy().and.returnValue(of([]))
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Control1V2Component],
      providers: [
        { provide: EmailService, useValue: mockEmailService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Control1V2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load emails on init', () => {
    expect(mockEmailService.getBatchEmails).toHaveBeenCalled();
  });
});