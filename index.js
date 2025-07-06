const express = require("express");
const axios = require("axios");
const app = express();

app.use(express.json());

const API_KEY = process.env.API_KEY;
const BASE_URL = "https://api.twelvedata.com";

// === Generic GET forwarding ===
const forwardGet = (route, endpointPath) => {
  app.get(route, async (req, res) => {
    try {
      const endpoint = typeof endpointPath === "function" ? endpointPath(req) : endpointPath;
      const url = `${BASE_URL}${endpoint}`;
      const response = await axios.get(url, {
        params: { ...req.query, apikey: API_KEY },
      });
      res.json(response.data);
    } catch (err) {
      res.status(err.response?.status || 500).json({
        error: err.message,
        details: err.response?.data || null,
      });
    }
  });
};

// === Real GET endpoints ===
forwardGet("/price", "/price");
forwardGet("/time_series", "/time_series");
forwardGet("/symbol_search", "/symbol_search");
forwardGet("/:indicator", (req) => `/${req.params.indicator}`);

// === POST /analytics/multi-indicator ===
app.post("/analytics/multi-indicator", async (req, res) => {
  const { symbol, interval, timezone = "Europe/Brussels", indicators } = req.body;

  if (!symbol || !interval || !indicators || !Array.isArray(indicators)) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    const results = await Promise.all(
      indicators.map(async (ind) => {
        const name = ind.name;
        const params = ind.parameters || {};

        const url = `${BASE_URL}/${name}`;
        const queryParams = {
          apikey: API_KEY,
          symbol,
          interval,
          timezone,
          ...params,
        };

        try {
          const { data } = await axios.get(url, { params: queryParams });
          return {
            name,
            config: queryParams,
            data: data?.values || [],
          };
        } catch (error) {
          return {
            name,
            config: queryParams,
            error: error.response?.data || error.message,
          };
        }
      })
    );

    res.json({ symbol, interval, indicators: results });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch indicator data", details: err.message });
  }
});

// === POST /analytics/insights ===
app.post("/analytics/insights", async (req, res) => {
  const { symbol, interval, indicators, prices } = req.body;

  if (!symbol || !interval || !Array.isArray(indicators)) {
    return res.status(400).json({ error: "Missing required data" });
  }

  let insights = [];

  indicators.forEach((ind) => {
    const name = ind.name?.toLowerCase();
    const values = ind.values || [];

    if (name === "rsi") {
      const last = parseFloat(values.at(-1)?.value);
      if (last > 70) insights.push("RSI indicates overbought market.");
      else if (last < 30) insights.push("RSI indicates oversold market.");
      else insights.push("RSI is in a neutral range.");
    }

    if (name === "macd") {
      const last = values.at(-1);
      const hist = parseFloat(last?.histogram || 0);
      if (hist > 0) insights.push("MACD shows bullish momentum.");
      else if (hist < 0) insights.push("MACD shows bearish momentum.");
    }

    if (name === "adx") {
      const last = parseFloat(values.at(-1)?.adx || 0);
      if (last > 25) insights.push("ADX confirms a strong trend.");
      else insights.push("ADX suggests a weak or sideways trend.");
    }
  });

  if (prices?.length > 0) {
    const recent = prices.at(-1);
    insights.push(`Latest close price: ${recent?.close}`);
  }

  res.json({ summary: insights.join(" ") });
});

// === Start server ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ GPT proxy server is running on port ${PORT}`);
});
