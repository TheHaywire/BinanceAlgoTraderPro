import WebSocket from "ws";
import { BINANCE_WS_URL } from "../../client/src/lib/constants";
import { EventEmitter } from "events";

class BinanceWebSocketClient extends EventEmitter {
  private streams: Map<string, WebSocket> = new Map();
  private isTestnet: boolean;
  
  constructor(isTestnet: boolean = true) {
    super();
    this.isTestnet = isTestnet;
  }
  
  private getWSBaseUrl(): string {
    return this.isTestnet 
      ? "wss://stream.binancefuture.com/ws" 
      : BINANCE_WS_URL;
  }
  
  // Subscribe to ticker updates for given symbols
  public subscribeToTickers(symbols: string[] = []) {
    const streamName = symbols.length > 0 
      ? symbols.map(s => `${s.toLowerCase()}@ticker`).join("/")
      : "!ticker@arr";
    
    this.subscribe(streamName, (data) => {
      // Process ticker data and emit events
      if (Array.isArray(data)) {
        // Handle array of all tickers
        data.forEach(ticker => {
          this.emit("marketUpdate", {
            symbol: ticker.s,
            price: ticker.c,
            priceChangePercent: ticker.P,
            volume: ticker.v,
            quoteVolume: ticker.q,
            highPrice: ticker.h,
            lowPrice: ticker.l,
            openTime: ticker.O,
            closeTime: ticker.C
          });
        });
      } else {
        // Handle single ticker
        this.emit("marketUpdate", {
          symbol: data.s,
          price: data.c,
          priceChangePercent: data.P,
          volume: data.v,
          quoteVolume: data.q,
          highPrice: data.h,
          lowPrice: data.l,
          openTime: data.O,
          closeTime: data.C
        });
      }
    });
  }
  
  // Subscribe to kline/candlestick updates
  public subscribeToKlines(symbol: string, interval: string) {
    const streamName = `${symbol.toLowerCase()}@kline_${interval}`;
    
    this.subscribe(streamName, (data) => {
      const k = data.k;
      this.emit("klineUpdate", {
        symbol: data.s,
        interval: k.i,
        openTime: k.t,
        closeTime: k.T,
        open: k.o,
        high: k.h,
        low: k.l,
        close: k.c,
        volume: k.v,
        trades: k.n,
        isClosed: k.x
      });
    });
  }
  
  // Subscribe to user data stream (requires API key)
  public subscribeToUserData(listenKey: string) {
    this.subscribe(listenKey, (data) => {
      if (data.e === "ACCOUNT_UPDATE") {
        // Process account updates
        this.emit("accountUpdate", data.a);
        
        // Process position updates
        if (data.a.P) {
          this.emit("positionUpdate", data.a.P);
        }
      } else if (data.e === "ORDER_TRADE_UPDATE") {
        // Process order updates
        this.emit("orderUpdate", data.o);
      }
    });
  }
  
  // Subscribe to a WebSocket stream
  private subscribe(streamName: string, callback: (data: any) => void) {
    if (this.streams.has(streamName)) {
      return;
    }
    
    const ws = new WebSocket(`${this.getWSBaseUrl()}/${streamName}`);
    
    ws.on("open", () => {
      console.log(`WebSocket connected: ${streamName}`);
    });
    
    ws.on("message", (data: WebSocket.Data) => {
      try {
        const parsedData = JSON.parse(data.toString());
        callback(parsedData);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    });
    
    ws.on("error", (error) => {
      console.error(`WebSocket error for ${streamName}:`, error);
      this.reconnect(streamName, callback);
    });
    
    ws.on("close", () => {
      console.log(`WebSocket closed: ${streamName}`);
      this.reconnect(streamName, callback);
    });
    
    this.streams.set(streamName, ws);
  }
  
  // Reconnect to a WebSocket stream after error or closure
  private reconnect(streamName: string, callback: (data: any) => void) {
    console.log(`Attempting to reconnect: ${streamName}`);
    
    // Remove the old WebSocket
    this.streams.delete(streamName);
    
    // Wait a bit before reconnecting
    setTimeout(() => {
      this.subscribe(streamName, callback);
    }, 5000);
  }
  
  // Unsubscribe from a WebSocket stream
  public unsubscribe(streamName: string) {
    const ws = this.streams.get(streamName);
    
    if (ws) {
      ws.close();
      this.streams.delete(streamName);
      console.log(`Unsubscribed from: ${streamName}`);
    }
  }
  
  // Close all WebSocket connections
  public closeAll() {
    for (const [streamName, ws] of this.streams.entries()) {
      ws.close();
      console.log(`Closed WebSocket: ${streamName}`);
    }
    
    this.streams.clear();
  }
}

export default BinanceWebSocketClient;
