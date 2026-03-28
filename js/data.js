window.inventoryBIPrototype = {
  meta: {
    title: "库存分析 BI 看板",
    stage: "静态原型首版",
    updatedAt: "2026-03-27 16:30",
    sources: [
      { name: "库存分析BI看板.md", href: "./PRD/库存分析BI看板.md" },
      { name: "库存分析BI看板_前3层指标对应图表建议.md", href: "./PRD/库存分析BI看板_前3层指标对应图表建议.md" },
      { name: "库存分析BI看板_前3层页面线框图建议.md", href: "./PRD/库存分析BI看板_前3层页面线框图建议.md" },
    ],
  },
  layers: {
    layer1: {
      badge: "第一层 · 面向老板 / 运营总监",
      title: "库存战略总览看板",
      summary: "一眼看清库存规模、资金占用和关键风险，服务老板和运营总监的首屏驾驶舱。",
      tags: ["总览优先", "资金视角", "风险首屏可见"],
      filters: [
        { label: "时间范围", value: "近 90 天" },
        { label: "国家 / 站点", value: "全站点总览" },
      ],
      metrics: [
        {
          title: "总库存量",
          value: "128,460",
          unit: "件",
          caption: "国内仓 + FBA + 在途",
          status: "focus",
          deltas: [
            { label: "MoM", value: "+5.2%", tone: "warning" },
            { label: "YoY", value: "+12.6%", tone: "warning" },
          ],
          sparkline: [84, 92, 88, 95, 106, 112, 118, 126],
        },
        {
          title: "总库存金额",
          value: "¥ 1,286 万",
          unit: "",
          caption: "资金占用核心口径",
          deltas: [
            { label: "MoM", value: "+4.1%", tone: "warning" },
            { label: "YoY", value: "+9.8%", tone: "warning" },
          ],
          sparkline: [76, 80, 79, 82, 85, 87, 91, 95],
        },
        {
          title: "在途库存量",
          value: "18,240",
          unit: "件",
          caption: "海运 / 空运 / 清关中",
          deltas: [
            { label: "MoM", value: "+11.3%", tone: "negative" },
            { label: "YoY", value: "+3.7%", tone: "neutral" },
          ],
          sparkline: [32, 35, 34, 38, 42, 46, 49, 57],
        },
        {
          title: "FBA 在库数量",
          value: "54,900",
          unit: "件",
          caption: "演示口径：含可售与处理中",
          deltas: [
            { label: "MoM", value: "-1.9%", tone: "positive" },
            { label: "YoY", value: "+6.1%", tone: "neutral" },
          ],
          sparkline: [58, 60, 61, 59, 58, 56, 55, 54],
        },
        {
          title: "库存周转天数",
          value: "47",
          unit: "天",
          caption: "近 90 天口径示意",
          deltas: [
            { label: "MoM", value: "-6.0%", tone: "positive" },
            { label: "YoY", value: "-8.7%", tone: "positive" },
          ],
          sparkline: [68, 63, 61, 58, 56, 53, 51, 47],
        },
        {
          title: "动销率",
          value: "72.4",
          unit: "%",
          caption: "有销量 SKU / 总 SKU",
          deltas: [
            { label: "MoM", value: "+2.4%", tone: "positive" },
            { label: "YoY", value: "+4.9%", tone: "positive" },
          ],
          sparkline: [54, 58, 59, 63, 66, 68, 70, 72],
        },
      ],
      healthScore: {
        score: 82,
        grade: "良好",
        summary: "整体库存仍处于可控区间，周转改善明显，但华东仓呆滞与在途偏高仍然拉低了资金效率。",
        factors: [
          { label: "周转效率", value: 86, tone: "positive" },
          { label: "库存结构", value: 79, tone: "neutral" },
          { label: "呆滞风险", value: 71, tone: "warning" },
          { label: "仓容压力", value: 84, tone: "positive" },
        ],
      },
      riskDistribution: {
        summary: [
          { label: "高风险", count: "12 个", amount: "¥310 万", color: "#cb5a48" },
          { label: "中风险", count: "26 个", amount: "¥420 万", color: "#bf7b22" },
          { label: "低风险", count: "41 个", amount: "¥556 万", color: "#2d8b65" },
        ],
        note: "高风险主要集中在华东仓与欧洲站慢销 SKU，中风险更多来自在途累积和周转偏慢的品类。",
      },
      outboundInbound: {
        labels: ["1W", "2W", "3W", "4W", "5W", "6W", "7W", "8W", "9W", "10W", "11W", "12W"],
        series: [
          { name: "出库量", color: "#0f7068", fill: "#0f7068", data: [410, 435, 452, 470, 482, 500, 515, 526, 548, 566, 582, 608] },
          { name: "入库量", color: "#bf7b22", fill: "#bf7b22", data: [520, 545, 562, 570, 586, 594, 603, 598, 586, 571, 559, 548] },
        ],
      },
      balanceTrend: {
        labels: ["1W", "2W", "3W", "4W", "5W", "6W", "7W", "8W", "9W", "10W", "11W", "12W"],
        series: [
          { name: "库存余额", color: "#4d7397", fill: "#4d7397", area: true, data: [1280, 1292, 1304, 1311, 1308, 1296, 1285, 1272, 1264, 1258, 1249, 1236] },
        ],
      },
      top10: [
        { label: "欧洲站家居清洁", meta: "呆滞 212 天 · 华东仓", value: 84, textValue: "¥84 万" },
        { label: "美国站收纳挂架", meta: "呆滞 189 天 · FBA", value: 76, textValue: "¥76 万" },
        { label: "德国站厨房配件", meta: "呆滞 178 天 · CN 仓", value: 69, textValue: "¥69 万" },
        { label: "加拿大站园艺套装", meta: "呆滞 171 天 · 华南仓", value: 63, textValue: "¥63 万" },
        { label: "英国站衣物护理", meta: "呆滞 163 天 · FBA", value: 58, textValue: "¥58 万" },
        { label: "日本站旅行配件", meta: "呆滞 152 天 · CN 仓", value: 55, textValue: "¥55 万" },
      ],
      alerts: [
        {
          level: "高风险",
          tone: "negative",
          title: "华东仓慢销库存持续攀升",
          body: "近 6 周库存金额提升 14%，但对应销售占比没有同步增加，建议在下一轮原型中补充品类拆解与促销动作入口。",
        },
        {
          level: "关注",
          tone: "warning",
          title: "在途库存增加快于出库改善",
          body: "当前在途量较上月提升 11.3%，若后续到货集中释放，可能进一步推高仓容与慢销压力。",
        },
        {
          level: "改善中",
          tone: "positive",
          title: "库存周转天数连续三期下降",
          body: "虽然整体仍需控制慢销与高库存站点，但总盘面周转已经进入更健康的区间，适合在汇报中作为正向信号展示。",
        },
      ],
    },
    layer2: {
      badge: "第二层 · 面向采购 / 运营 / 计划",
      title: "多维结构分析看板",
      summary: "聚焦库存结构是否合理，帮助识别畅销品缺货与滞销品积压的具体位置，为结构优化提供依据。",
      tags: ["结构占比", "排名对比", "库龄分布"],
      filters: [
        { label: "时间范围", value: "近 90 天" },
        { label: "国家 / 站点", value: "全站点 / 可切换" },
        { label: "仓库", value: "全部仓库" },
        { label: "品类", value: "全部品类" },
        { label: "系列", value: "全部系列" },
      ],
      modules: [
        {
          title: "ABC 分类库存分布",
          description: "用于展示高价值高动销、中价值中频次、低价值低动销库存的金额占比、SKU 占比和占用库位。",
          chart: "建议图表：堆积条形图 / 矩形树图",
          note: "重点看 A/B/C 三类结构是否失衡。",
        },
        {
          title: "SKU 周转速度排名",
          description: "同时保留高周转 Top 10 和低周转 Bottom 10 的位置，便于采购和运营在同一屏幕里看快慢两端。",
          chart: "建议图表：横向排名条形图",
          note: "重点看 MSKU、周转天数、日均销量与库存金额。",
        },
        {
          title: "库存结构对比图",
          description: "对比库存占比与销售占比，直接发现某些品类库存压得多但卖得少的结构性问题。",
          chart: "建议图表：分组柱状图 / 哑铃图",
          note: "重点看库存占比与销售占比之间的差距。",
        },
        {
          title: "库龄结构图",
          description: "先保留静态库龄结构与库龄变化趋势两个区块，后续可按 FBA 仓和 CN 仓拆开。",
          chart: "建议图表：堆积柱状图 + 堆积面积图",
          note: "重点看 0-30、31-60、61-90、90+ 等区间迁移。",
        },
        {
          title: "超期仓储费预警",
          description: "这里先预留费用预估和风险 SKU 清单的组合布局，用于后续补充长期仓储费与超龄附加费试算。",
          chart: "建议图表：预警表 + 横向条形图",
          note: "重点看 181-365 天与 365 天以上库存。",
        },
        {
          title: "不可售库存池",
          description: "按退货、损坏、过期等原因拆分不可售库存，同时保留处理截止日期与责任动作的显示位置。",
          chart: "建议图表：结构图 + 状态列表",
          note: "重点看原因占比与自动移除期限。",
        },
      ],
    },
    layer3: {
      badge: "第三层 · 面向一线运营 / 采购 / 计划",
      title: "动态预警与补货建议看板",
      summary: "以执行为中心，把断货预警、补货建议、时间决策与差异闭环放在同一层，方便业务快速处理。",
      tags: ["执行导向", "主表优先", "时间轴决策"],
      filters: [
        { label: "时间范围", value: "近 30 天" },
        { label: "国家 / 站点", value: "多站点切换" },
        { label: "系列", value: "全部系列" },
        { label: "运营", value: "全部运营" },
        { label: "货号", value: "全部货号" },
        { label: "紧急程度", value: "全部等级" },
      ],
      modules: [
        {
          title: "库存预警模块",
          description: "先把断货数量、断货比例、FBA 可售时间和必断货 SKU 的摘要区与主表位置固定下来。",
          chart: "建议图表：预警卡片 + 条件格式明细表",
          note: "重点看红黄绿灯机制与风险可读性。",
        },
        {
          title: "补货建议模块",
          description: "为需采购数量、预计断货日期、建议下单日期和紧急等级保留矩阵表与条形对比区。",
          chart: "建议图表：矩阵表 + 分组柱状图",
          note: "重点看正常 / 加急 / 必断货三档节奏。",
        },
        {
          title: "销量预测与库存水位预测图",
          description: "这里保留实际库存、预测库存和安全库存线的主图位置，后续适合叠加三条曲线。",
          chart: "建议图表：多折线图",
          note: "重点看未来缺货日期与连续补货策略。",
        },
        {
          title: "收发差异看板",
          description: "先固定差异明细表、超期未上架预警和差异根因分析三块的位置关系。",
          chart: "建议图表：主表 + 老化条形图 + 根因条形图",
          note: "重点看物流商、仓库、品类差异。",
        },
        {
          title: "索赔状态追踪",
          description: "保留待调查、已开 Case、索赔成功、已驳回等状态的闭环展示区，便于后续补流程图。",
          chart: "建议图表：漏斗图 / 状态看板",
          note: "重点看索赔处理阶段与金额挽回统计。",
        },
      ],
    },
    layer4: {
      badge: "第四层 · 面向数据分析员 / 供应链专家",
      title: "问题诊断与参数模拟看板",
      summary: "本层用于做根因定位、参数模拟和策略试验。由于当前只有需求文档依据，本轮先保留模块骨架，不预设图表细节。",
      tags: ["问题诊断", "参数模拟", "后续强化交互"],
      filters: [
        { label: "时间范围", value: "近 90 天" },
        { label: "国家 / 站点", value: "全站点" },
        { label: "仓库 / 物流商", value: "待后续接入" },
      ],
      modules: [
        {
          title: "SKU 周转矩阵",
          description: "预留畅销缺货、畅销安全、滞销积压、滞销安全四类问题 SKU 的分析区域。",
          chart: "图表方案：本轮仅保留占位",
          note: "后续再补四象限图与问题聚类规则。",
        },
        {
          title: "安全库存模型模拟",
          description: "预留服务系数、需求偏差和提前期参数的模拟面板位置。",
          chart: "图表方案：本轮仅保留占位",
          note: "后续再补滑块、模拟结果和 What-If 交互。",
        },
        {
          title: "提前期敏感性分析",
          description: "预留不同物流商、运输方式和政策变化对库存水平影响的展示区。",
          chart: "图表方案：本轮仅保留占位",
          note: "后续再补敏感性曲线和对比视图。",
        },
        {
          title: "全链路库存分布",
          description: "预留供应商生产中、国内仓、在途、清关、待上架、FBA 可售等全链路库存分布位置。",
          chart: "图表方案：本轮仅保留占位",
          note: "后续再补漏斗或分段流转视图。",
        },
        {
          title: "交期与时效偏差分析",
          description: "预留供应商延期、头程延误和差异趋势预警的组合分析区。",
          chart: "图表方案：本轮仅保留占位",
          note: "后续再补偏差趋势图与预警规则展示。",
        },
      ],
    },
  },
};
