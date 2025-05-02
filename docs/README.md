# AlgoTrader Documentation

This documentation provides an overview of the AlgoTrader application, its architecture, features, and how to use it.

## Table of Contents

1. [Introduction](#introduction)
2. [System Architecture](#system-architecture)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Usage](#usage)
6. [API Reference](#api-reference)
7. [Trading Strategies](#trading-strategies)
8. [Technical Analysis](#technical-analysis)
9. [Risk Management](#risk-management)
10. [Troubleshooting](#troubleshooting)

## Introduction

AlgoTrader is a sophisticated Binance Futures algorithmic trading platform designed for advanced cryptocurrency derivative trading and strategy development. It leverages cutting-edge technologies for comprehensive market analysis and automated trading.

The platform provides real-time market data, multiple trading strategies, risk management, and portfolio performance tracking, all in a visually appealing and user-friendly interface.

## System Architecture

The AlgoTrader application is built on a client-server architecture using modern web technologies:

### Backend
- **Node.js/Express**: Provides the server-side infrastructure
- **WebSocket**: For real-time data streaming
- **PostgreSQL**: Database for storing trading data, user preferences, and system information
- **Binance API Integration**: For market data and trading operations

### Frontend
- **React/TypeScript**: For building the user interface
- **TailwindCSS**: For styling
- **React Query**: For data fetching and caching
- **shadcn/ui**: For UI components

### Core Components
- **Trading Core**: Manages strategies, market scanning, and trade execution
- **Risk Manager**: Handles position sizing and risk controls
- **Portfolio Analyzer**: Performs correlation analysis and diversification recommendations
- **WebSocket Manager**: Handles real-time data streaming

## Installation

### Prerequisites
- Node.js v18+
- PostgreSQL database
- Binance API keys (can use Testnet for development)

### Steps

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/algotrader.git
   cd algotrader
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/algotrader
   BINANCE_TESTNET_API_KEY=your_testnet_api_key
   BINANCE_TESTNET_SECRET_KEY=your_testnet_secret_key
   ```

4. Initialize the database:
   ```
   npm run db:push
   ```

5. Start the development server:
   ```
   npm run dev
   ```

## Configuration

The application can be configured through various settings:

### Binance API Configuration

For Testnet:
```
BINANCE_TESTNET_API_KEY=your_testnet_api_key
BINANCE_TESTNET_SECRET_KEY=your_testnet_secret_key
```

For Production (use with caution):
```
BINANCE_API_KEY=your_api_key
BINANCE_SECRET_KEY=your_secret_key
USE_REAL_API=true
```

### Trading Settings

Trading settings can be configured through the UI in the Settings page. This includes:

- Strategy allocations
- Risk parameters
- Symbol selection
- Timeframe preferences

## Usage

### Dashboard

The dashboard provides an overview of the trading system, including:

- Current positions
- Account balance and performance
- Market data
- Active trading signals
- Risk exposure

### Trading Strategies

Manage trading strategies through the Strategies page, where you can:

- Enable/disable strategies
- Adjust allocation percentages
- View performance metrics
- Customize strategy parameters

### High-Probability Setups

The High-Probability Setups page shows the best current trading opportunities based on all active strategies, ranked by score.

### Technical Analysis

The Technical Analysis page provides detailed market analysis for selected symbols, including:

- Multiple indicators (RSI, MACD, Bollinger Bands, etc.)
- Support/resistance levels
- Trend analysis
- Volume analysis

### Risk Management

The Risk Management page offers tools to manage trading risk:

- Position sizing calculator
- Risk-per-trade settings
- Exposure limits
- Correlation analysis
- Diversification recommendations

## API Reference

The application exposes several API endpoints for internal use:

### Binance Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/binance/market` | GET | Get market data |
| `/api/binance/candles/:symbol/:timeframe` | GET | Get OHLCV data |
| `/api/binance/candles` | GET | Get OHLCV data with query parameters |
| `/api/binance/account` | GET | Get account information |
| `/api/binance/positions` | GET | Get current positions |
| `/api/binance/order` | POST | Place an order |
| `/api/binance/order` | DELETE | Cancel an order |
| `/api/binance/leverage` | POST | Change leverage |
| `/api/binance/close-position` | POST | Close a position |
| `/api/binance/tpsl` | POST | Set take profit/stop loss |
| `/api/binance/opportunities` | GET | Get current trading opportunities |
| `/api/binance/performance` | GET | Get performance metrics |
| `/api/binance/risk` | GET | Get risk metrics |

### System Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/system/logs` | GET | Get system logs |
| `/api/system/logs/clear` | POST | Clear system logs |

## Trading Strategies

The system implements several trading strategies:

### Momentum Breakout

Identifies potential breakout opportunities by analyzing price action, volume, and volatility.

- **Risk Profile**: 1-2% risk, 2-4% reward
- **Best Market Conditions**: Trending markets
- **Timeframe Preference**: 15m, 1h

### Mean Reversion

Looks for overbought/oversold conditions and price deviations from moving averages.

- **Risk Profile**: 0.5-1.5% risk, 1-3% reward
- **Best Market Conditions**: Ranging markets
- **Timeframe Preference**: 1h, 4h

### Volatility Expansion

Capitalizes on periods of increasing volatility and momentum.

- **Risk Profile**: 2-3% risk, 6-12% reward
- **Best Market Conditions**: Volatile markets
- **Timeframe Preference**: 5m, 15m, 1h

### Liquidation Cascade

Looks for opportunities when large positions are being liquidated, causing price cascades.

- **Risk Profile**: 1.5-3% risk, 5-10% reward
- **Best Market Conditions**: Volatile markets, high liquidation volume
- **Timeframe Preference**: 5m, 15m

### Funding Rate Arbitrage

Exploits discrepancies in funding rates between perpetual futures and spot prices.

- **Risk Profile**: 0.5-1% risk, 0.75-1.5% reward
- **Best Market Conditions**: Any market conditions
- **Timeframe Preference**: 1h, 4h

## Technical Analysis

The system uses various technical indicators to analyze the market:

- **Trend Indicators**: Moving Averages, ADX, Parabolic SAR
- **Momentum Indicators**: RSI, MACD, Stochastic
- **Volatility Indicators**: Bollinger Bands, ATR
- **Volume Indicators**: OBV, Volume Profile

## Risk Management

Risk management is a core component of the system:

### Position Sizing

The system calculates position sizes based on:
- Account size
- Risk percentage per trade
- Stop loss distance
- Leverage

### Risk Limits

- Maximum risk per trade
- Maximum account risk
- Maximum risk per symbol
- Maximum risk per strategy

### Correlation Analysis

The system analyzes correlations between assets to avoid over-exposure to correlated markets.

## Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Check your API keys
   - Verify that Binance services are online
   - Ensure your IP is not restricted

2. **WebSocket Disconnections**
   - Check your internet connection
   - Ensure you're not hitting rate limits
   - Reload the application

3. **NaN Values in Calculations**
   - Ensure there's enough candle data for indicators
   - Check for zero or negative values in denominators
   - Verify that API responses contain all required fields

4. **Database Connection Issues**
   - Verify PostgreSQL is running
   - Check database credentials
   - Ensure database migrations have been applied

### Support

For support, issues, or feature requests, please create an issue on the GitHub repository.