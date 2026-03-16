import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import multer from "multer";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({ storage: multer.memoryStorage() });

import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf-8"));
const configWithKey = {
  ...firebaseConfig,
  apiKey: process.env.VITE_FIREBASE_API_KEY
};
const firebaseApp = initializeApp(configWithKey);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

const memoryStore = {
  async set(id: string, data: any) {
    await setDoc(doc(db, "memories", id), data, { merge: true });
  },
  async get(id: string) {
    const docSnap = await getDoc(doc(db, "memories", id));
    return docSnap.exists() ? docSnap.data() : null;
  },
  async values() {
    const snapshot = await getDocs(collection(db, "memories"));
    return snapshot.docs.map(doc => doc.data());
  }
};

const jobStore = {
  async set(id: string, data: any) {
    await setDoc(doc(db, "jobs", id), data, { merge: true });
  },
  async get(id: string) {
    const docSnap = await getDoc(doc(db, "jobs", id));
    return docSnap.exists() ? docSnap.data() : null;
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mock Auth for the frontend
  app.get("/api/env", (req, res) => res.json({ API_KEY: !!process.env.API_KEY, GEMINI_API_KEY: !!process.env.GEMINI_API_KEY }));
  app.get("/auth/me", (req, res) => {
    res.json({
      user_id: "demo_user",
      email: "demo@example.com",
      auth_source: "demo",
      family_id: "demo_family"
    });
  });

  app.post("/api/transcribe", async (req, res) => {
    try {
      const { audioBase64, mimeType } = req.body;
      if (!audioBase64) {
        return res.status(400).json({ error: "No audio provided" });
      }

      console.log("API_KEY exists:", !!(process.env.API_KEY || process.env.GEMINI_API_KEY));
      console.log("API_KEY length:", (process.env.API_KEY || process.env.GEMINI_API_KEY)?.length);

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            inlineData: {
              mimeType: mimeType || "audio/webm",
              data: audioBase64
            }
          },
          "Transcribe this audio accurately. Return ONLY the transcription text."
        ]
      });
      
      res.json({ text: response.text?.trim() || "" });
    } catch (e) {
      console.error("Transcription error:", e);
      res.status(500).json({ error: "Failed to transcribe" });
    }
  });

  app.post("/api/generate-story", async (req, res) => {
    try {
      const { memory } = req.body;
      if (!memory) {
        return res.status(400).json({ error: "No memory provided" });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Turn this memory into a beautiful, cinematic story. Break it down into 3-4 distinct paragraphs.
        Memory: "${memory}"
        
        Format your response exactly like this:
        [TITLE]
        (Write a short, poetic title for this memory here)
        [PARAGRAPH]
        (Write the first paragraph here)
        [IMAGE]
        (Write a cinematic, nostalgic polaroid image prompt describing the scene in the first paragraph)
        [PARAGRAPH]
        (Write the second paragraph here)
        [IMAGE]
        (Write an image prompt for the second paragraph)
        ...and so on.`,
      });
      
      res.json({ text: response.text || "" });
    } catch (e) {
      console.error("Story generation error:", e);
      res.status(500).json({ error: "Failed to generate story: " + (e.message || e) });
    }
  });

  // Core Endpoint 1: Ingest Memory
  app.post("/memory/ingest", async (req, res) => {
    const { transcript } = req.body;
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this memory and extract the following in JSON format:
        - summary (1 sentence)
        - people (list of names)
        - year (string or null)
        - location (string or null)
        
        Memory: "${transcript}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              people: { type: Type.ARRAY, items: { type: Type.STRING } },
              year: { type: Type.STRING },
              location: { type: Type.STRING }
            }
          }
        }
      });
      
      const data = JSON.parse(response.text || "{}");
      res.json({
        memory_id: "mem_" + Date.now(),
        transcript,
        summary: data.summary || "A memory.",
        people: data.people || [],
        year: data.year || "Unknown",
        location: data.location || "Unknown",
        followup_questions: ["What is your favorite part of this memory?"]
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to ingest" });
    }
  });

  // Core Endpoint 1.5: Ingest Voice Memory
  app.post("/memory/ingest/voice", upload.single("file"), async (req, res) => {
    try {
      const file = (req as any).file;
      if (!file) {
        return res.status(400).json({ error: "No audio file provided" });
      }

      const audioBase64 = file.buffer.toString("base64");
      const mimeType = file.mimetype || "audio/webm";

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            inlineData: {
              mimeType: mimeType,
              data: audioBase64
            }
          },
          `Transcribe this audio accurately. Then analyze the memory and extract the following in JSON format:
          - transcript (the full transcription)
          - summary (1 sentence)
          - people (list of names)
          - year (string or null)
          - location (string or null)
          `
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              transcript: { type: Type.STRING },
              summary: { type: Type.STRING },
              people: { type: Type.ARRAY, items: { type: Type.STRING } },
              year: { type: Type.STRING },
              location: { type: Type.STRING }
            }
          }
        }
      });

      const data = JSON.parse(response.text || "{}");
      res.json({
        memory_id: "mem_" + Date.now(),
        transcript: data.transcript || "",
        summary: data.summary || "A memory.",
        people: data.people || [],
        year: data.year || "Unknown",
        location: data.location || "Unknown",
        followup_questions: ["What is your favorite part of this memory?"]
      });
    } catch (e) {
      console.error("Voice ingest error:", e);
      res.status(500).json({ error: "Failed to ingest voice" });
    }
  });

  // Core Endpoint 2: Generate Story (Real-time streaming)
  app.post("/memory/generate", async (req, res) => {
    const { memory_id, transcript, followups } = req.body;
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });
      const responseStream = await ai.models.generateContentStream({
        model: "gemini-3.1-pro-preview",
        contents: `Turn this memory into a beautiful, cinematic story.
        Memory: "${transcript}"
        Follow-ups: ${JSON.stringify(followups || [])}
        
        Start the story with a title on the first line like "Title: [Your Title]".
        Then write the story.
        At the very end, write "Prompt: [A cinematic, nostalgic polaroid image prompt describing the scene]"`,
      });
      
      let fullText = "";
      let titleSent = false;
      let promptSent = false;
      let storyText = "";
      
      let finalTitle = "";
      let finalPrompt = "";
      
      for await (const chunk of responseStream) {
        const text = chunk.text;
        fullText += text;
        
        let chunkToSend = text;
        
        // Parse out title and prompt
        if (!titleSent && fullText.includes("Title: ")) {
          const titleMatch = fullText.match(/Title:\s*(.+)\n/);
          if (titleMatch) {
            finalTitle = titleMatch[1].trim();
            res.write(`data: ${JSON.stringify({ title: finalTitle })}\n\n`);
            titleSent = true;
            chunkToSend = chunkToSend.replace(/Title:\s*(.+)\n/, "");
          }
        }
        
        if (fullText.includes("Prompt: ")) {
           const promptMatch = fullText.match(/Prompt:\s*(.+)/);
           if (promptMatch) {
             finalPrompt = promptMatch[1].trim();
             res.write(`data: ${JSON.stringify({ image_prompt: finalPrompt })}\n\n`);
             promptSent = true;
             chunkToSend = chunkToSend.replace(/Prompt:\s*(.+)/, "");
           }
        }
        
        if (chunkToSend.trim()) {
          storyText += chunkToSend;
          res.write(`data: ${JSON.stringify({ chunk: chunkToSend })}\n\n`);
        }
      }
      
      const memId = memory_id || "mem_" + Date.now();
      await memoryStore.set(memId, {
        id: memId,
        transcript,
        story: storyText,
        title: finalTitle || "A Cinematic Memory",
        imagePrompt: finalPrompt || "A cinematic, nostalgic polaroid of the scene."
      });

      res.write(`data: ${JSON.stringify({ memory_id: memId })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (e) {
      console.error(e);
      res.write(`data: {"error": "Failed to generate"}\n\n`);
      res.end();
    }
  });

  // Core Endpoint 3: Historian Interview Start
  app.post("/interview/start", async (req, res) => {
    const { transcript } = req.body;
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are a family historian. Based on this memory, ask one insightful follow-up question to deepen the story.
        Memory: "${transcript}"
        
        Return ONLY the question text.`,
      });
      
      res.json({
        session_id: "sess_" + Date.now(),
        status: "in_progress",
        memory_summary: "A memory being explored.",
        people: [],
        year: "Unknown",
        location: "Unknown",
        current_question: response.text?.trim() || "What else do you remember about this?"
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to start interview" });
    }
  });

  // Core Endpoint 4: Historian Interview Answer
  app.post("/interview/:session_id/answer", async (req, res) => {
    const { answer } = req.body;
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are a family historian. The user just answered your previous question with: "${answer}".
        Ask one more follow-up question to deepen the story.
        
        Return ONLY the question text.`,
      });
      
      res.json({
        session_id: req.params.session_id,
        status: "in_progress",
        current_question: response.text?.trim() || "Can you tell me more?",
        answers: [{ answer }]
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to submit answer" });
    }
  });

  // Core Endpoint 5: Historian Interview Finalize
  app.post("/interview/:session_id/finalize", async (req, res) => {
    try {
      res.json({
        memory: {
          memory_id: "mem_" + Date.now(),
          title: "A Deepened Memory",
          story: "This story has been enriched by your interview answers. Click 'Generate Story' to see the full cinematic version.",
          image_prompt: "A beautiful, nostalgic scene."
        }
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to finalize interview" });
    }
  });

  // Core Endpoint 6: Generate Storyboard
  app.post("/memory/storyboard", async (req, res) => {
    const { memory_id, scene_count } = req.body;
    const memory = await memoryStore.get(memory_id);
    const storyText = memory ? memory.story : "A generic memory about a childhood event.";
    const title = memory ? memory.title : "A Memory";

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Break this story down into exactly ${scene_count} cinematic scenes.
        Story: "${storyText}"
        
        Return a JSON array of objects, where each object has:
        - scene_number (number)
        - scene_title (string)
        - narration (string, 1-2 sentences of voiceover)
        - image_prompt (string, a detailed cinematic prompt for an image generator)
        `,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                scene_number: { type: Type.INTEGER },
                scene_title: { type: Type.STRING },
                narration: { type: Type.STRING },
                image_prompt: { type: Type.STRING }
              }
            }
          }
        }
      });
      
      const scenes = JSON.parse(response.text || "[]");
      res.json({
        memory_title: title,
        scene_count: scenes.length,
        manifest_uri: "mock_manifest.json",
        scenes
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to generate storyboard" });
    }
  });

  // Core Endpoint 7: Voice Personas
  app.get("/voice/personas", (req, res) => {
    res.json({
      personas: [
        { id: "Puck", name: "Puck (Warm, friendly)", voice_name: "Puck" },
        { id: "Charon", name: "Charon (Deep, resonant)", voice_name: "Charon" },
        { id: "Kore", name: "Kore (Bright, clear)", voice_name: "Kore" },
        { id: "Fenrir", name: "Fenrir (Gruff, serious)", voice_name: "Fenrir" },
        { id: "Zephyr", name: "Zephyr (Soft, airy)", voice_name: "Zephyr" }
      ]
    });
  });

  app.put("/voice/persona/default", (req, res) => {
    res.json({ status: "ok" });
  });

  // Core Endpoint 8: Render Film Job
  app.post("/memory/:memory_id/film/render/jobs", async (req, res) => {
    const { memory_id } = req.params;
    const { scene_count, voice_persona_id, voice_name } = req.body;
    
    const jobId = "job_" + Date.now();
    await jobStore.set(jobId, { status: "queued", memory_id, voice_name: voice_name || voice_persona_id || "Puck" });
    
    // Start background job
    (async () => {
      try {
        await jobStore.set(jobId, { ...(await jobStore.get(jobId)), status: "processing", progress: 10 });
        
        const memory = await memoryStore.get(memory_id);
        const storyText = memory ? memory.story : "A cinematic memory.";
        
        // Use Gemini TTS to generate the audio track
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: storyText.substring(0, 500) }] }], // limit length for demo
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: (await jobStore.get(jobId)).voice_name }
              }
            }
          }
        });
        
        await jobStore.set(jobId, { ...(await jobStore.get(jobId)), progress: 80 });
        
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        const audioUri = base64Audio ? `data:audio/mp3;base64,${base64Audio}` : "";
        
        await jobStore.set(jobId, {
          status: "completed",
          result: {
            video_uri: audioUri, // using audio as the "video" for the demo
            subtitle_uri: "",
            status: "completed",
            visual_mode: "cards",
            audio_mix_mode: "voice_only"
          }
        });
      } catch (e: any) {
        console.error("Film render failed:", e);
        await jobStore.set(jobId, { status: "failed", error_message: e.message });
      }
    })();
    
    res.json({ job_id: jobId, status: "queued" });
  });

  // Core Endpoint 9: Get Job Status
  app.get("/jobs/:job_id", async (req, res) => {
    const job = await jobStore.get(req.params.job_id);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.json(job);
  });

  // Core Endpoint 10: Get Latest Film
  app.get("/memory/:memory_id/film/latest", (req, res) => {
    // Just mock it or return empty
    res.json(null);
  });
  app.get("/memory/:memory_id/film/video", (req, res) => res.json({ status: "video" }));
  app.get("/memory/:memory_id/film/subtitles", (req, res) => res.json({ status: "subtitles" }));

  // Core Endpoint 11: Ask the Archive
  app.post("/memory/ask", async (req, res) => {
    const { query } = req.body;
    
    try {
      // Gather all memories
      const allMemories = (await memoryStore.values()).map((m: any) => `Title: ${m.title}\nStory: ${m.story}`).join("\n\n");
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are an AI archivist. Answer the user's question based on these memories:
        
        ${allMemories || "No memories stored yet."}
        
        Question: "${query}"
        
        Return a JSON object with:
        - answer (string, your answer)
        - citations (array of strings, titles of memories referenced)
        - followups (array of strings, 2 suggested follow-up questions)
        `,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              answer: { type: Type.STRING },
              citations: { type: Type.ARRAY, items: { type: Type.STRING } },
              followups: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      });
      
      const data = JSON.parse(response.text || "{}");
      res.json({
        answer: data.answer || "I couldn't find an answer.",
        citations: data.citations || [],
        followups: data.followups || []
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to ask archive" });
    }
  });

  // Mock other endpoints
  app.get("/memory", async (req, res) => {
    const memories = await memoryStore.values();
    res.json({ memories });
  });
  app.get("/memory/insights/overview", (req, res) => res.json({ total_memories: 0, top_people: [], top_locations: [], top_years: [] }));
  app.get("/memory/graph", (req, res) => res.json({ nodes: [], edges: [], stats: {} }));
  app.get("/memory/replay", (req, res) => res.json({ points: [] }));
  app.get("/collections", (req, res) => res.json({ collections: [] }));
  app.post("/collections", (req, res) => res.json({ collection: { id: "col_1", title: "New Collection" } }));
  app.get("/collections/:id", (req, res) => res.json({ collection: null, memories: [] }));
  app.get("/collections/:id/memories", (req, res) => res.json({ memories: [] }));
  
  // Core Endpoint 12: Generate Podcast
  app.post("/collections/:id/podcast", async (req, res) => {
    try {
      // Gather all memories for the podcast
      const allMemories = (await memoryStore.values()).map((m: any) => `Title: ${m.title}\nStory: ${m.story}`).join("\n\n");
      
      const prompt = `Turn the following family memories into a short, engaging podcast conversation between two hosts, Joe and Jane. 
      Joe is enthusiastic and curious. Jane is thoughtful and nostalgic.
      They should discuss the memories as if they are exploring a family archive. Keep it under 2 minutes.
      
      Memories:
      ${allMemories || "No memories stored yet. Just introduce the concept of the family archive."}`;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt.substring(0, 1500) }] }], // Limit length for speed/demo
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                {
                  speaker: "Joe",
                  voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } }
                },
                {
                  speaker: "Jane",
                  voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } }
                }
              ]
            }
          }
        }
      });
      
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        throw new Error("No audio generated");
      }
      
      const audioUri = `data:audio/mp3;base64,${base64Audio}`;
      res.json({ audio_url: audioUri });
    } catch (e) {
      console.error("Podcast generation failed:", e);
      res.status(500).json({ error: "Failed to generate podcast" });
    }
  });

  app.get("/memory/:id", async (req, res) => {
    const memory = await memoryStore.get(req.params.id);
    if (memory) {
      res.json(memory);
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });
  
  app.post("/memory/:id/invite", (req, res) => {
    const { email } = req.body;
    // In a real app, this would send an email and create an invite record
    res.json({ status: "invited", email });
  });

  app.post("/memory/:id/comments", async (req, res) => {
    const memory = await memoryStore.get(req.params.id);
    if (!memory) {
      return res.status(404).json({ error: "Memory not found" });
    }
    
    const { text } = req.body;
    if (!memory.comments) {
      memory.comments = [];
    }
    
    const newComment = {
      id: `comment_${Date.now()}`,
      text,
      author_name: "Family Member", // In a real app, this comes from auth
      created_at: new Date().toISOString()
    };
    
    memory.comments.push(newComment);
    await memoryStore.set(req.params.id, memory);
    
    res.json(newComment);
  });

  app.post("/memory/:id/publish", (req, res) => res.json({ status: "published" }));
  app.post("/memory/:id/print-order", (req, res) => res.json({ status: "ordered", order_id: `ORD-${Math.floor(Math.random() * 100000)}` }));
  
  app.post("/api/photo/restore", (req, res) => {
    // In a real app, this would process the uploaded file using an AI model
    // For now, we return a placeholder image
    setTimeout(() => {
      res.json({ status: "restored", restored_url: "https://picsum.photos/seed/restored/800/600" });
    }, 2000);
  });

  app.post("/memory/ask/clip/jobs", (req, res) => res.json({ job_id: "job_clip_1", status: "queued" }));
  app.get("/memory/ask/clip/video", (req, res) => res.json({ status: "video" }));
  app.get("/memory/ask/clip/subtitles", (req, res) => res.json({ status: "subtitles" }));
  app.post("/memory/book/export/jobs", (req, res) => res.json({ job_id: "job_book_1", status: "queued" }));
  app.get("/memory/book/download", (req, res) => res.json({ status: "downloading" }));
  
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
