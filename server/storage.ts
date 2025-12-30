import { 
  type User, 
  type InsertUser,
  type Message,
  type InsertMessage,
  users,
  messages 
} from "@shared/schema";
import { db } from "../db/index";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Message operations
  getMessages(petType: string, location: string, limit?: number, breed?: string): Promise<(Message & { user: User })[]>;
  createMessage(message: InsertMessage): Promise<Message>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Message operations
  async getMessages(petType: string, location: string, limit: number = 100, breed?: string): Promise<(Message & { user: User })[]> {
    const conditions = [
      eq(messages.petType, petType),
      eq(messages.location, location),
    ];
    
    if (breed) {
      conditions.push(eq(messages.breed, breed));
    }
    
    const result = await db
      .select({
        message: messages,
        user: users,
      })
      .from(messages)
      .innerJoin(users, eq(messages.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(messages.createdAt))
      .limit(limit);

    return result.map((r: { message: Message; user: User }) => ({
      ...r.message,
      user: r.user,
    }));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values(insertMessage).returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();
