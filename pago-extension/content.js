(function () {
  if (window.__PAGO_CORE_LOADED__) {
    return;
  }
  window.__PAGO_CORE_LOADED__ = true;

  const BPMN_LIBRARY_URL = 'https://unpkg.com/bpmn-js@17.11.1/dist/bpmn-viewer.development.js';
  const STATUS_ELEMENT_ID = 'pago-workflow-status';
  const ACTION_BUTTON_ID = 'pago-btn-action';
  const GOVERNANCE_HINT_ID = 'pago-governance-hint';

  const STAGE_NODE_MAP = {
    'Revisão Acadêmica': 'Task_Academic',
    'Check de Biblioteca': 'Task_Library',
    'Emissão Autorizada': 'Task_Final',
  };

  const HIGHLIGHT_CLASS_MAP = {
    'Revisão Acadêmica': 'pago-marker-blue',
    'Check de Biblioteca': 'pago-marker-blue',
    'Emissão Autorizada': 'pago-marker-green',
  };

  const BPMN_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  id="Definitions_PAGO"
  targetNamespace="http://pago.local/bpmn">
  <bpmn:process id="Process_Diploma" isExecutable="false">
    <bpmn:startEvent id="StartEvent_Begin" name="Início">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_Academic" name="Revisão Acadêmica">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_Library" name="Check de Biblioteca">
      <bpmn:incoming>Flow_2</bpmn:incoming>
      <bpmn:outgoing>Flow_3</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_Final" name="Emissão Autorizada">
      <bpmn:incoming>Flow_3</bpmn:incoming>
    </bpmn:task>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_Begin" targetRef="Task_Academic" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_Academic" targetRef="Task_Library" />
    <bpmn:sequenceFlow id="Flow_3" sourceRef="Task_Library" targetRef="Task_Final" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_Diploma">
      <bpmndi:BPMNShape id="StartEvent_Begin_di" bpmnElement="StartEvent_Begin">
        <dc:Bounds x="36" y="91" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Academic_di" bpmnElement="Task_Academic">
        <dc:Bounds x="112" y="68" width="130" height="82" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Library_di" bpmnElement="Task_Library">
        <dc:Bounds x="280" y="68" width="130" height="82" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Final_di" bpmnElement="Task_Final">
        <dc:Bounds x="448" y="68" width="130" height="82" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="72" y="109" />
        <di:waypoint x="112" y="109" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="242" y="109" />
        <di:waypoint x="280" y="109" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_3_di" bpmnElement="Flow_3">
        <di:waypoint x="410" y="109" />
        <di:waypoint x="448" y="109" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

  const state = {
    panelOpen: false,
    bpmnViewer: null,
    canvas: null,
  };

  function createOverlay() {
    const host = document.createElement('div');
    host.id = 'pago-overlay-host';
    host.style.position = 'fixed';
    host.style.right = '24px';
    host.style.bottom = '24px';
    host.style.zIndex = '2147483647';
    host.style.pointerEvents = 'none';
    document.documentElement.appendChild(host);

    const shadowRoot = host.attachShadow({ mode: 'open' });
    shadowRoot.innerHTML = `
      <style>
        :host { all: initial; }
        .pago-root {
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif;
          color: #f8fafc;
          pointer-events: none;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
        }
        .pago-fab {
          width: 58px;
          height: 58px;
          border-radius: 999px;
          border: 0;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #ffffff;
          box-shadow: 0 14px 30px rgba(37, 99, 235, 0.35);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.4px;
          cursor: pointer;
          pointer-events: auto;
        }
        .pago-panel {
          width: 640px;
          max-width: calc(100vw - 40px);
          height: 320px;
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.4);
          background: rgba(15, 23, 42, 0.74);
          backdrop-filter: blur(8px);
          box-shadow: 0 20px 45px rgba(2, 6, 23, 0.35);
          overflow: hidden;
          display: none;
          pointer-events: auto;
        }
        .pago-panel.open {
          display: flex;
          flex-direction: column;
        }
        .pago-panel-header {
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 14px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.25);
          font-size: 13px;
          color: #e2e8f0;
        }
        .pago-panel-header strong {
          font-weight: 700;
          color: #f8fafc;
        }
        .pago-stage {
          color: #bfdbfe;
          font-weight: 600;
        }
        .pago-bpmn-container {
          flex: 1;
          background: rgba(255, 255, 255, 0.95);
        }
        .djs-container .pago-marker-blue .djs-visual > :nth-child(1) {
          stroke: #2563eb !important;
          stroke-width: 3px !important;
          fill: #dbeafe !important;
        }
        .djs-container .pago-marker-green .djs-visual > :nth-child(1) {
          stroke: #16a34a !important;
          stroke-width: 3px !important;
          fill: #dcfce7 !important;
        }
      </style>
      <div class="pago-root">
        <div id="pago-panel" class="pago-panel" aria-label="Mapa de processo PAGO">
          <div class="pago-panel-header">
            <strong>PAGO ? GPS de Processo</strong>
            <span id="pago-current-stage" class="pago-stage">Revisão Acadêmica</span>
          </div>
          <div id="pago-bpmn-container" class="pago-bpmn-container"></div>
        </div>
        <button id="pago-fab" class="pago-fab" type="button" aria-expanded="false">PAGO</button>
      </div>
    `;

    return {
      shadowRoot,
      fab: shadowRoot.getElementById('pago-fab'),
      panel: shadowRoot.getElementById('pago-panel'),
      stageLabel: shadowRoot.getElementById('pago-current-stage'),
      diagramContainer: shadowRoot.getElementById('pago-bpmn-container'),
    };
  }

  function loadBpmnLibrary() {
    return new Promise((resolve, reject) => {
      if (window.BpmnJS) {
        resolve(window.BpmnJS);
        return;
      }

      const existing = document.querySelector('script[data-pago-bpmn="true"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.BpmnJS));
        existing.addEventListener('error', () => reject(new Error('Falha ao carregar bpmn-js')));
        return;
      }

      const script = document.createElement('script');
      script.src = BPMN_LIBRARY_URL;
      script.async = true;
      script.dataset.pagoBpmn = 'true';
      script.addEventListener('load', () => {
        if (window.BpmnJS) {
          resolve(window.BpmnJS);
          return;
        }
        reject(new Error('bpmn-js indisponível após o carregamento'));
      });
      script.addEventListener('error', () => reject(new Error('Não foi possível baixar bpmn-js via CDN')));
      document.documentElement.appendChild(script);
    });
  }

  async function initializeBpmn(overlay) {
    if (state.bpmnViewer && state.canvas) {
      return;
    }

    const BpmnJS = await loadBpmnLibrary();
    state.bpmnViewer = new BpmnJS({
      container: overlay.diagramContainer,
    });

    await state.bpmnViewer.importXML(BPMN_XML);
    state.canvas = state.bpmnViewer.get('canvas');
    state.canvas.zoom('fit-viewport');
  }

  function removeAllMarkers() {
    if (!state.canvas) {
      return;
    }

    Object.values(STAGE_NODE_MAP).forEach((nodeId) => {
      state.canvas.removeMarker(nodeId, 'pago-marker-blue');
      state.canvas.removeMarker(nodeId, 'pago-marker-green');
    });
  }

  function syncBpmnHighlight(statusText, overlay) {
    if (!state.canvas) {
      return;
    }

    removeAllMarkers();
    const nodeId = STAGE_NODE_MAP[statusText];
    const marker = HIGHLIGHT_CLASS_MAP[statusText];
    if (!nodeId || !marker) {
      overlay.stageLabel.textContent = 'Status desconhecido';
      return;
    }

    state.canvas.addMarker(nodeId, marker);
    overlay.stageLabel.textContent = statusText;
  }

  function ensureGovernanceMessage(button) {
    let hint = document.getElementById(GOVERNANCE_HINT_ID);
    if (!hint) {
      hint = document.createElement('div');
      hint.id = GOVERNANCE_HINT_ID;
      hint.textContent = 'Bloqueado pelo PAGO: Pendências detectadas';
      hint.style.marginTop = '8px';
      hint.style.padding = '8px 10px';
      hint.style.borderRadius = '10px';
      hint.style.background = '#fee2e2';
      hint.style.border = '1px solid #fecaca';
      hint.style.color = '#991b1b';
      hint.style.fontSize = '12px';
      hint.style.fontWeight = '600';
      hint.style.maxWidth = '280px';
      button.insertAdjacentElement('afterend', hint);
    }
    return hint;
  }

  function applyGuardrail(statusText) {
    const actionButton = document.getElementById(ACTION_BUTTON_ID);
    if (!actionButton) {
      return;
    }

    const isAuthorized = statusText === 'Emissão Autorizada';
    const hint = ensureGovernanceMessage(actionButton);

    if (isAuthorized) {
      actionButton.style.pointerEvents = 'auto';
      actionButton.style.opacity = '1';
      actionButton.removeAttribute('aria-disabled');
      actionButton.title = 'Pronto para emitir diploma.';
      hint.style.display = 'none';
      return;
    }

    actionButton.style.pointerEvents = 'none';
    actionButton.style.opacity = '0.5';
    actionButton.setAttribute('aria-disabled', 'true');
    actionButton.title = 'Ação bloqueada pelo PAGO: fluxo ainda não autorizado.';
    hint.style.display = 'block';
  }

  function getCurrentStatusText() {
    const statusElement = document.getElementById(STATUS_ELEMENT_ID);
    return statusElement ? statusElement.textContent.trim() : '';
  }

  function observeStatusChanges(onChange) {
    const statusElement = document.getElementById(STATUS_ELEMENT_ID);
    if (!statusElement) {
      return null;
    }

    const observer = new MutationObserver(() => {
      onChange(getCurrentStatusText());
    });

    observer.observe(statusElement, {
      characterData: true,
      childList: true,
      subtree: true,
    });

    return observer;
  }

  async function bootstrap() {
    const statusElement = document.getElementById(STATUS_ELEMENT_ID);
    if (!statusElement) {
      return;
    }

    const overlay = createOverlay();

    overlay.fab.addEventListener('click', async () => {
      state.panelOpen = !state.panelOpen;
      overlay.panel.classList.toggle('open', state.panelOpen);
      overlay.fab.setAttribute('aria-expanded', String(state.panelOpen));

      if (state.panelOpen && !state.bpmnViewer) {
        try {
          await initializeBpmn(overlay);
          syncBpmnHighlight(getCurrentStatusText(), overlay);
        } catch (error) {
          overlay.stageLabel.textContent = 'Erro ao carregar mapa BPMN';
          overlay.diagramContainer.innerHTML = '<div style="padding:16px;color:#b91c1c;font-size:13px;">Falha ao carregar o visualizador BPMN.</div>';
          console.error('[PAGO] Erro ao iniciar bpmn-js:', error);
        }
      }
    });

    const handleStatusUpdate = (statusText) => {
      applyGuardrail(statusText);
      if (state.bpmnViewer) {
        syncBpmnHighlight(statusText, overlay);
      } else {
        overlay.stageLabel.textContent = statusText || 'Status desconhecido';
      }
    };

    handleStatusUpdate(getCurrentStatusText());
    observeStatusChanges(handleStatusUpdate);
  }

  bootstrap();
})();