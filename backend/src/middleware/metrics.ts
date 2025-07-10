import { Request, Response, NextFunction } from 'express';
import promClient from 'prom-client';

// Erstelle Registry für alle Metriken
const register = new promClient.Registry();

// Sammle Standard-Metriken (CPU, Memory, etc.)
promClient.collectDefaultMetrics({ register });

// HTTP Request Counter
const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// HTTP Request Duration
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register]
});

// Business Logic Metriken
const userRegistrations = new promClient.Counter({
  name: 'user_registrations_total',
  help: 'Total number of user registrations',
  registers: [register]
});

const universeCreations = new promClient.Counter({
  name: 'universe_creations_total',
  help: 'Total number of universe creations',
  registers: [register]
});

// Middleware für HTTP Metriken (einfache Version)
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Verwende 'finish' Event statt res.end zu überschreiben
  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const route = req.route?.path || req.path || 'unknown';
    
    // Sammle Metriken
    httpRequestsTotal.inc({
      method: req.method,
      route: route,
      status_code: res.statusCode.toString()
    });
    
    httpRequestDuration.observe({
      method: req.method,
      route: route,
      status_code: res.statusCode.toString()
    }, duration);
  });
  
  next();
};

// Metrics Endpoint
export const getMetrics = async (req: Request, res: Response) => {
  try {
    const metrics = await register.metrics();
    res.set('Content-Type', register.contentType);
    res.send(metrics);
  } catch (error) {
    res.status(500).send('Error generating metrics');
  }
};

// Helper für Business Logic Metriken
export const trackUserRegistration = () => {
  userRegistrations.inc();
};

export const trackUniverseCreation = () => {
  universeCreations.inc();
};