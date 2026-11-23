import { Component } from '@angular/core';

@Component({
  selector: 'app-guide',
  template: `
    <div class="page-heading">
      <div>
        <span class="eyebrow">DOCUMENTAÇÃO</span>
        <h1>Guia do usuário</h1>
        <p class="muted">Manual completo de acesso e utilização da plataforma DoaMais.</p>
      </div>
      <a class="button primary" href="/guia-usuario.pdf" download="Manual-DoaMais.pdf">
        Baixar PDF <span aria-hidden="true">↓</span>
      </a>
    </div>
    <div class="guide-viewer panel">
      <iframe
        src="/guia-usuario.pdf"
        title="Manual do Usuário — DoaMais"
        class="guide-iframe"
        aria-label="Manual do Usuário DoaMais em PDF"
      ></iframe>
      <p class="guide-fallback">
        Seu navegador não exibe PDFs inline.
        <a class="text-link" href="/guia-usuario.pdf" target="_blank">Abrir em nova aba ↗</a>
      </p>
    </div>
  `,
  styles: `
    .guide-viewer {
      padding: 0;
      overflow: hidden;
    }
    .guide-iframe {
      display: block;
      width: 100%;
      height: calc(100dvh - 240px);
      min-height: 500px;
      border: 0;
    }
    .guide-fallback {
      padding: 18px 24px;
      border-top: 1px solid #dfe7e0;
      font-size: 0.88rem;
      color: #5a6e63;
      margin: 0;
    }
  `,
})
export class Guide {}
