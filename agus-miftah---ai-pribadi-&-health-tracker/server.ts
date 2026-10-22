import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DATA_FILE = path.join(__dirname, 'agus_miftah_store.json');

app.use(express.json({ limit: '10mb' }));

// Server-side Gemini client using @google/genai
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Real-time synchronization via Server-Sent Events (SSE)
const sseClients = new Set<express.Response>();

function broadcastStateUpdate(data: any) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

// API: Stream real-time state updates to all connected devices (HP, Laptop)
app.get('/api/state/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  // Send current state immediately on initial connection if available
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      res.write(`data: ${JSON.stringify(parsed)}\n\n`);
    }
  } catch (err) {
    console.error('Error sending initial SSE state:', err);
  }

  sseClients.add(res);

  // Keep-alive heartbeat every 15 seconds
  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(heartbeat);
      sseClients.delete(res);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

// API: Get shared state for device synchronization
app.get('/api/state', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      return res.json({ empty: false, ...parsed });
    }
  } catch (err) {
    console.error('Error reading data file:', err);
  }
  return res.json({ empty: true });
});

// API: Save shared state across devices
app.post('/api/state', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  try {
    const data = req.body;
    const now = Date.now();
    const serverUpdatedAt = Math.max(now, (data.serverUpdatedAt || 0) + 1);
    const toSave = {
      ...data,
      serverUpdatedAt,
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(toSave, null, 2), 'utf-8');
    
    // Broadcast instantly to all connected phones, tablets & laptops
    broadcastStateUpdate(toSave);

    return res.json({ success: true, serverUpdatedAt: toSave.serverUpdatedAt });
  } catch (err) {
    console.error('Error saving data file:', err);
    return res.status(500).json({ error: 'Gagal menyimpan ke server' });
  }
});

// API: AI Agus Miftah Friendly Personal AI
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages, userContext } = req.body;

    const systemInstruction = `Kamu adalah "JARVIS", asisten AI pribadi yang cerdas, sigap, ramah, dan sangat suportif (asisten pribadi digital khusus untuk Agus).
Kamu berbicara dengan bahasa Indonesia yang natural, akrab, solutif, dan penuh perhatian layaknya asisten pribadi terpercaya (gaya cerdas, to-the-point, namun tetap ramah).

Tugas & Kemampuanmu:
1. Menyapa pengguna dengan hangat (panggil "Agus" atau "Pak Agus" / "Boss" santai).
2. Membantu memantau kesehatan (tensi darah, asam urat, kolesterol, gula darah, target minum air, tidur).
3. Mengingatkan kegiatan, tugas kerjaan, dan deadline yang belum selesai dengan sigap.
4. Jika ditanya tentang makanan atau hasil skrining lab, berikan analisa ringkas dan jelas yang mudah dipahami di layar HP.
5. Format jawaban selalu ringkas, terstruktur, rapi, dan nyaman dibaca (hindari paragraf panjang yang membosankan).
6. Berikan motivasi produktif dan dorongan positif.

Konteks data pengguna saat ini:
${JSON.stringify(userContext || {})}`;

    const formattedContents = (messages || []).map((m: any) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.text }],
    }));

    if (formattedContents.length === 0) {
      return res.json({ reply: 'JARVIS online. Halo Agus, ada yang bisa saya bantu sekarang?' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.8,
      },
    });

    const reply = response.text || 'Halo! Aku Agus Miftah. Senang bisa ngobrol denganmu hari ini!';
    return res.json({ reply });
  } catch (error: any) {
    console.error('Gemini error:', error);
    return res.status(500).json({
      error: 'Terjadi kendala saat memproses jawaban AI Agus Miftah.',
      details: error?.message || String(error),
    });
  }
});

async function start() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Agus Miftah App running on http://0.0.0.0:${PORT}`);
  });
}

start();
