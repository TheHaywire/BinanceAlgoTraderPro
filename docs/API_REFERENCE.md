# AlgoTrader API Reference

This document provides a comprehensive reference for all API endpoints available in the AlgoTrader application.

## Table of Contents

1. [Authentication](#authentication)
2. [Error Handling](#error-handling)
3. [Binance Endpoints](#binance-endpoints)
4. [System Endpoints](#system-endpoints)
5. [User Endpoints](#user-endpoints)
6. [Trading Endpoints](#trading-endpoints)
7. [WebSocket API](#websocket-api)

## Authentication

All API endpoints except for login and registration require authentication. 

Authentication is handled via JSON Web Tokens (JWT). After successful login, a token is returned which must be included in the `Authorization` header of all subsequent requests.

```
Authorization: Bearer <token>
```

## Error Handling

API errors are returned with appropriate HTTP status codes and a JSON response containing error details.

Example error response:

```json
{
  "error": "Invalid credentials",
  "status": 401,
  "message": "Username or password is incorrect"
}
```

Common error status codes:

- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication failure
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server-side error

## Binance Endpoints

### Get Market Data

Retrieves current market data for all symbols or a specific symbol.

- **URL**: `/api/binance/market`
- **Method**: `GET`
- **Query Parameters**:
  - `symbol` (optional): Symbol to retrieve data for

**Response**:

```json
[
  {
    "symbol": "BTCUSDT",
    "priceChange": "265.40000000",
    "priceChangePercent": "0.273",
    "weightedAvgPrice": "97368.22138732",
    "lastPrice": "97520.00000000",
    "lastQty": "0.00414000",
    "openPrice": "97254.60000000",
    "highPrice": "97900.00000000",
    "lowPrice": "96666.90000000",
    "volume": "91234.12345600",
    "quoteVolume": "8901234.12345600"
  }
]
```

### Get Candle Data

Retrieves candlestick data for a specific symbol and timeframe.

- **URL**: `/api/binance/candles/:symbol/:timeframe`
- **Method**: `GET`
- **Path Parameters**:
  - `symbol`: Symbol to retrieve candles for (e.g., BTCUSDT)
  - `timeframe`: Timeframe for candles (e.g., 1m, 5m, 15m, 1h, 4h, 1d)
- **Query Parameters**:
  - `limit` (optional): Number of candles to retrieve (default: 100, max: 1000)

**Response**:

```json
[
  {
    "openTime": 1625097600000,
    "open": "34500.00000000",
    "high": "34800.00000000",
    "low": "34300.00000000",
    "close": "34650.00000000",
    "volume": "123.45678900",
    "closeTime": 1625101199999,
    "quoteAssetVolume": "4265432.12345678",
    "numberOfTrades": 1234,
    "takerBuyBaseAssetVolume": "56.78901234",
    "takerBuyQuoteAssetVolume": "1965432.12345678"
  }
]
```

### Alternative Candle Data Endpoint

- **URL**: `/api/binance/candles`
- **Method**: `GET`
- **Query Parameters**:
  - `symbol`: Symbol to retrieve candles for (e.g., BTCUSDT)
  - `timeframe`: Timeframe for candles (e.g., 1m, 5m, 15m, 1h, 4h, 1d)
  - `limit` (optional): Number of candles to retrieve (default: 100, max: 1000)

**Response**: Same as the path parameter version.

### Get Account Information

Retrieves account information from Binance.

- **URL**: `/api/binance/account`
- **Method**: `GET`

**Response**:

```json
{
  "feeTier": 0,
  "canTrade": true,
  "canDeposit": true,
  "canWithdraw": true,
  "updateTime": 1625097600000,
  "totalInitialMargin": "0.00000000",
  "totalMaintMargin": "0.00000000",
  "totalWalletBalance": "1234.56789000",
  "totalUnrealizedProfit": "123.45678900",
  "totalMarginBalance": "1358.02467900",
  "totalPositionInitialMargin": "0.00000000",
  "totalOpenOrderInitialMargin": "0.00000000",
  "totalCrossWalletBalance": "1358.02467900",
  "totalCrossUnPnl": "0.00000000",
  "availableBalance": "1358.02467900",
  "maxWithdrawAmount": "1358.02467900",
  "assets": [...],
  "positions": [...]
}
```

### Get Positions

Retrieves current positions from Binance.

- **URL**: `/api/binance/positions`
- **Method**: `GET`

**Response**:

```json
[
  {
    "symbol": "BTCUSDT",
    "positionAmt": "0.001",
    "entryPrice": "97000.00000000",
    "markPrice": "97500.00000000",
    "unRealizedProfit": "0.50000000",
    "liquidationPrice": "95000.00000000",
    "leverage": "10",
    "marginType": "cross",
    "isolatedMargin": "0.00000000",
    "positionSide": "BOTH"
  }
]
```

### Place Order

Places a new order on Binance.

- **URL**: `/api/binance/order`
- **Method**: `POST`
- **Body Parameters**:
  - `symbol`: Symbol to place order for
  - `side`: Order side (BUY, SELL)
  - `type`: Order type (LIMIT, MARKET, STOP, TAKE_PROFIT, etc.)
  - `quantity`: Order quantity
  - `price` (optional): Order price (required for LIMIT orders)
  - `stopPrice` (optional): Stop price (required for STOP, TAKE_PROFIT orders)
  - `timeInForce` (optional): Time in force (GTC, IOC, FOK)

**Response**:

```json
{
  "orderId": 12345678,
  "symbol": "BTCUSDT",
  "status": "NEW",
  "clientOrderId": "my_order_id",
  "price": "97000.00000000",
  "avgPrice": "0.00000000",
  "origQty": "0.001",
  "executedQty": "0.000",
  "cumQuote": "0.00000000",
  "timeInForce": "GTC",
  "type": "LIMIT",
  "side": "BUY",
  "time": 1625097600000,
  "updateTime": 1625097600000
}
```

### Cancel Order

Cancels an existing order on Binance.

- **URL**: `/api/binance/order`
- **Method**: `DELETE`
- **Query Parameters**:
  - `symbol`: Symbol of the order
  - `orderId`: ID of the order to cancel

**Response**:

```json
{
  "orderId": 12345678,
  "symbol": "BTCUSDT",
  "status": "CANCELED",
  "clientOrderId": "my_order_id"
}
```

### Change Leverage

Changes the leverage for a symbol.

- **URL**: `/api/binance/leverage`
- **Method**: `POST`
- **Body Parameters**:
  - `symbol`: Symbol to change leverage for
  - `leverage`: New leverage value (1-125)

**Response**:

```json
{
  "leverage": 10,
  "maxNotionalValue": "1000000",
  "symbol": "BTCUSDT"
}
```

### Close Position

Closes an existing position.

- **URL**: `/api/binance/close-position`
- **Method**: `POST`
- **Body Parameters**:
  - `symbol`: Symbol of the position
  - `positionSide`: Position side (BOTH, LONG, SHORT)

**Response**:

```json
{
  "orderId": 12345678,
  "symbol": "BTCUSDT",
  "status": "FILLED",
  "clientOrderId": "close_position_12345",
  "price": "0.00000000",
  "avgPrice": "97500.00000000",
  "origQty": "0.001",
  "executedQty": "0.001",
  "cumQuote": "97.50000000",
  "timeInForce": "IOC",
  "type": "MARKET",
  "side": "SELL",
  "time": 1625097600000,
  "updateTime": 1625097600000
}
```

### Set Take Profit / Stop Loss

Sets take profit and/or stop loss for an existing position.

- **URL**: `/api/binance/tpsl`
- **Method**: `POST`
- **Body Parameters**:
  - `symbol`: Symbol of the position
  - `positionSide`: Position side (BOTH, LONG, SHORT)
  - `stopPrice` (optional): Stop loss price
  - `profitPrice` (optional): Take profit price

**Response**:

```json
{
  "stopLossOrder": {
    "orderId": 12345678,
    "symbol": "BTCUSDT",
    "status": "NEW",
    "type": "STOP_MARKET"
  },
  "takeProfitOrder": {
    "orderId": 12345679,
    "symbol": "BTCUSDT",
    "status": "NEW",
    "type": "TAKE_PROFIT_MARKET"
  }
}
```

### Get Trading Opportunities

Retrieves current trading opportunities.

- **URL**: `/api/binance/opportunities`
- **Method**: `GET`

**Response**:

```json
[
  {
    "id": "BTCUSDT_momentumBreakout_1625097600000",
    "symbol": "BTCUSDT",
    "strategy": "momentumBreakout",
    "direction": "LONG",
    "entryPrice": 97000,
    "targetPrice": 98500,
    "stopLoss": 96000,
    "riskRewardRatio": 1.5,
    "confidence": 85,
    "score": 8.5,
    "timestamp": 1625097600000
  }
]
```

### Get Performance Metrics

Retrieves performance metrics for the trading account.

- **URL**: `/api/binance/performance`
- **Method**: `GET`

**Response**:

```json
{
  "id": 1,
  "userId": 1,
  "portfolioValue": 10000,
  "dailyPnl": 250,
  "weeklyPnl": 1250,
  "monthlyPnl": 3000,
  "totalTrades": 150,
  "winRate": 65,
  "maxDrawdown": 15,
  "sharpeRatio": 1.8,
  "performanceByStrategy": [
    {
      "strategy": "MOMENTUM_BREAKOUT",
      "winRate": 72,
      "pnl": "845.23",
      "pnlPercent": "8.2",
      "trades": 6
    },
    {
      "strategy": "MEAN_REVERSION",
      "winRate": 65,
      "pnl": "423.12",
      "pnlPercent": "4.1",
      "trades": 8
    }
  ]
}
```

### Get Risk Metrics

Retrieves risk metrics for the trading account.

- **URL**: `/api/binance/risk`
- **Method**: `GET`

**Response**:

```json
{
  "totalRiskExposure": 25.5,
  "maxRiskLimit": 50,
  "marginUtilization": 35.2,
  "portfolioHeatmap": [
    {
      "symbol": "BTCUSDT",
      "exposure": 15.3,
      "risk": 7.5
    },
    {
      "symbol": "ETHUSDT",
      "exposure": 10.2,
      "risk": 5.0
    }
  ],
  "correlationMatrix": {
    "BTCUSDT": {
      "ETHUSDT": 0.85,
      "BNBUSDT": 0.65
    },
    "ETHUSDT": {
      "BTCUSDT": 0.85,
      "BNBUSDT": 0.70
    }
  }
}
```

## System Endpoints

### Get System Logs

Retrieves system logs.

- **URL**: `/api/system/logs`
- **Method**: `GET`
- **Query Parameters**:
  - `level` (optional): Log level filter (INFO, WARN, ERROR)
  - `source` (optional): Log source filter
  - `limit` (optional): Number of logs to retrieve (default: 100)

**Response**:

```json
[
  {
    "id": "log_1625097600000",
    "timestamp": 1625097600000,
    "level": "INFO",
    "message": "System started successfully",
    "source": "System"
  },
  {
    "id": "log_1625097601000",
    "timestamp": 1625097601000,
    "level": "ERROR",
    "message": "Failed to connect to Binance API",
    "source": "BinanceClient",
    "data": {
      "error": "Network error"
    }
  }
]
```

### Clear System Logs

Clears all system logs.

- **URL**: `/api/system/logs/clear`
- **Method**: `POST`

**Response**:

```json
{
  "success": true,
  "message": "Logs cleared successfully"
}
```

## WebSocket API

The WebSocket API allows for real-time updates from the server.

### Connection

- **URL**: `/ws`
- **Protocol**: WebSocket

### Authentication

WebSocket authentication is done by including a client ID in the connection URL:

```
ws://localhost:5000/ws?clientId=unique_client_id
```

### Subscription

After connecting, clients can subscribe to various data channels by sending a subscription message:

```json
{
  "type": "subscribe",
  "channel": "channel_name"
}
```

Available channels:
- `system_logs`: System log updates
- `market_data`: Market data updates
- `position_updates`: Position updates
- `order_updates`: Order updates
- `trading_signals`: New trading signals

### Message Format

All messages follow this format:

```json
{
  "type": "message_type",
  "data": {},
  "timestamp": 1625097600000
}
```

### Message Types

#### marketUpdate

Received when there are market data updates:

```json
{
  "type": "marketUpdate",
  "data": [
    {
      "symbol": "BTCUSDT",
      "price": "97500.00000000",
      "priceChangePercent": "0.52"
    },
    {
      "symbol": "ETHUSDT",
      "price": "1850.00000000",
      "priceChangePercent": "0.27"
    }
  ],
  "timestamp": 1625097600000
}
```

#### positionUpdate

Received when positions are updated:

```json
{
  "type": "positionUpdate",
  "data": [
    {
      "symbol": "BTCUSDT",
      "positionAmt": "0.001",
      "entryPrice": "97000.00000000",
      "unRealizedProfit": "0.50000000"
    }
  ],
  "timestamp": 1625097600000
}
```

#### orderUpdate

Received when orders are updated:

```json
{
  "type": "orderUpdate",
  "data": {
    "orderId": 12345678,
    "symbol": "BTCUSDT",
    "status": "FILLED",
    "type": "LIMIT",
    "side": "BUY"
  },
  "timestamp": 1625097600000
}
```

#### tradingSignal

Received when new trading signals are generated:

```json
{
  "type": "tradingSignal",
  "data": {
    "id": "BTCUSDT_momentumBreakout_1625097600000",
    "symbol": "BTCUSDT",
    "strategy": "momentumBreakout",
    "direction": "LONG",
    "score": 8.5
  },
  "timestamp": 1625097600000
}
```

#### system_log

Received when new system logs are generated:

```json
{
  "type": "system_log",
  "data": {
    "id": "log_1625097600000",
    "level": "INFO",
    "message": "New position opened",
    "source": "TradingCore"
  },
  "timestamp": 1625097600000
}
```

### Ping/Pong

The server sends ping messages periodically to check if the client is still connected. Clients should respond with a pong message:

```json
// Server ping
{
  "type": "ping",
  "timestamp": 1625097600000
}

// Client pong
{
  "type": "pong",
  "timestamp": 1625097600000
}
```

### Reconnection

If the connection is lost, clients should implement an exponential backoff reconnection strategy.