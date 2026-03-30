(function () {
  function formatAmount(v) { return "\u00a5" + (v / 10000).toFixed(1) + "\u4e07"; }
  function formatNumber(v) { return Number(v).toLocaleString("zh-CN"); }
  function formatWan(v) {
    if (Number.isInteger(v) && v >= 1000) return v + "\u4e07";
    if (v >= 100) return v.toFixed(1).replace(/\.0$/, "") + "\u4e07";
    return v.toFixed(2).replace(/0+$/, "").replace(/\.$/, "") + "\u4e07";
  }

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

  function renderAbcBars(target, items) {
    if (!target) return;
    var sorted = items.slice().sort(function (a, b) { return b.value - a.value; });
    target.innerHTML = '<div class="abc-bar-list">' + sorted.map(function (item) {
      return '<div class="abc-bar-row"><span class="abc-bar-label">' + (item.tier || item.label) +
        '</span><div class="abc-bar-track"><span class="abc-bar-fill" style="width:' + item.value +
        '%"></span><span class="abc-bar-value' + (item.value < 11 ? " is-outside" : "") +
        '" style="left:' + item.value + '%">' + (Number.isInteger(item.value) ? item.value : item.value.toFixed(1)) +
        '%</span></div></div>';
    }).join("") + "</div>";
  }

  function renderEChartsPie(target, items, title) {
    if (!target) return;
    target.innerHTML = '<div class="echart-box-sm" style="min-height:240px"></div>';
    var chart = echarts.init(target.querySelector(".echart-box-sm"));
    chart.setOption({
      tooltip: { trigger: "item", formatter: "{b}: {c}%" },
      legend: { bottom: 0, textStyle: { fontSize: 11 } },
      series: [{
        type: "pie", radius: ["42%", "68%"], center: ["50%", "42%"],
        label: { formatter: "{b}\n{c}%", fontSize: 11 },
        data: items.map(function (item) {
          return { name: item.tier || item.label, value: item.value, itemStyle: { color: item.color } };
        }),
      }],
    });
    window.addEventListener("resize", function () { chart.resize(); });
  }

  function renderTurnoverList(target, items, mode) {
    if (!target) return;
    var allDays = items.map(function (i) { return i.turnoverDays; });
    var maxDays = Math.max.apply(null, allDays);
    var minDays = Math.min.apply(null, allDays);
    var span = maxDays - minDays || 1;
    target.innerHTML = items.map(function (item) {
      var width = mode === "fast"
        ? ((maxDays - item.turnoverDays + 8) / (span + 8)) * 100
        : (item.turnoverDays / maxDays) * 100;
      var barColor = mode === "fast" ? "#2a9d8f" : "#e63946";
      return '<div class="turnover-item"><div class="turnover-item__top"><strong>' + item.parent +
        '</strong><span>' + item.turnoverDays + ' \u5929</span></div>' +
        '<div class="turnover-bar"><span style="width:' + width + '%;background:' + barColor + '"></span></div>' +
        '<p class="turnover-meta">\u65e5\u5747\u9500\u91cf ' + formatNumber(item.dailySales) +
        ' | \u5e93\u5b58 ' + formatNumber(item.stockQty) + ' \u53cc | \u5e93\u5b58\u91d1\u989d ' +
        formatAmount(item.stockAmount) + '</p></div>';
    }).join("");
  }

  function renderGroupedBarChart(target, labels, inventorySeries, salesSeries) {
    if (!target) return;
    target.innerHTML = '<div class="echart-box"></div>';
    var chart = echarts.init(target.querySelector(".echart-box"));
    chart.setOption({
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      legend: { data: ["\u5e93\u5b58\u91cf", "\u9500\u91cf"], bottom: 0, textStyle: { fontSize: 11 } },
      grid: { left: 46, right: 16, top: 16, bottom: 40 },
      xAxis: { type: "category", data: labels, axisLabel: { fontSize: 11 } },
      yAxis: { type: "value", axisLabel: { fontSize: 11 }, splitLine: { lineStyle: { color: "#f0f0f0" } } },
      series: [
        { name: "\u5e93\u5b58\u91cf", type: "bar", data: inventorySeries, itemStyle: { color: "#457b9d" }, barGap: "20%" },
        { name: "\u9500\u91cf", type: "bar", data: salesSeries, itemStyle: { color: "#2a9d8f" } },
      ],
    });
    window.addEventListener("resize", function () { chart.resize(); });
  }

  function renderAgingDistributionChart(target, points) {
    if (!target || !Array.isArray(points)) return;
    target.innerHTML = '<div class="echart-box"></div>';
    var chart = echarts.init(target.querySelector(".echart-box"));
    chart.setOption({
      tooltip: { trigger: "axis" },
      grid: { left: 56, right: 16, top: 16, bottom: 50 },
      xAxis: { type: "category", data: points.map(function (p) { return p.label; }),
        axisLabel: { fontSize: 10, rotate: 20 } },
      yAxis: { type: "value", axisLabel: { fontSize: 10, formatter: function (v) { return formatWan(v); } },
        splitLine: { lineStyle: { color: "#f0f0f0" } } },
      series: [{
        type: "line", data: points.map(function (p) { return p.amountWan; }),
        smooth: true, symbol: "circle", symbolSize: 6,
        lineStyle: { color: "#457b9d", width: 2.5 },
        itemStyle: { color: "#457b9d" },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: "rgba(69,123,157,0.3)" },
          { offset: 1, color: "rgba(69,123,157,0.02)" },
        ]) },
        label: { show: true, position: "top", fontSize: 10,
          formatter: function (p) { return formatWan(p.value); } },
      }],
    });
    window.addEventListener("resize", function () { chart.resize(); });
  }

  function renderStorageFeeWarning(section) {
    var summary = document.querySelector(".js-fee-summary");
    var bands = document.querySelector(".js-fee-bands");
    var riskList = document.querySelector(".js-fee-risk-skus");
    if (!summary || !bands || !riskList) return;
    summary.innerHTML =
      '<article class="fee-card"><p>\u5373\u5c06\u4ea7\u751f LTSF \u7684 SKU</p><strong>' + formatNumber(section.ltsfSkuCount) + ' \u4e2a</strong></article>' +
      '<article class="fee-card"><p>\u957f\u671f\u4ed3\u50a8\u8d39\uff08\u9884\u4f30\uff09</p><strong>' + formatAmount(section.estimatedLtsf) + '</strong></article>' +
      '<article class="fee-card"><p>\u8d85\u9f84\u9644\u52a0\u8d39\uff08\u9884\u4f30\uff09</p><strong>' + formatAmount(section.estimatedAgedFee) + '</strong></article>' +
      '<article class="fee-card fee-card--focus"><p>' + section.month + '\u9884\u8ba1\u6263\u8d39\u603b\u989d</p><strong>' + formatAmount(section.estimatedTotal) + '</strong></article>';
    bands.innerHTML =
      '<div class="fee-table-head"><span>\u5e93\u9f84\u533a\u95f4</span><span>SKU\u6570</span><span>\u4f53\u79ef</span><span>\u8d39\u7387</span><span>\u9884\u4f30\u8d39\u7528</span></div>' +
      section.bands.map(function (b) {
        return '<div class="fee-table-row"><span>' + b.range + '</span><span>' + formatNumber(b.skuCount) +
          '</span><span>' + b.volume + '</span><span>' + b.rate + '</span><strong>' + formatAmount(b.fee) + '</strong></div>';
      }).join("");
    var maxFee = Math.max.apply(null, section.topRiskSkus.map(function (i) { return i.fee; }));
    riskList.innerHTML = section.topRiskSkus.map(function (item) {
      var w = (item.fee / maxFee) * 100;
      return '<div class="fee-risk-row"><div class="fee-risk-row__top"><strong>' + item.sku +
        '</strong><span>' + item.warehouse + ' \u00b7 ' + item.age + '</span></div>' +
        '<div class="fee-risk-row__bar"><span style="width:' + w + '%"></span></div>' +
        '<div class="fee-risk-row__value">' + formatAmount(item.fee) + '</div></div>';
    }).join("");
  }

  function renderUnsellablePool(section) {
    var summary = document.querySelector(".js-unsellable-summary");
    var reasons = document.querySelector(".js-unsellable-reasons");
    var deadlines = document.querySelector(".js-unsellable-deadlines");
    if (!summary || !reasons || !deadlines) return;
    summary.innerHTML =
      '<article class="unsellable-total-card"><p>\u4e0d\u53ef\u552e\u5e93\u5b58\u6570\u91cf</p><strong>' + formatNumber(section.totalQty) + ' \u53cc</strong></article>' +
      '<article class="unsellable-total-card"><p>\u4e0d\u53ef\u552e\u5e93\u5b58\u91d1\u989d</p><strong>' + formatAmount(section.totalAmount) + '</strong></article>';
    reasons.innerHTML = section.reasons.map(function (item) {
      return '<div class="unsellable-reason-item"><div class="unsellable-reason-item__top"><strong>' + item.reason +
        '</strong><span>' + item.share + '%</span></div>' +
        '<div class="unsellable-reason-track"><span style="width:' + item.share + '%;background:' + item.color + '"></span></div>' +
        '<p>\u6570\u91cf ' + formatNumber(item.qty) + ' \u53cc \u00b7 \u91d1\u989d ' + formatAmount(item.amount) + '</p></div>';
    }).join("");
    deadlines.innerHTML = section.deadlines.map(function (item) {
      return '<div class="deadline-row"><div class="deadline-row__main"><strong>' + item.sku +
        '</strong><span>' + item.reason + ' \u00b7 ' + item.action + '</span></div>' +
        '<div class="deadline-row__meta"><span>' + item.deadline +
        '</span><span class="delta-chip ' + (item.daysLeft <= 14 ? "tone-negative" : "tone-warning") +
        '">\u5269\u4f59 ' + item.daysLeft + ' \u5929</span></div></div>';
    }).join("");
  }

  function renderLayer2Page(layer) {
    var root = document.querySelector(".js-layer2-page");
    if (!root) return;

    root.innerHTML =
      '<article class="panel layer2-module">' +
        '<div class="panel-heading"><div><p class="panel-kicker">\u6a21\u57571</p><h3>ABC\u5206\u7c7b\u5e93\u5b58\u5206\u5e03</h3></div>' +
        '<div class="layer2-switch-row"><div class="panel-switch js-abc-dimension-switch"></div><div class="panel-switch js-abc-metric-switch"></div></div></div>' +
        '<p class="layer2-module__note">' + layer.abcDistribution.note + '</p>' +
        '<div class="layer2-abc-grid"><article class="chart-card-lite"><h4>\u6761\u5f62\u56fe</h4><div class="js-abc-bar"></div></article>' +
        '<article class="chart-card-lite"><h4>\u997c\u56fe</h4><div class="abc-donut-wrap js-abc-pie"></div></article></div></article>' +

      '<article class="panel layer2-module">' +
        '<div class="panel-heading"><div><p class="panel-kicker">\u6a21\u57572</p><h3>SKU\u5468\u8f6c\u901f\u5ea6\u6392\u540d\uff08\u7236\u4f53\uff09</h3></div>' +
        '<span class="pill pill-muted">\u6392\u5e8f\u6307\u6807\uff1a\u5468\u8f6c\u5929\u6570</span></div>' +
        '<div class="layer2-ranking-grid"><article class="chart-card-lite"><h4>Top 10 \u9ad8\u5468\u8f6c\u7236\u4f53</h4>' +
        '<div class="turnover-list js-turnover-fast"></div></article>' +
        '<article class="chart-card-lite"><h4>Bottom 10 \u4f4e\u5468\u8f6c\u7236\u4f53</h4>' +
        '<div class="turnover-list js-turnover-slow"></div></article></div></article>' +

      '<article class="panel layer2-module">' +
        '<div class="panel-heading"><div><p class="panel-kicker">\u6a21\u57573</p><h3>\u5e93\u5b58\u7ed3\u6784\u5bf9\u6bd4\u56fe</h3></div>' +
        '<div class="panel-switch js-structure-scope-switch"></div></div>' +
        '<div class="chart-stage js-structure-compare-chart"></div></article>' +

      '<article class="panel layer2-module">' +
        '<div class="panel-heading"><div><p class="panel-kicker">\u6a21\u57574</p><h3>\u5e93\u9f84\u7ed3\u6784\u56fe</h3></div>' +
        '<div class="panel-switch js-aging-warehouse-switch"></div></div>' +
        '<div class="layer2-aging-grid"><article class="chart-card-lite"><h4>\u5e93\u9f84\u5360\u6bd4</h4>' +
        '<div class="abc-donut-wrap js-aging-pie"></div></article>' +
        '<article class="chart-card-lite"><h4>\u5e93\u9f84\u5206\u5e03</h4>' +
        '<div class="chart-stage js-aging-area"></div></article></div></article>' +

      '<article class="panel layer2-module">' +
        '<div class="panel-heading"><div><p class="panel-kicker">\u6a21\u57575</p><h3>\u8d85\u671f\u4ed3\u50a8\u8d39\u9884\u8b66</h3></div>' +
        '<span class="pill pill-danger">181-365\u5929 / 365\u5929\u4ee5\u4e0a</span></div>' +
        '<div class="fee-summary-grid js-fee-summary"></div><div class="fee-table js-fee-bands"></div>' +
        '<article class="chart-card-lite"><h4>\u9ad8\u98ce\u9669 SKU \u9884\u4f30\u6263\u8d39</h4>' +
        '<div class="fee-risk-list js-fee-risk-skus"></div></article></article>' +

      '<article class="panel layer2-module">' +
        '<div class="panel-heading"><div><p class="panel-kicker">\u6a21\u57576</p><h3>\u4e0d\u53ef\u552e\u5e93\u5b58\u6c60</h3></div>' +
        '<span class="pill pill-warning">\u81ea\u52a8\u79fb\u9664 / \u5f03\u7f6e\u671f\u9650\u63d0\u793a</span></div>' +
        '<div class="unsellable-summary js-unsellable-summary"></div>' +
        '<div class="unsellable-grid"><article class="chart-card-lite"><h4>\u4e0d\u53ef\u552e\u539f\u56e0\u5206\u5e03</h4>' +
        '<div class="unsellable-reasons js-unsellable-reasons"></div></article>' +
        '<article class="chart-card-lite"><h4>\u5904\u7406\u671f\u9650\u8ffd\u8e2a</h4>' +
        '<div class="deadline-list js-unsellable-deadlines"></div></article></div></article>';

    var abc = layer.abcDistribution;
    var activeDimension = abc.defaultDimension;
    var activeMetric = abc.defaultMetric;

    function paintAbc() {
      var items = ((abc.dataByDimension || {})[activeDimension] || {})[activeMetric] || [];
      renderAbcBars(root.querySelector(".js-abc-bar"), items);
      renderEChartsPie(root.querySelector(".js-abc-pie"), items, activeMetric);
    }
    function bindAbcDimensionSwitch() {
      renderSegmentSwitch(root.querySelector(".js-abc-dimension-switch"), abc.dimensionOptions, activeDimension, function (next) {
        activeDimension = next; bindAbcDimensionSwitch(); paintAbc();
      });
    }
    function bindAbcMetricSwitch() {
      renderSegmentSwitch(root.querySelector(".js-abc-metric-switch"), abc.metricOptions, activeMetric, function (next) {
        activeMetric = next; bindAbcMetricSwitch(); paintAbc();
      });
    }
    bindAbcDimensionSwitch();
    bindAbcMetricSwitch();
    paintAbc();

    renderTurnoverList(root.querySelector(".js-turnover-fast"), layer.turnoverRanking.top10, "fast");
    renderTurnoverList(root.querySelector(".js-turnover-slow"), layer.turnoverRanking.bottom10, "slow");

    var structure = layer.structureCompare;
    var activeScope = structure.defaultScope;
    function paintStructure() {
      renderGroupedBarChart(root.querySelector(".js-structure-compare-chart"), structure.labels,
        (structure.inventoryByScope || {})[activeScope] || [], structure.sales);
    }
    function bindStructureSwitch() {
      renderSegmentSwitch(root.querySelector(".js-structure-scope-switch"), structure.scopeOptions, activeScope, function (next) {
        activeScope = next; bindStructureSwitch(); paintStructure();
      });
    }
    bindStructureSwitch();
    paintStructure();

    var aging = layer.agingStructure;
    var activeWarehouse = aging.defaultWarehouse;
    function paintAging() {
      var data = (aging.dataByWarehouse || {})[activeWarehouse];
      if (!data) return;
      renderEChartsPie(root.querySelector(".js-aging-pie"), data.share, activeWarehouse);
      renderAgingDistributionChart(root.querySelector(".js-aging-area"), data.distribution);
    }
    function bindAgingSwitch() {
      renderSegmentSwitch(root.querySelector(".js-aging-warehouse-switch"), aging.warehouseOptions, activeWarehouse, function (next) {
        activeWarehouse = next; bindAgingSwitch(); paintAging();
      });
    }
    bindAgingSwitch();
    paintAging();

    renderStorageFeeWarning(layer.storageFeeWarning);
    renderUnsellablePool(layer.unsellablePool);
  }

  window.renderLayer2Page = renderLayer2Page;
})();
