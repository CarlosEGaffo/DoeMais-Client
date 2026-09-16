import { TestBed } from '@angular/core/testing';
import { Pagination } from './pagination';

describe('Pagination', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<Pagination>>;
  let component: Pagination;
  let el: HTMLElement;

  function set(total: number, page: number, pageSize = 12): void {
    fixture.componentRef.setInput('total', total);
    fixture.componentRef.setInput('page', page);
    fixture.componentRef.setInput('pageSize', pageSize);
    fixture.detectChanges();
  }

  function pageNumbers(): string[] {
    return Array.from(el.querySelectorAll<HTMLButtonElement>('button.page-number')).map(
      (b) => b.textContent?.trim() ?? '',
    );
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Pagination] });
    fixture = TestBed.createComponent(Pagination);
    component = fixture.componentInstance;
    el = fixture.nativeElement as HTMLElement;
  });

  it('renders a single page button when there is only one page', () => {
    set(12, 1);
    expect(pageNumbers()).toEqual(['1']);
    expect((el.querySelector('button.pagination-prev') as HTMLButtonElement).disabled).toBe(true);
    expect((el.querySelector('button.pagination-next') as HTMLButtonElement).disabled).toBe(true);
  });

  it('shows numbered pages around the current one with ellipses for large sets', () => {
    set(300, 13);
    expect(pageNumbers()).toEqual(['1', '11', '12', '13', '14', '15', '25']);
    expect(el.querySelectorAll('.page-gap').length).toBe(2);
    const current = el.querySelector<HTMLButtonElement>('.page-number.current');
    expect(current?.textContent?.trim()).toBe('13');
    expect(current?.getAttribute('aria-current')).toBe('page');
    expect(current?.disabled).toBe(true);
  });

  it('emits the page number when a numbered button is clicked', () => {
    set(300, 13);
    let emitted = 0;
    component.changed.subscribe((value) => (emitted = value));
    const button = el.querySelector<HTMLButtonElement>(
      '.page-number[aria-label="Ir para a página 15"]',
    );
    expect(button).not.toBeNull();
    button?.click();
    fixture.detectChanges();
    expect(emitted).toBe(15);
  });

  it('disables next on the last page and previous on the first page', () => {
    set(300, 1);
    expect((el.querySelector('button.pagination-prev') as HTMLButtonElement).disabled).toBe(true);
    expect((el.querySelector('button.pagination-next') as HTMLButtonElement).disabled).toBe(false);
    set(300, 25);
    expect((el.querySelector('button.pagination-next') as HTMLButtonElement).disabled).toBe(true);
  });

  it('disables all navigation while loading without marking a current page', () => {
    component.disabled = true;
    set(300, 2);
    el.querySelectorAll<HTMLButtonElement>('button.page-number').forEach((button) => {
      expect(button.disabled).toBe(true);
    });
    expect(el.querySelector('.page-number.current')).toBeNull();
  });
});
