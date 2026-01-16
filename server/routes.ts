import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { calculateMetrics } from "./metrics";
import { insertDailyEntrySchema } from "@shared/schema";

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).send("Unauthorized");
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  app.get("/api/entries", requireAuth, async (req, res, next) => {
    try {
      const entries = await storage.getEntriesByUserId(req.user!.id);
      res.json(entries);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/entries", requireAuth, async (req, res, next) => {
    try {
      const parsed = insertDailyEntrySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const existingEntry = await storage.getEntryByDate(req.user!.id, parsed.data.date);
      if (existingEntry) {
        const updated = await storage.updateEntry(existingEntry.id, req.user!.id, parsed.data);
        return res.json(updated);
      }

      const entry = await storage.createEntry(req.user!.id, parsed.data);
      res.status(201).json(entry);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/entries/:id", requireAuth, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).send("Invalid entry ID");
      }

      const entry = await storage.getEntryById(id, req.user!.id);
      if (!entry) {
        return res.status(404).send("Entry not found");
      }

      res.json(entry);
    } catch (err) {
      next(err);
    }
  });

  app.patch("/api/entries/:id", requireAuth, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).send("Invalid entry ID");
      }

      const parsed = insertDailyEntrySchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const updated = await storage.updateEntry(id, req.user!.id, parsed.data);
      if (!updated) {
        return res.status(404).send("Entry not found");
      }

      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  app.delete("/api/entries/:id", requireAuth, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).send("Invalid entry ID");
      }

      const deleted = await storage.deleteEntry(id, req.user!.id);
      if (!deleted) {
        return res.status(404).send("Entry not found");
      }

      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/metrics", requireAuth, async (req, res, next) => {
    try {
      const entries = await storage.getEntriesByUserId(req.user!.id);
      const metrics = calculateMetrics(entries);
      res.json(metrics);
    } catch (err) {
      next(err);
    }
  });

  return httpServer;
}
