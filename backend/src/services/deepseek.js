const BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
const VALID_SENTIMENTS = ['bullish', 'bearish', 'neutral'];
const VALID_RISK_LEVELS = ['low', 'medium', 'high'];

const SYSTEM_PROMPT = `你是一名谨慎、客观的美股分析助手。根据给定的单次行情快照输出 JSON，不得输出 Markdown 或额外文字。

JSON 必须包含：
- summary：3-5 句具体摘要，解释相对昨收、相对开盘、日内振幅与 52 周位置，使用用户指定的语言，不得承诺收益
- sentiment：bullish、bearish 或 neutral
- risk_level：low、medium 或 high
- confidence：0-100 的整数，表示结论可信度而非上涨概率
- highlights：4-5 条简短要点数组，至少覆盖涨跌幅、开盘后走势、日内振幅和 52 周位置
- risks：3-4 条简短风险数组，解释波动强度、价格所处区间及数据局限

必须说明单次行情快照的局限性，并避免将结果表述为投资建议。`;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function buildRuleBasedAnalysis(stockData, notice, language = 'zh') {
  const changePercent = Number(stockData.changePercent) || 0;
  const position52Week = Number(stockData.metrics?.position52Week) || 0;
  const intradayRange = Number(stockData.metrics?.intradayRangePercent) || 0;
  const price = Number(stockData.price) || 0;
  const open = Number(stockData.open) || 0;
  const absoluteChange = Math.abs(Number(stockData.change) || 0);
  const openChangePercent = open > 0 ? ((price - open) / open) * 100 : 0;
  const gapFrom52WeekHigh = Number(stockData.metrics?.gapFrom52WeekHigh) || 0;
  let score = 0;
  if (changePercent >= 1) score += 2;
  else if (changePercent <= -1) score -= 2;
  if (stockData.price > stockData.open) score += 1;
  else if (stockData.price < stockData.open) score -= 1;
  if (position52Week >= 75) score += 1;
  else if (position52Week > 0 && position52Week <= 25) score -= 1;

  const sentiment = score >= 2 ? 'bullish' : score <= -2 ? 'bearish' : 'neutral';
  const absoluteMove = Math.abs(changePercent);
  const riskLevel = absoluteMove >= 4 || intradayRange >= 5
    ? 'high'
    : absoluteMove >= 2 || intradayRange >= 3
      ? 'medium'
      : 'low';
  if (language === 'en') {
    const direction = changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'unchanged';
    const tone = sentiment === 'bullish' ? 'constructive' : sentiment === 'bearish' ? 'weak' : 'neutral';
    const openTone = openChangePercent > 0.1
      ? 'buyers have strengthened the price since the open'
      : openChangePercent < -0.1
        ? 'selling pressure has persisted since the open'
        : 'the price remains close to its opening level';
    const rangeTone = intradayRange >= 5
      ? 'an unusually wide session range'
      : intradayRange >= 3 ? 'an active session range' : 'a relatively contained session range';
    const closeMove = changePercent === 0
      ? 'is unchanged from the previous close'
      : `is ${direction} ${Math.abs(changePercent).toFixed(2)}% ($${absoluteChange.toFixed(2)}) from the previous close`;
    return {
      summary: `${stockData.symbol} ${closeMove}, leaving the near-term signal ${tone}. It has moved ${openChangePercent >= 0 ? '+' : ''}${openChangePercent.toFixed(2)}% since the open, so ${openTone}. The high-low spread equals ${intradayRange.toFixed(2)}% of the previous close, which is ${rangeTone}. The price sits at ${position52Week.toFixed(1)}% of its 52-week range and ${Math.abs(gapFrom52WeekHigh).toFixed(2)}% below the 52-week high.`,
      sentiment,
      risk_level: riskLevel,
      confidence: clamp(Math.round(55 + Math.abs(score) * 7), 55, 80),
      highlights: [
        changePercent === 0
          ? 'Price is unchanged from the previous close'
          : `Price is ${direction} ${Math.abs(changePercent).toFixed(2)}%, or $${absoluteChange.toFixed(2)}, from the previous close`,
        `Since the open, the price has moved ${openChangePercent >= 0 ? '+' : ''}${openChangePercent.toFixed(2)}%`,
        `The session high-low spread is ${intradayRange.toFixed(2)}% of the previous close`,
        `Price is at ${position52Week.toFixed(1)}% of its 52-week range and ${Math.abs(gapFrom52WeekHigh).toFixed(2)}% below the high`,
      ],
      risks: [
        intradayRange >= 5
          ? 'The wide intraday range indicates elevated short-term volatility'
          : intradayRange >= 3
            ? 'Intraday movement is active enough to increase short-term execution risk'
            : 'A calm single session does not establish a durable trend',
        position52Week >= 80
          ? 'Trading near the top of the 52-week range can increase sensitivity to pullbacks'
          : position52Week <= 20
            ? 'Trading near the bottom of the 52-week range can reflect persistent weakness'
            : 'The mid-range position does not provide a strong long-term directional signal',
        'This snapshot excludes financials, news, macro conditions, and longer-term price history',
      ],
      source: 'rule-based',
      notice: notice || 'Using the transparent rapid-assessment model.',
      generatedAt: new Date().toISOString(),
    };
  }

  const direction = changePercent > 0 ? '上涨' : changePercent < 0 ? '下跌' : '持平';
  const closeMove = changePercent === 0
    ? '与前收盘持平'
    : `较前收盘${direction} ${Math.abs(changePercent).toFixed(2)}%（$${absoluteChange.toFixed(2)}）`;
  const openTone = openChangePercent > 0.1
    ? '开盘后买盘相对占优'
    : openChangePercent < -0.1 ? '开盘后卖压相对明显' : '当前价格接近开盘水平';
  const rangeTone = intradayRange >= 5
    ? '日内波动明显放大'
    : intradayRange >= 3 ? '日内交投波动较活跃' : '日内波动相对温和';
  const highlights = [
    changePercent === 0
      ? '当前价格与前收盘持平'
      : `当前价格较前收盘${direction} ${Math.abs(changePercent).toFixed(2)}%，绝对变动 $${absoluteChange.toFixed(2)}`,
    `开盘以来价格变动 ${openChangePercent >= 0 ? '+' : ''}${openChangePercent.toFixed(2)}%，${openTone}`,
    `当日最高与最低价之间的振幅约为前收盘价的 ${intradayRange.toFixed(2)}%`,
    `价格位于 52 周区间的 ${position52Week.toFixed(1)}% 位置，距 52 周高点 ${Math.abs(gapFrom52WeekHigh).toFixed(2)}%`,
  ];
  const risks = [
    intradayRange >= 5
      ? '日内振幅较宽，短线价格与成交执行风险明显上升'
      : intradayRange >= 3
        ? '日内波动较活跃，短线进出价格可能存在较大偏差'
        : '单日波动温和并不能单独确认趋势已经形成',
    position52Week >= 80
      ? '价格接近 52 周区间上沿，对回撤和利空消息可能更敏感'
      : position52Week <= 20
        ? '价格接近 52 周区间下沿，可能反映中期弱势仍未扭转'
        : '价格处于 52 周区间中部，长期方向信号仍不明确',
    '本结果仅基于单次行情快照，未纳入财报、新闻与宏观信息',
  ];

  return {
    summary: `${stockData.symbol} 当前${closeMove}，短线信号整体${sentiment === 'bullish' ? '偏强' : sentiment === 'bearish' ? '偏弱' : '中性'}。开盘以来变动 ${openChangePercent >= 0 ? '+' : ''}${openChangePercent.toFixed(2)}%，${openTone}。最高与最低价形成 ${intradayRange.toFixed(2)}% 的日内振幅，${rangeTone}。当前价格位于 52 周区间的 ${position52Week.toFixed(1)}% 位置，距离 52 周高点约 ${Math.abs(gapFrom52WeekHigh).toFixed(2)}%。`,
    sentiment,
    risk_level: riskLevel,
    confidence: clamp(Math.round(55 + Math.abs(score) * 7), 55, 80),
    highlights,
    risks,
    source: 'rule-based',
    notice: notice || '当前使用可解释的快速评估模型。',
    generatedAt: new Date().toISOString(),
  };
}

function extractJson(raw) {
  const cleaned = String(raw || '').replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('AI response did not contain a JSON object');
  return JSON.parse(cleaned.slice(start, end + 1));
}

function normalizeAnalysis(result) {
  if (!result || typeof result.summary !== 'string' || !result.summary.trim()) {
    throw new Error('AI response missing summary');
  }
  if (!VALID_SENTIMENTS.includes(result.sentiment)) {
    throw new Error(`Invalid sentiment: ${result.sentiment}`);
  }
  if (!VALID_RISK_LEVELS.includes(result.risk_level)) {
    throw new Error(`Invalid risk_level: ${result.risk_level}`);
  }
  const list = (value) => Array.isArray(value)
    ? value.filter((item) => typeof item === 'string' && item.trim()).slice(0, 5)
    : [];
  return {
    summary: result.summary.trim(),
    sentiment: result.sentiment,
    risk_level: result.risk_level,
    confidence: clamp(Math.round(Number(result.confidence) || 60), 0, 100),
    highlights: list(result.highlights),
    risks: list(result.risks),
    source: 'deepseek',
    generatedAt: new Date().toISOString(),
  };
}

async function analyzeStock(stockData, options = {}) {
  const language = options.language === 'en' ? 'en' : 'zh';
  if (options.mode === 'quick') return buildRuleBasedAnalysis(stockData, null, language);
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return buildRuleBasedAnalysis(
      stockData,
      language === 'en'
        ? 'DeepSeek is not configured; switched to the rapid-assessment model.'
        : 'DeepSeek 未配置，已自动切换为快速评估。',
      language
    );
  }

  try {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(25_000),
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `${SYSTEM_PROMPT}\n${language === 'en'
              ? 'Write every human-readable field in English.'
              : '所有面向用户的字段均使用简体中文。'}`,
          },
          {
            role: 'user',
            content: `${language === 'en'
              ? 'Analyze this market snapshot and return JSON only:'
              : '请分析以下行情快照并仅返回 JSON：'}
${JSON.stringify(stockData, null, 2)}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });
    if (!response.ok) throw new Error(`DeepSeek returned HTTP ${response.status}`);
    const body = await response.json();
    return normalizeAnalysis(extractJson(body.choices?.[0]?.message?.content));
  } catch (error) {
    console.warn(`DeepSeek analysis failed, using rule-based fallback: ${error.message}`);
    return buildRuleBasedAnalysis(
      stockData,
      language === 'en'
        ? 'AI is temporarily unavailable; switched to the rapid-assessment model.'
        : 'AI 服务暂时不可用，已自动切换为快速评估。',
      language
    );
  }
}

module.exports = {
  analyzeStock,
  buildRuleBasedAnalysis,
  extractJson,
  normalizeAnalysis,
};
