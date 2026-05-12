const axios = require('axios');

const API_KEY = process.env.DEEPSEEK_API_KEY;
const BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';

const SYSTEM_PROMPT = `You are a professional stock analyst. Analyze the given stock data and return ONLY valid JSON — no markdown, no code fences, no extra text.

The JSON object must have exactly these three fields:
- "summary": a concise analysis summary (string, 2-4 sentences in Chinese)
- "sentiment": one of "bullish", "bearish", or "neutral" (string)
- "risk_level": one of "low", "medium", or "high" (string)

Example of valid output:
{"summary":"该股票近期表现强劲，技术指标显示上升趋势。","sentiment":"bullish","risk_level":"low"}`;

async function analyzeStock(stockData) {
  const response = await axios.post(
    `${BASE_URL}/chat/completions`,
    {
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Analyze this stock data and return only the JSON object:\n${JSON.stringify(stockData, null, 2)}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
    }
  );

  const raw = response.data.choices[0].message.content.trim();

  let cleaned = raw;
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/```(?:json)?\s*/g, '').replace(/```\s*$/, '').trim();
  }

  const result = JSON.parse(cleaned);

  if (!result.summary || !result.sentiment || !result.risk_level) {
    throw new Error('AI response missing required fields (summary, sentiment, risk_level)');
  }

  const validSentiments = ['bullish', 'bearish', 'neutral'];
  const validRiskLevels = ['low', 'medium', 'high'];

  if (!validSentiments.includes(result.sentiment)) {
    throw new Error(`Invalid sentiment: ${result.sentiment}`);
  }
  if (!validRiskLevels.includes(result.risk_level)) {
    throw new Error(`Invalid risk_level: ${result.risk_level}`);
  }

  return {
    summary: result.summary,
    sentiment: result.sentiment,
    risk_level: result.risk_level,
  };
}

module.exports = { analyzeStock };
