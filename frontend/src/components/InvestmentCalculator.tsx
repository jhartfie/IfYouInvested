import React, { useState } from "react";
import axios from "axios";

interface CalculationResult {
  symbol: string;
  investmentDate: string;
  originalAmount: number;
  historicalPrice: string;
  currentPrice: string;
  sharesPurchased: string;
  currentValue: string;
  totalReturn: string;
  returnPercentage: string;
  annualizedReturn: string;
  yearsHeld: string;
}

const InvestmentCalculator: React.FC = () => {
  const [formData, setFormData] = useState({
    symbol: "",
    date: "",
    amount: "",
  });
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Popular stocks with their IPO dates for smart date selection
  const stocksWithIPO = [
    { symbol: "AAPL", ipoDate: "1980-12-12" },
    { symbol: "MSFT", ipoDate: "1986-03-13" },
    { symbol: "AMZN", ipoDate: "1997-05-15" },
    { symbol: "GOOGL", ipoDate: "2004-08-19" },
    { symbol: "TSLA", ipoDate: "2010-06-29" },
    { symbol: "META", ipoDate: "2012-05-18" },
    { symbol: "NVDA", ipoDate: "1999-01-22" },
    { symbol: "NFLX", ipoDate: "2002-05-23" },
    { symbol: "AMD", ipoDate: "1972-09-27" },
    { symbol: "PYPL", ipoDate: "2015-07-06" },
    { symbol: "DIS", ipoDate: "1957-11-12" },
    { symbol: "BA", ipoDate: "1962-01-02" },
    { symbol: "JPM", ipoDate: "1971-01-04" },
    { symbol: "JNJ", ipoDate: "1944-09-25" },
    { symbol: "PG", ipoDate: "1891-01-01" },
    { symbol: "KO", ipoDate: "1919-09-05" },
    { symbol: "PEP", ipoDate: "1965-12-30" },
    { symbol: "WMT", ipoDate: "1972-08-25" },
    { symbol: "HD", ipoDate: "1981-09-22" },
    { symbol: "V", ipoDate: "2008-03-19" },
    { symbol: "MA", ipoDate: "2006-05-25" },
    { symbol: "UNH", ipoDate: "1984-10-17" },
    { symbol: "CRM", ipoDate: "2004-06-23" },
    { symbol: "ADBE", ipoDate: "1986-08-20" },
    { symbol: "INTC", ipoDate: "1971-10-13" },
    { symbol: "CSCO", ipoDate: "1990-02-16" },
    { symbol: "VZ", ipoDate: "1983-11-21" },
    { symbol: "T", ipoDate: "1983-11-18" },
    { symbol: "XOM", ipoDate: "1972-01-03" },
    { symbol: "CVX", ipoDate: "1977-07-01" },
    { symbol: "PFE", ipoDate: "1972-06-01" },
    { symbol: "MRK", ipoDate: "1946-01-01" },
    { symbol: "ABBV", ipoDate: "2013-01-02" },
    { symbol: "TMO", ipoDate: "1986-11-01" },
    { symbol: "COST", ipoDate: "1985-12-05" },
    { symbol: "AVGO", ipoDate: "2009-08-06" },
    { symbol: "TXN", ipoDate: "1972-09-01" },
    { symbol: "QCOM", ipoDate: "1991-12-16" },
    { symbol: "ORCL", ipoDate: "1986-03-12" },
    { symbol: "IBM", ipoDate: "1962-01-02" },
    { symbol: "SBUX", ipoDate: "1992-06-26" },
    { symbol: "MCD", ipoDate: "1965-04-21" },
    { symbol: "NKE", ipoDate: "1980-12-02" },
    { symbol: "BABA", ipoDate: "2014-09-19" },
    { symbol: "SHOP", ipoDate: "2015-05-21" },
    { symbol: "SQ", ipoDate: "2015-11-19" },
    { symbol: "ZM", ipoDate: "2019-04-18" },
    { symbol: "UBER", ipoDate: "2019-05-10" },
    { symbol: "LYFT", ipoDate: "2019-03-29" },
    { symbol: "SNAP", ipoDate: "2017-03-02" },
  ];

  // Random selection functions
  const getRandomStock = () => {
    const randomIndex = Math.floor(Math.random() * stocksWithIPO.length);
    return stocksWithIPO[randomIndex].symbol;
  };

  const getRandomDate = (stockSymbol?: string) => {
    const today = new Date();
    const maxYearsBack = 10;
    const minYearsBack = 0.5; // At least 6 months ago

    let earliestDate = new Date(
      today.getTime() - maxYearsBack * 365 * 24 * 60 * 60 * 1000
    );

    // If a stock symbol is provided, ensure date is after IPO
    if (stockSymbol) {
      const stockData = stocksWithIPO.find(
        (stock) => stock.symbol === stockSymbol
      );
      if (stockData) {
        const ipoDate = new Date(stockData.ipoDate);
        // Use the later of either the IPO date or our earliest possible date
        earliestDate = ipoDate > earliestDate ? ipoDate : earliestDate;
      }
    }

    const latestDate = new Date(
      today.getTime() - minYearsBack * 365 * 24 * 60 * 60 * 1000
    );

    // Ensure we don't try to generate a date where earliest > latest
    if (earliestDate >= latestDate) {
      earliestDate = new Date(latestDate.getTime() - 365 * 24 * 60 * 60 * 1000); // 1 year before latest
    }

    const timeDiff = latestDate.getTime() - earliestDate.getTime();
    const randomTime = Math.random() * timeDiff;
    const randomDate = new Date(earliestDate.getTime() + randomTime);

    return randomDate.toISOString().split("T")[0];
  };

  const getRandomAmount = () => {
    const amounts = [500, 1000, 1500, 2000, 2500, 5000, 10000];
    const randomIndex = Math.floor(Math.random() * amounts.length);
    return amounts[randomIndex].toString();
  };

  // Button handlers for random selection
  const handleRandomStock = () => {
    const newStock = getRandomStock();
    setFormData((prev) => {
      // Check if current date is valid for the new stock
      let newDate = prev.date;
      if (prev.date) {
        const stockData = stocksWithIPO.find(
          (stock) => stock.symbol === newStock
        );
        if (stockData) {
          const currentDate = new Date(prev.date);
          const ipoDate = new Date(stockData.ipoDate);
          // If current date is before IPO, generate a new valid date
          if (currentDate < ipoDate) {
            newDate = getRandomDate(newStock);
          }
        }
      }

      return {
        ...prev,
        symbol: newStock,
        date: newDate,
      };
    });
  };

  const handleRandomDate = () => {
    setFormData((prev) => ({
      ...prev,
      date: getRandomDate(prev.symbol || undefined),
    }));
  };

  const handleRandomAmount = () => {
    setFormData((prev) => ({
      ...prev,
      amount: getRandomAmount(),
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post(
        "http://localhost:5001/api/stocks/calculate", // TODO: change to production URL
        {
          symbol: formData.symbol,
          date: formData.date,
          amount: parseFloat(formData.amount),
        }
      );

      setResult(response.data);
    } catch (err: any) {
      console.error("API Error:", err);

      if (err.response) {
        // Server responded with error status
        console.error("Response data:", err.response.data);
        console.error("Response status:", err.response.status);
        setError(
          err.response.data?.error || `Server error: ${err.response.status}`
        );
      } else if (err.request) {
        // Network error - request was made but no response received
        console.error("Network error:", err.request);
        setError(
          "Cannot connect to server. Make sure the backend is running on port 5001."
        );
      } else {
        // Something else happened
        console.error("Error:", err.message);
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(parseFloat(value));
  };

  const formatPercentage = (value: string) => {
    return `${parseFloat(value) >= 0 ? "+" : ""}${value}%`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Main Calculator Card */}
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 px-8 py-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                ></path>
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                Investment Calculator
              </h2>
              <p className="text-blue-100">
                Discover what your investment would be worth today.
                <br />
                Example: $1,000 in CVNA on Jan 26, 2023 → $53,218 (5,221%
                return)
              </p>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="px-8 py-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Stock Symbol */}
              <div className="space-y-2">
                <label
                  htmlFor="symbol"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <svg
                        className="w-4 h-4 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        ></path>
                      </svg>
                      <span>Stock Symbol</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRandomStock}
                      className="px-2 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors duration-200"
                    >
                      Random Stock
                    </button>
                  </div>
                </label>
                <input
                  type="text"
                  id="symbol"
                  name="symbol"
                  value={formData.symbol}
                  onChange={handleInputChange}
                  placeholder="e.g., AAPL, GOOGL, TSLA"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-700 placeholder-gray-400"
                  required
                />
              </div>

              {/* Investment Date */}
              <div className="space-y-2">
                <label
                  htmlFor="date"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <svg
                        className="w-4 h-4 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        ></path>
                      </svg>
                      <span>Investment Date</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRandomDate}
                      className="px-2 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-colors duration-200"
                    >
                      Random Date
                    </button>
                  </div>
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-700"
                  required
                />
              </div>

              {/* Investment Amount */}
              <div className="space-y-2">
                <label
                  htmlFor="amount"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <svg
                        className="w-4 h-4 text-purple-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                        ></path>
                      </svg>
                      <span>Investment Amount</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRandomAmount}
                      className="px-2 py-1 bg-purple-500 text-white text-xs rounded-lg hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 transition-colors duration-200"
                    >
                      Random Amount
                    </button>
                  </div>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500 text-lg">
                    $
                  </span>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="1000"
                    min="0.01"
                    step="0.01"
                    className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-700 placeholder-gray-400"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Calculating...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      ></path>
                    </svg>
                    <span>Calculate Investment</span>
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-8 mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-500 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <span className="text-red-700 font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="mx-8 mb-8">
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-6 border-2 border-green-100">
              {/* Results Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      ></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      Investment Results for {result.symbol}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(result.investmentDate).toLocaleDateString()} to
                      Today
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-600">
                    {formatCurrency(result.currentValue)}
                  </div>
                  <div className="text-sm text-gray-500">Current Value</div>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="text-sm text-gray-500 mb-1">Total Return</div>
                  <div
                    className={`text-xl font-bold ${
                      parseFloat(result.totalReturn) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(result.totalReturn)}
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="text-sm text-gray-500 mb-1">Return %</div>
                  <div
                    className={`text-xl font-bold ${
                      parseFloat(result.returnPercentage) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatPercentage(result.returnPercentage)}
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="text-sm text-gray-500 mb-1">
                    Annual Return
                  </div>
                  <div
                    className={`text-xl font-bold ${
                      parseFloat(result.annualizedReturn) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatPercentage(result.annualizedReturn)}
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="text-sm text-gray-500 mb-1">Years Held</div>
                  <div className="text-xl font-bold text-gray-800">
                    {result.yearsHeld}
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">
                  Investment Breakdown
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Original Investment</span>
                      <span className="font-semibold text-gray-800">
                        {formatCurrency(result.originalAmount.toString())}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Historical Price</span>
                      <span className="font-semibold text-gray-800">
                        {formatCurrency(result.historicalPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Shares Purchased</span>
                      <span className="font-semibold text-gray-800">
                        {result.sharesPurchased}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Current Price</span>
                      <span className="font-semibold text-gray-800">
                        {formatCurrency(result.currentPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Current Value</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(result.currentValue)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Investment Period</span>
                      <span className="font-semibold text-gray-800">
                        {result.yearsHeld} years
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">How It Works</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>
                • Enter any stock symbol (e.g., AAPL for Apple, GOOGL for
                Google)
              </p>
              <p>• Select the date you would have made the investment</p>
              <p>• Enter the amount you would have invested</p>
              <p>
                • We calculate the number of shares you could have bought at
                that price
              </p>
              <p>
                • See what those shares would be worth at today's market price
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentCalculator;
