const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

const API_KEY = process.env.API_KEY;
const BASE_URL = "https://api.twelvedata.com";

// === Utility to forward GET requests ===
const forwardGet = (path, endpointPath) => {
  app.get(path, async (req, res) => {
    try {
      const response = await axios.get(
        typeof endpointPath === "function"
          ? `${BASE_URL}${endpointPath(req)}`
          : `${BASE_URL}${endpointPath}`,
        {
          params: {
            ...req.query,
            apikey: API_KEY,
          },
        }
      );
      res.json(response.data);
    } catch (err) {
      res.status(err.response?.status || 500).json({
        error: err.message,
        details: err.response?.data || null,
      });
    }
  });
};

// === Utility to forward POST requests ===
const forwardPost = (path, endpointPath) => {
  app.post(path, async (req, res) => {
    try {
      const response = await axios.post(`${BASE_URL}${endpointPath}`, req.body, {
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

// === Forward all GET endpoints ===
forwardGet("/price", "/price");
forwardGet("/time_series", "/time_series");
forwardGet("/symbol_search", "/symbol_search");
forwardGet("/:indicator", (req) => `/${req.params.indicator}`);

// === Forward all POST endpoints ===
forwardPost("/analytics/multi-indicator", "/analytics/multi-indicator");
forwardPost("/analytics/insights", "/analytics/insights");

// === Start the proxy server ===
app.listen(3000, () => {
  console.log("✅ GPT proxy server running on port 3000");
});
