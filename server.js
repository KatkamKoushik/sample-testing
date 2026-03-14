import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import handler from './api/chat.js';

dotenv.config();

async function createServer() {
  const app = express();
  
  // Enable JSON parsing for API requests
  app.use(express.json());
  
  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa', // don't include Vite's default HTML handling middleware
  });

  // Proxy /api requests to our Serverless function
  app.post('/api/chat', (req, res) => {
    handler(req, res);
  });

  // Use Vite's connect instance as middleware
  app.use(vite.middlewares);

  const port = process.env.PORT || 5173;
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`API endpoint available at http://localhost:${port}/api/chat`);
  });
}

createServer();
