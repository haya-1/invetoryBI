(function () {
  function formatNumber(v) { return Number(v).toLocaleString("zh-CN"); }
  function formatAmount(v) { return "\u00a5" + (v / 10000).toFixed(1).replace(/\.0$/, "") + "\u4e07"; }

  function renderSegmentSwitch(target, options, activeValue, onChange) {
    if (!target) return;
    target.innerHTML = options.map(function (o) {
      return '<button class="seg-btn' + (o === activeValue ? " is-active" : "") +
        '" type="button" data-seg-value="' + o + '">' + o + "</button>";
    }).join("");
    target.querySelectorAll("[data-seg-value]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var v = btn.getAttribute("data-seg-value");
        if (v && v !== activeValue) onChange(v);
      });
    });
  }

  function toneFromLevel(level) {
    if (level === "\u7ea2\u8272" || level === "\u5fc5\u65ad\u8d27") return "tone-negative";
    if (level === "\u9ec4\u8272" || level === "\u52a0\u6025") return "tone-warning";
    if (level === "\u7eff\u8272" || level === "\u6b63\u5e38") return "tone-positive";
    return "tone-neutral";
  }

  function toneFromStatus(status) {
    if (status === "\u5f85\u8c03\u67e5" || status === "\u5df2\u5f00Case") return "tone-warning";
    if (status === "\u7d22\u8d54\u6210\u529f") return "tone-positive";
    if (status === "\u5df2\u9a73\u56de") return "tone-negative";
    return "tone-neutral";
  }

  function renderEChartsLine(target, chartData, ariaLabel) {
    if (!target || !chartData) return;
    target.innerHTML = '<div class="echart-box"></div>';
    var chart = echarts.init(target.querySelector(".echart-box"));
    chart.setOption({
      tooltip: { trigger: "axis" },
      legend: { data: chartData.series.map(function (s) { return s.name; }), bottom: 0, textStyle: { fontSize: 11 } },
      grid: { left: 46, right: 16, top: 16, bottom: 40 },
      xAxis: { type: "category", data: chartData.labels, boundaryGap: false,
        axisLabel: { fontSize: 11, color: "#999" }, axisLine: { lineStyle: { color: "#e0e0e0" } } },
      yAxis: { type: "value", axisLabel: { fontSize: 11, color: "#999" }, splitLine: { lineStyle: { color: "#f0f0f0" } } },
      series: chartData.series.map(function (s) {
        var opt = { name: s.name, type: "line", data: s.data, smooth: true, symbol: "circle", symbolSize: 4,
          lineStyle: { width: 2, color: s.color }, itemStyle: { color: s.color } };
        if (s.dashed) opt.lineStyle.type = "dashed";
        if (s.area) {
          opt.areaStyle = { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: s.color.replace(")", ",0.2)").replace("rgb", "rgba") },
            { offset: 1, color: "rgba(255,255,255,0)" },
          ]) };
        }
        return opt;
      }),
    });
    window.addEventListener("resize", function () { chart.resize(); });
  }

  function renderAlertModule(module) {
    var summaryNode = document.querySelector(".js-alert-summary");
    var thresholdsNode = document.querySelector(".js-alert-thresholds");
    var tableNode = document.querySelector(".js-alert-table");
    if (!summaryNode || !thresholdsNode || !tableNode) return;

    summaryNode.innerHTML = module.summary.map(function (item) {
      return '<article class="layer3-kpi-card"><p>' + item.label + '</p><strong>' + item.value +
        '<span>' + item.unit + '</span></strong>' +
        '<span class="delta-chip ' + (item.tone === "negative" ? "tone-negative" : item.tone === "warning" ? "tone-warning" : "tone-positive") + '">' +
        (item.tone === "negative" ? "\u9ad8\u98ce\u9669" : item.tone === "warning" ? "\u9700\u5173\u6ce8" : "\u5065\u5eb7") + '</span></article>';
    }).join("");

    thresholdsNode.innerHTML = module.thresholds.map(function (item) {
      return '<div class="layer3-threshold-item"><span class="delta-chip ' + toneFromLevel(item.level) + '">' +
        item.level + '</span><span>' + item.rule + '</span></div>';
    }).join("");

    tableNode.innerHTML =
      '<div class="layer3-table-head layer3-alert-row"><span>SKU</span><span>\u56fd\u5bb6</span><span>\u7cfb\u5217</span><span>\u8fd0\u8425</span><span>FBA\u53ef\u552e\u5929\u6570</span><span>\u65ad\u8d27\u6bd4\u4f8b</span><span>\u9884\u8ba1\u65ad\u8d27\u65e5\u671f</span><span>\u72b6\u6001</span></div>' +
      module.rows.map(function (row) {
        return '<div class="layer3-table-row layer3-alert-row"><span class="row-primary">' + row.sku +
          (row.mustOut ? "<em>\u5fc5\u65ad\u8d27</em>" : "") + '</span><span>' + row.country + '</span><span>' + row.series +
          '</span><span>' + row.owner + '</span><span>' + row.fbaDays + '\u5929</span><span class="' +
          (row.stockoutRatio > 5 ? "text-danger" : "text-muted") + '">' + row.stockoutRatio.toFixed(1) + '%</span><span>' +
          row.predictedOutDate + '</span><span class="delta-chip ' + toneFromLevel(row.level) + '">' + row.level + '</span></div>';
      }).join("");
  }

  function renderEChartsHBar(target, labels, values, colors, opts) {
    if (!target || !labels.length) return;
    var o = opts || {};
    var unit = o.unit || "";
    var rowH = o.rowHeight || 30;
    var h = Math.max(180, labels.length * rowH + 40);
    target.innerHTML = '<div class="echart-box" style="min-height:' + h + 'px"></div>';
    var chart = echarts.init(target.querySelector(".echart-box"));
    chart.setOption({
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" },
        formatter: function (p) { return p[0].name + ": " + p[0].value + unit; } },
      grid: { left: o.labelWidth || 80, right: 56, top: 6, bottom: 6, containLabel: false },
      xAxis: { type: "value", max: o.max || undefined, show: false },
      yAxis: { type: "category", data: labels, axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { fontSize: 12, color: "#333" } },
      series: [{
        type: "bar", barWidth: o.barWidth || 16,
        data: values.map(function (v, i) { return { value: v, itemStyle: { color: colors[i] || o.color || "#5DADE2" } }; }),
        showBackground: true,
        backgroundStyle: { color: "rgba(180,180,180,0.12)", borderRadius: 2 },
        itemStyle: { borderRadius: 2 },
        label: { show: true, position: "right", fontSize: 11, fontWeight: 600, color: "#333",
          formatter: function (p) { return p.value + unit; } },
      }],
    });
    window.addEventListener("resize", function () { chart.resize(); });
  }

  function renderUrgencyBars(target, items) {
    if (!target || !Array.isArray(items) || !items.length) return;
    var sorted = items.slice().sort(function (a, b) { return a.value - b.value; });
    var suffix = items[0].suffix || " SKU";
    renderEChartsHBar(target,
      sorted.map(function (i) { return i.level; }),
      sorted.map(function (i) { return i.value; }),
      sorted.map(function (i) { return i.color; }),
      { unit: suffix, labelWidth: 70, barWidth: 16 });
  }

  function renderAdoptionList(target, items) {
    if (!target) return;
    target.innerHTML = items.map(function (item) {
      var rate = item.suggestedSku > 0 ? (item.adoptedSku / item.suggestedSku) * 100 : 0;
      return '<div class="layer3-adoption-item"><div class="layer3-adoption-item__top"><strong>' + item.period +
        '</strong><span>' + rate.toFixed(1) + '%</span></div>' +
        '<div class="layer3-adoption-track"><span style="width:' + Math.min(rate, 100) + '%"></span></div>' +
        '<p>\u5efa\u8bae ' + item.suggestedSku + ' SKU \u00b7 \u5b9e\u91c7 ' + item.adoptedSku + ' SKU</p></div>';
    }).join("");
  }

  function renderReplenishmentModule(module) {
    var barsNode = document.querySelector(".js-urgency-bars");
    var tableNode = document.querySelector(".js-replenish-table");
    var adoptionNode = document.querySelector(".js-adoption-list");
    var switchNode = document.querySelector(".js-urgency-metric-switch");
    if (!barsNode || !tableNode || !adoptionNode || !switchNode) return;
    var activeMetric = module.defaultMetric;

    function paintBars() { renderUrgencyBars(barsNode, (module.urgencyData || {})[activeMetric] || []); }
    function bindMetricSwitch() {
      renderSegmentSwitch(switchNode, module.metricOptions, activeMetric, function (next) {
        activeMetric = next; bindMetricSwitch(); paintBars();
      });
    }
    bindMetricSwitch();
    paintBars();
    renderAdoptionList(adoptionNode, module.adoptionTrend);

    tableNode.innerHTML =
      '<div class="layer3-table-head layer3-replenish-row"><span>SKU</span><span>\u7ad9\u70b9</span><span>\u7d27\u6025\u7b49\u7ea7</span><span>\u9700\u91c7\u8d2d\u6570\u91cf</span><span>\u9700\u91c7\u8d2d\u91d1\u989d</span><span>\u9884\u8ba1\u65ad\u8d27\u65e5</span><span>\u5efa\u8bae\u4e0b\u5355\u65e5</span></div>' +
      module.suggestions.map(function (item) {
        return '<div class="layer3-table-row layer3-replenish-row"><span class="row-primary">' + item.sku +
          '</span><span>' + item.site + '</span><span class="delta-chip ' + toneFromLevel(item.level) + '">' + item.level +
          '</span><span>' + formatNumber(item.requiredQty) + '</span><span>' + formatAmount(item.requiredAmount) +
          '</span><span>' + item.stockoutDate + '</span><span>' + item.orderDate + '</span></div>';
      }).join("");
  }

  function renderDiscrepancyModule(module) {
    var tableNode = document.querySelector(".js-discrepancy-table");
    var overdueNode = document.querySelector(".js-overdue-list");
    var rootBarsNode = document.querySelector(".js-root-cause-bars");
    var switchNode = document.querySelector(".js-root-cause-switch");
    if (!tableNode || !overdueNode || !rootBarsNode || !switchNode) return;

    tableNode.innerHTML =
      '<div class="layer3-table-head layer3-discrepancy-row"><span>\u8d27\u4ef6\u53f7</span><span>\u7269\u6d41\u5546</span><span>\u53d1\u8d27\u91cf</span><span>\u7b7e\u6536\u91cf</span><span>\u5dee\u5f02\u91cf</span><span>\u5dee\u5f02\u7387</span><span>\u5728\u9014\u5929\u6570</span></div>' +
      module.rows.map(function (item) {
        var dq = item.shippedQty - item.receivedQty;
        var dr = item.shippedQty > 0 ? (dq / item.shippedQty) * 100 : 0;
        return '<div class="layer3-table-row layer3-discrepancy-row"><span class="row-primary">' + item.shipmentNo +
          '</span><span>' + item.carrier + '</span><span>' + formatNumber(item.shippedQty) +
          '</span><span>' + formatNumber(item.receivedQty) +
          '</span><span class="' + (dq > 80 ? "text-danger" : "text-muted") + '">' + formatNumber(dq) +
          '</span><span class="' + (dr > 5 ? "text-danger" : "text-muted") + '">' + dr.toFixed(1) +
          '%</span><span>' + item.agingDays + '\u5929</span></div>';
      }).join("");

    overdueNode.innerHTML = module.overdueShipments.map(function (item) {
      return '<div class="layer3-overdue-item"><div class="layer3-overdue-item__top"><strong>' + item.shipmentNo +
        '</strong><span>' + item.site + ' \u00b7 ' + item.carrier + '</span></div>' +
        '<p>\u8d85\u671f ' + item.waitingDays + ' \u5929\uff0c\u5efa\u8bae\u5728 ' + item.deadline + ' \u524d\u5b8c\u6210\u7d22\u8d54\u767b\u8bb0\u3002</p></div>';
    }).join("");

    var activeRootCause = module.defaultRootCause;
    function paintRootCauseBars() {
      var list = (module.rootCauseData || {})[activeRootCause] || [];
      if (!list.length) return;
      var sorted = list.slice().sort(function (a, b) { return a.diffRate - b.diffRate; });
      renderEChartsHBar(rootBarsNode,
        sorted.map(function (i) { return i.name; }),
        sorted.map(function (i) { return Math.round(i.diffRate * 10) / 10; }),
        sorted.map(function () { return "#E74C3C"; }),
        { unit: "%", labelWidth: 90, barWidth: 14, color: "#E74C3C" });
    }
    function bindRootCauseSwitch() {
      renderSegmentSwitch(switchNode, module.rootCauseOptions, activeRootCause, function (next) {
        activeRootCause = next; bindRootCauseSwitch(); paintRootCauseBars();
      });
    }
    bindRootCauseSwitch();
    paintRootCauseBars();
  }

  function renderClaimModule(module) {
    var statusNode = document.querySelector(".js-claim-status");
    var summaryNode = document.querySelector(".js-claim-summary");
    var trendNode = document.querySelector(".js-claim-trend");
    var tableNode = document.querySelector(".js-claim-table");
    if (!statusNode || !summaryNode || !trendNode || !tableNode) return;

    statusNode.innerHTML = module.statusCards.map(function (item) {
      return '<article class="layer3-status-card"><p>' + item.status + '</p><strong>' + item.count +
        ' \u7b14</strong><span>' + formatAmount(item.amount) + '</span></article>';
    }).join("");

    var recovered = module.recoveredSummary.recoveredAmount;
    var target = module.recoveredSummary.targetAmount;
    var rate = target > 0 ? (recovered / target) * 100 : 0;
    summaryNode.innerHTML =
      '<article class="layer3-recover-card"><p>\u7d2f\u8ba1\u633d\u56de\u91d1\u989d</p><strong>' + formatAmount(recovered) + '</strong></article>' +
      '<article class="layer3-recover-card"><p>\u76ee\u6807\u8fbe\u6210\u7387</p><strong>' + rate.toFixed(1) + '%</strong></article>';

    var mr = module.monthlyRecovered;
    if (mr && mr.length) {
      renderEChartsHBar(trendNode,
        mr.map(function (i) { return i.month; }),
        mr.map(function (i) { return i.amount; }),
        mr.map(function () { return "#2a9d8f"; }),
        { unit: "\u4e07", labelWidth: 70, barWidth: 14, color: "#2a9d8f" });
    }

    tableNode.innerHTML =
      '<div class="layer3-table-head layer3-claim-row"><span>Case\u7f16\u53f7</span><span>\u8d27\u4ef6\u53f7</span><span>\u72b6\u6001</span><span>\u91d1\u989d</span><span>\u8d1f\u8d23\u4eba</span><span>\u66f4\u65b0\u65f6\u95f4</span></div>' +
      module.cases.map(function (item) {
        return '<div class="layer3-table-row layer3-claim-row"><span class="row-primary">' + item.caseNo +
          '</span><span>' + item.shipmentNo + '</span><span class="delta-chip ' + toneFromStatus(item.status) + '">' + item.status +
          '</span><span>' + formatAmount(item.amount) + '</span><span>' + item.owner + '</span><span>' + item.updatedAt + '</span></div>';
      }).join("");
  }

  function renderLayer3Page(layer) {
    var root = document.querySelector(".js-layer3-page");
    if (!root) return;

    root.innerHTML =
      '<article class="panel layer3-module">' +
        '<div class="panel-heading"><div><p class="panel-kicker">\u6a21\u57571</p><h3>\u5e93\u5b58\u9884\u8b66\u6a21\u5757</h3></div>' +
        '<span class="pill pill-danger">\u7ea2\u9ec4\u7eff\u84dd\u5e93\u5b58\u706f\u673a\u5236</span></div>' +
        '<div class="layer3-alert-grid"><div class="layer3-summary-grid js-alert-summary"></div>' +
        '<article class="chart-card-lite"><h4>\u9884\u8b66\u9608\u503c\u89c4\u5219</h4><div class="layer3-threshold-list js-alert-thresholds"></div></article></div>' +
        '<div class="layer3-table js-alert-table"></div></article>' +

      '<article class="panel layer3-module">' +
        '<div class="panel-heading"><div><p class="panel-kicker">\u6a21\u57572</p><h3>\u8865\u8d27\u5efa\u8bae\u6a21\u5757</h3></div>' +
        '<div class="panel-switch js-urgency-metric-switch"></div></div>' +
        '<div class="layer3-replenish-grid"><article class="chart-card-lite"><h4>\u7d27\u6025\u7a0b\u5ea6\u5206\u5e03</h4>' +
        '<div class="layer3-bar-list js-urgency-bars"></div></article>' +
        '<article class="chart-card-lite"><h4>\u5efa\u8bae\u91c7\u7eb3\u7387\u8ffd\u8e2a</h4>' +
        '<div class="layer3-adoption-list js-adoption-list"></div></article></div>' +
        '<div class="layer3-table js-replenish-table"></div></article>' +

      '<article class="panel layer3-module">' +
        '<div class="panel-heading"><div><p class="panel-kicker">\u6a21\u57573</p><h3>\u9500\u91cf\u9884\u6d4b\u4e0e\u5e93\u5b58\u6c34\u4f4d\u9884\u6d4b\u56fe</h3></div>' +
        '<div class="panel-switch js-forecast-dimension-switch"></div></div>' +
        '<div class="chart-stage js-forecast-chart"></div></article>' +

      '<article class="panel layer3-module">' +
        '<div class="panel-heading"><div><p class="panel-kicker">\u6a21\u57574</p><h3>\u6536\u53d1\u5dee\u5f02\u770b\u677f</h3></div>' +
        '<div class="panel-switch js-root-cause-switch"></div></div>' +
        '<div class="layer3-discrepancy-grid"><article class="chart-card-lite"><h4>\u5dee\u5f02\u660e\u7ec6</h4>' +
        '<div class="layer3-table js-discrepancy-table"></div></article>' +
        '<article class="chart-card-lite"><h4>\u8d85\u671f\u672a\u4e0a\u67b6\u9884\u8b66</h4>' +
        '<div class="layer3-overdue-list js-overdue-list"></div></article></div>' +
        '<article class="chart-card-lite"><h4>\u5dee\u5f02\u6839\u56e0\u5206\u6790</h4>' +
        '<div class="layer3-bar-list js-root-cause-bars"></div></article></article>' +

      '<article class="panel layer3-module">' +
        '<div class="panel-heading"><div><p class="panel-kicker">\u6a21\u57575</p><h3>\u7d22\u8d54\u72b6\u6001\u8ffd\u8e2a</h3></div>' +
        '<span class="pill pill-warning">\u8d44\u4ea7\u633d\u56de\u95ed\u73af</span></div>' +
        '<div class="layer3-claim-grid"><article class="chart-card-lite"><h4>\u72b6\u6001\u8ffd\u8e2a</h4>' +
        '<div class="layer3-status-grid js-claim-status"></div></article>' +
        '<article class="chart-card-lite"><h4>\u91d1\u989d\u633d\u56de\u7edf\u8ba1</h4>' +
        '<div class="layer3-recover-summary js-claim-summary"></div><div class="layer3-bar-list js-claim-trend"></div></article></div>' +
        '<div class="layer3-table js-claim-table"></div></article>';

    renderAlertModule(layer.alertModule);
    renderReplenishmentModule(layer.replenishmentModule);
    renderDiscrepancyModule(layer.discrepancyModule);
    renderClaimModule(layer.claimModule);

    var fm = layer.forecastModule;
    var activeDimension = fm.defaultDimension;
    function paintForecastChart() {
      renderEChartsLine(root.querySelector(".js-forecast-chart"), (fm.dataByDimension || {})[activeDimension], "\u9500\u91cf\u9884\u6d4b\u4e0e\u5e93\u5b58\u6c34\u4f4d");
    }
    function bindForecastSwitch() {
      renderSegmentSwitch(root.querySelector(".js-forecast-dimension-switch"), fm.dimensionOptions, activeDimension, function (next) {
        activeDimension = next; bindForecastSwitch(); paintForecastChart();
      });
    }
    bindForecastSwitch();
    paintForecastChart();
  }

  window.renderLayer3Page = renderLayer3Page;
})();
