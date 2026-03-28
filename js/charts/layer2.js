(function () {
  const SVG_NS = "http://www.w3.org/2000/svg";

  function createSvgElement(tag, attrs) {
    const node = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs || {}).forEach(([key, value]) => {
      node.setAttribute(key, String(value));
    });
    return node;
  }

  function buildLinePath(points) {
    return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  }

  function buildAreaPath(points, baseline) {
    const line = buildLinePath(points);
    const first = points[0];
    const last = points[points.length - 1];
    return `${line} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`;
  }

  function formatAmount(value) {
    return `¥${(value / 10000).toFixed(1)}万`;
  }

  function formatNumber(value) {
    return value.toLocaleString("zh-CN");
  }

  function renderSegmentSwitch(target, options, activeValue, onChange) {
    if (!target) return;
    target.innerHTML = options
      .map(
        (option) => `
          <button class="seg-btn${option === activeValue ? " is-active" : ""}" type="button" data-seg-value="${option}">
            ${option}
          </button>
        `
      )
      .join("");

    target.querySelectorAll("[data-seg-value]").forEach((button) => {
      button.addEventListener("click", () => {
        const value = button.getAttribute("data-seg-value");
        if (!value || value === activeValue) return;
        onChange(value);
      });
    });
  }

  function renderAbcBars(target, items) {
    if (!target) return;
    target.innerHTML = `
      <div class="abc-bar-list">
        ${items
          .map(
            (item) => `
              <div class="abc-bar-row" style="--abc-color:${item.color}">
                <span class="abc-bar-label">${item.tier}</span>
                <div class="abc-bar-track"><span style="width:${item.value}%"></span></div>
                <span class="abc-bar-value">${item.value}%</span>
              </div>
            `
          )
          .join("")}
      </div>
    `;
  }

  function renderDonut(target, items, centerTitle) {
    if (!target) return;

    const size = 220;
    const center = size / 2;
    const radius = 70;
    const strokeWidth = 24;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    const svg = createSvgElement("svg", {
      viewBox: `0 0 ${size} ${size}`,
      class: "abc-donut-svg",
      role: "img",
      "aria-label": `${centerTitle}占比环图`,
    });

    svg.appendChild(
      createSvgElement("circle", {
        cx: center,
        cy: center,
        r: radius,
        fill: "none",
        stroke: "rgba(23,48,49,0.08)",
        "stroke-width": strokeWidth,
      })
    );

    items.forEach((item) => {
      const length = (item.value / 100) * circumference;
      const segment = createSvgElement("circle", {
        cx: center,
        cy: center,
        r: radius,
        fill: "none",
        stroke: item.color,
        "stroke-width": strokeWidth,
        "stroke-linecap": "butt",
        "stroke-dasharray": `${length} ${circumference - length}`,
        "stroke-dashoffset": `${-offset}`,
        transform: `rotate(-90 ${center} ${center})`,
      });
      svg.appendChild(segment);
      offset += length;
    });

    const title = createSvgElement("text", {
      x: "50%",
      y: "48%",
      "text-anchor": "middle",
      "font-size": "22",
      "font-weight": "800",
      fill: "#173031",
    });
    title.textContent = centerTitle;
    svg.appendChild(title);

    const note = createSvgElement("text", {
      x: "50%",
      y: "60%",
      "text-anchor": "middle",
      "font-size": "11",
      fill: "#5f7477",
    });
    note.textContent = "ABC 聚合占比";
    svg.appendChild(note);

    target.innerHTML = "";
    target.appendChild(svg);

    const legend = document.createElement("div");
    legend.className = "abc-legend";
    legend.innerHTML = items
      .map(
        (item) => `
          <div class="abc-legend-item">
            <span class="abc-legend-dot" style="background:${item.color}"></span>
            <span>${item.tier}</span>
            <strong>${item.value}%</strong>
          </div>
        `
      )
      .join("");
    target.appendChild(legend);
  }

  function renderTurnoverList(target, items, mode) {
    if (!target) return;

    const allDays = items.map((item) => item.turnoverDays);
    const maxDays = Math.max(...allDays);
    const minDays = Math.min(...allDays);
    const span = maxDays - minDays || 1;

    target.innerHTML = items
      .map((item) => {
        const width =
          mode === "fast"
            ? ((maxDays - item.turnoverDays + 8) / (span + 8)) * 100
            : (item.turnoverDays / maxDays) * 100;
        const barColor = mode === "fast" ? "#0f7068" : "#cb5a48";

        return `
          <div class="turnover-item">
            <div class="turnover-item__top">
              <strong>${item.parent}</strong>
              <span>${item.turnoverDays} 天</span>
            </div>
            <div class="turnover-bar"><span style="width:${width}%; background:${barColor}"></span></div>
            <p class="turnover-meta">
              日均销量 ${formatNumber(item.dailySales)} | 库存 ${formatNumber(item.stockQty)} 双 | 库存金额 ${formatAmount(item.stockAmount)}
            </p>
          </div>
        `;
      })
      .join("");
  }

  function renderGroupedBarChart(target, labels, inventorySeries, salesSeries) {
    if (!target) return;

    const width = 760;
    const height = 300;
    const margin = { top: 20, right: 18, bottom: 46, left: 48 };
    const maxValue = Math.max(...inventorySeries, ...salesSeries);
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const groupWidth = innerWidth / labels.length;
    const barWidth = Math.min(18, groupWidth / 3);

    const svg = createSvgElement("svg", {
      viewBox: `0 0 ${width} ${height}`,
      role: "img",
      "aria-label": "库存结构对比双轴柱状图",
    });

    for (let i = 0; i <= 4; i += 1) {
      const ratio = i / 4;
      const y = margin.top + ratio * innerHeight;
      svg.appendChild(
        createSvgElement("line", { x1: margin.left, y1: y, x2: width - margin.right, y2: y, class: "chart-grid-line" })
      );
      const valueText = createSvgElement("text", {
        x: margin.left - 10,
        y: y + 4,
        "text-anchor": "end",
        class: "chart-axis-label",
      });
      valueText.textContent = String(Math.round(maxValue - maxValue * ratio));
      svg.appendChild(valueText);
    }

    labels.forEach((label, index) => {
      const groupX = margin.left + index * groupWidth + groupWidth / 2;
      const inv = inventorySeries[index];
      const sales = salesSeries[index];
      const invHeight = (inv / maxValue) * innerHeight;
      const salesHeight = (sales / maxValue) * innerHeight;

      const invBar = createSvgElement("rect", {
        x: groupX - barWidth - 3,
        y: margin.top + innerHeight - invHeight,
        width: barWidth,
        height: invHeight,
        rx: 6,
        fill: "#0f7068",
      });
      const salesBar = createSvgElement("rect", {
        x: groupX + 3,
        y: margin.top + innerHeight - salesHeight,
        width: barWidth,
        height: salesHeight,
        rx: 6,
        fill: "#4d7397",
      });

      svg.append(invBar, salesBar);

      const axis = createSvgElement("text", {
        x: groupX,
        y: height - 14,
        "text-anchor": "middle",
        class: "chart-axis-label",
      });
      axis.textContent = label;
      svg.appendChild(axis);
    });

    target.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "chart-wrap";
    wrap.appendChild(svg);

    const legend = document.createElement("div");
    legend.className = "chart-legend";
    legend.innerHTML = `
      <span class="legend-item"><span class="legend-swatch" style="background:#0f7068"></span>库存量（受仓别切换影响）</span>
      <span class="legend-item"><span class="legend-swatch" style="background:#4d7397"></span>销量（口径固定）</span>
    `;
    target.append(wrap, legend);
  }

  function renderAreaTrend(target, trendData) {
    if (!target || !trendData) return;

    const width = 720;
    const height = 280;
    const margin = { top: 20, right: 18, bottom: 40, left: 42 };
    const allValues = trendData.series.flatMap((item) => item.data);
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const span = max - min || 1;
    const xStep = (width - margin.left - margin.right) / (trendData.labels.length - 1 || 1);

    const svg = createSvgElement("svg", {
      viewBox: `0 0 ${width} ${height}`,
      role: "img",
      "aria-label": "库龄面积图",
    });

    for (let i = 0; i <= 4; i += 1) {
      const ratio = i / 4;
      const y = margin.top + ratio * (height - margin.top - margin.bottom);
      svg.appendChild(
        createSvgElement("line", { x1: margin.left, y1: y, x2: width - margin.right, y2: y, class: "chart-grid-line" })
      );
    }

    trendData.labels.forEach((label, index) => {
      const x = margin.left + index * xStep;
      const axis = createSvgElement("text", {
        x,
        y: height - 12,
        "text-anchor": "middle",
        class: "chart-axis-label",
      });
      axis.textContent = label;
      svg.appendChild(axis);
    });

    trendData.series.forEach((series) => {
      const points = series.data.map((value, index) => ({
        x: margin.left + index * xStep,
        y: margin.top + ((max - value) / span) * (height - margin.top - margin.bottom),
      }));

      svg.appendChild(
        createSvgElement("path", {
          d: buildAreaPath(points, height - margin.bottom),
          class: "chart-area",
          fill: series.fill,
          opacity: 0.09,
        })
      );
      svg.appendChild(
        createSvgElement("path", {
          d: buildLinePath(points),
          class: "chart-line",
          stroke: series.color,
        })
      );
    });

    target.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "chart-wrap";
    wrap.appendChild(svg);
    const legend = document.createElement("div");
    legend.className = "chart-legend";
    legend.innerHTML = trendData.series
      .map(
        (series) => `
          <span class="legend-item">
            <span class="legend-swatch" style="background:${series.color}"></span>
            ${series.name}
          </span>
        `
      )
      .join("");
    target.append(wrap, legend);
  }

  function renderStorageFeeWarning(section) {
    const summary = document.querySelector(".js-fee-summary");
    const bands = document.querySelector(".js-fee-bands");
    const riskList = document.querySelector(".js-fee-risk-skus");
    if (!summary || !bands || !riskList) return;

    summary.innerHTML = `
      <article class="fee-card">
        <p>即将产生 LTSF 的 SKU</p>
        <strong>${formatNumber(section.ltsfSkuCount)} 个</strong>
      </article>
      <article class="fee-card">
        <p>长期仓储费（预估）</p>
        <strong>${formatAmount(section.estimatedLtsf)}</strong>
      </article>
      <article class="fee-card">
        <p>超龄附加费（预估）</p>
        <strong>${formatAmount(section.estimatedAgedFee)}</strong>
      </article>
      <article class="fee-card fee-card--focus">
        <p>${section.month}预计扣费总额</p>
        <strong>${formatAmount(section.estimatedTotal)}</strong>
      </article>
    `;

    bands.innerHTML = `
      <div class="fee-table-head">
        <span>库龄区间</span>
        <span>SKU数</span>
        <span>体积</span>
        <span>费率</span>
        <span>预估费用</span>
      </div>
      ${section.bands
        .map(
          (band) => `
            <div class="fee-table-row">
              <span>${band.range}</span>
              <span>${formatNumber(band.skuCount)}</span>
              <span>${band.volume}</span>
              <span>${band.rate}</span>
              <strong>${formatAmount(band.fee)}</strong>
            </div>
          `
        )
        .join("")}
    `;

    const maxFee = Math.max(...section.topRiskSkus.map((item) => item.fee));
    riskList.innerHTML = section.topRiskSkus
      .map((item) => {
        const width = (item.fee / maxFee) * 100;
        return `
          <div class="fee-risk-row">
            <div class="fee-risk-row__top">
              <strong>${item.sku}</strong>
              <span>${item.warehouse} · ${item.age}</span>
            </div>
            <div class="fee-risk-row__bar"><span style="width:${width}%"></span></div>
            <div class="fee-risk-row__value">${formatAmount(item.fee)}</div>
          </div>
        `;
      })
      .join("");
  }

  function renderUnsellablePool(section) {
    const summary = document.querySelector(".js-unsellable-summary");
    const reasons = document.querySelector(".js-unsellable-reasons");
    const deadlines = document.querySelector(".js-unsellable-deadlines");
    if (!summary || !reasons || !deadlines) return;

    summary.innerHTML = `
      <article class="unsellable-total-card">
        <p>不可售库存数量</p>
        <strong>${formatNumber(section.totalQty)} 双</strong>
      </article>
      <article class="unsellable-total-card">
        <p>不可售库存金额</p>
        <strong>${formatAmount(section.totalAmount)}</strong>
      </article>
    `;

    reasons.innerHTML = section.reasons
      .map(
        (item) => `
          <div class="unsellable-reason-item">
            <div class="unsellable-reason-item__top">
              <strong>${item.reason}</strong>
              <span>${item.share}%</span>
            </div>
            <div class="unsellable-reason-track"><span style="width:${item.share}%; background:${item.color}"></span></div>
            <p>数量 ${formatNumber(item.qty)} 双 · 金额 ${formatAmount(item.amount)}</p>
          </div>
        `
      )
      .join("");

    deadlines.innerHTML = section.deadlines
      .map(
        (item) => `
          <div class="deadline-row">
            <div class="deadline-row__main">
              <strong>${item.sku}</strong>
              <span>${item.reason} · ${item.action}</span>
            </div>
            <div class="deadline-row__meta">
              <span>${item.deadline}</span>
              <span class="delta-chip ${item.daysLeft <= 14 ? "tone-negative" : "tone-warning"}">剩余 ${item.daysLeft} 天</span>
            </div>
          </div>
        `
      )
      .join("");
  }

  function renderLayer2Page(layer) {
    const root = document.querySelector(".js-layer2-page");
    if (!root) return;

    root.innerHTML = `
      <article class="panel layer2-module">
        <div class="panel-heading">
          <div>
            <p class="panel-kicker">模块1</p>
            <h3>ABC分类库存分布</h3>
          </div>
          <div class="layer2-switch-row">
            <div class="panel-switch js-abc-dimension-switch" aria-label="ABC分析维度切换"></div>
            <div class="panel-switch js-abc-metric-switch" aria-label="ABC统计口径切换"></div>
          </div>
        </div>
        <p class="layer2-module__note">${layer.abcDistribution.note}</p>
        <div class="layer2-abc-grid">
          <article class="chart-card-lite">
            <h4>条形图</h4>
            <div class="js-abc-bar"></div>
          </article>
          <article class="chart-card-lite">
            <h4>饼图</h4>
            <div class="abc-donut-wrap js-abc-pie"></div>
          </article>
        </div>
      </article>

      <article class="panel layer2-module">
        <div class="panel-heading">
          <div>
            <p class="panel-kicker">模块2</p>
            <h3>SKU周转速度排名（父体）</h3>
          </div>
          <span class="pill pill-muted">排序指标：周转天数</span>
        </div>
        <div class="layer2-ranking-grid">
          <article class="chart-card-lite">
            <h4>Top 10 高周转父体</h4>
            <div class="turnover-list js-turnover-fast"></div>
          </article>
          <article class="chart-card-lite">
            <h4>Bottom 10 低周转父体</h4>
            <div class="turnover-list js-turnover-slow"></div>
          </article>
        </div>
      </article>

      <article class="panel layer2-module">
        <div class="panel-heading">
          <div>
            <p class="panel-kicker">模块3</p>
            <h3>库存结构对比图（双轴柱状图）</h3>
          </div>
          <div class="panel-switch js-structure-scope-switch" aria-label="库存结构仓别切换"></div>
        </div>
        <div class="chart-stage js-structure-compare-chart"></div>
      </article>

      <article class="panel layer2-module">
        <div class="panel-heading">
          <div>
            <p class="panel-kicker">模块4</p>
            <h3>库龄结构图</h3>
          </div>
          <div class="panel-switch js-aging-warehouse-switch" aria-label="库龄仓别切换"></div>
        </div>
        <div class="layer2-aging-grid">
          <article class="chart-card-lite">
            <h4>库龄占比（扇形图）</h4>
            <div class="abc-donut-wrap js-aging-pie"></div>
          </article>
          <article class="chart-card-lite">
            <h4>库龄分布（面积图）</h4>
            <div class="chart-stage js-aging-area"></div>
          </article>
        </div>
      </article>

      <article class="panel layer2-module">
        <div class="panel-heading">
          <div>
            <p class="panel-kicker">模块5</p>
            <h3>超期仓储费预警</h3>
          </div>
          <span class="pill pill-danger">181-365天 / 365天以上</span>
        </div>
        <div class="fee-summary-grid js-fee-summary"></div>
        <div class="fee-table js-fee-bands"></div>
        <article class="chart-card-lite">
          <h4>高风险 SKU 预估扣费</h4>
          <div class="fee-risk-list js-fee-risk-skus"></div>
        </article>
      </article>

      <article class="panel layer2-module">
        <div class="panel-heading">
          <div>
            <p class="panel-kicker">模块6</p>
            <h3>不可售库存池</h3>
          </div>
          <span class="pill pill-warning">自动移除 / 弃置期限提示</span>
        </div>
        <div class="unsellable-summary js-unsellable-summary"></div>
        <div class="unsellable-grid">
          <article class="chart-card-lite">
            <h4>不可售原因分布</h4>
            <div class="unsellable-reasons js-unsellable-reasons"></div>
          </article>
          <article class="chart-card-lite">
            <h4>处理期限追踪</h4>
            <div class="deadline-list js-unsellable-deadlines"></div>
          </article>
        </div>
      </article>
    `;

    const abc = layer.abcDistribution;
    let activeDimension = abc.defaultDimension;
    let activeMetric = abc.defaultMetric;

    const abcDimensionSwitch = root.querySelector(".js-abc-dimension-switch");
    const abcMetricSwitch = root.querySelector(".js-abc-metric-switch");
    const abcBarTarget = root.querySelector(".js-abc-bar");
    const abcPieTarget = root.querySelector(".js-abc-pie");

    function paintAbc() {
      const items = abc.dataByDimension?.[activeDimension]?.[activeMetric] || [];
      renderAbcBars(abcBarTarget, items);
      renderDonut(abcPieTarget, items, activeMetric);
    }

    function bindAbcDimensionSwitch() {
      renderSegmentSwitch(abcDimensionSwitch, abc.dimensionOptions, activeDimension, (next) => {
        activeDimension = next;
        bindAbcDimensionSwitch();
        paintAbc();
      });
    }

    function bindAbcMetricSwitch() {
      renderSegmentSwitch(abcMetricSwitch, abc.metricOptions, activeMetric, (next) => {
        activeMetric = next;
        bindAbcMetricSwitch();
        paintAbc();
      });
    }

    bindAbcDimensionSwitch();
    bindAbcMetricSwitch();
    paintAbc();

    renderTurnoverList(root.querySelector(".js-turnover-fast"), layer.turnoverRanking.top10, "fast");
    renderTurnoverList(root.querySelector(".js-turnover-slow"), layer.turnoverRanking.bottom10, "slow");

    const structure = layer.structureCompare;
    const structureSwitch = root.querySelector(".js-structure-scope-switch");
    let activeScope = structure.defaultScope;

    function paintStructure() {
      renderGroupedBarChart(
        root.querySelector(".js-structure-compare-chart"),
        structure.labels,
        structure.inventoryByScope?.[activeScope] || [],
        structure.sales
      );
    }

    function bindStructureSwitch() {
      renderSegmentSwitch(structureSwitch, structure.scopeOptions, activeScope, (next) => {
        activeScope = next;
        bindStructureSwitch();
        paintStructure();
      });
    }

    bindStructureSwitch();
    paintStructure();

    const aging = layer.agingStructure;
    const agingSwitch = root.querySelector(".js-aging-warehouse-switch");
    let activeWarehouse = aging.defaultWarehouse;

    function paintAging() {
      const data = aging.dataByWarehouse?.[activeWarehouse];
      if (!data) return;
      renderDonut(root.querySelector(".js-aging-pie"), data.share, activeWarehouse);
      renderAreaTrend(root.querySelector(".js-aging-area"), data.trend);
    }

    function bindAgingSwitch() {
      renderSegmentSwitch(agingSwitch, aging.warehouseOptions, activeWarehouse, (next) => {
        activeWarehouse = next;
        bindAgingSwitch();
        paintAging();
      });
    }

    bindAgingSwitch();
    paintAging();

    renderStorageFeeWarning(layer.storageFeeWarning);
    renderUnsellablePool(layer.unsellablePool);
  }

  window.renderLayer2Page = renderLayer2Page;
})();
