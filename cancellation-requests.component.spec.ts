import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CancellationRequests } from './cancellation-requests.component';

describe('CancellationRequests', () => {
  let component: CancellationRequests;
  let fixture: ComponentFixture<CancellationRequests>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CancellationRequests]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CancellationRequests);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});