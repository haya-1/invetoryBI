(function () {
  const SVG_NS = "http://www.w3.org/2000/svg";
  let riskPanelResizeBound = false;

  function createSvgElement(tag, attrs) {
    const node = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs || {}).forEach(([key, value]) => {
      node.setAttribute(key, String(value));
    });
    return node;
  }

  function buildLinePath(points) {
    return points
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ");
  }

  function buildAreaPath(points, baseline) {
    const line = buildLinePath(points);
    const last = points[points.length - 1];
    const first = points[0];
    return `${line} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`;
  }

  function scaleSeries(series, labels, width, height, margin) {
    const allValues = series.flatMap((item) => item.data);
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const span = max - min || 1;
    const xStep = (width - margin.left - margin.right) / (labels.length - 1 || 1);

    return series.map((item) => ({
      ...item,
      points: item.data.map((value, index) => ({
        x: margin.left + index * xStep,
        y: margin.top + ((max - value) / span) * (height - margin.top - margin.bottom),
      })),
    }));
  }

  function formatAmount(value) {
    return `¥${(value / 10000).toFixed(1)}万`;
  }

  function formatQuantity(value) {
    return `${value.toLocaleString("zh-CN")} 件`;
  }

  function renderSegmentSwitch(target, options, activeValue, onChange) {
    if (!target) return;

    target.innerHTML = options
      .map(
        (option) => `
          <button
            class="seg-btn${option === activeValue ? " is-active" : ""}"
            type="button"
            data-seg-value="${option}"
          >${option}</button>
        `
      )
      .join("");

    target.querySelectorAll("[data-seg-value]").forEach((node) => {
      node.addEventListener("click", () => {
        const value = node.getAttribute("data-seg-value");
        if (!value || value === activeValue) return;
        onChange(value);
      });
    });
  }

  function renderMetricCard(metric, showDeltas) {
    const deltas = showDeltas && Array.isArray(metric.deltas) && metric.deltas.length > 0
      ? `
        <div class="metric-deltas">
          ${metric.deltas
            .map((delta) => `<span class="delta-chip tone-${delta.tone}">${delta.label} ${delta.value}</span>`)
            .join("")}
        </div>
      `
      : "";

    return `
      <article class="metric-card">
        <p class="metric-title">${metric.title}</p>
        <p class="metric-value">${metric.value}${metric.unit ? `<span class="metric-unit">${metric.unit}</span>` : ""}</p>
        <p class="metric-caption">${metric.caption}</p>
        ${deltas}
      </article>
    `;
  }

  function renderStaticKpiGroup(group, kicker) {
    return `
      <article class="panel kpi-group-panel">
        <div class="panel-heading panel-heading--compact">
          <div>
            <p class="panel-kicker">${kicker}</p>
            <h3>${group.title}</h3>
          </div>
          <span class="group-hint">${group.hint}</span>
        </div>
        <div class="kpi-row">
          ${group.metrics.map((metric) => renderMetricCard(metric, group.showDeltas)).join("")}
        </div>
      </article>
    `;
  }

  function renderKpis(layer) {
    const container = document.querySelector(".js-kpi-groups");
    if (!container || !layer.kpiGroups) return;

    const { inventoryScale, turnoverEfficiency, fundingRisk } = layer.kpiGroups;
    let activeValueType = fundingRisk.defaultValueType;
    let activeWarehouse = fundingRisk.defaultWarehouse;

    container.innerHTML = `
      ${renderStaticKpiGroup(inventoryScale, "核心指标")}
      ${renderStaticKpiGroup(turnoverEfficiency, "核心指标")}
      <article class="panel kpi-group-panel">
        <div class="panel-heading panel-heading--compact">
          <div>
            <p class="panel-kicker">核心指标</p>
            <h3>${fundingRisk.title}</h3>
          </div>
          <span class="group-hint">${fundingRisk.hint}</span>
        </div>
        <div class="kpi-group-switches">
          <div class="panel-switch js-funding-value-switch" aria-label="资金风险口径切换"></div>
          <div class="panel-switch js-funding-warehouse-switch" aria-label="资金风险仓别切换"></div>
        </div>
        <div class="kpi-row js-funding-risk-cards"></div>
      </article>
    `;

    const valueSwitchNode = container.querySelector(".js-funding-value-switch");
    const warehouseSwitchNode = container.querySelector(".js-funding-warehouse-switch");
    const cardsNode = container.querySelector(".js-funding-risk-cards");

    function paintFundingMetrics() {
      if (!cardsNode) return;

      const metrics = fundingRisk.metricsByView?.[activeValueType]?.[activeWarehouse] || [];
      cardsNode.innerHTML = metrics.map((metric) => renderMetricCard(metric, false)).join("");
    }

    function bindFundingValueSwitch() {
      renderSegmentSwitch(valueSwitchNode, fundingRisk.valueTypeOptions, activeValueType, (next) => {
        activeValueType = next;
        bindFundingValueSwitch();
        paintFundingMetrics();
      });
    }

    function bindFundingWarehouseSwitch() {
      renderSegmentSwitch(warehouseSwitchNode, fundingRisk.warehouseOptions, activeWarehouse, (next) => {
        activeWarehouse = next;
        bindFundingWarehouseSwitch();
        paintFundingMetrics();
      });
    }

    bindFundingValueSwitch();
    bindFundingWarehouseSwitch();

    paintFundingMetrics();
  }

  function renderHealthScore(layer) {
    const chartTarget = document.querySelector(".js-health-score-chart");
    const summaryTarget = document.querySelector(".js-health-score-summary");
    const factorsTarget = document.querySelector(".js-health-score-factors");
    if (!chartTarget || !summaryTarget || !factorsTarget) return;

    const score = layer.healthScore.score;
    const size = 214;
    const radius = 72;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - score / 100);

    chartTarget.innerHTML = `
      <svg class="score-svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="库存健康度评分 ${score}">
        <defs>
          <linearGradient id="scoreGradient" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stop-color="#0f7068"></stop>
            <stop offset="100%" stop-color="#bf7b22"></stop>
          </linearGradient>
        </defs>
        <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none" stroke="rgba(23,48,49,0.08)" stroke-width="16"></circle>
        <circle
          cx="${size / 2}"
          cy="${size / 2}"
          r="${radius}"
          fill="none"
          stroke="url(#scoreGradient)"
          stroke-linecap="round"
          stroke-width="16"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${dashOffset}"
          transform="rotate(-90 ${size / 2} ${size / 2})"
        ></circle>
        <text x="50%" y="46%" text-anchor="middle" font-size="46" font-weight="800" fill="#173031">${score}</text>
        <text x="50%" y="59%" text-anchor="middle" font-size="16" fill="#5f7477">${layer.healthScore.grade}</text>
        <text x="50%" y="73%" text-anchor="middle" font-size="11" fill="#5f7477">0-100 综合评分</text>
      </svg>
    `;

    summaryTarget.textContent = layer.healthScore.summary;
    factorsTarget.innerHTML = layer.healthScore.factors
      .map(
        (factor) => `
          <div class="factor-card">
            <div class="factor-card__top">
              <span>${factor.label}</span>
              <span class="delta-chip tone-${factor.tone}">${factor.value} 分</span>
            </div>
            <div class="factor-track"><span style="width:${factor.value}%"></span></div>
          </div>
        `
      )
      .join("");
  }

  function renderRiskRatings(layer) {
    const target = document.querySelector(".js-risk-rating-list");
    if (!target || !layer.riskRatings) return;

    target.innerHTML = `
      <div class="risk-summary">
        ${layer.riskRatings.summary
          .map(
            (item) => `
              <div class="risk-card">
                <strong>${item.count}</strong>
                <span>${item.level}</span>
              </div>
            `
          )
          .join("")}
      </div>
      <div class="risk-rating-cards">
        ${layer.riskRatings.categories
          .map(
            (item) => `
              <article class="risk-rating-card">
                <div class="risk-rating-card__top">
                  <h4>${item.category}</h4>
                  <span class="delta-chip tone-${item.tone}">${item.level}</span>
                </div>
                <div class="risk-rating-card__metrics">
                  <span>呆滞率 ${item.stagnantRate}</span>
                  <span>库销比 ${item.stockSalesRatio}</span>
                  <span>周转天数 ${item.turnoverDays}</span>
                </div>
                <p>${item.explanation}</p>
              </article>
            `
          )
          .join("")}
      </div>
    `;
  }

  function syncRiskPanelHeight() {
    const healthPanel = document.querySelector(".panel-spotlight");
    const riskPanel = document.querySelector(".js-risk-panel");
    const riskCards = riskPanel?.querySelector(".risk-rating-cards");
    if (!healthPanel || !riskPanel || !riskCards) return;

    riskPanel.style.height = "";
    if (window.matchMedia("(max-width: 1320px)").matches) return;

    const targetHeight = Math.round(healthPanel.getBoundingClientRect().height);
    if (targetHeight > 0) {
      riskPanel.style.height = `${targetHeight}px`;
    }
  }

  function bindRiskPanelResizeSync() {
    if (riskPanelResizeBound) return;

    window.addEventListener("resize", () => {
      syncRiskPanelHeight();
    });
    riskPanelResizeBound = true;
  }

  function renderLineChart(selector, chartData, label) {
    const target = document.querySelector(selector);
    if (!target) return;

    const width = 720;
    const height = 300;
    const margin = { top: 20, right: 18, bottom: 36, left: 42 };
    const allValues = chartData.series.flatMap((item) => item.data);
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const scaled = scaleSeries(chartData.series, chartData.labels, width, height, margin);
    const svg = createSvgElement("svg", { viewBox: `0 0 ${width} ${height}`, role: "img", "aria-label": label });

    for (let i = 0; i <= 4; i += 1) {
      const ratio = i / 4;
      const y = margin.top + ratio * (height - margin.top - margin.bottom);
      const value = Math.round(max - (max - min) * ratio);

      svg.appendChild(createSvgElement("line", { x1: margin.left, y1: y, x2: width - margin.right, y2: y, class: "chart-grid-line" }));
      const axis = createSvgElement("text", {
        x: margin.left - 10,
        y: y + 4,
        "text-anchor": "end",
        class: "chart-axis-label",
      });
      axis.textContent = String(value);
      svg.appendChild(axis);
    }

    chartData.labels.forEach((labelText, index) => {
      const x = margin.left + (index / (chartData.labels.length - 1 || 1)) * (width - margin.left - margin.right);
      const axis = createSvgElement("text", {
        x,
        y: height - 12,
        "text-anchor": "middle",
        class: "chart-axis-label",
      });
      axis.textContent = labelText;
      svg.appendChild(axis);
    });

    scaled.forEach((series) => {
      if (series.area) {
        svg.appendChild(
          createSvgElement("path", {
            d: buildAreaPath(series.points, height - margin.bottom),
            class: "chart-area",
            fill: series.fill,
          })
        );
      }

      svg.appendChild(
        createSvgElement("path", {
          d: buildLinePath(series.points),
          class: "chart-line",
          stroke: series.color,
        })
      );

      series.points.forEach((point) => {
        svg.appendChild(
          createSvgElement("circle", {
            cx: point.x,
            cy: point.y,
            r: 4.2,
            class: "chart-point",
            fill: series.color,
          })
        );
      });
    });

    target.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "chart-wrap";
    wrap.appendChild(svg);
    const legend = document.createElement("div");
    legend.className = "chart-legend";
    legend.innerHTML = chartData.series
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

  function renderTrendSection(layer) {
    const scopeOptions = layer.trendScopeOptions || ["总体"];
    let activeOutboundScope = scopeOptions[0];
    let activeBalanceScope = scopeOptions[0];

    const outboundSwitch = document.querySelector(".js-outbound-scope-switch");
    const balanceSwitch = document.querySelector(".js-balance-scope-switch");

    function paintOutbound() {
      const data = layer.outboundInboundByScope?.[activeOutboundScope];
      if (data) {
        renderLineChart(".js-outbound-inbound-chart", data, `出入库趋势-${activeOutboundScope}`);
      }
    }

    function paintBalance() {
      const data = layer.balanceTrendByScope?.[activeBalanceScope];
      if (data) {
        renderLineChart(".js-balance-chart", data, `库存余额趋势-${activeBalanceScope}`);
      }
    }

    function bindOutboundSwitch() {
      renderSegmentSwitch(outboundSwitch, scopeOptions, activeOutboundScope, (next) => {
        activeOutboundScope = next;
        bindOutboundSwitch();
        paintOutbound();
      });
    }

    function bindBalanceSwitch() {
      renderSegmentSwitch(balanceSwitch, scopeOptions, activeBalanceScope, (next) => {
        activeBalanceScope = next;
        bindBalanceSwitch();
        paintBalance();
      });
    }

    bindOutboundSwitch();
    bindBalanceSwitch();

    paintOutbound();
    paintBalance();
  }

  function renderStagnantTable(target, rows, activeSort) {
    if (!target) return;

    target.innerHTML = rows
      .map((item, index) => {
        const primaryValue = activeSort === "按金额" ? formatAmount(item.amount) : formatQuantity(item.quantity);
        const secondaryValue = activeSort === "按金额" ? formatQuantity(item.quantity) : formatAmount(item.amount);

        return `
          <div class="rank-table-row">
            <span class="rank-index">${String(index + 1).padStart(2, "0")}</span>
            <span class="rank-name">${item.name}</span>
            <span class="rank-primary">${primaryValue}</span>
            <span class="rank-secondary">${secondaryValue}</span>
          </div>
        `;
      })
      .join("");
  }

  function renderStagnantAnalysis(layer) {
    const section = layer.stagnantAnalysis;
    if (!section) return;

    const categoryTarget = document.querySelector(".js-stagnant-category");
    const warehouseTarget = document.querySelector(".js-stagnant-warehouse");
    const switchTarget = document.querySelector(".js-stagnant-sort-switch");
    let activeSort = section.defaultSort;

    function paintTables() {
      renderStagnantTable(categoryTarget, section.categoryTop10?.[activeSort] || [], activeSort);
      renderStagnantTable(warehouseTarget, section.warehouseTop10?.[activeSort] || [], activeSort);
    }

    function bindSortSwitch() {
      renderSegmentSwitch(switchTarget, section.sortOptions, activeSort, (next) => {
        activeSort = next;
        bindSortSwitch();
        paintTables();
      });
    }

    bindSortSwitch();
    paintTables();
  }

  window.renderOverviewPage = function renderOverviewPage(layer) {
    renderKpis(layer);
    renderHealthScore(layer);
    renderRiskRatings(layer);
    renderTrendSection(layer);
    renderStagnantAnalysis(layer);
    syncRiskPanelHeight();
    requestAnimationFrame(syncRiskPanelHeight);
    bindRiskPanelResizeSync();
  };
})();
