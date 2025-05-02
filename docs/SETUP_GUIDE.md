# AlgoTrader Setup and Configuration Guide

This guide provides detailed instructions for setting up and configuring the AlgoTrader application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Database Setup](#database-setup)
4. [Environment Configuration](#environment-configuration)
5. [Binance API Configuration](#binance-api-configuration)
6. [Application Configuration](#application-configuration)
7. [Running the Application](#running-the-application)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js**: Version 18.x or higher
- **npm**: Version 9.x or higher
- **PostgreSQL**: Version 14.x or higher
- **Git**: For version control

## Installation

### Clone the Repository

```bash
git clone https://github.com/yourusername/algotrader.git
cd algotrader
```

### Install Dependencies

```bash
npm install
```

This will install all required dependencies as listed in `package.json`.

## Database Setup

### Create a PostgreSQL Database

```bash
psql -U postgres
```

```sql
CREATE DATABASE algotrader;
CREATE USER algotrader_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE algotrader TO algotrader_user;
\q
```

### Configure Database Connection

Create a `.env` file in the root directory of the project and add the following:

```
DATABASE_URL=postgresql://algotrader_user:your_password@localhost:5432/algotrader
```

### Initialize the Database Schema

The application uses Drizzle ORM for database schema management. To initialize the database schema:

```bash
npm run db:push
```

This will create all the necessary tables and relationships in the database.

## Environment Configuration

In addition to the database connection, you'll need to configure several environment variables. Add the following to your `.env` file:

```
# Server Configuration
PORT=5000
NODE_ENV=development

# Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1d

# Binance API Configuration
BINANCE_TESTNET_API_KEY=your_testnet_api_key
BINANCE_TESTNET_SECRET_KEY=your_testnet_secret_key

# For production (uncomment when ready)
# BINANCE_API_KEY=your_production_api_key
# BINANCE_SECRET_KEY=your_production_secret_key
# USE_REAL_API=true
```

## Binance API Configuration

The application uses Binance Futures API for trading. By default, it connects to the Binance Futures Testnet, which is a sandbox environment for testing without real funds.

### Creating a Binance Testnet Account

1. Go to [Binance Futures Testnet](https://testnet.binancefuture.com/)
2. Click on "Register Now" to create a new account
3. Follow the registration process
4. Once registered, go to the API Management page
5. Create a new API key and note down the API key and secret key

### Adding API Keys to Environment Variables

Add your Binance Testnet API keys to the `.env` file:

```
BINANCE_TESTNET_API_KEY=your_testnet_api_key
BINANCE_TESTNET_SECRET_KEY=your_testnet_secret_key
```

### Using Production API (Warning: Real Trading)

When you're ready to use real funds, you can switch to the production API by uncommenting and setting the following variables in your `.env` file:

```
BINANCE_API_KEY=your_production_api_key
BINANCE_SECRET_KEY=your_production_secret_key
USE_REAL_API=true
```

**Warning**: Using the production API will involve real cryptocurrency trading. Only use this with funds you can afford to lose.

## Application Configuration

The application can be configured through various settings files and environment variables.

### Trading Settings

Trading settings are managed through the application UI in the Settings page. This includes:

- Trading strategy allocations
- Risk management parameters
- Symbol selection
- Timeframe preferences

These settings are stored in the database and can be changed at any time through the UI.

### Default Configuration

Default configuration values are defined in the codebase and can be overridden through environment variables or the UI. Important defaults include:

- **Default Leverage**: 5x
- **Max Risk Per Trade**: 2% of account balance
- **Max Risk Exposure**: 50% of account balance
- **Default Timeframes**: 5m, 15m, 1h, 4h
- **Popular Symbols**: BTCUSDT, ETHUSDT, BNBUSDT, SOLUSDT, ADAUSDT, DOGEUSDT, XRPUSDT, DOTUSDT, AVAXUSDT, LINKUSDT

## Running the Application

### Development Mode

To run the application in development mode:

```bash
npm run dev
```

This will start the server and client in development mode with hot reloading.

### Production Mode

To build and run the application in production mode:

```bash
npm run build
npm start
```

### Accessing the Application

Once the application is running, you can access it at:

- Development: http://localhost:5000
- Production: http://your-server-address:5000

## Troubleshooting

### Common Issues

#### Database Connection Failed

**Symptoms**: Server fails to start with database connection errors.

**Solution**:
- Check that PostgreSQL is running
- Verify that the `DATABASE_URL` in your `.env` file is correct
- Ensure the database user has the correct permissions

```bash
psql -U postgres
```

```sql
ALTER USER algotrader_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE algotrader TO algotrader_user;
\q
```

#### Binance API Connection Failed

**Symptoms**: Unable to fetch market data or place orders.

**Solution**:
- Check that your API keys are correct in your `.env` file
- Verify that your API keys have the correct permissions
- Check that the Binance API services are online
- If using Testnet, ensure you're using Testnet API keys

#### WebSocket Connection Issues

**Symptoms**: Real-time updates not working, UI shows "Disconnected" status.

**Solution**:
- Check that the server is running
- Check for any firewall or network issues
- Try refreshing the page
- Check browser console for WebSocket errors

#### NaN or Undefined Values in UI

**Symptoms**: Dashboard displays NaN or undefined values for calculations.

**Solution**:
- Check that the required data is available (candles, account info, etc.)
- Ensure there are enough candles for indicator calculations
- Check for division by zero or other mathematical errors in calculations

### Getting Help

If you encounter issues not covered in this guide, please:

1. Check the logs for error messages
2. Check the GitHub repository for known issues
3. Create a new issue on the GitHub repository with detailed information about the problem

## Next Steps

After successfully setting up the application, you should:

1. Configure your trading strategies and risk parameters
2. Test the application with small positions on the Testnet
3. Monitor the performance and adjust your strategy parameters as needed
4. Only move to the production API with real funds when you are confident in your setup

Remember that algorithmic trading involves risks, and past performance is not indicative of future results. Always use risk management strategies and only trade with funds you can afford to lose.