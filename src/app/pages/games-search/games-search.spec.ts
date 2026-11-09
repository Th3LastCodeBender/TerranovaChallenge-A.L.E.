import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GamesSearch } from './games-search';

describe('GamesSearch', () => {
  let component: GamesSearch;
  let fixture: ComponentFixture<GamesSearch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GamesSearch],
    }).compileComponents();

    fixture = TestBed.createComponent(GamesSearch);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
