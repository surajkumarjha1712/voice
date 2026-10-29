import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

// Shared server-side Gemini client with User-Agent header for telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API endpoint: Text-to-Speech generation
app.post('/api/tts/generate', async (req, res) => {
  try {
    const {
      text,
      voice = 'Kore',
      style = '',
      mode = 'single',
      speakers,
      dialogueLines,
    } = req.body;

    if (!text && (!dialogueLines || dialogueLines.length === 0)) {
      return res.status(400).json({ error: 'Text or dialogue lines are required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Gemini API key is not configured. Please check your Settings > Secrets panel.',
      });
    }

    // Supported voices
    const allowedVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
    const chosenVoice = allowedVoices.includes(voice) ? voice : 'Kore';

    let base64Audio = '';
    let usedModel = 'gemini-3.8-flash-lite-tts';

    if (mode === 'dialogue' && Array.isArray(dialogueLines) && dialogueLines.length > 0) {
      // Multi-speaker mode using gemini-3.8-flash-tts
      usedModel = 'gemini-3.8-flash-tts';
      const speakerList = Array.isArray(speakers) && speakers.length >= 2
        ? speakers.slice(0, 2)
        : [
            { speaker: 'Alex', voice: 'Puck', style: 'Dynamic, curious podcast host' },
            { speaker: 'Sam', voice: 'Kore', style: 'Insightful, warm expert' },
          ];

      const parts = dialogueLines.map((line: { speaker: string; text: string; style?: string }) => ({
        text: `${line.speaker}: ${line.text}`,
        speechMetadata: {
          speaker: line.speaker,
          style: line.style || 'Natural, expressive conversational tone',
        },
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: [
          {
            role: 'user',
            parts,
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                {
                  speaker: speakerList[0].speaker,
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: speakerList[0].voice || 'Puck' },
                  },
                },
                {
                  speaker: speakerList[1].speaker,
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: speakerList[1].voice || 'Kore' },
                  },
                },
              ],
            },
          },
        },
      });

      const audioPart = response.candidates?.[0]?.content?.parts?.find(
        (p: any) => p.inlineData && p.inlineData.data
      );
      base64Audio = audioPart?.inlineData?.data || '';
    } else {
      // Single speaker TTS
      usedModel = 'gemini-3.8-flash-lite-tts';
      const contentParts: any[] = [
        {
          text: text.trim(),
        },
      ];

      if (style && style.trim().length > 0) {
        contentParts[0].speechMetadata = {
          style: style.trim(),
        };
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: contentParts,
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: chosenVoice },
            },
          },
        },
      });

      const audioPart = response.candidates?.[0]?.content?.parts?.find(
        (p: any) => p.inlineData && p.inlineData.data
      );
      base64Audio = audioPart?.inlineData?.data || '';
    }

    if (!base64Audio) {
      return res.status(502).json({
        error: 'The speech synthesis service did not return audio data. Please try adjusting your prompt or voice settings.',
      });
    }

    const wordsCount = (text || '').trim().split(/\s+/).filter(Boolean).length;
    const charactersCount = (text || '').length;

    return res.json({
      success: true,
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
      sampleRate: 24000,
      model: usedModel,
      voice: chosenVoice,
      style: style || 'Default',
      wordsCount,
      charactersCount,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('TTS Generation error:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate speech audio. Please check your network or API status.',
    });
  }
});

// API endpoint: Available voices and style catalogs
app.get('/api/voices', (_req, res) => {
  res.json({
    voices: [
      {
        id: 'Kore',
        name: 'Kore',
        gender: 'Female',
        timbre: 'Warm, clear, balanced and articulate',
        description: 'Ideal for audiobooks, guided meditations, polished narrations, and educational content.',
        recommendedStyles: ['Warm Storyteller', 'Calm Meditation', 'Audiobook Chapter', 'Friendly Explainer'],
      },
      {
        id: 'Puck',
        name: 'Puck',
        gender: 'Male / Youthful',
        timbre: 'Energetic, crisp, engaging, and dynamic',
        description: 'Perfect for tech podcasts, upbeat commercials, video game characters, and quick explainers.',
        recommendedStyles: ['Energetic Host', 'Tech Podcast', 'Vibrant Commercial', 'Playful Narrator'],
      },
      {
        id: 'Charon',
        name: 'Charon',
        gender: 'Male',
        timbre: 'Deep, resonant, authoritative, and cinematic',
        description: 'Commands presence for dramatic movie trailers, investigative documentaries, and solemn historical pieces.',
        recommendedStyles: ['Cinematic Trailer', 'Deep Documentary', 'Authoritative Voice', 'Late Night Radio'],
      },
      {
        id: 'Fenrir',
        name: 'Fenrir',
        gender: 'Male',
        timbre: 'Rich, husky, commanding, and grounded',
        description: 'Excellent for sci-fi narrations, rugged character voices, and thrilling audio dramas.',
        recommendedStyles: ['Gritty Sci-Fi', 'Intense Thriller', 'Commanding Speech', 'Mystery Novelist'],
      },
      {
        id: 'Zephyr',
        name: 'Zephyr',
        gender: 'Neutral / Smooth',
        timbre: 'Smooth, relaxed, conversational, and effortless',
        description: 'Optimal for modern conversational assistants, relaxing lifestyle guides, and friendly tutorials.',
        recommendedStyles: ['Relaxed Companion', 'Lifestyle Host', 'Gentle Guide', 'Conversational AI'],
      },
    ],
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Setup Vite middleware in dev or serve dist in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`VoxStudio server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
