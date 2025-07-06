const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

const API_KEY = process.env.API_KEY;
const BASE_URL = "https://api.twelvedata.com";

// === GET Handler ===
const forwardGet = (route, endpointPath) => {
  app.get(route, async (req, res) => {
    try {
      const url = `${BASE_URL}${
        typeof endpointPath === "function" ? endpointPath(req) : endpointPath
      }`;
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

// === POST Handler ===
const forwardPost = (route, endpointPath) => {
  app.post(route, async (req, res) => {
    try {
      const response = await axios.post(`${BASE_URL}${endpointPath}`, req.body, {
        params: { apikey: API_KEY },
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

// ✅ Register GET endpoints
forwardGet("/price", "/price");
forwardGet("/time_series", "/time_series");
forwardGet("/symbol_search", "/symbol_search");
forwardGet("/:indicator", (req) => `/${req.params.indicator}`);

// ✅ Register POST endpoints
forwardPost("/analytics/multi-indicator", "/analytics/multi-indicator");
forwardPost("/analytics/insights", "/analytics/insights");

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Proxy running on port ${PORT}`);
});
