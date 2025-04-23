import { v4 as uuidv4 } from 'uuid';
import { Position, TradingOpportunity } from '../../client/src/lib/types';
import { getStrategyFunction } from './strategies';
import { RiskManager } from './risk';

export class TradingEngine {
  private riskManager: RiskManager;

  constructor() {
    this.riskManager = new RiskManager();
  }

  /**
   * Simulates order execution for testing
   */
  simulateOrderExecution(orderParams: any): any {
    const {
      symbol,
      side,
      type,
      quantity,
      price,
      positionSide = 'BOTH',
      leverage = 10
    } = orderParams;

    // Generate a unique order ID
    const orderId = Math.floor(Math.random() * 1000000).toString();
    
    // Current timestamp
    const transactTime = Date.now();
    
    // Price calculation - for market orders, use provided price or generate one
    const executionPrice = type === 'MARKET' 
      ? (price || (Math.random() * 100 + 100).toFixed(2))
      : price;
    
    // Format simulated response similar to Binance API
    return {
      clientOrderId: `simulated_${uuidv4().substring(0, 8)}`,
      cumQty: quantity,
      executedQty: quantity,
      orderId,
      orderListId: -1,
      origQty: quantity,
      price: executionPrice,
      reduceOnly: orderParams.reduceOnly || false,
      side,
      positionSide,
      status: 'FILLED',
      stopPrice: orderParams.stopPrice || "0",
      symbol,
      timeInForce: orderParams.timeInForce || 'GTC',
      type,
      updateTime: transactTime,
      workingType: 'CONTRACT_PRICE',
      avgPrice: executionPrice,
      leverageBracket: leverage,
      origType: type,
      priceProtect: false,
      selfTradePreventionMode: 'NONE',
      time: transactTime
    };
  }

  /**
   * Simulates order cancellation
   */
  simulateOrderCancellation(symbol: string, orderId: string): any {
    return {
      clientOrderId: `cancelled_${uuidv4().substring(0, 8)}`,
      cumQty: "0",
      executedQty: "0",
      orderId,
      orderListId: -1,
      origClientOrderId: `original_${uuidv4().substring(0, 8)}`,
      origQty: "0",
      price: "0",
      reduceOnly: false,
      side: "BUY", // placeholder
      positionSide: "BOTH", // placeholder
      status: "CANCELED",
      stopPrice: "0",
      symbol,
      timeInForce: "GTC",
      type: "LIMIT", // placeholder
      updateTime: Date.now(),
      workingType: "CONTRACT_PRICE"
    };
  }

  /**
   * Simulates position closure
   */
  simulatePositionClosure(symbol: string, positionSide: string): any {
    return {
      clientOrderId: `close_${uuidv4().substring(0, 8)}`,
      cumQty: "1",
      executedQty: "1",
      orderId: Math.floor(Math.random() * 1000000).toString(),
      orderListId: -1,
      origQty: "1",
      price: "0",
      reduceOnly: true,
      side: positionSide === "LONG" ? "SELL" : "BUY",
      positionSide,
      status: "FILLED",
      stopPrice: "0",
      symbol,
      timeInForce: "GTC",
      type: "MARKET",
      updateTime: Date.now(),
      workingType: "CONTRACT_PRICE"
    };
  }

  /**
   * Simulates setting take profit / stop loss
   */
  simulateTPSL(
    symbol: string, 
    positionSide: string, 
    stopPrice?: string, 
    profitPrice?: string
  ): any {
    const result: any = {
      symbol,
      positionSide,
      orders: []
    };
    
    if (stopPrice) {
      result.orders.push({
        clientOrderId: `sl_${uuidv4().substring(0, 8)}`,
        orderId: Math.floor(Math.random() * 1000000).toString(),
        symbol,
        type: "STOP_MARKET",
        side: positionSide === "LONG" ? "SELL" : "BUY",
        positionSide,
        stopPrice,
        reduceOnly: true,
        status: "NEW",
        workingType: "CONTRACT_PRICE",
        time: Date.now()
      });
    }
    
    if (profitPrice) {
      result.orders.push({
        clientOrderId: `tp_${uuidv4().substring(0, 8)}`,
        orderId: Math.floor(Math.random() * 1000000).toString(),
        symbol,
        type: "TAKE_PROFIT_MARKET",
        side: positionSide === "LONG" ? "SELL" : "BUY",
        positionSide,
        stopPrice: profitPrice,
        reduceOnly: true,
        status: "NEW",
        workingType: "CONTRACT_PRICE",
        time: Date.now()
      });
    }
    
    return result;
  }

  /**
   * Update positions array with new position data
   */
  updatePositions(positions: any[], orderResult: any): any[] {
    const {
      symbol,
      side,
      executedQty,
      price,
      positionSide = 'BOTH',
      reduceOnly
    } = orderResult;
    
    // If reduce only, remove or update the position
    if (reduceOnly) {
      return positions.filter(pos => !(pos.symbol === symbol && pos.positionSide === positionSide));
    }
    
    // Check if position already exists
    const existingPosition = positions.find(
      pos => pos.symbol === symbol && pos.positionSide === positionSide
    );
    
    if (existingPosition) {
      // Update existing position
      return positions.map(pos => {
        if (pos.symbol === symbol && pos.positionSide === positionSide) {
          const newPositionAmt = side === 'BUY' 
            ? (parseFloat(pos.positionAmt) + parseFloat(executedQty)).toString()
            : (parseFloat(pos.positionAmt) - parseFloat(executedQty)).toString();
          
          return {
            ...pos,
            positionAmt: newPositionAmt,
            entryPrice: price,
            markPrice: price,
            updateTime: Date.now()
          };
        }
        return pos;
      });
    } else {
      // Create new position
      const newPosition = this.createSimulatedPosition(
        symbol,
        side === 'BUY' ? executedQty : `-${executedQty}`,
        price,
        positionSide
      );
      
      return [...positions, newPosition];
    }
  }

  /**
   * Create a simulated position object
   */
  createSimulatedPosition(
    symbol: string,
    positionAmt: string,
    entryPrice: string,
    positionSide: string = 'BOTH',
    leverage: string = '10'
  ): Position {
    // Generate liquidation price (20-30% away from entry price)
    const entryPriceNum = parseFloat(entryPrice);
    const leverageNum = parseFloat(leverage);
    const liquidationPercentage = 1 - (0.8 / leverageNum); // simplified calculation
    
    const liquidationPrice = parseFloat(positionAmt) > 0
      ? (entryPriceNum * liquidationPercentage).toFixed(2)
      : (entryPriceNum * (2 - liquidationPercentage)).toFixed(2);
    
    return {
      id: uuidv4(),
      symbol,
      positionAmt,
      entryPrice,
      markPrice: entryPrice, // Initially the same as entry price
      unRealizedProfit: "0",
      liquidationPrice,
      leverage,
      marginType: "isolated",
      isolatedMargin: (parseFloat(positionAmt) * parseFloat(entryPrice) / leverageNum).toFixed(8),
      isAutoAddMargin: "false",
      positionSide: positionSide as any,
      notional: (parseFloat(positionAmt) * parseFloat(entryPrice)).toFixed(8),
      isolatedWallet: (parseFloat(positionAmt) * parseFloat(entryPrice) / leverageNum).toFixed(8),
      updateTime: Date.now()
    };
  }

  /**
   * Executes a trading opportunity
   */
  executeOpportunity(opportunity: TradingOpportunity): any {
    const {
      symbol,
      direction,
      entryPriceMin,
      entryPriceMax,
      targetPrice,
      stopLoss
    } = opportunity;
    
    // Choose an entry price within the range
    const entryPriceRange = parseFloat(entryPriceMax) - parseFloat(entryPriceMin);
    const entryPrice = (parseFloat(entryPriceMin) + (entryPriceRange * Math.random())).toFixed(2);
    
    // Calculate position size based on risk management
    const positionSize = this.riskManager.calculatePositionSize(
      symbol,
      parseFloat(entryPrice),
      parseFloat(stopLoss),
      10 // Default leverage
    );
    
    // Calculate quantity
    const quantity = (positionSize / parseFloat(entryPrice)).toFixed(4);
    
    // Simulate the order execution
    const orderResult = this.simulateOrderExecution({
      symbol,
      side: direction === 'LONG' ? 'BUY' : 'SELL',
      type: 'LIMIT',
      quantity,
      price: entryPrice,
      positionSide: 'BOTH',
      leverage: 10
    });
    
    // Create position object
    const position = this.createSimulatedPosition(
      symbol,
      direction === 'LONG' ? quantity : `-${quantity}`,
      entryPrice,
      'BOTH',
      '10'
    );
    
    // Set take profit and stop loss
    const tpslResult = this.simulateTPSL(
      symbol,
      'BOTH',
      stopLoss,
      targetPrice
    );
    
    return {
      executed: true,
      order: orderResult,
      position,
      tpsl: tpslResult
    };
  }

  /**
   * Run a strategy on market data
   */
  runStrategy(strategyType: string, marketData: any, params: any = {}): any {
    try {
      const strategyFunction = getStrategyFunction(strategyType as any);
      return strategyFunction(marketData, params);
    } catch (error) {
      console.error(`Error running strategy ${strategyType}:`, error);
      return { signal: 'NEUTRAL', confidence: 0 };
    }
  }
}
