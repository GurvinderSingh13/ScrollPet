import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from "ws";
import { insertMessageSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://xmapispmhbvqowgcbguf.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtYXBpc3BtaGJ2cW93Z2NiZ3VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNjA1NzYsImV4cCI6MjA4ODgzNjU3Nn0.TbN1bg0gITJXieXQq3Z_nWY8nu1S2uX1klj4a7u57ac"
);

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
  breed?: string;
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
          ws.breed = payload.breed || null;
          ws.location = payload.location;
          console.log(`User ${payload.userId} joined ${payload.petType}${payload.breed ? ` (${payload.breed})` : ''} - ${payload.location}`);
          return;
        }

        // Handle send message (text only via WebSocket)
        if (payload.type === "message") {
          const validatedMessage = insertMessageSchema.parse({
            userId: ws.userId,
            petType: ws.petType,
            breed: ws.breed || null,
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
            // Match by petType, location, and breed (null breed matches "All Breeds")
            const breedMatches = !ws.breed || !authClient.breed || ws.breed === authClient.breed;
            if (
              authClient.readyState === WebSocket.OPEN &&
              authClient.petType === ws.petType &&
              authClient.location === ws.location &&
              breedMatches
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
      const { userId, petType, breed, location, content, messageType, mediaDuration } = req.body;
      
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
        breed: breed || null,
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
          // Match by petType, location, and breed (null breed matches "All Breeds")
          const breedMatches = !breed || !authClient.breed || breed === authClient.breed;
          if (
            authClient.readyState === WebSocket.OPEN &&
            authClient.petType === petType &&
            authClient.location === location &&
            breedMatches
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
      const { petType, location, breed, limit } = req.query;
      
      if (!petType || !location) {
        return res.status(400).json({ error: "petType and location are required" });
      }

      const messages = await storage.getMessages(
        petType as string,
        location as string,
        limit ? parseInt(limit as string) : 100,
        breed as string | undefined
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
      const timestamp = Date.now();
      const demoUser = await storage.createUser({
        username: `user_${timestamp}`,
        email: `demo_${timestamp}@scrollpet.com`,
        displayName: req.body.displayName || "Demo User",
        password: "demo",
      });

      res.json(demoUser);
    } catch (error) {
      console.error("Error creating demo user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

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

  // SEO: Dynamic Meta Tags for Post Details Page
  app.get("/post/:postId", async (req, res, next) => {
    console.log("Current NODE_ENV:", process.env.NODE_ENV);
    // Skip SEO injection in development to preserve Vite HMR preamble
    if (process.env.NODE_ENV !== "production") {
      return next();
    }

    try {
      const { postId } = req.params;
      console.log("DEBUG: Post details route hit for ID:", postId);

      const { data: postsData, error } = await supabase.from('posts').select('*').eq('id', postId);
      console.log("DEBUG: Raw database result:", postsData);
      if (error) console.log("DEBUG: Supabase query error:", error);
      
      const post = postsData && postsData.length > 0 ? postsData[0] : null;
      console.log("DEBUG: Post found:", post);

      if (!post) {
        console.log("DEBUG: Post not found in database for ID:", postId);
        return next(); // Fallback to normal serving if not found
      }

      // Determine HTML file path based on environment
      let htmlPath = path.resolve(process.cwd(), "index.html"); // dev
      if (process.env.NODE_ENV === "production") {
        htmlPath = path.resolve(process.cwd(), "dist/index.html");
      }

      if (!fs.existsSync(htmlPath)) {
         return next();
      }

      let html = fs.readFileSync(htmlPath, "utf-8");

      // Truncate content for description
      const description = post.content ? (post.content.substring(0, 150) + (post.content.length > 150 ? '...' : '')) : "View this post on ScrollPet";
      const title = post.title || "ScrollPet Post";
      const image = post.image_url || "https://scrollpet.com/opengraph.png";

      // Inject Meta Tags
      html = html.replace(
        /<\/head>/,
        `  <title>${title} | ScrollPet</title>\n  <meta property="og:title" content="${title}" />\n  <meta property="og:description" content="${description}" />\n  <meta property="og:image" content="${image}" />\n  <meta name="twitter:card" content="summary_large_image" />\n  <meta name="twitter:title" content="${title}" />\n  <meta name="twitter:description" content="${description}" />\n  <meta name="twitter:image" content="${image}" />\n</head>`
      );

      res.send(html);
    } catch (error) {
      console.error("Error serving post with meta tags:", error);
      next(); // fallback to normal vite/static handler
    }
  });

  // SEO: Dynamic Sitemap
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const { data: posts } = await supabase.from('posts').select('id, created_at');

      const baseUrl = "https://scrollpet.com";
      const staticRoutes = [
        "/", "/landing", "/explore", "/community", "/faq", 
        "/about", "/contact", "/privacy", "/terms", "/cookies", 
        "/community-guidelines", "/login", "/signup"
      ];

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

      staticRoutes.forEach(route => {
        xml += `  <url>\n    <loc>${baseUrl}${route}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${route === '/' ? '1.0' : '0.8'}</priority>\n  </url>\n`;
      });

      if (posts) {
        posts.forEach((post: any) => {
          xml += `  <url>\n    <loc>${baseUrl}/post/${post.id}</loc>\n    <lastmod>${new Date(post.created_at).toISOString()}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
        });
      }

      xml += `</urlset>`;

      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } catch (error) {
      console.error("Error generating sitemap:", error);
      res.status(500).send("Error generating sitemap");
    }
  });

  return httpServer;
}
