(function () {
  let riskPanelResizeBound = false;

  function formatAmount(value) {
    return "\u00a5" + (value / 10000).toFixed(1) + "\u4e07";
  }

  function formatQuantity(value) {
    return value.toLocaleString("zh-CN") + " \u4ef6";
  }

  function renderSegmentSwitch(target, options, activeValue, onChange) {
    if (!target) return;
    target.innerHTML = options
      .map(function (option) {
        return '<button class="seg-btn' + (option === activeValue ? " is-active" : "") +
          '" type="button" data-seg-value="' + option + '">' + option + "</button>";
      })
      .join("");
    target.querySelectorAll("[data-seg-value]").forEach(function (node) {
      node.addEventListener("click", function () {
        var value = node.getAttribute("data-seg-value");
        if (!value || value === activeValue) return;
        onChange(value);
      });
    });
  }

  function renderMetricCard(metric, showDeltas) {
    var deltas = "";
    if (showDeltas && Array.isArray(metric.deltas) && metric.deltas.length > 0) {
      deltas = '<div class="metric-deltas">' +
        metric.deltas.map(function (d) {
          return '<span class="delta-chip tone-' + d.tone + '">' + d.label + " " + d.value + "</span>";
        }).join("") + "</div>";
    }
    return '<article class="metric-card">' +
      '<p class="metric-title">' + metric.title + "</p>" +
      '<p class="metric-value">' + metric.value +
      (metric.unit ? '<span class="metric-unit">' + metric.unit + "</span>" : "") + "</p>" +
      '<p class="metric-caption">' + metric.caption + "</p>" +
      deltas + "</article>";
  }

  function renderStaticKpiGroup(group, kicker) {
    return '<article class="panel kpi-group-panel">' +
      '<div class="panel-heading panel-heading--compact"><div>' +
      '<p class="panel-kicker">' + kicker + "</p>" +
      "<h3>" + group.title + "</h3></div>" +
      '<span class="group-hint">' + group.hint + "</span></div>" +
      '<div class="kpi-row">' +
      group.metrics.map(function (m) { return renderMetricCard(m, group.showDeltas); }).join("") +
      "</div></article>";
  }

  function renderKpis(layer) {
    var container = document.querySelector(".js-kpi-groups");
    if (!container || !layer.kpiGroups) return;
    var g = layer.kpiGroups;
    var activeValueType = g.fundingRisk.defaultValueType;
    var activeWarehouse = g.fundingRisk.defaultWarehouse;

    container.innerHTML =
      renderStaticKpiGroup(g.inventoryScale, "\u6838\u5fc3\u6307\u6807") +
      renderStaticKpiGroup(g.turnoverEfficiency, "\u6838\u5fc3\u6307\u6807") +
      '<article class="panel kpi-group-panel">' +
      '<div class="panel-heading panel-heading--compact"><div>' +
      '<p class="panel-kicker">\u6838\u5fc3\u6307\u6807</p>' +
      "<h3>" + g.fundingRisk.title + "</h3></div>" +
      '<span class="group-hint">' + g.fundingRisk.hint + "</span></div>" +
      '<div class="kpi-group-switches">' +
      '<div class="panel-switch js-funding-value-switch"></div>' +
      '<div class="panel-switch js-funding-warehouse-switch"></div></div>' +
      '<div class="kpi-row js-funding-risk-cards"></div></article>';

    var cardsNode = container.querySelector(".js-funding-risk-cards");

    function paintFundingMetrics() {
      if (!cardsNode) return;
      var metrics = (g.fundingRisk.metricsByView[activeValueType] || {})[activeWarehouse] || [];
      cardsNode.innerHTML = metrics.map(function (m) { return renderMetricCard(m, false); }).join("");
    }

    function bindFundingValueSwitch() {
      renderSegmentSwitch(container.querySelector(".js-funding-value-switch"),
        g.fundingRisk.valueTypeOptions, activeValueType, function (next) {
          activeValueType = next;
          bindFundingValueSwitch();
          paintFundingMetrics();
        });
    }

    function bindFundingWarehouseSwitch() {
      renderSegmentSwitch(container.querySelector(".js-funding-warehouse-switch"),
        g.fundingRisk.warehouseOptions, activeWarehouse, function (next) {
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
    var chartTarget = document.querySelector(".js-health-score-chart");
    var summaryTarget = document.querySelector(".js-health-score-summary");
    var factorsTarget = document.querySelector(".js-health-score-factors");
    if (!chartTarget || !summaryTarget || !factorsTarget) return;

    var score = layer.healthScore.score;
    chartTarget.innerHTML = '<div class="echart-box-sm" style="min-height:170px"></div>';
    var chart = echarts.init(chartTarget.querySelector(".echart-box-sm"));
    chart.setOption({
      series: [{
        type: "gauge",
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: 100,
        radius: "90%",
        progress: { show: true, width: 14, itemStyle: { color: "#2a9d8f" } },
        axisLine: { lineStyle: { width: 14, color: [[1, "#e0e0e0"]] } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        pointer: { show: false },
        title: { offsetCenter: [0, "30%"], fontSize: 12, color: "#666" },
        detail: { valueAnimation: true, offsetCenter: [0, "-5%"], fontSize: 32, fontWeight: 700, color: "#1d3557",
          formatter: "{value}" },
        data: [{ value: score, name: layer.healthScore.grade }],
      }],
    });
    window.addEventListener("resize", function () { chart.resize(); });

    summaryTarget.textContent = layer.healthScore.summary;
    summaryTarget.style.cssText = "font-size:0.78rem;color:#666;line-height:1.5;margin:0";
    factorsTarget.innerHTML = layer.healthScore.factors.map(function (f) {
      return '<div class="factor-card"><div class="factor-card__top"><span>' + f.label +
        '</span><span class="delta-chip tone-' + f.tone + '">' + f.value +
        ' \u5206</span></div><div class="factor-track"><span style="width:' + f.value + '%"></span></div></div>';
    }).join("");
  }

  function renderRiskRatings(layer) {
    var target = document.querySelector(".js-risk-rating-list");
    if (!target || !layer.riskRatings) return;
    target.innerHTML =
      '<div class="risk-summary">' +
      layer.riskRatings.summary.map(function (item) {
        return '<div class="risk-card"><strong>' + item.count + '</strong><span>' + item.level + '</span></div>';
      }).join("") + "</div>" +
      '<div class="risk-rating-cards">' +
      layer.riskRatings.categories.map(function (item) {
        return '<article class="risk-rating-card"><div class="risk-rating-card__top"><h4>' + item.category +
          '</h4><span class="delta-chip tone-' + item.tone + '">' + item.level + '</span></div>' +
          '<div class="risk-rating-card__metrics">' +
          '<span>\u5446\u6ede\u7387 ' + item.stagnantRate + '</span>' +
          '<span>\u5e93\u9500\u6bd4 ' + item.stockSalesRatio + '</span>' +
          '<span>\u5468\u8f6c\u5929\u6570 ' + item.turnoverDays + '</span></div>' +
          '<p>' + item.explanation + '</p></article>';
      }).join("") + "</div>";
  }

  function syncRiskPanelHeight() {
    var healthPanel = document.querySelector(".panel-spotlight");
    var riskPanel = document.querySelector(".js-risk-panel");
    if (!healthPanel || !riskPanel) return;
    riskPanel.style.height = "";
    if (window.matchMedia("(max-width: 1320px)").matches) return;
    var h = Math.round(healthPanel.getBoundingClientRect().height);
    if (h > 0) riskPanel.style.height = h + "px";
  }

  function bindRiskPanelResizeSync() {
    if (riskPanelResizeBound) return;
    window.addEventListener("resize", syncRiskPanelHeight);
    riskPanelResizeBound = true;
  }

  function renderEChartsLine(selector, chartData, ariaLabel) {
    var target = document.querySelector(selector);
    if (!target || !chartData) return;
    target.innerHTML = '<div class="echart-box"></div>';
    var chart = echarts.init(target.querySelector(".echart-box"));
    var series = chartData.series.map(function (s) {
      var opt = {
        name: s.name,
        type: "line",
        data: s.data,
        smooth: true,
        symbol: "circle",
        symbolSize: 5,
        lineStyle: { width: 2.5, color: s.color },
        itemStyle: { color: s.color },
      };
      if (s.area) {
        opt.areaStyle = { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: s.color.replace(")", ",0.25)").replace("rgb", "rgba") },
          { offset: 1, color: "rgba(255,255,255,0)" },
        ]) };
      }
      return opt;
    });

    chart.setOption({
      tooltip: { trigger: "axis" },
      legend: { data: chartData.series.map(function (s) { return s.name; }), bottom: 0, textStyle: { fontSize: 11 } },
      grid: { left: 46, right: 16, top: 16, bottom: 40 },
      xAxis: { type: "category", data: chartData.labels, boundaryGap: false,
        axisLabel: { fontSize: 11, color: "#999" }, axisLine: { lineStyle: { color: "#e0e0e0" } } },
      yAxis: { type: "value",
        axisLabel: { fontSize: 11, color: "#999" }, splitLine: { lineStyle: { color: "#f0f0f0" } } },
      series: series,
    });
    window.addEventListener("resize", function () { chart.resize(); });
  }

  function renderTrendSection(layer) {
    var scopeOptions = layer.trendScopeOptions || ["\u603b\u4f53"];
    var activeOutboundScope = scopeOptions[0];
    var activeBalanceScope = scopeOptions[0];

    function paintOutbound() {
      var data = (layer.outboundInboundByScope || {})[activeOutboundScope];
      if (data) renderEChartsLine(".js-outbound-inbound-chart", data, "\u51fa\u5165\u5e93\u8d8b\u52bf");
    }
    function paintBalance() {
      var data = (layer.balanceTrendByScope || {})[activeBalanceScope];
      if (data) renderEChartsLine(".js-balance-chart", data, "\u5e93\u5b58\u4f59\u989d\u8d8b\u52bf");
    }

    function bindOutboundSwitch() {
      renderSegmentSwitch(document.querySelector(".js-outbound-scope-switch"), scopeOptions, activeOutboundScope, function (next) {
        activeOutboundScope = next;
        bindOutboundSwitch();
        paintOutbound();
      });
    }
    function bindBalanceSwitch() {
      renderSegmentSwitch(document.querySelector(".js-balance-scope-switch"), scopeOptions, activeBalanceScope, function (next) {
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
    target.innerHTML = rows.map(function (item, index) {
      var primary = activeSort === "\u6309\u91d1\u989d" ? formatAmount(item.amount) : formatQuantity(item.quantity);
      var secondary = activeSort === "\u6309\u91d1\u989d" ? formatQuantity(item.quantity) : formatAmount(item.amount);
      return '<div class="rank-table-row"><span class="rank-index">' + String(index + 1).padStart(2, "0") +
        '</span><span class="rank-name">' + item.name +
        '</span><span class="rank-primary">' + primary +
        '</span><span class="rank-secondary">' + secondary + '</span></div>';
    }).join("");
  }

  function renderStagnantAnalysis(layer) {
    var section = layer.stagnantAnalysis;
    if (!section) return;
    var categoryTarget = document.querySelector(".js-stagnant-category");
    var warehouseTarget = document.querySelector(".js-stagnant-warehouse");
    var switchTarget = document.querySelector(".js-stagnant-sort-switch");
    var activeSort = section.defaultSort;

    function paintTables() {
      renderStagnantTable(categoryTarget, (section.categoryTop10 || {})[activeSort] || [], activeSort);
      renderStagnantTable(warehouseTarget, (section.warehouseTop10 || {})[activeSort] || [], activeSort);
    }
    function bindSortSwitch() {
      renderSegmentSwitch(switchTarget, section.sortOptions, activeSort, function (next) {
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
