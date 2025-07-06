const express = require("express");
const axios = require("axios");
const app = express();

app.use(express.json());

// ✅ Your Twelve Data API key from Render environment variable
const API_KEY = process.env.API_KEY;
const BASE_URL = "https://api.twelvedata.com";

// === Utility to handle GET endpoints ===
const forwardGet = (route, apiPath) => {
  app.get(route, async (req, res) => {
    try {
      const endpoint =
        typeof apiPath === "function" ? apiPath(req) : apiPath;
      const url = `${BASE_URL}${endpoint}`;
      const response = await axios.get(url, {
        params: {
          ...req.query,
          apikey: API_KEY,
        },
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

// === Utility to handle POST endpoints ===
const forwardPost = (route, apiPath) => {
  app.post(route, async (req, res) => {
    try {
      const response = await axios.post(`${BASE_URL}${apiPath}`, req.body, {
        params: {
          apikey: API_KEY,
        },
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

// ✅ Register GET routes
forwardGet("/price", "/price");
forwardGet("/time_series", "/time_series");
forwardGet("/symbol_search", "/symbol_search");
forwardGet("/:indicator", (req) => `/${req.params.indicator}`);

// ✅ Register POST routes
forwardPost("/analytics/multi-indicator", "/analytics/multi-indicator");
forwardPost("/analytics/insights", "/analytics/insights");

// ✅ Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ GPT proxy server is running on port ${PORT}`);
});
