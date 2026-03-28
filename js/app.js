(function () {
  const data = window.inventoryBIPrototype;
  if (!data) return;

  function markActiveNav(layerKey) {
    document.querySelectorAll("[data-nav]").forEach((link) => {
      link.classList.toggle("is-active", link.dataset.nav === layerKey);
    });
  }

  function renderUpdatedAt() {
    document.querySelectorAll(".js-updated-at").forEach((node) => {
      node.textContent = data.meta.updatedAt;
    });
  }

  function renderSources() {
    const html = data.meta.sources.map((source) => `<a href="${source.href}">${source.name}</a>`).join("");
    document.querySelectorAll(".js-source-list").forEach((node) => {
      node.innerHTML = html;
    });
  }

  function renderToolbar(layer) {
    const toolbar = document.querySelector(".js-toolbar");
    if (!toolbar || !layer.filters) return;

    toolbar.innerHTML = layer.filters
      .map(
        (filter) => `
          <div class="filter-field">
            <label>${filter.label}</label>
            <div class="filter-value">${filter.value}</div>
          </div>
        `
      )
      .join("");
  }

  function getModuleVisualType(title, index) {
    const rules = [
      ["矩阵", "quadrant"],
      ["模拟", "controls"],
      ["敏感性", "line"],
      ["预测", "line"],
      ["排名", "rank"],
      ["补货", "rank"],
      ["库龄", "aging"],
      ["预警", "warning"],
      ["追踪", "status"],
      ["分布", "bars"],
      ["结构", "bars"],
      ["库存池", "funnel"],
      ["差异", "warning"],
    ];

    const matched = rules.find(([keyword]) => title.includes(keyword));
    if (matched) return matched[1];

    const fallbackTypes = ["bars", "line", "rank", "warning"];
    return fallbackTypes[index % fallbackTypes.length];
  }

  function getModuleVisualLabel(type) {
    const labels = {
      bars: "结构图",
      rank: "排名图",
      aging: "分布图",
      warning: "预警表",
      line: "趋势图",
      status: "状态图",
      quadrant: "矩阵图",
      controls: "模拟面板",
      funnel: "流转图",
    };

    return labels[type] || "基础图表";
  }

  function renderModuleVisual(type) {
    const templates = {
      bars: `
        <svg class="placeholder-svg" viewBox="0 0 640 220" role="presentation" aria-hidden="true">
          <line class="ph-axis" x1="48" y1="22" x2="48" y2="188"></line>
          <line class="ph-axis" x1="48" y1="188" x2="604" y2="188"></line>
          <line class="ph-grid" x1="48" y1="58" x2="604" y2="58"></line>
          <line class="ph-grid" x1="48" y1="102" x2="604" y2="102"></line>
          <line class="ph-grid" x1="48" y1="145" x2="604" y2="145"></line>
          <rect class="ph-bar-a" x="88" y="110" width="54" height="78" rx="12"></rect>
          <rect class="ph-bar-b" x="172" y="76" width="54" height="112" rx="12"></rect>
          <rect class="ph-bar-c" x="256" y="94" width="54" height="94" rx="12"></rect>
          <rect class="ph-bar-a" x="340" y="58" width="54" height="130" rx="12"></rect>
          <rect class="ph-bar-b" x="424" y="88" width="54" height="100" rx="12"></rect>
          <rect class="ph-bar-c" x="508" y="126" width="54" height="62" rx="12"></rect>
        </svg>
      `,
      rank: `
        <svg class="placeholder-svg" viewBox="0 0 640 220" role="presentation" aria-hidden="true">
          <rect class="ph-track" x="34" y="34" width="572" height="22" rx="11"></rect>
          <rect class="ph-bar-a" x="34" y="34" width="458" height="22" rx="11"></rect>
          <rect class="ph-track" x="34" y="74" width="572" height="22" rx="11"></rect>
          <rect class="ph-bar-b" x="34" y="74" width="392" height="22" rx="11"></rect>
          <rect class="ph-track" x="34" y="114" width="572" height="22" rx="11"></rect>
          <rect class="ph-bar-c" x="34" y="114" width="338" height="22" rx="11"></rect>
          <rect class="ph-track" x="34" y="154" width="572" height="22" rx="11"></rect>
          <rect class="ph-bar-a" x="34" y="154" width="286" height="22" rx="11"></rect>
        </svg>
      `,
      aging: `
        <svg class="placeholder-svg" viewBox="0 0 640 220" role="presentation" aria-hidden="true">
          <rect class="ph-segment-1" x="48" y="42" width="118" height="34" rx="14"></rect>
          <rect class="ph-segment-2" x="166" y="42" width="152" height="34" rx="14"></rect>
          <rect class="ph-segment-3" x="318" y="42" width="128" height="34" rx="14"></rect>
          <rect class="ph-segment-4" x="446" y="42" width="146" height="34" rx="14"></rect>
          <rect class="ph-segment-1" x="48" y="104" width="158" height="34" rx="14"></rect>
          <rect class="ph-segment-2" x="206" y="104" width="136" height="34" rx="14"></rect>
          <rect class="ph-segment-3" x="342" y="104" width="102" height="34" rx="14"></rect>
          <rect class="ph-segment-4" x="444" y="104" width="98" height="34" rx="14"></rect>
          <rect class="ph-track" x="48" y="170" width="544" height="16" rx="8"></rect>
          <rect class="ph-bar-a" x="48" y="170" width="196" height="16" rx="8"></rect>
          <rect class="ph-bar-b" x="244" y="170" width="174" height="16" rx="8"></rect>
          <rect class="ph-bar-c" x="418" y="170" width="118" height="16" rx="8"></rect>
        </svg>
      `,
      warning: `
        <svg class="placeholder-svg" viewBox="0 0 640 220" role="presentation" aria-hidden="true">
          <rect class="ph-surface" x="28" y="26" width="584" height="40" rx="16"></rect>
          <rect class="ph-surface" x="28" y="84" width="584" height="32" rx="14"></rect>
          <rect class="ph-surface" x="28" y="128" width="584" height="32" rx="14"></rect>
          <rect class="ph-surface" x="28" y="172" width="584" height="20" rx="10"></rect>
          <rect class="ph-bar-a" x="56" y="37" width="138" height="18" rx="9"></rect>
          <rect class="ph-bar-b" x="214" y="37" width="94" height="18" rx="9"></rect>
          <rect class="ph-bar-c" x="330" y="37" width="156" height="18" rx="9"></rect>
          <rect class="ph-bar-a" x="56" y="91" width="292" height="18" rx="9"></rect>
          <rect class="ph-bar-b" x="56" y="135" width="244" height="18" rx="9"></rect>
          <rect class="ph-bar-c" x="56" y="173" width="416" height="12" rx="6"></rect>
        </svg>
      `,
      line: `
        <svg class="placeholder-svg" viewBox="0 0 640 220" role="presentation" aria-hidden="true">
          <line class="ph-axis" x1="48" y1="24" x2="48" y2="188"></line>
          <line class="ph-axis" x1="48" y1="188" x2="604" y2="188"></line>
          <line class="ph-grid" x1="48" y1="66" x2="604" y2="66"></line>
          <line class="ph-grid" x1="48" y1="108" x2="604" y2="108"></line>
          <line class="ph-grid" x1="48" y1="150" x2="604" y2="150"></line>
          <path class="ph-area" d="M 72 164 L 152 138 L 232 148 L 312 116 L 392 126 L 472 92 L 552 74 L 552 188 L 72 188 Z"></path>
          <path class="ph-line-a" d="M 72 164 L 152 138 L 232 148 L 312 116 L 392 126 L 472 92 L 552 74"></path>
          <path class="ph-line-b" d="M 72 152 L 152 144 L 232 132 L 312 136 L 392 112 L 472 122 L 552 108"></path>
          <circle class="ph-node" cx="72" cy="164" r="6"></circle>
          <circle class="ph-node" cx="232" cy="148" r="6"></circle>
          <circle class="ph-node" cx="392" cy="126" r="6"></circle>
          <circle class="ph-node" cx="552" cy="74" r="6"></circle>
        </svg>
      `,
      status: `
        <svg class="placeholder-svg" viewBox="0 0 640 220" role="presentation" aria-hidden="true">
          <rect class="ph-track" x="56" y="34" width="528" height="24" rx="12"></rect>
          <rect class="ph-bar-a" x="56" y="34" width="152" height="24" rx="12"></rect>
          <rect class="ph-bar-b" x="208" y="34" width="164" height="24" rx="12"></rect>
          <rect class="ph-bar-c" x="372" y="34" width="108" height="24" rx="12"></rect>
          <rect class="ph-segment-4" x="480" y="34" width="104" height="24" rx="12"></rect>
          <rect class="ph-surface" x="56" y="92" width="224" height="92" rx="18"></rect>
          <rect class="ph-surface" x="306" y="92" width="278" height="92" rx="18"></rect>
          <circle class="ph-dot-a" cx="112" cy="138" r="16"></circle>
          <circle class="ph-dot-b" cx="182" cy="138" r="16"></circle>
          <circle class="ph-dot-c" cx="252" cy="138" r="16"></circle>
          <rect class="ph-bar-a" x="338" y="114" width="210" height="18" rx="9"></rect>
          <rect class="ph-bar-b" x="338" y="146" width="154" height="18" rx="9"></rect>
        </svg>
      `,
      quadrant: `
        <svg class="placeholder-svg" viewBox="0 0 640 220" role="presentation" aria-hidden="true">
          <rect class="ph-surface" x="64" y="26" width="512" height="168" rx="18"></rect>
          <line class="ph-axis" x1="320" y1="34" x2="320" y2="186"></line>
          <line class="ph-axis" x1="76" y1="110" x2="564" y2="110"></line>
          <circle class="ph-dot-a" cx="196" cy="78" r="14"></circle>
          <circle class="ph-dot-b" cx="246" cy="92" r="10"></circle>
          <circle class="ph-dot-c" cx="396" cy="76" r="16"></circle>
          <circle class="ph-dot-a" cx="422" cy="140" r="12"></circle>
          <circle class="ph-dot-b" cx="260" cy="148" r="18"></circle>
          <circle class="ph-dot-c" cx="170" cy="142" r="11"></circle>
        </svg>
      `,
      controls: `
        <svg class="placeholder-svg" viewBox="0 0 640 220" role="presentation" aria-hidden="true">
          <rect class="ph-surface" x="32" y="28" width="256" height="164" rx="18"></rect>
          <rect class="ph-surface" x="320" y="28" width="288" height="164" rx="18"></rect>
          <line class="ph-axis" x1="64" y1="72" x2="246" y2="72"></line>
          <line class="ph-axis" x1="64" y1="112" x2="246" y2="112"></line>
          <line class="ph-axis" x1="64" y1="152" x2="246" y2="152"></line>
          <circle class="ph-dot-a" cx="134" cy="72" r="11"></circle>
          <circle class="ph-dot-b" cx="204" cy="112" r="11"></circle>
          <circle class="ph-dot-c" cx="164" cy="152" r="11"></circle>
          <rect class="ph-bar-a" x="352" y="56" width="76" height="108" rx="14"></rect>
          <rect class="ph-bar-b" x="448" y="88" width="76" height="76" rx="14"></rect>
          <rect class="ph-bar-c" x="544" y="70" width="32" height="94" rx="14"></rect>
        </svg>
      `,
      funnel: `
        <svg class="placeholder-svg" viewBox="0 0 640 220" role="presentation" aria-hidden="true">
          <rect class="ph-bar-a" x="96" y="28" width="448" height="30" rx="15"></rect>
          <rect class="ph-bar-b" x="132" y="74" width="376" height="30" rx="15"></rect>
          <rect class="ph-bar-c" x="176" y="120" width="288" height="30" rx="15"></rect>
          <rect class="ph-segment-4" x="230" y="166" width="180" height="26" rx="13"></rect>
        </svg>
      `,
    };

    return templates[type] || templates.bars;
  }

  function renderPlaceholderPage(layer) {
    const grid = document.querySelector(".js-module-grid");
    if (!grid || !layer.modules) return;

    grid.innerHTML = layer.modules
      .map(
        (module, index) => {
          const visualType = getModuleVisualType(module.title, index);
          return `
          <article class="panel chart-card">
            <div class="panel-heading panel-heading--compact">
              <h3>${module.title}</h3>
              <span class="pill pill-muted">${getModuleVisualLabel(visualType)}</span>
            </div>
            <div class="chart-card__stage">
              ${renderModuleVisual(visualType)}
            </div>
          </article>
        `;
        }
      )
      .join("");
  }

  document.addEventListener("DOMContentLoaded", () => {
    const layerKey = document.body.dataset.layer;
    const layer = data.layers[layerKey];
    if (!layer) return;

    document.title = `${data.meta.title} · ${layer.title}`;
    markActiveNav(layerKey);
    renderUpdatedAt();
    renderSources();
    renderToolbar(layer);

    if (layerKey === "layer1") {
      if (typeof window.renderOverviewPage === "function") {
        window.renderOverviewPage(layer);
      }
      return;
    }

    if (layerKey === "layer2") {
      if (typeof window.renderLayer2Page === "function") {
        window.renderLayer2Page(layer);
      }
      return;
    }

    renderPlaceholderPage(layer);
  });
})();
