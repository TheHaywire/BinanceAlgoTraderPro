import { users, positions, orders, strategies, performanceMetrics } from "@shared/schema";
import { type User, type InsertUser, type Position, type Order, type Strategy, type PerformanceMetrics } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Positions
  getPositions(userId: number): Promise<Position[]>;
  getPosition(id: number): Promise<Position | undefined>;
  createPosition(position: any): Promise<Position>;
  updatePosition(id: number, position: any): Promise<Position | undefined>;
  deletePosition(id: number): Promise<boolean>;
  
  // Orders
  getOrders(userId: number): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: any): Promise<Order>;
  updateOrder(id: number, order: any): Promise<Order | undefined>;
  
  // Strategies
  getStrategies(userId: number): Promise<Strategy[]>;
  getStrategy(id: number): Promise<Strategy | undefined>;
  createStrategy(strategy: any): Promise<Strategy>;
  updateStrategy(id: number, strategy: any): Promise<Strategy | undefined>;
  
  // Performance Metrics
  getPerformanceMetrics(userId: number): Promise<PerformanceMetrics | undefined>;
  createPerformanceMetrics(metrics: any): Promise<PerformanceMetrics>;
  updatePerformanceMetrics(id: number, metrics: any): Promise<PerformanceMetrics | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  // Positions
  async getPositions(userId: number): Promise<Position[]> {
    return await db.select().from(positions).where(eq(positions.userId, userId));
  }
  
  async getPosition(id: number): Promise<Position | undefined> {
    const [position] = await db.select().from(positions).where(eq(positions.id, id));
    return position || undefined;
  }
  
  async createPosition(position: any): Promise<Position> {
    const [newPosition] = await db
      .insert(positions)
      .values(position)
      .returning();
    return newPosition;
  }
  
  async updatePosition(id: number, position: any): Promise<Position | undefined> {
    const [updatedPosition] = await db
      .update(positions)
      .set(position)
      .where(eq(positions.id, id))
      .returning();
    return updatedPosition || undefined;
  }
  
  async deletePosition(id: number): Promise<boolean> {
    const result = await db
      .delete(positions)
      .where(eq(positions.id, id))
      .returning({ id: positions.id });
    return result.length > 0;
  }
  
  // Orders
  async getOrders(userId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.userId, userId));
  }
  
  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }
  
  async createOrder(order: any): Promise<Order> {
    const [newOrder] = await db
      .insert(orders)
      .values(order)
      .returning();
    return newOrder;
  }
  
  async updateOrder(id: number, order: any): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set(order)
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder || undefined;
  }
  
  // Strategies
  async getStrategies(userId: number): Promise<Strategy[]> {
    return await db.select().from(strategies).where(eq(strategies.userId, userId));
  }
  
  async getStrategy(id: number): Promise<Strategy | undefined> {
    const [strategy] = await db.select().from(strategies).where(eq(strategies.id, id));
    return strategy || undefined;
  }
  
  async createStrategy(strategy: any): Promise<Strategy> {
    const [newStrategy] = await db
      .insert(strategies)
      .values(strategy)
      .returning();
    return newStrategy;
  }
  
  async updateStrategy(id: number, strategy: any): Promise<Strategy | undefined> {
    const [updatedStrategy] = await db
      .update(strategies)
      .set(strategy)
      .where(eq(strategies.id, id))
      .returning();
    return updatedStrategy || undefined;
  }
  
  // Performance Metrics
  async getPerformanceMetrics(userId: number): Promise<PerformanceMetrics | undefined> {
    const [metrics] = await db
      .select()
      .from(performanceMetrics)
      .where(eq(performanceMetrics.userId, userId))
      .orderBy(performanceMetrics.date);
    return metrics || undefined;
  }
  
  async createPerformanceMetrics(metrics: any): Promise<PerformanceMetrics> {
    const [newMetrics] = await db
      .insert(performanceMetrics)
      .values(metrics)
      .returning();
    return newMetrics;
  }
  
  async updatePerformanceMetrics(id: number, metrics: any): Promise<PerformanceMetrics | undefined> {
    const [updatedMetrics] = await db
      .update(performanceMetrics)
      .set(metrics)
      .where(eq(performanceMetrics.id, id))
      .returning();
    return updatedMetrics || undefined;
  }
}

export const storage = new DatabaseStorage();
