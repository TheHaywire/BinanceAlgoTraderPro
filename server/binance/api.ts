import axios from "axios";
import { BINANCE_API_URL } from "../../client/src/lib/constants";
import crypto from "crypto";

// Configure Binance API client
const binance = axios.create({
  baseURL: BINANCE_API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    "X-MBX-APIKEY": process.env.BINANCE_TESTNET_API_KEY || ""
  }
});

// Generate signature for authenticated requests
const generateSignature = (queryString: string): string => {
  return crypto
    .createHmac("sha256", process.env.BINANCE_TESTNET_SECRET_KEY || "")
    .update(queryString)
    .digest("hex");
};

// Get timestamp with recvWindow for API calls
const getTimestamp = (recvWindow = 5000): { timestamp: number, recvWindow: number } => {
  return {
    timestamp: Date.now(),
    recvWindow
  };
};

// Get server time
export const getServerTime = async (): Promise<number> => {
  try {
    const response = await binance.get("/fapi/v1/time");
    return response.data.serverTime;
  } catch (error) {
    console.error("Error getting server time:", error);
    return Date.now();
  }
};

// Get market data for all symbols or specific symbol
export const getMarketData = async (symbol?: string): Promise<any> => {
  try {
    const endpoint = symbol 
      ? `/fapi/v1/ticker/24hr?symbol=${symbol}` 
      : "/fapi/v1/ticker/24hr";
    const response = await binance.get(endpoint);
    return response.data;
  } catch (error) {
    console.error("Error getting market data:", error);
    throw error;
  }
};

// Get kline/candlestick data
export const getCandles = async (
  symbol: string, 
  interval: string, 
  limit = 100
): Promise<any> => {
  try {
    const response = await binance.get(
      `/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    );
    
    // Transform data to match our expected format
    return response.data.map((candle: any[]) => ({
      openTime: candle[0],
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
      volume: candle[5],
      closeTime: candle[6],
      quoteVolume: candle[7],
      trades: candle[8],
      takerBuyBaseVolume: candle[9],
      takerBuyQuoteVolume: candle[10]
    }));
  } catch (error) {
    console.error("Error getting candle data:", error);
    throw error;
  }
};

// Get account information (requires signature)
export const getAccountInfo = async (): Promise<any> => {
  try {
    const params = getTimestamp();
    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${value}`)
      .join("&");
    
    const signature = generateSignature(queryString);
    
    const response = await binance.get(
      `/fapi/v2/account?${queryString}&signature=${signature}`
    );
    
    return response.data;
  } catch (error) {
    console.error("Error getting account info:", error);
    throw error;
  }
};

// Get position information (requires signature)
export const getPositions = async (): Promise<any> => {
  try {
    const params = getTimestamp();
    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${value}`)
      .join("&");
    
    const signature = generateSignature(queryString);
    
    const response = await binance.get(
      `/fapi/v2/positionRisk?${queryString}&signature=${signature}`
    );
    
    // Filter out zero-sized positions
    return response.data.filter((position: any) => 
      parseFloat(position.positionAmt) !== 0
    );
  } catch (error) {
    console.error("Error getting positions:", error);
    throw error;
  }
};

// Place a new order (requires signature)
export const placeOrder = async (orderParams: any): Promise<any> => {
  try {
    const params = {
      ...orderParams,
      ...getTimestamp()
    };
    
    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${value}`)
      .join("&");
    
    const signature = generateSignature(queryString);
    
    const response = await binance.post(
      `/fapi/v1/order?${queryString}&signature=${signature}`
    );
    
    return response.data;
  } catch (error) {
    console.error("Error placing order:", error);
    throw error;
  }
};

// Cancel an order (requires signature)
export const cancelOrder = async (
  symbol: string, 
  orderId: string
): Promise<any> => {
  try {
    const params = {
      symbol,
      orderId,
      ...getTimestamp()
    };
    
    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${value}`)
      .join("&");
    
    const signature = generateSignature(queryString);
    
    const response = await binance.delete(
      `/fapi/v1/order?${queryString}&signature=${signature}`
    );
    
    return response.data;
  } catch (error) {
    console.error("Error canceling order:", error);
    throw error;
  }
};

// Change position leverage (requires signature)
export const changeLeverage = async (
  symbol: string, 
  leverage: number
): Promise<any> => {
  try {
    const params = {
      symbol,
      leverage,
      ...getTimestamp()
    };
    
    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${value}`)
      .join("&");
    
    const signature = generateSignature(queryString);
    
    const response = await binance.post(
      `/fapi/v1/leverage?${queryString}&signature=${signature}`
    );
    
    return response.data;
  } catch (error) {
    console.error("Error changing leverage:", error);
    throw error;
  }
};

// Close a position
export const closePosition = async (
  symbol: string, 
  positionSide: 'LONG' | 'SHORT' | 'BOTH'
): Promise<any> => {
  try {
    // First get the position details
    const positions = await getPositions();
    const position = positions.find((p: any) => 
      p.symbol === symbol && p.positionSide === positionSide
    );
    
    if (!position) {
      throw new Error("Position not found");
    }
    
    // The amount needs to be the opposite of the current position
    const quantity = Math.abs(parseFloat(position.positionAmt));
    const side = parseFloat(position.positionAmt) > 0 ? "SELL" : "BUY";
    
    // Place a market order to close the position
    const orderParams = {
      symbol,
      side,
      positionSide,
      type: "MARKET",
      quantity,
      reduceOnly: true
    };
    
    return await placeOrder(orderParams);
  } catch (error) {
    console.error("Error closing position:", error);
    throw error;
  }
};
