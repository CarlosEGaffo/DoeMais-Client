import { Component, Input, output } from '@angular/core';
@Component({
  selector: 'app-pagination',
  template: `<nav class="pagination" aria-label="Paginação">
    <span role="status">{{ total }} resultados · Página {{ page }} de {{ pages }}</span>
    <div>
      <button
        class="button secondary"
        [disabled]="disabled || page <= 1"
        (click)="changed.emit(page - 1)"
      >
        ← Anterior</button
      ><button
        class="button secondary"
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
}
