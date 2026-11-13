import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CollectionsLayout } from './collections-layout';

describe('CollectionsLayout', () => {
  let component: CollectionsLayout;
  let fixture: ComponentFixture<CollectionsLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollectionsLayout],
    }).compileComponents();

    fixture = TestBed.createComponent(CollectionsLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
