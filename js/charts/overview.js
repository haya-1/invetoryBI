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

  function renderSparkline(target, values, tone) {
    const width = 120;
    const height = 40;
    const padding = 4;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const step = (width - padding * 2) / (values.length - 1 || 1);
    const colorMap = {
      positive: "#2d8b65",
      warning: "#bf7b22",
      negative: "#cb5a48",
      neutral: "#4d7397",
      focus: "#0f7068",
    };
    const stroke = colorMap[tone] || colorMap.focus;

    const points = values.map((value, index) => ({
      x: padding + index * step,
      y: padding + ((max - value) / span) * (height - padding * 2),
    }));

    const svg = createSvgElement("svg", {
      viewBox: `0 0 ${width} ${height}`,
      class: "sparkline-svg",
      "aria-hidden": "true",
    });
    const area = createSvgElement("path", {
      d: buildAreaPath(points, height - padding),
      class: "spark-area",
      fill: stroke,
    });
    const line = createSvgElement("path", {
      d: buildLinePath(points),
      class: "spark-line",
      stroke,
    });
    const dot = createSvgElement("circle", {
      cx: points[points.length - 1].x,
      cy: points[points.length - 1].y,
      r: 4.2,
      class: "spark-dot",
      fill: stroke,
    });

    svg.append(area, line, dot);
    target.innerHTML = "";
    target.appendChild(svg);
  }

  function renderKpis(layer) {
    const container = document.querySelector(".js-kpi-grid");
    if (!container) return;

    container.innerHTML = layer.metrics
      .map(
        (metric, index) => `
          <article class="kpi-card">
            <div class="kpi-head">
              <div>
                <p class="kpi-title">${metric.title}</p>
                <div class="kpi-caption">${metric.caption}</div>
              </div>
              <span class="pill pill-muted">#0${index + 1}</span>
            </div>
            <div class="kpi-value">${metric.value}${metric.unit ? `<span class="kpi-unit">${metric.unit}</span>` : ""}</div>
            <div class="kpi-foot">
              <div class="kpi-deltas">
                ${metric.deltas
                  .map((delta) => `<span class="delta-chip tone-${delta.tone}">${delta.label} ${delta.value}</span>`)
                  .join("")}
              </div>
              <div class="kpi-sparkline" data-sparkline-index="${index}"></div>
            </div>
          </article>
        `
      )
      .join("");

    container.querySelectorAll("[data-sparkline-index]").forEach((node) => {
      const metric = layer.metrics[Number(node.getAttribute("data-sparkline-index"))];
      renderSparkline(node, metric.sparkline, metric.status);
    });
  }

  function renderHealthScore(layer) {
    const chartTarget = document.querySelector(".js-health-score-chart");
    const summaryTarget = document.querySelector(".js-health-score-summary");
    const factorsTarget = document.querySelector(".js-health-score-factors");
    if (!chartTarget || !summaryTarget || !factorsTarget) return;

    const score = layer.healthScore.score;
    const size = 250;
    const radius = 84;
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
        <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none" stroke="rgba(23,48,49,0.08)" stroke-width="18"></circle>
        <circle
          cx="${size / 2}"
          cy="${size / 2}"
          r="${radius}"
          fill="none"
          stroke="url(#scoreGradient)"
          stroke-linecap="round"
          stroke-width="18"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${dashOffset}"
          transform="rotate(-90 ${size / 2} ${size / 2})"
        ></circle>
        <text x="50%" y="46%" text-anchor="middle" font-size="54" font-weight="800" fill="#173031">${score}</text>
        <text x="50%" y="58%" text-anchor="middle" font-size="18" fill="#5f7477">${layer.healthScore.grade}</text>
        <text x="50%" y="71%" text-anchor="middle" font-size="12" fill="#5f7477">0-100 综合评分</text>
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

  function renderRiskDistribution(layer) {
    const target = document.querySelector(".js-risk-distribution");
    if (!target) return;

    const total = layer.riskDistribution.summary.reduce(
      (sum, item) => sum + Number(item.amount.replace(/[^\d]/g, "")),
      0
    );

    target.innerHTML = `
      <div class="risk-summary">
        ${layer.riskDistribution.summary
          .map(
            (item) => `
              <div class="risk-card">
                <strong>${item.count}</strong>
                <span>${item.label} · ${item.amount}</span>
              </div>
            `
          )
          .join("")}
      </div>
      <div class="risk-track" aria-hidden="true">
        ${layer.riskDistribution.summary
          .map((item) => {
            const percentage = (Number(item.amount.replace(/[^\d]/g, "")) / total) * 100;
            return `<span style="width:${percentage}%; background:${item.color}"></span>`;
          })
          .join("")}
      </div>
      <p class="muted">${layer.riskDistribution.note}</p>
      <div class="risk-legend">
        ${layer.riskDistribution.summary
          .map((item) => {
            const percentage = ((Number(item.amount.replace(/[^\d]/g, "")) / total) * 100).toFixed(1);
            return `
              <div class="risk-legend-item">
                <span class="risk-dot" style="background:${item.color}"></span>
                <div>
                  <strong>${item.label}</strong>
                  <div class="muted">${item.count} · ${item.amount}</div>
                </div>
                <span>${percentage}%</span>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
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

  function renderTop10(layer) {
    const target = document.querySelector(".js-top10-chart");
    if (!target) return;

    const maxValue = Math.max(...layer.top10.map((item) => item.value));
    target.innerHTML = layer.top10
      .map((item) => {
        const width = (item.value / maxValue) * 100;
        return `
          <div class="rank-item">
            <div class="rank-label">
              <strong>${item.label}</strong>
              <span>${item.meta}</span>
            </div>
            <div class="rank-bar"><span style="width:${width}%"></span></div>
            <div class="rank-value">${item.textValue}</div>
          </div>
        `;
      })
      .join("");
  }

  function renderAlerts(layer) {
    const target = document.querySelector(".js-alert-list");
    if (!target) return;

    target.innerHTML = layer.alerts
      .map(
        (alert) => `
          <article class="alert-card">
            <div class="alert-card__top">
              <h4>${alert.title}</h4>
              <span class="delta-chip tone-${alert.tone}">${alert.level}</span>
            </div>
            <p>${alert.body}</p>
          </article>
        `
      )
      .join("");
  }

  window.renderOverviewPage = function renderOverviewPage(layer) {
    renderKpis(layer);
    renderHealthScore(layer);
    renderRiskDistribution(layer);
    renderLineChart(".js-outbound-inbound-chart", layer.outboundInbound, "出库量与入库量趋势图");
    renderLineChart(".js-balance-chart", layer.balanceTrend, "库存余额趋势图");
    renderTop10(layer);
  };
})();
