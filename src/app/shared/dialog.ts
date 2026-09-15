import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
  output,
} from '@angular/core';
let dialogSequence = 0;
@Component({
  selector: 'app-dialog',
  template: `<dialog
    #dialog
    class="app-dialog"
    [attr.aria-labelledby]="titleId"
    (close)="closed.emit()"
    (click)="backdrop($event)"
  >
    <header class="dialog-heading">
      <h2 [id]="titleId">{{ title }}</h2>
      <button
        type="button"
        class="dialog-close"
        aria-label="Fechar janela"
        (click)="dialog.close()"
      >
        ×
      </button>
    </header>
    <div class="dialog-body"><ng-content /></div>
  </dialog>`,
})
export class AppDialog implements AfterViewInit, OnDestroy {
  @Input({ required: true }) title = '';
  readonly closed = output<void>();
  readonly titleId = `dialog-title-${++dialogSequence}`;
  @ViewChild('dialog', { static: true }) dialog!: ElementRef<HTMLDialogElement>;
  private opener: HTMLElement | null = null;
  ngAfterViewInit(): void {
    this.opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.dialog.nativeElement.showModal();
  }
  backdrop(event: MouseEvent): void {
    const element = this.dialog.nativeElement;
    const rect = element.getBoundingClientRect();
    if (
      event.target === element &&
      (event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom)
    )
      element.close();
  }
  ngOnDestroy(): void {
    this.dialog.nativeElement.close();
    if (this.opener?.isConnected) this.opener.focus();
  }
}
