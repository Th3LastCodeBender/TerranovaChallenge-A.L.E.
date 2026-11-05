import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PopupCard } from './popup-card';

describe('PopupCard', () => {
  let component: PopupCard;
  let fixture: ComponentFixture<PopupCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopupCard],
    }).compileComponents();

    fixture = TestBed.createComponent(PopupCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
