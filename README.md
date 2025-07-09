# If You Invested - Stock Investment Calculator

A web application that calculates what your stock investment would be worth today if you had invested a certain amount on a specific date.

## Features

- **Real-time stock data**: Uses Yahoo Finance API to get historical and current stock prices
- **Investment calculation**: Calculates shares purchased, current value, total return, and annualized return
- **Modern UI**: Clean, responsive design built with React and Tailwind CSS
- **TypeScript**: Full type safety for better development experience
- **API validation**: Backend validation for stock symbols and dates

## Tech Stack

### Frontend

- React 18 with TypeScript
- Tailwind CSS for styling
- Axios for API calls
- Responsive design

### Backend

- Node.js with Express
- Yahoo Finance API integration
- Rate limiting and security middleware
- CORS support

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd IfYouInvested
```

2. Install dependencies for all projects:

```bash
npm run install-all
```

### Running the Application

#### Development Mode

To run both frontend and backend simultaneously:

```bash
npm run dev
```

This will start:

- Backend server on http://localhost:5001
- Frontend development server on http://localhost:3000

#### Running Separately

**Backend only:**

```bash
npm run server
```

**Frontend only:**

```bash
npm run client
```

### Building for Production

To build the frontend for production:

```bash
npm run build
```

To start the production server:

```bash
npm start
```

## Usage

1. Enter a stock symbol (e.g., AAPL, GOOGL, TSLA)
2. Select the date you would have invested
3. Enter the investment amount in USD
4. Click "Calculate Investment"
5. View the results showing:
   - Original investment amount
   - Historical stock price
   - Current stock price
   - Number of shares purchased
   - Current value of investment
   - Total return (dollar amount and percentage)
   - Annualized return

## Example

If you invested $1,000 in Apple (AAPL) on January 1, 2010:

- Historical price: ~$7.00
- Shares purchased: ~142.86
- Current value: Significantly higher (varies with current price)
- Shows exact returns and annualized growth

## API Endpoints

### POST /api/stocks/calculate

Calculate investment returns for a stock.

**Request body:**

```json
{
  "symbol": "AAPL",
  "date": "2010-01-01",
  "amount": 1000
}
```

**Response:**

```json
{
  "symbol": "AAPL",
  "investmentDate": "2010-01-01",
  "originalAmount": 1000,
  "historicalPrice": "7.00",
  "currentPrice": "150.00",
  "sharesPurchased": "142.86",
  "currentValue": "21429.00",
  "totalReturn": "20429.00",
  "returnPercentage": "2042.90",
  "annualizedReturn": "25.50",
  "yearsHeld": "14.00"
}
```

### GET /api/stocks/info/:symbol

Get current stock information.

## Error Handling

The application handles various error scenarios:

- Invalid stock symbols
- Future dates
- Invalid investment amounts
- API failures
- Network errors

## Data Source

Stock data is provided by Yahoo Finance API, which offers free access to historical and current stock prices. The API provides reliable data for most major stock exchanges.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Disclaimer

This tool is for educational and informational purposes only. Past performance does not guarantee future results. Always consult with a financial advisor before making investment decisions.
