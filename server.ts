import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

// Load environment variables from .env
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser middleware
  app.use(express.json());

  // Paystack integration endpoints - mount before Vite middleware so `/api/*` is handled
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

  app.post('/api/paystack/initialize', async (req, res) => {
    try {
      if (!PAYSTACK_SECRET_KEY) return res.status(500).json({ error: 'Paystack secret key not configured on server.' });
      const { email, amount, reference, currency = 'GHS' } = req.body;
      if (!email || !amount || !reference) return res.status(400).json({ error: 'email, amount and reference are required' });

      const resp = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, amount, reference, currency })
      });

      const data = await resp.json();
      if (!resp.ok) return res.status(resp.status).json(data);
      return res.json(data);
    } catch (err) {
      console.error('Paystack initialize error:', err);
      return res.status(500).json({ error: 'Paystack initialize failed' });
    }
  });

  app.get('/api/paystack/verify/:reference', async (req, res) => {
    try {
      if (!PAYSTACK_SECRET_KEY) return res.status(500).json({ error: 'Paystack secret key not configured on server.' });
      const { reference } = req.params;
      if (!reference) return res.status(400).json({ error: 'reference is required' });

      const resp = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
      });
      const data = await resp.json();
      if (!resp.ok) return res.status(resp.status).json(data);
      return res.json(data);
    } catch (err) {
      console.error('Paystack verify error:', err);
      return res.status(500).json({ error: 'Paystack verify failed' });
    }
  });

  // Vite middleware for development or serve built files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT} under NODE_ENV=${process.env.NODE_ENV || "development"}`);
  });
}

startServer();
