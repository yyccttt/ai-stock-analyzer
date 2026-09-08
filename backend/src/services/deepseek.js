const BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
const VALID_SENTIMENTS = ['bullish', 'bearish', 'neutral'];
const VALID_RISK_LEVELS = ['low', 'medium', 'high'];

const SYSTEM_PROMPT = `你是一名谨慎、客观的美股分析助手。根据给定的单次行情快照输出 JSON，不得输出 Markdown 或额外文字。

JSON 必须包含：
- summary：2-4 句简洁摘要，使用用户指定的语言，不得承诺收益
- sentiment：bullish、bearish 或 neutral
- risk_level：low、medium 或 high
- confidence：0-100 的整数，表示结论可信度而非上涨概率
- highlights：1-3 条简短要点数组
- risks：1-3 条简短风险数组

必须说明单次行情快照的局限性，并避免将结果表述为投资建议。`;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function buildRuleBasedAnalysis(stockData, notice, language = 'zh') {
  const changePercent = Number(stockData.changePercent) || 0;
  const position52Week = Number(stockData.metrics?.position52Week) || 0;
  const intradayRange = Number(stockData.metrics?.intradayRangePercent) || 0;
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
    return {
      summary: `${stockData.symbol} is ${direction} ${Math.abs(changePercent).toFixed(2)}% from the previous close, leaving the near-term signal ${tone}. The price sits at ${position52Week.toFixed(1)}% of its 52-week range, so a longer time horizon is needed to confirm the signal.`,
      sentiment,
      risk_level: riskLevel,
      confidence: clamp(Math.round(55 + Math.abs(score) * 7), 55, 80),
      highlights: [
        `Price is ${direction} ${Math.abs(changePercent).toFixed(2)}% from the previous close`,
        `Price is at ${position52Week.toFixed(1)}% of its 52-week range`,
      ],
      risks: [
        `The intraday range is ${intradayRange.toFixed(2)}% of the previous close`,
        'This snapshot excludes financials, news, macro conditions, and longer-term price history',
      ],
      source: 'rule-based',
      notice: notice || 'Using the transparent rapid-assessment model.',
      generatedAt: new Date().toISOString(),
    };
  }

  const direction = changePercent > 0 ? '上涨' : changePercent < 0 ? '下跌' : '持平';
  const highlights = [
    `当前价格较前收盘${direction} ${Math.abs(changePercent).toFixed(2)}%`,
    `价格位于 52 周区间的 ${position52Week.toFixed(1)}% 位置`,
  ];
  const risks = [
    `日内波动区间约为前收盘价的 ${intradayRange.toFixed(2)}%`,
    '本结果仅基于单次行情快照，未纳入财报、新闻与宏观信息',
  ];

  return {
    summary: `${stockData.symbol} 当前较前收盘${direction}，短线信号整体${sentiment === 'bullish' ? '偏强' : sentiment === 'bearish' ? '偏弱' : '中性'}。价格处于 52 周区间的 ${position52Week.toFixed(1)}% 位置，需结合更长周期数据验证。`,
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
    ? value.filter((item) => typeof item === 'string' && item.trim()).slice(0, 3)
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
        max_tokens: 700,
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
