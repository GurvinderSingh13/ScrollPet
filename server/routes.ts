import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from "ws";
import { insertMessageSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime',
      'audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/ogg'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  petType?: string;
  location?: string;
}

// Store WebSocket server reference for broadcasting
let wssRef: WebSocketServer | null = null;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Serve uploaded files
  app.use('/uploads', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  }, express.static(uploadDir));

  // WebSocket server for real-time messaging
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  wssRef = wss;

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

        // Handle send message (text only via WebSocket)
        if (payload.type === "message") {
          const validatedMessage = insertMessageSchema.parse({
            userId: ws.userId,
            petType: ws.petType,
            location: ws.location,
            content: payload.content || '',
            messageType: payload.messageType || 'text',
            mediaUrl: payload.mediaUrl || null,
            mediaDuration: payload.mediaDuration || null,
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

  // Upload media file
  app.post("/api/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({ url: fileUrl, filename: req.file.filename });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Send message with media (via HTTP, then broadcast via WebSocket)
  app.post("/api/messages", upload.single('file'), async (req, res) => {
    try {
      const { userId, petType, location, content, messageType, mediaDuration } = req.body;
      
      if (!userId || !petType || !location) {
        return res.status(400).json({ error: "userId, petType, and location are required" });
      }

      let mediaUrl = null;
      if (req.file) {
        mediaUrl = `/uploads/${req.file.filename}`;
      }

      const validatedMessage = insertMessageSchema.parse({
        userId,
        petType,
        location,
        content: content || '',
        messageType: messageType || 'text',
        mediaUrl,
        mediaDuration: mediaDuration ? parseInt(mediaDuration) : null,
      });

      const message = await storage.createMessage(validatedMessage);
      const user = await storage.getUser(message.userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Broadcast to WebSocket clients
      if (wssRef) {
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

        wssRef.clients.forEach((client: WebSocket) => {
          const authClient = client as AuthenticatedWebSocket;
          if (
            authClient.readyState === WebSocket.OPEN &&
            authClient.petType === petType &&
            authClient.location === location
          ) {
            authClient.send(JSON.stringify(messageWithUser));
          }
        });
      }

      res.json({
        ...message,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
        },
      });
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ error: "Failed to create message" });
    }
  });

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
        password: "demo",
      });

      res.json(demoUser);
    } catch (error) {
      console.error("Error creating demo user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Get user info
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
