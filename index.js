const express = require("express");
const axios = require("axios");
const app = express();

const API_KEY = process.env.API_KEY;

app.get("/price", async (req, res) => {
  const { symbol } = req.query;

  try {
    const response = await axios.get("https://api.twelvedata.com/price", {
      params: {
        symbol,
        apikey: API_KEY
      }
    });

    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      error: err.message,
      details: err.response?.data || null
    });
  }
});

app.listen(3000, () => {
  console.log("Proxy running on port 3000");
});
