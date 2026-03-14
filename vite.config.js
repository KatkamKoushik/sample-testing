import { defineConfig } from 'vite'
import path from 'path'

// Vite plugin to run the Vercel serverless function during local development
const vercelApiPlugin = () => ({
  name: 'vercel-api-plugin',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      // Intercept purely /api/ requests
      if (req.url?.startsWith('/api/chat')) {
        try {
          // Dynamically import the api handler so it catches live changes
          const handlerPath = path.resolve(__dirname, './api/chat.js')
          
          // Clear it from the cache so we don't have to restart the server
          delete require.cache[require.resolve(handlerPath)]
          
          const handler = await import(`${handlerPath}?t=${Date.now()}`);

          // Mock a minimal Vercel-like environment for the request body
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
              body += chunk.toString();
            });
            req.on('end', async () => {
              req.body = body ? JSON.parse(body) : {};
              await handler.default(req, res);
            });
            return;
          }

          await handler.default(req, res);
          return;
          
        } catch (error) {
          console.error("Local API Error:", error);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: error.message }));
          return;
        }
      }
      next();
    });
  }
});

export default defineConfig({
  plugins: [vercelApiPlugin()],
})
