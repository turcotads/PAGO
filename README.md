# PAGO ? Process-Aware Governance Overlay (MVP Profissional)

POC de um **GPS de Processo não intrusivo** para ERP legado: uma extensão Chromium (Manifest V3) que lê contexto via DOM, exibe um mini-mapa BPMN e aplica guardrails operacionais para reduzir erro humano.

## Visão da POC

Processo modelado (Emissão de Diploma):

**Início ? Revisão Acadêmica ? Check de Biblioteca ? Emissão Autorizada**

Regra de governança implementada:

- O botão **Emitir Diploma Oficial** fica bloqueado enquanto o status do aluno for diferente de **Emissão Autorizada**.

## Estrutura do projeto

```
PAGO/
??? mock-erp.html
??? pago-extension/
    ??? manifest.json
    ??? content.js
```

## Componentes

### 1) Mock ERP (`mock-erp.html`)

Ambiente de teste em arquivo único com estilo SaaS (Tailwind via CDN):

- Sidebar azul escuro
- Topbar branca com busca
- Área de conteúdo cinza claro
- Card de perfil do aluno
- `#pago-student-id` com valor `#2024-8831`
- `#pago-workflow-status` (badge dinâmico)
- `#pago-status-simulator` (select para simular etapas)
- `#pago-btn-action` (botão de emissão)

### 2) Extensão PAGO Core (`pago-extension`)

Implementação Manifest V3 com `content_script`:

- Injeção de overlay via **Shadow DOM** (evita conflito de CSS com o ERP)
- FAB flutuante no canto inferior direito
- Painel translúcido com BPMN usando **bpmn-js (viewer mode)**
- `MutationObserver` no `#pago-workflow-status`
- Destaque no diagrama com `canvas.addMarker`
- Guardrail operacional no `#pago-btn-action`

## Lógica de sincronização DOM ? BPMN

- `Revisão Acadêmica` ? destaca `Task_Academic` (azul)
- `Check de Biblioteca` ? destaca `Task_Library` (azul)
- `Emissão Autorizada` ? destaca `Task_Final` (verde)

## Guardrail de conformidade

Quando status **!= Emissão Autorizada**:

- `pointer-events: none`
- `opacity: 0.5`
- aviso injetado: **Bloqueado pelo PAGO: Pendências detectadas**

Quando status **== Emissão Autorizada**:

- botão reabilitado visual e funcionalmente
- aviso ocultado

## Como executar

### Pré-requisitos

- Chromium/Google Chrome
- Python 3 (ou qualquer servidor estático)

### 1) Subir servidor local

Na raiz do projeto:

```bash
python3 -m http.server 8080
```

Abrir no navegador:

`http://localhost:8080/mock-erp.html`

### 2) Carregar a extensão

1. Acesse `chrome://extensions`
2. Ative **Modo do desenvolvedor**
3. Clique em **Carregar sem compactação**
4. Selecione a pasta `pago-extension`

## Como validar a demo

1. Abra o mock ERP.
2. Clique no FAB **PAGO** (canto inferior direito) para expandir o painel BPMN.
3. Troque o status no seletor:
   - `Revisão Acadêmica`
   - `Check de Biblioteca`
   - `Emissão Autorizada`
4. Observe o destaque do nó correspondente no diagrama.
5. Verifique o guardrail no botão de emissão:
   - bloqueado nas duas primeiras etapas
   - liberado em `Emissão Autorizada`

## Definição de pronto (DoP)

- [x] Mock ERP com visual profissional e contexto administrativo
- [x] Overlay da extensão isolado por Shadow DOM
- [x] Mini-mapa BPMN sincronizado em tempo real com o status DOM
- [x] Bloqueio elegante da ação de emissão quando fora da etapa permitida

## Observações técnicas

- O `manifest.json` permite `localhost`, `127.0.0.1` e `file://` para facilitar testes.
- O `bpmn-js` é carregado por CDN (`unpkg`) no `content.js`.
- Para ambientes sem internet, é possível substituir por bundle local de `bpmn-js`.