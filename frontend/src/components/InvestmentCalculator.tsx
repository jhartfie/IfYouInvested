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

interface ValidationErrors {
  symbol?: string;
  date?: string;
  amount?: string;
}

interface InputValidation {
  isValid: boolean;
  message: string;
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
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [showSymbolSuggestions, setShowSymbolSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [touchedFields, setTouchedFields] = useState<{[key: string]: boolean}>({});

  // Popular stocks for suggestions
  const popularStocks = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX',
    'AMD', 'PYPL', 'DIS', 'BA', 'JPM', 'JNJ', 'PG', 'KO', 'PEP', 'WMT'
  ];

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

  const validateSymbol = (symbol: string): InputValidation => {
    if (!symbol || !symbol.trim()) {
      return { isValid: false, message: 'Stock symbol is required' };
    }
    if (symbol.length < 1 || symbol.length > 5) {
      return { isValid: false, message: 'Stock symbol should be 1-5 characters' };
    }
    if (!/^[A-Za-z]+$/.test(symbol.trim())) {
      return { isValid: false, message: 'Stock symbol should contain only letters' };
    }
    return { isValid: true, message: 'Valid stock symbol' };
  };

  const validateDate = (date: string): InputValidation => {
    if (!date || !date.trim()) {
      return { isValid: false, message: 'Investment date is required' };
    }
    const selectedDate = new Date(date);
    const today = new Date();
    const minDate = new Date('1980-01-01');
    
    if (isNaN(selectedDate.getTime())) {
      return { isValid: false, message: 'Please enter a valid date' };
    }
    if (selectedDate >= today) {
      return { isValid: false, message: 'Date must be in the past' };
    }
    if (selectedDate < minDate) {
      return { isValid: false, message: 'Date too far in the past (minimum: 1980)' };
    }
    return { isValid: true, message: 'Valid investment date' };
  };

  const validateAmount = (amount: string): InputValidation => {
    if (!amount || !amount.trim()) {
      return { isValid: false, message: 'Investment amount is required' };
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
      return { isValid: false, message: 'Please enter a valid number' };
    }
    if (numAmount < 0.01) {
      return { isValid: false, message: 'Minimum investment: $0.01' };
    }
    if (numAmount > 1000000) {
      return { isValid: false, message: 'Maximum investment: $1,000,000' };
    }
    return { isValid: true, message: 'Valid investment amount' };
  };

  const validateForm = (data: typeof formData) => {
    const errors: ValidationErrors = {};
    let isValid = true;

    const symbolValidation = validateSymbol(data.symbol);
    if (!symbolValidation.isValid) {
      errors.symbol = symbolValidation.message;
      isValid = false;
    }

    const dateValidation = validateDate(data.date);
    if (!dateValidation.isValid) {
      errors.date = dateValidation.message;
      isValid = false;
    }

    const amountValidation = validateAmount(data.amount);
    if (!amountValidation.isValid) {
      errors.amount = amountValidation.message;
      isValid = false;
    }

    setValidationErrors(errors);
    setIsFormValid(isValid);
    return isValid;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    // Format stock symbol to uppercase
    if (name === 'symbol') {
      processedValue = value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5);
    }
    
    const newFormData = {
      ...formData,
      [name]: processedValue,
    };
    
    setFormData(newFormData);
    
    // Mark field as touched
    setTouchedFields(prev => ({
      ...prev,
      [name]: true
    }));
    
    // Show suggestions when focusing on symbol input
    if (name === 'symbol') {
      setShowSymbolSuggestions(true);
    }
    
    // Real-time validation
    setTimeout(() => validateForm(newFormData), 100);
  };

  // Check if form is valid whenever formData changes
  React.useEffect(() => {
    const symbolValid = validateSymbol(formData.symbol).isValid;
    const dateValid = validateDate(formData.date).isValid;
    const amountValid = validateAmount(formData.amount).isValid;
    setIsFormValid(symbolValid && dateValid && amountValid);
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Use relative URL for production, absolute for development
      const apiUrl =
        process.env.NODE_ENV === "production"
          ? ""
          : process.env.REACT_APP_API_URL || "http://localhost:5001";
      const response = await axios.post(`${apiUrl}/api/stocks/calculate`, {
        symbol: formData.symbol,
        date: formData.date,
        amount: parseFloat(formData.amount),
      });

      setResult(response.data);
      
      // Add to recent searches
      setRecentSearches(prev => {
        const updated = [formData.symbol, ...prev.filter(s => s !== formData.symbol)].slice(0, 5);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
        return updated;
      });
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

  // Load recent searches on component mount
  React.useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const handleSymbolFocus = () => {
    setShowSymbolSuggestions(true);
  };

  const handleSymbolBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => setShowSymbolSuggestions(false), 200);
  };

  const selectSymbol = (symbol: string) => {
    setFormData(prev => ({ ...prev, symbol }));
    setShowSymbolSuggestions(false);
    // Update date if needed for selected stock
    const stockData = stocksWithIPO.find(stock => stock.symbol === symbol);
    if (stockData && formData.date) {
      const currentDate = new Date(formData.date);
      const ipoDate = new Date(stockData.ipoDate);
      if (currentDate < ipoDate) {
        setFormData(prev => ({ ...prev, date: getRandomDate(symbol) }));
      }
    }
    setTimeout(() => validateForm({ ...formData, symbol }), 100);
  };

  const shareResults = async () => {
    if (!result) return;
    
    const shareText = `💰 Investment Analysis: $${result.originalAmount} in ${result.symbol} → $${result.currentValue} (${result.returnPercentage}% return)`;
    const shareUrl = window.location.href;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Investment Time Machine Results',
          text: shareText,
          url: shareUrl
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${shareText}\n\nTry it yourself: ${shareUrl}`);
        // You could add a toast notification here
      }
    } catch (error) {
      // User canceled sharing or clipboard access denied - this is normal, don't show error
      console.log('Share canceled by user');
    }
  };

  const copyResultsLink = async () => {
    if (!result) return;
    
    const resultSummary = `Investment Analysis:\n$${result.originalAmount} in ${result.symbol} on ${new Date(result.investmentDate).toLocaleDateString()}\nCurrent Value: $${result.currentValue}\nReturn: ${result.returnPercentage}%\n\nTry your own: ${window.location.href}`;
    
    try {
      await navigator.clipboard.writeText(resultSummary);
      // You could add a success notification here
    } catch (error) {
      // Clipboard access denied - this is normal on some browsers
      console.log('Could not copy to clipboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6 shadow-lg animate-float">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-4 px-4">
            Investment Time Machine
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
            Discover the power of historical investing. See what your money could have grown to with our professional-grade investment calculator.
          </p>
          <div className="mt-4 text-sm text-gray-500 font-medium px-4">
            Example: $1,000 in CVNA on Jan 26, 2023 → $53,218 (5,221% return)
          </div>
        </div>

        {/* Main Calculator Card */}
        <div className="backdrop-blur-lg bg-white/80 rounded-3xl shadow-2xl overflow-hidden border border-white/20 relative">
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
          
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 px-8 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white mb-1">
                    Calculate Your Returns
                  </h2>
                  <p className="text-blue-100 text-lg font-medium">
                    Professional investment analysis at your fingertips
                  </p>
                </div>
              </div>
              <div className="hidden lg:flex items-center space-x-2 text-white/80">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Live Market Data</span>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="relative px-8 py-8 bg-gradient-to-b from-white/50 to-white/30">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Stock Symbol */}
                <div className="group">
                  <label htmlFor="symbol" className="block text-sm font-bold text-gray-800 mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                          </svg>
                        </div>
                        <span className="text-lg">Stock Symbol</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRandomStock}
                        className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-medium rounded-lg hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        🎲 Random
                      </button>
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="symbol"
                      name="symbol"
                      value={formData.symbol}
                      onChange={handleInputChange}
                      onFocus={handleSymbolFocus}
                      onBlur={handleSymbolBlur}
                      placeholder="e.g., AAPL, GOOGL, TSLA"
                      className={`w-full px-5 py-4 bg-white/70 backdrop-blur-sm border-2 rounded-2xl focus:outline-none focus:ring-4 transition-all duration-300 text-gray-800 placeholder-gray-500 text-lg font-medium shadow-lg group-hover:shadow-xl ${
                        validationErrors.symbol 
                          ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' 
                          : formData.symbol && !validationErrors.symbol 
                          ? 'border-green-300 focus:ring-green-500/20 focus:border-green-500'
                          : 'border-gray-200/50 focus:ring-blue-500/20 focus:border-blue-500'
                      }`}
                      required
                    />
                    
                    {/* Stock Suggestions Dropdown */}
                    {showSymbolSuggestions && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-lg rounded-2xl border border-gray-200/50 shadow-2xl z-50 max-h-64 overflow-y-auto">
                        {recentSearches.length > 0 && (
                          <div className="p-3 border-b border-gray-100">
                            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Recent</div>
                            <div className="flex flex-wrap gap-2">
                              {recentSearches.map((stock) => (
                                <button
                                  key={stock}
                                  type="button"
                                  onClick={() => selectSymbol(stock)}
                                  className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                                >
                                  {stock}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="p-3">
                          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Popular Stocks</div>
                          <div className="grid grid-cols-3 gap-2">
                            {popularStocks.filter(stock => 
                              !formData.symbol || stock.toLowerCase().includes(formData.symbol.toLowerCase())
                            ).slice(0, 12).map((stock) => (
                              <button
                                key={stock}
                                type="button"
                                onClick={() => selectSymbol(stock)}
                                className="px-3 py-2 text-left text-gray-700 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
                              >
                                {stock}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {touchedFields.symbol && validationErrors.symbol && (
                      <div className="mt-2 flex items-center text-red-600 text-sm">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        {validationErrors.symbol}
                      </div>
                    )}
                    {touchedFields.symbol && formData.symbol && !validationErrors.symbol && (
                      <div className="mt-2 flex items-center text-green-600 text-sm">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Valid stock symbol
                      </div>
                    )}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                </div>

                {/* Investment Date */}
                <div className="group">
                  <label htmlFor="date" className="block text-sm font-bold text-gray-800 mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                        </div>
                        <span className="text-lg">Investment Date</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRandomDate}
                        className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-medium rounded-lg hover:from-green-600 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        📅 Random
                      </button>
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      min="1980-01-01"
                      max={new Date().toISOString().split("T")[0]}
                      className={`w-full px-5 py-4 bg-white/70 backdrop-blur-sm border-2 rounded-2xl focus:outline-none focus:ring-4 transition-all duration-300 text-gray-800 text-lg font-medium shadow-lg group-hover:shadow-xl ${
                        validationErrors.date 
                          ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' 
                          : formData.date && !validationErrors.date 
                          ? 'border-green-300 focus:ring-green-500/20 focus:border-green-500'
                          : 'border-gray-200/50 focus:ring-green-500/20 focus:border-green-500'
                      }`}
                      required
                    />
                    {touchedFields.date && validationErrors.date && (
                      <div className="mt-2 flex items-center text-red-600 text-sm">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        {validationErrors.date}
                      </div>
                    )}
                    {touchedFields.date && formData.date && !validationErrors.date && (
                      <div className="mt-2 flex items-center text-green-600 text-sm">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Valid investment date
                      </div>
                    )}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500/5 to-emerald-500/5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                </div>

                {/* Investment Amount */}
                <div className="group">
                  <label htmlFor="amount" className="block text-sm font-bold text-gray-800 mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                          </svg>
                        </div>
                        <span className="text-lg">Investment Amount</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRandomAmount}
                        className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        💰 Random
                      </button>
                    </div>
                  </label>
                  <div className="relative">
                    <span className="absolute left-5 top-4 text-gray-600 text-xl font-bold z-10">
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
                      max="1000000"
                      step="0.01"
                      className={`w-full pl-10 pr-5 py-4 bg-white/70 backdrop-blur-sm border-2 rounded-2xl focus:outline-none focus:ring-4 transition-all duration-300 text-gray-800 placeholder-gray-500 text-lg font-medium shadow-lg group-hover:shadow-xl ${
                        validationErrors.amount 
                          ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' 
                          : formData.amount && !validationErrors.amount 
                          ? 'border-green-300 focus:ring-green-500/20 focus:border-green-500'
                          : 'border-gray-200/50 focus:ring-purple-500/20 focus:border-purple-500'
                      }`}
                      required
                    />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/5 to-pink-500/5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  {touchedFields.amount && validationErrors.amount && (
                    <div className="mt-2 flex items-center text-red-600 text-sm">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      {validationErrors.amount}
                    </div>
                  )}
                  {touchedFields.amount && formData.amount && !validationErrors.amount && (
                    <div className="mt-2 flex items-center text-green-600 text-sm">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Valid investment amount
                    </div>
                  )}
                </div>
            </div>

              {/* Submit Button */}
              <div className="flex justify-center mt-8">
                <button
                  type="submit"
                  disabled={loading}
                  className={`group relative px-12 py-5 text-white font-bold text-lg rounded-2xl shadow-2xl focus:outline-none focus:ring-4 focus:ring-purple-500/50 focus:ring-offset-2 transition-all duration-300 overflow-hidden ${
                    loading
                      ? 'bg-gray-400 cursor-not-allowed opacity-60'
                      : 'bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:shadow-3xl transform hover:scale-105'
                  }`}
                >
                  {/* Button background animation */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-purple-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                  
                  <div className="relative z-10">
                    {loading ? (
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 relative">
                          <div className="absolute inset-0 border-3 border-white/30 rounded-full"></div>
                          <div className="absolute inset-0 border-3 border-t-white rounded-full animate-spin"></div>
                        </div>
                        <span className="font-semibold">Analyzing Market Data...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <svg className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                        </svg>
                        <span className="font-semibold">Calculate Investment Returns</span>
                        <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              </div>
            </form>
          </div>

          {/* Loading Skeleton */}
          {loading && (
            <div className="mx-4 sm:mx-8 mb-8">
              <div className="relative bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 rounded-3xl p-6 sm:p-8 border border-white/30 shadow-2xl backdrop-blur-sm overflow-hidden animate-scale-in">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full transform translate-x-32 -translate-y-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-green-500/10 to-blue-500/10 rounded-full transform -translate-x-24 translate-y-24"></div>
                
                {/* Loading Header */}
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
                  <div className="flex items-center space-x-4 mb-4 lg:mb-0">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-xl">
                      <div className="w-8 h-8 border-3 border-white/30 rounded-full">
                        <div className="w-full h-full border-3 border-t-white rounded-full animate-spin"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-6 bg-gray-300 rounded-lg animate-pulse w-48"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                    </div>
                  </div>
                  <div className="text-center lg:text-right space-y-2">
                    <div className="h-12 bg-gray-300 rounded-lg animate-pulse w-40"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                  </div>
                </div>

                {/* Loading Metrics */}
                <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                  {[...Array(4)].map((_, index) => (
                    <div key={index} className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/50 shadow-xl">
                      <div className="flex items-center justify-between mb-3">
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
                        <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                      </div>
                      <div className="h-8 bg-gray-300 rounded animate-pulse w-24"></div>
                    </div>
                  ))}\n                </div>

                {/* Loading Breakdown */}
                <div className="relative z-10 bg-white/90 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-white/50 shadow-2xl">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-gray-300 rounded-xl animate-pulse"></div>
                    <div className="h-6 bg-gray-300 rounded animate-pulse w-64"></div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {[...Array(2)].map((_, colIndex) => (
                      <div key={colIndex} className="space-y-4">
                        {[...Array(3)].map((_, rowIndex) => (
                          <div key={rowIndex} className="flex justify-between items-center py-4 px-4 rounded-xl">
                            <div className="flex items-center space-x-3">
                              <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
                              <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                            </div>
                            <div className="h-5 bg-gray-300 rounded animate-pulse w-20"></div>
                          </div>
                        ))}\n                      </div>
                    ))}\n                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mx-8 mb-6 p-6 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl shadow-lg backdrop-blur-sm">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center mr-4 shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-red-800 mb-1">Analysis Error</div>
                  <div className="text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Results Section */}
          {result && (
            <div className="mx-8 mb-8">
              <div className="relative bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 rounded-3xl p-8 border border-white/30 shadow-2xl backdrop-blur-sm overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full transform translate-x-32 -translate-y-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-green-500/10 to-blue-500/10 rounded-full transform -translate-x-24 translate-y-24"></div>
                {/* Results Header */}
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
                  <div className="flex items-center space-x-4 mb-4 lg:mb-0">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-xl">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        Analysis Results: {result.symbol}
                      </h3>
                      <p className="text-gray-600 font-medium">
                        {new Date(result.investmentDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })} → Present
                      </p>
                    </div>
                  </div>
                  <div className="text-center lg:text-right">
                    <div className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                      {formatCurrency(result.currentValue)}
                    </div>
                    <div className="text-sm text-gray-600 font-semibold tracking-wide uppercase mb-3">Portfolio Value Today</div>
                    
                    {/* Share Results */}
                    <div className="flex justify-center lg:justify-end space-x-2">
                      <button
                        onClick={shareResults}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors shadow-lg"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
                        </svg>
                        Share
                      </button>
                      <button
                        onClick={copyResultsLink}
                        className="inline-flex items-center px-3 py-1.5 bg-gray-500 text-white text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors shadow-lg"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v6a2 2 0 002 2h2m0 0h2a2 2 0 002-2v-6a2 2 0 00-2-2H6m0 0V3a2 2 0 012-2h4a2 2 0 012 2v2M7 7h10l-2 2M7 7l2 2"></path>
                        </svg>
                        Copy
                      </button>
                    </div>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="group bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-bold text-gray-600 uppercase tracking-wide">Total Return</div>
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                        </svg>
                      </div>
                    </div>
                    <div className={`text-2xl font-black ${
                      parseFloat(result.totalReturn) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}>
                      {formatCurrency(result.totalReturn)}
                    </div>
                  </div>
                  
                  <div className="group bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-bold text-gray-600 uppercase tracking-wide">Return %</div>
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                        </svg>
                      </div>
                    </div>
                    <div className={`text-2xl font-black ${
                      parseFloat(result.returnPercentage) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}>
                      {formatPercentage(result.returnPercentage)}
                    </div>
                  </div>
                  
                  <div className="group bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-bold text-gray-600 uppercase tracking-wide">Annual Return</div>
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                        </svg>
                      </div>
                    </div>
                    <div className={`text-2xl font-black ${
                      parseFloat(result.annualizedReturn) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}>
                      {formatPercentage(result.annualizedReturn)}
                    </div>
                  </div>
                  
                  <div className="group bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-bold text-gray-600 uppercase tracking-wide">Years Held</div>
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                      </div>
                    </div>
                    <div className="text-2xl font-black text-gray-800">
                      {result.yearsHeld}
                    </div>
                  </div>
                </div>

                {/* Detailed Breakdown */}
                <div className="relative z-10 bg-white/90 backdrop-blur-xl rounded-2xl p-8 border border-white/50 shadow-2xl">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m9-6v6m0 0h2a2 2 0 002-2V9a2 2 0 00-2-2h-2m0 6a2 2 0 01-2 2H9"></path>
                      </svg>
                    </div>
                    <h4 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Detailed Investment Breakdown
                    </h4>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="group flex justify-between items-center py-4 px-4 rounded-xl hover:bg-gray-50/50 transition-colors duration-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="font-medium text-gray-700">Original Investment</span>
                        </div>
                        <span className="font-bold text-gray-900 text-lg">
                          {formatCurrency(result.originalAmount.toString())}
                        </span>
                      </div>
                      
                      <div className="group flex justify-between items-center py-4 px-4 rounded-xl hover:bg-gray-50/50 transition-colors duration-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="font-medium text-gray-700">Historical Price</span>
                        </div>
                        <span className="font-bold text-gray-900 text-lg">
                          {formatCurrency(result.historicalPrice)}
                        </span>
                      </div>
                      
                      <div className="group flex justify-between items-center py-4 px-4 rounded-xl hover:bg-gray-50/50 transition-colors duration-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className="font-medium text-gray-700">Shares Purchased</span>
                        </div>
                        <span className="font-bold text-gray-900 text-lg">
                          {result.sharesPurchased}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="group flex justify-between items-center py-4 px-4 rounded-xl hover:bg-gray-50/50 transition-colors duration-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                          <span className="font-medium text-gray-700">Current Price</span>
                        </div>
                        <span className="font-bold text-gray-900 text-lg">
                          {formatCurrency(result.currentPrice)}
                        </span>
                      </div>
                      
                      <div className="group flex justify-between items-center py-4 px-4 rounded-xl hover:bg-gray-50/50 transition-colors duration-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                          <span className="font-medium text-gray-700">Current Value</span>
                        </div>
                        <span className="font-bold text-emerald-600 text-lg">
                          {formatCurrency(result.currentValue)}
                        </span>
                      </div>
                      
                      <div className="group flex justify-between items-center py-4 px-4 rounded-xl hover:bg-gray-50/50 transition-colors duration-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span className="font-medium text-gray-700">Investment Period</span>
                        </div>
                        <span className="font-bold text-gray-900 text-lg">
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

        {/* Enhanced Info Cards */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* How It Works Card */}
          <div className="group bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl p-8 border border-blue-200/50 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h4 className="text-2xl font-bold bg-gradient-to-r from-blue-900 to-indigo-900 bg-clip-text text-transparent">
                How It Works
              </h4>
            </div>
            <div className="space-y-4 text-blue-800">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <p className="font-medium">Enter any stock symbol (e.g., AAPL for Apple, GOOGL for Google)</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <p className="font-medium">Select the date you would have made the investment</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
                <p className="font-medium">Enter the amount you would have invested</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <p className="font-medium">Get professional-grade analysis of your potential returns</p>
              </div>
            </div>
          </div>

          {/* Features Card */}
          <div className="group bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 rounded-3xl p-8 border border-purple-200/50 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
                </svg>
              </div>
              <h4 className="text-2xl font-bold bg-gradient-to-r from-purple-900 to-pink-900 bg-clip-text text-transparent">
                Professional Features
              </h4>
            </div>
            <div className="space-y-4 text-purple-800">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <p className="font-medium">Real-time market data integration</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <p className="font-medium">Annualized return calculations</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <p className="font-medium">Historical price accuracy</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <p className="font-medium">Comprehensive breakdown analysis</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="font-medium text-green-700">Enterprise-grade calculations</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentCalculator;
