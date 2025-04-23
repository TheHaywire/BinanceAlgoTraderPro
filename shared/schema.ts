import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  apiKey: text("api_key"),
  apiSecret: text("api_secret"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  apiKey: true,
  apiSecret: true,
});

// Trading positions table
export const positions = pgTable("positions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  symbol: text("symbol").notNull(),
  positionAmt: text("position_amt").notNull(),
  entryPrice: text("entry_price").notNull(),
  markPrice: text("mark_price").notNull(),
  unRealizedProfit: text("unrealized_profit").notNull(),
  liquidationPrice: text("liquidation_price").notNull(),
  leverage: text("leverage").notNull(),
  marginType: text("margin_type").notNull(),
  positionSide: text("position_side").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPositionSchema = createInsertSchema(positions).pick({
  userId: true,
  symbol: true,
  positionAmt: true,
  entryPrice: true,
  markPrice: true,
  unRealizedProfit: true,
  liquidationPrice: true,
  leverage: true,
  marginType: true,
  positionSide: true,
});

// Trading orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  symbol: text("symbol").notNull(),
  orderId: text("order_id").notNull(),
  clientOrderId: text("client_order_id").notNull(),
  side: text("side").notNull(),
  type: text("type").notNull(),
  quantity: text("quantity").notNull(),
  price: text("price"),
  stopPrice: text("stop_price"),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  userId: true,
  symbol: true,
  orderId: true,
  clientOrderId: true,
  side: true,
  type: true,
  quantity: true,
  price: true,
  stopPrice: true,
  status: true,
});

// Trading strategies table
export const strategies = pgTable("strategies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  type: text("type").notNull(),
  params: jsonb("params").notNull(),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertStrategySchema = createInsertSchema(strategies).pick({
  userId: true,
  name: true,
  type: true,
  params: true,
  isActive: true,
});

// Trading performance metrics
export const performanceMetrics = pgTable("performance_metrics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  portfolioValue: text("portfolio_value").notNull(),
  dailyPnL: text("daily_pnl").notNull(),
  weeklyPnL: text("weekly_pnl").notNull(),
  totalTrades: integer("total_trades").notNull(),
  winningTrades: integer("winning_trades").notNull(),
  losingTrades: integer("losing_trades").notNull(),
  winRate: integer("win_rate").notNull(),
  maxDrawdown: text("max_drawdown").notNull(),
  sharpeRatio: text("sharpe_ratio").notNull(),
  date: timestamp("date").notNull(),
});

export const insertPerformanceMetricsSchema = createInsertSchema(performanceMetrics).pick({
  userId: true,
  portfolioValue: true,
  dailyPnL: true,
  weeklyPnL: true,
  totalTrades: true,
  winningTrades: true,
  losingTrades: true,
  winRate: true,
  maxDrawdown: true,
  sharpeRatio: true,
  date: true,
});

// Type definitions
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertPosition = z.infer<typeof insertPositionSchema>;
export type Position = typeof positions.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertStrategy = z.infer<typeof insertStrategySchema>;
export type Strategy = typeof strategies.$inferSelect;

export type InsertPerformanceMetrics = z.infer<typeof insertPerformanceMetricsSchema>;
export type PerformanceMetrics = typeof performanceMetrics.$inferSelect;
