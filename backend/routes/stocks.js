const express = require("express");
const axios = require("axios");
const router = express.Router();

// Yahoo Finance API (free alternative)
const YAHOO_FINANCE_API = "https://query1.finance.yahoo.com/v8/finance/chart";

// Helper function to format date for API
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return Math.floor(date.getTime() / 1000); // Convert to Unix timestamp
};

// Helper function to get stock data from Yahoo Finance
const getStockData = async (symbol, startDate, endDate) => {
  try {
    const startTimestamp = formatDate(startDate);
    const endTimestamp = formatDate(endDate);

    const url = `${YAHOO_FINANCE_API}/${symbol}?period1=${startTimestamp}&period2=${endTimestamp}&interval=1d`;

    const response = await axios.get(url);
    const data = response.data;

    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
      throw new Error("No data found for this stock symbol");
    }

    const result = data.chart.result[0];
    const timestamps = result.timestamp;
    const prices = result.indicators.quote[0].close;

    return {
      timestamps,
      prices: prices.filter((price) => price !== null),
    };
  } catch (error) {
    console.error("Error fetching stock data:", error.message);
    throw error;
  }
};

// Get current stock price
const getCurrentPrice = async (symbol) => {
  try {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const data = await getStockData(
      symbol,
      yesterday.toISOString(),
      today.toISOString()
    );

    if (data.prices.length === 0) {
      throw new Error("Unable to get current price");
    }

    return data.prices[data.prices.length - 1];
  } catch (error) {
    console.error("Error getting current price:", error.message);
    throw error;
  }
};

// Get historical stock price
const getHistoricalPrice = async (symbol, date) => {
  try {
    const targetDate = new Date(date);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 7); // Get a week of data to find the closest trading day

    const data = await getStockData(
      symbol,
      targetDate.toISOString(),
      nextDay.toISOString()
    );

    if (data.prices.length === 0) {
      throw new Error("No historical data found for this date");
    }

    return data.prices[0]; // Return the first available price
  } catch (error) {
    console.error("Error getting historical price:", error.message);
    throw error;
  }
};

// Calculate investment returns
router.post("/calculate", async (req, res) => {
  try {
    const { symbol, date, amount } = req.body;

    // Validation
    if (!symbol || !date || !amount) {
      return res.status(400).json({
        error: "Missing required fields: symbol, date, and amount are required",
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        error: "Investment amount must be greater than 0",
      });
    }

    // Validate date
    const investmentDate = new Date(date);
    const today = new Date();

    if (investmentDate > today) {
      return res.status(400).json({
        error: "Investment date cannot be in the future",
      });
    }

    // Get historical and current prices
    const historicalPrice = await getHistoricalPrice(
      symbol.toUpperCase(),
      date
    );
    const currentPrice = await getCurrentPrice(symbol.toUpperCase());

    // Calculate returns
    const sharesPurchased = amount / historicalPrice;
    const currentValue = sharesPurchased * currentPrice;
    const totalReturn = currentValue - amount;
    const returnPercentage = ((currentValue - amount) / amount) * 100;

    // Calculate annualized return
    const years = (today - investmentDate) / (365.25 * 24 * 60 * 60 * 1000);
    const annualizedReturn = Math.pow(currentValue / amount, 1 / years) - 1;

    res.json({
      symbol: symbol.toUpperCase(),
      investmentDate: date,
      originalAmount: amount,
      historicalPrice: historicalPrice.toFixed(2),
      currentPrice: currentPrice.toFixed(2),
      sharesPurchased: sharesPurchased.toFixed(4),
      currentValue: currentValue.toFixed(2),
      totalReturn: totalReturn.toFixed(2),
      returnPercentage: returnPercentage.toFixed(2),
      annualizedReturn: (annualizedReturn * 100).toFixed(2),
      yearsHeld: years.toFixed(2),
    });
  } catch (error) {
    console.error("Calculation error:", error.message);
    res.status(500).json({
      error:
        "Unable to calculate investment returns. Please check the stock symbol and date.",
    });
  }
});

// Get stock info (for validation)
router.get("/info/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const currentPrice = await getCurrentPrice(symbol.toUpperCase());

    res.json({
      symbol: symbol.toUpperCase(),
      currentPrice: currentPrice.toFixed(2),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Stock info error:", error.message);
    res.status(404).json({
      error: "Stock symbol not found or invalid",
    });
  }
});

module.exports = router;
