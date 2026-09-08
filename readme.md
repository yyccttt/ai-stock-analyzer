# Signal Desk

一个面向美股研究的轻量工作台：获取最新行情快照，通过 DeepSeek 生成结构化分析，并在 AI 不可用时自动使用可解释的规则模型。

> 本项目只提供信息整理与研究辅助，不构成投资建议。

## 功能

- **双分析模式**：DeepSeek 深度分析与无需 API Key 的快速量化评估
- **行情解释**：价格、涨跌、成交量、日内区间、52 周价格位置
- **横向对比**：一次比较 2-5 只股票，批量请求行情以减少等待
- **自选股**：最多保存 12 个常用股票代码
- **历史记录**：最近 12 次分析保存在浏览器本地
- **可靠降级**：AI 服务失败时自动回退；云存储未配置时仍能保存到本地
- **报告操作**：复制摘要、导出 JSON、可选同步至 Supabase
- **工程质量**：结构化错误、输入校验、速率限制、行情缓存、健康检查和 CI

## 技术栈

- 前端：React 18、Vite、Vitest
- 后端：Node.js 20+、Express 5、Node Test Runner
- 行情：新浪财经美股行情
- AI：DeepSeek（可选）
- 云存储：Supabase REST API（可选）

## 本地运行

需要 Node.js 20 或更高版本。打开两个终端：

```bash
# 终端 1
cd backend
cp .env.example .env
npm ci
npm start

# 终端 2
cd frontend
cp .env.example .env
npm ci
npm start
```

浏览器访问 `http://localhost:3000`。不填写 DeepSeek 和 Supabase 配置也可以使用快速评估、本地历史和导出功能。

## 环境变量

### 后端

| 变量 | 必需 | 用途 |
| --- | --- | --- |
| `PORT` | 否 | API 端口，默认 3001 |
| `DEEPSEEK_API_KEY` | 否 | 启用 AI 深度分析 |
| `DEEPSEEK_BASE_URL` | 否 | DeepSeek API 地址 |
| `SUPABASE_URL` | 否 | 启用云端保存 |
| `SUPABASE_SERVICE_KEY` | 否 | Supabase 服务端密钥 |
| `CORS_ORIGINS` | 否 | 逗号分隔的前端来源白名单 |
| `STOCK_CACHE_TTL_MS` | 否 | 行情缓存时间，默认 60 秒 |

### 前端

| 变量 | 必需 | 用途 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | 生产环境 | 后端 API 根地址 |

## API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/health` | 服务状态和可选能力 |
| `GET` | `/api/stock/:symbol` | 单只股票行情 |
| `POST` | `/api/stock/compare` | 批量查询 2-5 只股票 |
| `POST` | `/api/analyze` | AI 或规则分析 |
| `POST` | `/api/save` | 保存至 Supabase |

示例：

```bash
curl http://localhost:3001/api/stock/AAPL

curl -X POST http://localhost:3001/api/stock/compare \
  -H "Content-Type: application/json" \
  -d '{"symbols":["AAPL","MSFT","NVDA"]}'
```

错误响应统一为：

```json
{
  "error": {
    "code": "INVALID_SYMBOL",
    "message": "Stock symbol must be 1-10 letters, numbers, dots, or hyphens"
  }
}
```

## 测试与构建

```bash
cd backend && npm test
cd frontend && npm test
cd frontend && npm run build
```

GitHub Actions 会在每次 PR 和 `main` 分支推送时自动运行以上检查，并对后端生产依赖执行高危漏洞审计。

## Supabase 表

如需云端保存，请创建 `stock_analyses` 表，至少包含：

- `symbol`：text
- `stock_data`：jsonb
- `analysis`：jsonb
- `created_at`：timestamptz，默认 `now()`
