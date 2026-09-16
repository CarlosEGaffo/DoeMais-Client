import { Component, Input, output } from '@angular/core';
@Component({
  selector: 'app-pagination',
  template: `<nav class="pagination" aria-label="Paginação">
    <span role="status">{{ total }} resultados · Página {{ page }} de {{ pages }}</span>
    <div class="pagination-controls">
      <button
        class="button secondary pagination-prev"
        type="button"
        [disabled]="disabled || page <= 1"
        (click)="changed.emit(page - 1)"
      >
        ← Anterior
      </button>
      <ol class="page-numbers">
        @for (p of visiblePages; track $index) {
          @if (p === null) {
            <li class="page-gap" aria-hidden="true">…</li>
          } @else {
            <li>
              <button
                class="page-number"
                type="button"
                [class.current]="p === page && !disabled"
                [attr.aria-current]="p === page ? 'page' : null"
                [attr.aria-label]="'Ir para a página ' + p"
                [disabled]="disabled || p === page"
                (click)="changed.emit(p)"
              >
                {{ p }}
              </button>
            </li>
          }
        }
      </ol>
      <button
        class="button secondary pagination-next"
        type="button"
        [disabled]="disabled || page >= pages"
        (click)="changed.emit(page + 1)"
      >
        Próxima →
      </button>
    </div>
  </nav>`,
})
export class Pagination {
  @Input() total = 0;
  @Input() page = 1;
  @Input() pageSize = 12;
  @Input() disabled = false;
  readonly changed = output<number>();
  get pages(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }
  get visiblePages(): (number | null)[] {
    const current = this.page;
    const last = this.pages;
    const window = 2;
    const numbers: (number | null)[] = [];
    for (let page = 1; page <= last; page++) {
      if (page === 1 || page === last || Math.abs(page - current) <= window) {
        numbers.push(page);
      } else if (numbers[numbers.length - 1] !== null) {
        numbers.push(null);
      }
    }
    return numbers;
  }
}
