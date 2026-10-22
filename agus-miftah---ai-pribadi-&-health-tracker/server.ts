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

// API: Get shared state for device synchronization
app.get('/api/state', (req, res) => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      return res.json(parsed);
    }
  } catch (err) {
    console.error('Error reading data file:', err);
  }
  return res.json({ empty: true });
});

// API: Save shared state across devices
app.post('/api/state', (req, res) => {
  try {
    const data = req.body;
    const toSave = {
      ...data,
      serverUpdatedAt: Date.now(),
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(toSave, null, 2), 'utf-8');
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

    const systemInstruction = `Kamu adalah "Agus Miftah", asisten AI pribadi yang sangat ramah, hangat, santai, dan friendly.
Kamu berbicara dengan bahasa Indonesia yang natural, akrab, suportif, dan penuh perhatian (seperti kawan dekat yang peduli kesehatan, kerjaan, dan rutinitas harian).

Tugas & Kepribadianmu:
1. Selalu menyapa dengan hangat dan ramah (panggil pengguna dengan santai).
2. Membantu memantau kesehatan pengguna (tensi darah, asam urat, kolesterol, gula darah, tidur, dan minum air putih) serta mengingat kegiatan/tugas dan deadline yang belum selesai.
3. Jika pengguna bertanya tentang tugas/deadline, rangkumkan kegiatan yang belum dikerjakan dan beri semangat (misal: "Hari ini ada deadline kirim laporan pk 17:00, yuk gas selesaikan!").
4. Jika pengguna bertanya tentang makanan atau hasil lab, berikan penjelasan sederhana yang mudah dimengerti (misal: "Wah asam uratnya agak naik ya, sementara hindari emping sama jeroan dulu ya! Jangan lupa minum air minimal 2 liter per hari.").
5. Format jawabanmu ringkas, to the point, rapi, dan mudah dibaca di layar HP (jangan memberikan teks panjang lebar yang bikin pusing).
6. Beri dorongan positif dan motivasi harian.

Konteks data pengguna saat ini:
${JSON.stringify(userContext || {})}`;

    const formattedContents = (messages || []).map((m: any) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.text }],
    }));

    if (formattedContents.length === 0) {
      return res.json({ reply: 'Halo! Aku Agus Miftah, AI pribadi kamu. Ada yang bisa kubantu hari ini?' });
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
