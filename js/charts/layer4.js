(function () {
  function formatNumber(v) { return Number(v).toLocaleString("zh-CN"); }
  function formatWan(v) { return "\u00a5" + Number(v).toFixed(0) + "\u4e07"; }

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

  function quadrantColor(name) {
    if (name === "\u7545\u9500\u7f3a\u8d27") return "#e63946";
    if (name === "\u7545\u9500\u5b89\u5168") return "#2a9d8f";
    if (name === "\u6ede\u9500\u79ef\u538b") return "#e9c46a";
    return "#457b9d";
  }

  function renderTurnoverMatrix(target, matrix) {
    if (!target || !matrix) return;
    target.innerHTML = '<div class="echart-box-lg"></div>';
    var chart = echarts.init(target.querySelector(".echart-box-lg"));

    var seriesMap = {};
    matrix.points.forEach(function (p) {
      if (!seriesMap[p.quadrant]) seriesMap[p.quadrant] = [];
      seriesMap[p.quadrant].push([p.x, p.y, p.qty, p.sku]);
    });

    var series = Object.keys(seriesMap).map(function (name) {
      return {
        name: name,
        type: "scatter",
        data: seriesMap[name],
        symbolSize: function (data) { return Math.max(8, Math.min(22, Math.sqrt(data[2]) / 2)); },
        itemStyle: { color: quadrantColor(name) },
        label: { show: true, position: "right", formatter: function (p) { return p.data[3]; }, fontSize: 10 },
      };
    });

    chart.setOption({
      tooltip: {
        formatter: function (p) {
          var d = p.data;
          return d[3] + "<br/>\u9500\u91cf\u6307\u6570: " + d[0] + "<br/>\u5e93\u5b58\u6307\u6570: " + d[1] + "<br/>\u5e93\u5b58: " + d[2];
        },
      },
      legend: { bottom: 0, textStyle: { fontSize: 11 } },
      grid: { left: 56, right: 22, top: 22, bottom: 46 },
      xAxis: { name: matrix.xLabel, nameLocation: "center", nameGap: 30, min: 0, max: 100,
        axisLabel: { fontSize: 10 }, splitLine: { lineStyle: { color: "#f0f0f0" } } },
      yAxis: { name: matrix.yLabel, nameLocation: "center", nameGap: 40, min: 0, max: 100,
        axisLabel: { fontSize: 10 }, splitLine: { lineStyle: { color: "#f0f0f0" } } },
      series: series,
    });
    window.addEventListener("resize", function () { chart.resize(); });
  }

  function erf(x) {
    var sign = x < 0 ? -1 : 1;
    var absX = Math.abs(x);
    var t = 1 / (1 + 0.3275911 * absX);
    var y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-absX * absX);
    return sign * y;
  }

  function computeSafetyMetrics(state) {
    var safetyStock = state.z * state.sigmaD * Math.sqrt(state.leadTime);
    var reorderPoint = state.avgDailyDemand * state.leadTime + safetyStock;
    var reviewDemand = state.avgDailyDemand * state.reviewDays;
    var suggestQty = Math.max(0, reorderPoint + reviewDemand - state.onHand - state.inTransit);
    var serviceLevel = 0.5 * (1 + erf(state.z / Math.sqrt(2))) * 100;
    return { safetyStock: safetyStock, reorderPoint: reorderPoint, suggestQty: suggestQty, serviceLevel: serviceLevel };
  }

  function renderSafetySimulation(module) {
    var control = document.querySelector(".js-sim-control");
    var metricsNode = document.querySelector(".js-sim-metrics");
    var curveNode = document.querySelector(".js-sim-curve");
    if (!control || !metricsNode || !curveNode || !module) return;

    var defaults = module.defaults;
    var ranges = module.ranges;
    var state = {};
    Object.keys(defaults).forEach(function (k) { state[k] = defaults[k]; });

    function sliderRow(id, label, value, range, precision) {
      return '<div class="layer4-slider-row"><label for="' + id + '">' + label +
        '</label><input id="' + id + '" type="range" min="' + range.min + '" max="' + range.max +
        '" step="' + range.step + '" value="' + value + '" /><strong class="js-' + id + '-value">' +
        Number(value).toFixed(precision) + '</strong></div>';
    }

    control.innerHTML =
      sliderRow("sim-z", "\u670d\u52a1\u7cfb\u6570 Z", state.z, ranges.z, 2) +
      sliderRow("sim-sigma", "\u9700\u6c42\u504f\u5dee \u03c3D", state.sigmaD, ranges.sigmaD, 0) +
      sliderRow("sim-lead", "\u63d0\u524d\u671f L(\u5929)", state.leadTime, ranges.leadTime, 0) +
      '<div class="layer4-context-grid">' +
      '<div><span>\u65e5\u5747\u9700\u6c42</span><strong>' + formatNumber(state.avgDailyDemand) + '</strong></div>' +
      '<div><span>\u73b0\u6709\u5e93\u5b58</span><strong>' + formatNumber(state.onHand) + '</strong></div>' +
      '<div><span>\u5728\u9014\u5e93\u5b58</span><strong>' + formatNumber(state.inTransit) + '</strong></div>' +
      '<div><span>\u590d\u76d8\u5468\u671f</span><strong>' + state.reviewDays + '\u5929</strong></div></div>';

    function paintCurve() {
      var leads = [7, 12, 18, 24, 30, 36, 42];
      var chartData = {
        labels: leads.map(function (d) { return d + "\u5929"; }),
        series: [
          { name: "\u5b89\u5168\u5e93\u5b58", color: "#2a9d8f", area: true,
            data: leads.map(function (lt) { return Math.round(state.z * state.sigmaD * Math.sqrt(lt)); }) },
          { name: "\u518d\u8ba2\u8d27\u70b9ROP", color: "#e63946",
            data: leads.map(function (lt) { return Math.round(state.avgDailyDemand * lt + state.z * state.sigmaD * Math.sqrt(lt)); }) },
        ],
      };
      renderEChartsLine(curveNode, chartData, "\u5b89\u5168\u5e93\u5b58\u6a21\u62df\u66f2\u7ebf");
    }

    function paintMetrics() {
      var m = computeSafetyMetrics(state);
      metricsNode.innerHTML =
        '<article class="layer4-metric-card"><p>\u670d\u52a1\u6c34\u5e73</p><strong>' + m.serviceLevel.toFixed(1) + '%</strong></article>' +
        '<article class="layer4-metric-card"><p>\u5b89\u5168\u5e93\u5b58 SS</p><strong>' + formatNumber(Math.round(m.safetyStock)) + '</strong></article>' +
        '<article class="layer4-metric-card"><p>\u518d\u8ba2\u8d27\u70b9 ROP</p><strong>' + formatNumber(Math.round(m.reorderPoint)) + '</strong></article>' +
        '<article class="layer4-metric-card"><p>\u5efa\u8bae\u4e0b\u5355\u91cf</p><strong>' + formatNumber(Math.round(m.suggestQty)) + '</strong></article>';
    }

    function updateLabel(id, value, precision) {
      var node = control.querySelector(".js-" + id + "-value");
      if (node) node.textContent = Number(value).toFixed(precision);
    }

    var zInput = control.querySelector("#sim-z");
    var sigmaInput = control.querySelector("#sim-sigma");
    var leadInput = control.querySelector("#sim-lead");

    zInput.addEventListener("input", function () {
      state.z = Number(zInput.value); updateLabel("sim-z", state.z, 2); paintMetrics(); paintCurve();
    });
    sigmaInput.addEventListener("input", function () {
      state.sigmaD = Number(sigmaInput.value); updateLabel("sim-sigma", state.sigmaD, 0); paintMetrics(); paintCurve();
    });
    leadInput.addEventListener("input", function () {
      state.leadTime = Number(leadInput.value); updateLabel("sim-lead", state.leadTime, 0); paintMetrics(); paintCurve();
    });

    paintMetrics();
    paintCurve();
  }

  function renderLeadTimeSensitivity(module) {
    var switchNode = document.querySelector(".js-sensitivity-mode-switch");
    var chartNode = document.querySelector(".js-sensitivity-chart");
    if (!switchNode || !chartNode || !module) return;
    var activeMode = module.defaultMode;

    function paintChart() {
      var data = (module.dataByMode || {})[activeMode];
      if (!data) return;
      chartNode.innerHTML = '<div class="echart-box"></div>';
      var chart = echarts.init(chartNode.querySelector(".echart-box"));
      chart.setOption({
        tooltip: { trigger: "axis" },
        legend: { data: data.series.map(function (s) { return s.name; }), bottom: 0, textStyle: { fontSize: 11 } },
        grid: { left: 46, right: 16, top: 16, bottom: 40 },
        xAxis: { type: "category", data: data.labels, axisLabel: { fontSize: 11 } },
        yAxis: { type: "value", axisLabel: { fontSize: 11 }, splitLine: { lineStyle: { color: "#f0f0f0" } } },
        series: data.series.map(function (s) {
          return { name: s.name, type: "bar", data: s.data, itemStyle: { color: s.color }, barGap: "20%" };
        }),
      });
      window.addEventListener("resize", function () { chart.resize(); });
    }

    function bindSwitch() {
      renderSegmentSwitch(switchNode, module.modeOptions, activeMode, function (next) {
        activeMode = next; bindSwitch(); paintChart();
      });
    }
    bindSwitch();
    paintChart();
  }

  function renderChainDistribution(module) {
    var node = document.querySelector(".js-chain-funnel");
    if (!node || !module) return;
    var maxQty = Math.max.apply(null, module.stages.map(function (i) { return i.qty; }).concat([1]));
    node.innerHTML = module.stages.map(function (item) {
      var w = (item.qty / maxQty) * 100;
      var offset = (100 - w) / 2;
      return '<div class="layer4-funnel-row"><div class="layer4-funnel-meta"><strong>' + item.stage +
        '</strong><span>' + formatNumber(item.qty) + ' \u53cc \u00b7 ' + formatWan(item.amountWan) + '</span></div>' +
        '<div class="layer4-funnel-track"><span style="width:' + w + '%;margin-left:' + offset + '%"></span></div></div>';
    }).join("");
  }

  function renderDeliveryDeviation(module) {
    var summaryNode = document.querySelector(".js-deviation-summary");
    var trendNode = document.querySelector(".js-deviation-trend");
    var providerNode = document.querySelector(".js-provider-stats");
    if (!summaryNode || !trendNode || !providerNode || !module) return;

    summaryNode.innerHTML =
      '<article class="layer4-metric-card"><p>\u4f9b\u5e94\u5546\u5e73\u5747\u903e\u671f\u5929\u6570</p><strong>' + module.supplierOverdueAvg + '\u5929</strong></article>' +
      '<article class="layer4-metric-card"><p>\u5934\u7a0b\u7269\u6d41\u5ef6\u8bef\u5929\u6570</p><strong>' + module.headhaulDelayAvg + '\u5929</strong></article>' +
      '<article class="layer4-metric-card"><p>\u52a8\u6001\u5b89\u5168\u5e93\u5b58Buffer</p><strong>' + module.bufferDays + '\u5929</strong></article>';

    renderEChartsLine(trendNode, { labels: module.trendLabels, series: module.trendSeries }, "\u7269\u6d41\u5546\u5dee\u5f02\u7387\u8d8b\u52bf\u56fe");

    providerNode.innerHTML =
      '<div class="layer4-table-head layer4-provider-row"><span>\u7269\u6d41\u5546</span><span>\u627f\u8bfa\u65f6\u6548</span><span>\u5b9e\u9645\u65f6\u6548</span><span>\u5dee\u5f02\u7387</span><span>\u8d8b\u52bf</span></div>' +
      module.providerStats.map(function (item) {
        return '<div class="layer4-table-row layer4-provider-row"><span class="row-primary">' + item.provider +
          '</span><span>' + item.promiseDays + '\u5929</span><span>' + item.actualDays + '\u5929</span>' +
          '<span class="' + (item.diffRate >= 6 ? "text-danger" : "text-muted") + '">' + item.diffRate.toFixed(1) +
          '%</span><span class="delta-chip ' + (item.alert ? "tone-negative" : "tone-neutral") + '">' + item.trend + '</span></div>';
      }).join("");
  }

  function renderLayer4Page(layer) {
    var root = document.querySelector(".js-layer4-page");
    if (!root) return;

    root.innerHTML =
      '<article class="panel layer4-module">' +
        '<div class="panel-heading"><div><p class="panel-kicker">\u6a21\u57571</p><h3>SKU\u5468\u8f6c\u77e9\u9635</h3></div>' +
        '<span class="pill pill-danger">\u56db\u8c61\u9650\u95ee\u9898\u5b9a\u4f4d</span></div>' +
        '<div class="chart-stage js-turnover-matrix"></div></article>' +

      '<article class="panel layer4-module">' +
        '<div class="panel-heading"><div><p class="panel-kicker">\u6a21\u57572</p><h3>\u5b89\u5168\u5e93\u5b58\u6a21\u578b\u6a21\u62df</h3></div>' +
        '<span class="pill pill-warning">What-If \u53c2\u6570\u8054\u52a8</span></div>' +
        '<div class="layer4-sim-grid"><article class="chart-card-lite"><h4>\u53c2\u6570\u9762\u677f</h4>' +
        '<div class="layer4-control-stack js-sim-control"></div></article>' +
        '<article class="chart-card-lite"><h4>\u6a21\u62df\u7ed3\u679c</h4>' +
        '<div class="layer4-metrics-grid js-sim-metrics"></div><div class="chart-stage js-sim-curve"></div></article></div></article>' +

      '<article class="panel layer4-module">' +
        '<div class="panel-heading"><div><p class="panel-kicker">\u6a21\u57573</p><h3>\u63d0\u524d\u671f\u654f\u611f\u6027\u5206\u6790</h3></div>' +
        '<div class="panel-switch js-sensitivity-mode-switch"></div></div>' +
        '<div class="chart-stage js-sensitivity-chart"></div></article>' +

      '<article class="panel layer4-module">' +
        '<div class="panel-heading"><div><p class="panel-kicker">\u6a21\u57574</p><h3>\u5168\u94fe\u8def\u5e93\u5b58\u5206\u5e03</h3></div>' +
        '<span class="pill pill-muted">\u4f9b\u5e94\u5546 -> FBA\u53ef\u552e</span></div>' +
        '<div class="layer4-funnel-list js-chain-funnel"></div></article>' +

      '<article class="panel layer4-module">' +
        '<div class="panel-heading"><div><p class="panel-kicker">\u6a21\u57575</p><h3>\u4ea4\u671f\u4e0e\u65f6\u6548\u504f\u5dee\u5206\u6790</h3></div>' +
        '<span class="pill pill-danger">\u5dee\u5f02\u8d8b\u52bf\u9884\u8b66</span></div>' +
        '<div class="layer4-metrics-grid js-deviation-summary"></div>' +
        '<div class="chart-stage js-deviation-trend"></div>' +
        '<div class="layer4-table js-provider-stats"></div></article>';

    renderTurnoverMatrix(root.querySelector(".js-turnover-matrix"), layer.skuTurnoverMatrix);
    renderSafetySimulation(layer.safetySimulation);
    renderLeadTimeSensitivity(layer.leadTimeSensitivity);
    renderChainDistribution(layer.chainDistribution);
    renderDeliveryDeviation(layer.deliveryDeviation);
  }

  window.renderLayer4Page = renderLayer4Page;
})();
