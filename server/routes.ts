import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from "ws";
import { insertMessageSchema } from "@shared/schema";
import { z } from "zod";

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  petType?: string;
  location?: string;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // WebSocket server for real-time messaging
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws: AuthenticatedWebSocket, req) => {
    console.log("New WebSocket connection");

    ws.on("message", async (data) => {
      try {
        const payload = JSON.parse(data.toString());

        // Handle join room
        if (payload.type === "join") {
          ws.userId = payload.userId;
          ws.petType = payload.petType;
          ws.location = payload.location;
          console.log(`User ${payload.userId} joined ${payload.petType} - ${payload.location}`);
          return;
        }

        // Handle send message
        if (payload.type === "message") {
          const validatedMessage = insertMessageSchema.parse({
            userId: ws.userId,
            petType: ws.petType,
            location: ws.location,
            content: payload.content,
          });

          const message = await storage.createMessage(validatedMessage);
          const user = await storage.getUser(message.userId);

          if (!user) return;

          // Broadcast to all clients in same room
          const messageWithUser = {
            type: "message",
            data: {
              ...message,
              user: {
                id: user.id,
                username: user.username,
                displayName: user.displayName,
              },
            },
          };

          wss.clients.forEach((client: WebSocket) => {
            const authClient = client as AuthenticatedWebSocket;
            if (
              authClient.readyState === WebSocket.OPEN &&
              authClient.petType === ws.petType &&
              authClient.location === ws.location
            ) {
              authClient.send(JSON.stringify(messageWithUser));
            }
          });
        }
      } catch (error) {
        console.error("WebSocket error:", error);
        ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
      }
    });

    ws.on("close", () => {
      console.log("WebSocket connection closed");
    });
  });

  // API Routes

  // Get messages for a specific room
  app.get("/api/messages", async (req, res) => {
    try {
      const { petType, location, limit } = req.query;
      
      if (!petType || !location) {
        return res.status(400).json({ error: "petType and location are required" });
      }

      const messages = await storage.getMessages(
        petType as string,
        location as string,
        limit ? parseInt(limit as string) : 100
      );

      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Create a test user (for demo purposes)
  app.post("/api/users/create-demo", async (req, res) => {
    try {
      const demoUser = await storage.createUser({
        username: `user_${Date.now()}`,
        displayName: req.body.displayName || "Demo User",
        password: "demo", // In production, hash this properly
      });

      res.json(demoUser);
    } catch (error) {
      console.error("Error creating demo user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Get current user info (simplified for demo - would use session in production)
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  return httpServer;
}
