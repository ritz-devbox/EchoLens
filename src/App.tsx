/// <reference types="vite/client" />
import React, { useState, useRef, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Image as ImageIcon, BookOpen, History, Sparkles, Wand2, PlayCircle, ArrowRight, Square, LogOut, Volume2, VolumeX, Download, MessageSquare, Trash2, Share2 } from 'lucide-react';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { GoogleGenAI } from "@google/genai";

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const compressImage = (base64: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };
    img.src = "data:image/png;base64," + base64;
  });
};

const DEMO_TEMPLATES = [
  {
    title: "Childhood Summer",
    icon: <Sparkles className="w-5 h-5" />,
    text: "I remember the summer of 1998 at my grandparents' house in the countryside. We used to catch fireflies in glass jars and the smell of fresh cut grass was always in the air. My grandfather would sit on the porch playing his old acoustic guitar while we ran around the yard until it got completely dark."
  },
  {
    title: "First Road Trip",
    icon: <History className="w-5 h-5" />,
    text: "Our first cross-country road trip in the old station wagon. We drove from Chicago to the Grand Canyon. I remember waking up in the back seat to see the sunrise over the desert mountains, the radio playing softly, and my parents drinking coffee from a thermos."
  },
  {
    title: "Holiday Tradition",
    icon: <BookOpen className="w-5 h-5" />,
    text: "Every Christmas Eve, the whole family would gather at Aunt Mary's house. The kitchen was always filled with the smell of cinnamon and roasting turkey. We cousins would hide under the large oak dining table, pretending it was our secret fort, waiting for the adults to finally let us open one present."
  }
];

const Studio = () => {
  const [memoryText, setMemoryText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [templateSearch, setTemplateSearch] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleGenerate = () => {
    if (!memoryText.trim() && !selectedImage) return;
    navigate('/story', { state: { memory: memoryText, image: selectedImage } });
  };

  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#ff4e00';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();

      const sliceWidth = canvas.width * 1.0 / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * canvas.height / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();
  };

  const stopWaveform = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      stopWaveform();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Setup Audio Context for visualizer
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 2048;
        
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        drawWaveform();

        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
          stream.getTracks().forEach(track => track.stop());
          
          setIsTranscribing(true);
          try {
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
              const base64data = (reader.result as string).split(',')[1];
              try {
                const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY });
                const response = await ai.models.generateContent({
                  model: "gemini-3-flash-preview",
                  contents: [
                    {
                      inlineData: {
                        mimeType: mediaRecorder.mimeType || "audio/webm",
                        data: base64data
                      }
                    },
                    "Transcribe this audio accurately. Return ONLY the transcription text."
                  ]
                });
                const text = response.text?.trim() || "";
                if (text) {
                  setMemoryText(prev => prev ? `${prev} ${text}` : text);
                }
              } catch (e: any) {
                console.error("Transcription failed:", e);
                alert("Transcription failed: " + e.message);
              } finally {
                setIsTranscribing(false);
              }
            };
          } catch (error) {
            console.error("Transcription failed:", error);
            setIsTranscribing(false);
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Error accessing microphone:", err);
        alert("Microphone access is required to record memories.");
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const askFollowUp = async () => {
    if (!memoryText.trim()) return;
    setIsAsking(true);
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `The user shared this memory: "${memoryText}". Ask ONE short, deep, evocative follow-up question to help them add more sensory details or emotional depth. Return ONLY the question.`
      });
      setFollowUp(response.text?.trim() || "");
    } catch (e) {
      console.error("Failed to get follow up", e);
    }
    setIsAsking(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center min-h-[80vh] space-y-16"
    >
      <div className="text-center space-y-8 max-w-3xl">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-7xl md:text-8xl font-serif font-light tracking-tight text-white leading-[0.9]"
        >
          Preserve the <br/><span className="italic text-white/60">Unspoken</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-xl text-white/50 font-light leading-relaxed max-w-xl mx-auto"
        >
          Share a memory. The Historian agent will weave it into a cinematic, multimedia story.
        </motion.p>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-3xl space-y-8"
      >
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#ff4e00]/20 to-transparent rounded-[32px] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700"></div>
          <div className="glass-panel p-3 flex flex-col justify-center relative rounded-[32px] bg-black/40 border-white/10 overflow-hidden min-h-[200px]">
            {isRecording ? (
              <div className="w-full flex flex-col items-center justify-center py-8 z-10">
                <canvas ref={canvasRef} width={600} height={120} className="w-full max-w-xl h-32" />
                <div className="mt-6 flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-red-500 bg-red-500/10 px-4 py-2 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
                    <span className="text-sm font-medium tracking-widest uppercase">Recording</span>
                  </div>
                  <button onClick={toggleRecording} className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                    <Square className="w-5 h-5 text-white fill-current" />
                  </button>
                </div>
              </div>
            ) : isTranscribing ? (
              <div className="w-full flex flex-col items-center justify-center py-16 z-10">
                <div className="w-12 h-12 rounded-full border-2 border-[#ff4e00] border-t-transparent animate-spin mb-4"></div>
                <p className="text-white/50 font-medium tracking-widest uppercase text-sm">Transcribing Audio...</p>
              </div>
            ) : (
              <>
                {selectedImage && (
                  <div className="absolute left-6 top-6 w-20 h-20 rounded-xl overflow-hidden border border-white/20 shadow-lg z-10">
                    <img src={selectedImage} alt="Uploaded" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setSelectedImage(null)}
                      className="absolute top-1 right-1 bg-black/50 rounded-full p-1 hover:bg-black/80 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                )}
                <textarea 
                  value={memoryText}
                  onChange={(e) => setMemoryText(e.target.value)}
                  placeholder={selectedImage ? "Add context to your photo..." : "It was the summer of 1994 in New York..."}
                  className={`w-full bg-transparent text-white placeholder-white/30 p-8 outline-none resize-none h-40 font-serif text-2xl leading-relaxed ${selectedImage ? 'pl-32' : ''}`}
                />
                {followUp && (
                  <div className="px-8 pb-4 text-[#ff4e00] font-medium animate-pulse">
                    ✨ {followUp}
                  </div>
                )}
                <div className="absolute bottom-6 right-6 flex space-x-3 z-10">
                  <button 
                    onClick={askFollowUp}
                    disabled={!memoryText.trim() || isAsking}
                    className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all duration-300 disabled:opacity-30"
                    title="Ask a follow-up question to deepen the memory"
                  >
                    {isAsking ? <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div> : <MessageSquare className="w-5 h-5 text-white" />}
                  </button>
                  <button 
                    onClick={handleGenerate}
                    disabled={!memoryText.trim() && !selectedImage}
                    className="w-14 h-14 rounded-full bg-[#ff4e00] flex items-center justify-center hover:scale-105 transition-all duration-300 disabled:opacity-30 disabled:hover:scale-100 shadow-[0_0_30px_rgba(255,78,0,0.3)] hover:shadow-[0_0_40px_rgba(255,78,0,0.6)]"
                  >
                    <ArrowRight className="w-6 h-6 text-white" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center space-x-6 text-white/30 text-xs tracking-[0.2em] uppercase font-medium">
          <span className="h-px w-16 bg-gradient-to-r from-transparent to-white/20"></span>
          <span>Or begin with</span>
          <span className="h-px w-16 bg-gradient-to-l from-transparent to-white/20"></span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          <button 
            onClick={toggleRecording}
            disabled={isRecording || isTranscribing}
            className={`glass-panel p-6 flex items-center space-x-6 transition-all duration-500 group border rounded-3xl relative overflow-hidden bg-black/20 hover:bg-white/5 border-white/5 hover:border-white/10 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 relative z-10 bg-white/5 group-hover:scale-110 group-hover:bg-white/10`}>
              <Mic className="w-6 h-6 text-white/70 group-hover:text-white transition-colors" />
            </div>
            <div className="text-left relative z-10">
              <span className="block text-lg font-medium tracking-wide text-white/90">
                Voice Memo
              </span>
              <span className="block text-sm text-white/40 mt-1">
                Speak your memory
              </span>
            </div>
          </button>

          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="glass-panel p-6 flex items-center space-x-6 transition-all duration-500 group border rounded-3xl bg-black/20 hover:bg-white/5 border-white/5 hover:border-white/10"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500">
              <ImageIcon className="w-6 h-6 text-white/70 group-hover:text-white transition-colors" />
            </div>
            <div className="text-left">
              <span className="block text-lg font-medium tracking-wide text-white/90">Upload Photo</span>
              <span className="block text-sm text-white/40 mt-1">Start with an image</span>
            </div>
          </button>
        </div>

        <div className="pt-8 w-full">
          <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
            <div className="flex items-center space-x-6 text-white/30 text-xs tracking-[0.2em] uppercase font-medium">
              <span className="h-px w-16 bg-gradient-to-r from-transparent to-white/20"></span>
              <span>Demo Templates</span>
              <span className="h-px w-16 bg-gradient-to-l from-transparent to-white/20"></span>
            </div>
            <div className="relative w-full md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/40"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </div>
              <input
                type="text"
                placeholder="Search templates..."
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-full py-2 pl-9 pr-4 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#ff4e00]/50 focus:bg-white/5 transition-all duration-300"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DEMO_TEMPLATES.filter(t => 
              t.title.toLowerCase().includes(templateSearch.toLowerCase()) || 
              t.text.toLowerCase().includes(templateSearch.toLowerCase())
            ).map((template, idx) => (
              <button
                key={idx}
                onClick={() => setMemoryText(template.text)}
                className="glass-panel p-5 text-left rounded-2xl border border-white/5 hover:border-white/20 hover:bg-white/5 transition-all duration-300 group bg-black/20"
              >
                <div className="text-[#ff4e00] mb-3 opacity-70 group-hover:opacity-100 transition-opacity">{template.icon}</div>
                <h4 className="text-white/90 font-medium mb-2 tracking-wide">{template.title}</h4>
                <p className="text-white/40 text-sm line-clamp-3 font-light leading-relaxed">{template.text}</p>
              </button>
            ))}
            {DEMO_TEMPLATES.filter(t => 
              t.title.toLowerCase().includes(templateSearch.toLowerCase()) || 
              t.text.toLowerCase().includes(templateSearch.toLowerCase())
            ).length === 0 && (
              <div className="col-span-1 md:col-span-3 text-center py-8 text-white/40 text-sm">
                No templates found matching "{templateSearch}"
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Storyteller = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const memory = location.state?.memory;
  const archivedStory = location.state?.archivedStory;
  const [blocks, setBlocks] = useState<any[]>(archivedStory?.blocks || []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasStarted, setHasStarted] = useState(!!archivedStory);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStoryId, setCurrentStoryId] = useState<string | null>(archivedStory?.id || null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const generateStory = async () => {
    if (!memory || !auth.currentUser) return;
    setIsGenerating(true);
    setHasStarted(true);
    setBlocks([]);

    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY });
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
      
      const fullText = response.text || "";
      
      let title = "Untitled Memory";
      let contentToParse = fullText;
      
      if (fullText.includes("[TITLE]")) {
        const titleMatch = fullText.match(/\[TITLE\]\s*([\s\S]*?)(?=\[PARAGRAPH\]|\[IMAGE\]|$)/);
        if (titleMatch && titleMatch[1]) {
          title = titleMatch[1].trim();
          contentToParse = fullText.replace(titleMatch[0], "");
        }
      }

      const parts = contentToParse.split(/\[PARAGRAPH\]|\[IMAGE\]/).map(s => s.trim()).filter(Boolean);
      
      let isParagraph = contentToParse.indexOf("[PARAGRAPH]") < contentToParse.indexOf("[IMAGE]");
      if (contentToParse.indexOf("[PARAGRAPH]") === -1) isParagraph = false;
      
      const generatedBlocks = [];
      let firstImagePrompt = "";
      
      for (let i = 0; i < parts.length; i++) {
        const content = parts[i];
        if (isParagraph) {
          const block = { type: 'text', content };
          setBlocks(prev => [...prev, block]);
          generatedBlocks.push(block);
        } else {
          let imageUrl = 'https://picsum.photos/seed/' + encodeURIComponent(content.slice(0, 20)) + '/800/450?blur=2';
          try {
            const imageResponse = await ai.models.generateContent({
              model: 'gemini-3.1-flash-image-preview',
              contents: content,
              config: { imageConfig: { aspectRatio: "16:9", imageSize: "512px" } }
            });
            let base64 = "";
            for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
              if (part.inlineData) {
                base64 = part.inlineData.data;
                break;
              }
            }
            if (base64) {
              imageUrl = await compressImage(base64);
            }
          } catch (e) {
            console.error("Image generation failed, falling back to placeholder", e);
          }
          const block = { type: 'image', content, imageUrl };
          setBlocks(prev => [...prev, block]);
          generatedBlocks.push(block);
          if (!firstImagePrompt) firstImagePrompt = content;
        }
        isParagraph = !isParagraph;
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Save to Firestore
      const docRef = await addDoc(collection(db, 'memories'), {
        userId: auth.currentUser.uid,
        title: title,
        transcript: memory,
        story: generatedBlocks.filter(b => b.type === 'text').map(b => b.content).join('\n\n'),
        image_prompt: firstImagePrompt,
        blocks: generatedBlocks,
        createdAt: serverTimestamp()
      });
      
      setCurrentStoryId(docRef.id);
      setIsGenerating(false);
    } catch (error: any) {
      console.error("Error generating story:", error);
      alert("Failed to generate story: " + error.message);
      setIsGenerating(false);
    }
  };

  React.useEffect(() => {
    if (memory && !hasStarted && !isGenerating && !archivedStory) {
      generateStory();
    }
  }, [memory, hasStarted, isGenerating, archivedStory]);

  const playNarration = async () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }
    try {
      setIsPlaying(true);
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY });
      const storyText = blocks.filter(b => b.type === 'text').map(b => b.content).join(' ');
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: storyText,
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } }
          }
        }
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audio = new Audio("data:audio/wav;base64," + base64Audio);
        audioRef.current = audio;
        audio.onended = () => setIsPlaying(false);
        audio.play();
      } else {
        setIsPlaying(false);
      }
    } catch (e) {
      console.error("TTS failed", e);
      setIsPlaying(false);
      alert("Failed to generate narration.");
    }
  };

  const handleExport = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: archivedStory?.title || "My Cinematic Story",
          text: "Check out this memory I preserved with EchoLens!",
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing', error);
      }
    } else {
      alert("Sharing is not supported on this browser. You can copy the URL instead!");
    }
  };

  const handleDelete = async () => {
    if (!currentStoryId) return;
    const confirmed = window.confirm("Are you sure you want to delete this memory?");
    if (confirmed) {
      try {
        await deleteDoc(doc(db, 'memories', currentStoryId));
        navigate('/archive');
      } catch (error) {
        console.error("Error deleting memory:", error);
        alert("Failed to delete memory.");
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }} 
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="h-full flex flex-col"
    >
      <header className="mb-10 flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-5xl font-serif font-light tracking-tight text-white">{archivedStory ? archivedStory.title : "The Storyteller"}</h2>
          <p className="text-white/50 mt-3 text-lg font-light">Watch your memory come to life with interleaved text, images, and audio.</p>
        </div>
        {!isGenerating && blocks.length > 0 && (
          <div className="flex space-x-4">
            <button 
              onClick={playNarration}
              className="glass-panel px-6 py-3 flex items-center space-x-2 hover:bg-white/10 transition-all duration-300 text-white rounded-full border border-white/10"
            >
              {isPlaying ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              <span className="font-medium tracking-wide">{isPlaying ? "Stop" : "Listen"}</span>
            </button>
            <button 
              onClick={handleExport}
              className="glass-panel px-6 py-3 flex items-center space-x-2 hover:bg-white/10 transition-all duration-300 text-white rounded-full border border-white/10"
              title="Save as PDF"
            >
              <Download className="w-5 h-5" />
              <span className="font-medium tracking-wide hidden md:inline">Save</span>
            </button>
            <button 
              onClick={handleShare}
              className="glass-panel px-6 py-3 flex items-center space-x-2 hover:bg-white/10 transition-all duration-300 text-white rounded-full border border-white/10"
              title="Share"
            >
              <Share2 className="w-5 h-5" />
              <span className="font-medium tracking-wide hidden md:inline">Share</span>
            </button>
            {currentStoryId && (
              <button 
                onClick={handleDelete}
                className="glass-panel px-6 py-3 flex items-center space-x-2 hover:bg-red-500/20 transition-all duration-300 text-red-400 rounded-full border border-white/10 hover:border-red-500/30"
                title="Delete Memory"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            {!archivedStory && (
              <button 
                onClick={generateStory}
                disabled={!memory}
                className="glass-panel px-6 py-3 flex items-center space-x-2 hover:bg-white/10 transition-all duration-300 text-[#ff4e00] disabled:opacity-30 rounded-full border border-white/10 hover:border-white/20 hover:shadow-[0_0_30px_rgba(255,78,0,0.2)]"
              >
                <Wand2 className="w-5 h-5" />
                <span className="font-medium tracking-wide hidden md:inline">Regenerate</span>
              </button>
            )}
          </div>
        )}
      </header>

      <div className="flex-1 glass-panel p-10 overflow-y-auto border-dashed border-white/10 relative rounded-[32px] bg-black/20 print:bg-white print:text-black print:border-none print:p-0">
        {blocks.length === 0 && !isGenerating ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <PlayCircle className="w-10 h-10 text-white/30" />
            </div>
            <p className="text-white/40 text-xl font-light max-w-md">
              {memory ? "Ready to generate your cinematic story." : "Awaiting memory input. Go to Studio to start."}
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-24 pb-32 pt-10">
            {blocks.map((block, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-8"
              >
                {block.type === 'text' && (
                  <p className="text-3xl md:text-4xl font-serif leading-relaxed text-white/90 drop-shadow-lg print:text-black print:drop-shadow-none">
                    {block.content}
                  </p>
                )}
                {block.type === 'image' && block.imageUrl && (
                  <div className="relative rounded-[32px] overflow-hidden shadow-2xl border border-white/10 group">
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-700 z-10"></div>
                    <img src={block.imageUrl} alt={block.content} className="w-full h-auto object-cover animate-ken-burns" />
                    <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-20">
                      <p className="text-sm text-white/60 font-mono tracking-wide uppercase">{block.content}</p>
                    </div>
                  </div>
                )}
                {block.type === 'image' && !block.imageUrl && (
                  <div className="w-full aspect-video rounded-[32px] bg-white/5 flex items-center justify-center animate-pulse border border-white/10">
                    <ImageIcon className="w-10 h-10 text-white/20" />
                  </div>
                )}
              </motion.div>
            ))}
            {isGenerating && (
              <div className="flex items-center justify-center py-16">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 rounded-full border-2 border-white/10"></div>
                  <div className="absolute inset-0 rounded-full border-2 border-[#ff4e00] border-t-transparent animate-spin"></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const Archive = () => {
  const [memories, setMemories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const confirmed = window.confirm("Are you sure you want to delete this memory?");
    if (confirmed) {
      try {
        await deleteDoc(doc(db, 'memories', id));
      } catch (error) {
        console.error("Error deleting memory:", error);
      }
    }
  };

  useEffect(() => {
    if (!auth.currentUser) return;
    
    const q = query(
      collection(db, 'memories'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMemories = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      fetchedMemories.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      setMemories(fetchedMemories);
      setIsLoading(false);
    }, (error) => {
      console.error("Failed to load memories", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredMemories = memories.filter(memory => {
    const query = searchQuery.toLowerCase();
    return (
      (memory.title && memory.title.toLowerCase().includes(query)) ||
      (memory.transcript && memory.transcript.toLowerCase().includes(query)) ||
      (memory.story && memory.story.toLowerCase().includes(query))
    );
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }} 
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="h-full flex flex-col"
    >
      <header className="mb-10">
        <h2 className="text-5xl font-serif font-light tracking-tight text-white">Family Archive</h2>
        <p className="text-white/50 mt-3 text-lg font-light">Explore the timeline of your preserved stories.</p>
      </header>

      <div className="mb-10">
        <div className="relative w-full max-w-3xl">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/40"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
          <input
            type="text"
            placeholder="Search memories by title, transcript, or story..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-full py-5 pl-16 pr-6 text-lg text-white placeholder-white/40 focus:outline-none focus:border-[#ff4e00]/50 focus:bg-white/5 focus:shadow-[0_0_30px_rgba(255,78,0,0.15)] transition-all duration-300"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-4 pb-20">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 rounded-full border-2 border-[#ff4e00] border-t-transparent animate-spin"></div>
          </div>
        ) : filteredMemories.length === 0 ? (
          <div className="glass-panel p-16 rounded-[32px] text-center border-dashed border-white/10 bg-black/20">
            <History className="w-16 h-16 text-white/20 mx-auto mb-6" />
            <h3 className="text-2xl font-serif text-white/80 mb-2">
              {searchQuery ? "No matching memories found" : "No memories yet"}
            </h3>
            <p className="text-white/40">
              {searchQuery ? "Try adjusting your search keywords." : "Your preserved stories will appear here."}
            </p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {filteredMemories.map((memory, i) => (
              <motion.div 
                key={memory.id || i}
                onClick={() => navigate('/story', { state: { archivedStory: memory } })}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="glass-panel p-6 flex flex-col justify-end relative overflow-hidden group cursor-pointer rounded-[32px] break-inside-avoid min-h-[300px] border border-white/10 hover:border-white/30 hover:shadow-[0_0_40px_rgba(255,78,0,0.15)] transition-all duration-500"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10 transition-opacity duration-500 group-hover:opacity-80"></div>
                <button 
                  onClick={(e) => handleDelete(e, memory.id)}
                  className="absolute top-4 right-4 z-30 p-2 bg-black/40 hover:bg-red-500/80 rounded-full text-white/50 hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-md"
                  title="Delete memory"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {memory.image_prompt ? (
                  <img src={`https://picsum.photos/seed/${encodeURIComponent(memory.image_prompt.slice(0, 20))}/600/800?blur=1`} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                ) : (
                  <div className="absolute inset-0 bg-white/5 group-hover:scale-105 transition-transform duration-700"></div>
                )}
                <div className="relative z-20 space-y-3 transform group-hover:-translate-y-2 transition-transform duration-500">
                  <span className="text-xs font-mono text-[#ff4e00] uppercase tracking-widest bg-black/50 px-3 py-1 rounded-full backdrop-blur-md inline-block">
                    {memory.createdAt ? (memory.createdAt.toDate ? memory.createdAt.toDate().getFullYear() : new Date(memory.createdAt).getFullYear()) : "Unknown Year"}
                  </span>
                  <h3 className="text-2xl font-serif leading-tight text-white/90 group-hover:text-white">{memory.title || "Untitled Memory"}</h3>
                  <p className="text-sm text-white/50 line-clamp-2 font-light">{memory.transcript || memory.story || "No description available."}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default function App() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true); // Default to true for free models, but we'll check

  useEffect(() => {
    const checkApiKey = async () => {
      // We force API key selection if the free key is failing
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      }
    };
    checkApiKey();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleSelectApiKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login failed:", error);
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        // User closed the popup, no need to show an aggressive alert
      } else {
        alert("Login failed. Please try again.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0a0502]">
        <div className="w-12 h-12 rounded-full border-2 border-[#ff4e00] border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!hasApiKey) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0a0502] text-white relative overflow-hidden">
        <div className="atmosphere"></div>
        <div className="relative z-10 text-center space-y-8 max-w-lg p-10 glass-panel rounded-[32px] bg-black/40 backdrop-blur-xl border border-white/10">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#ff4e00] to-[#ff8a00] flex items-center justify-center shadow-[0_0_40px_rgba(255,78,0,0.4)]">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-5xl font-serif font-light tracking-tight mb-4">API Key Required</h1>
            <p className="text-white/50 text-lg font-light">Please select your Google Cloud project API key to continue.</p>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-[#ff4e00] hover:underline text-sm mt-2 inline-block">Learn about billing</a>
          </div>
          <button 
            onClick={handleSelectApiKey}
            className="w-full glass-panel py-4 flex items-center justify-center space-x-3 hover:bg-white/10 transition-all duration-300 rounded-full border border-white/10 hover:border-white/20 hover:shadow-[0_0_30px_rgba(255,78,0,0.2)]"
          >
            <span className="font-medium tracking-wide">Select API Key</span>
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0a0502] text-white relative overflow-hidden">
        <div className="atmosphere"></div>
        <div className="relative z-10 text-center space-y-8 max-w-lg p-10 glass-panel rounded-[32px] bg-black/40 backdrop-blur-xl border border-white/10">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#ff4e00] to-[#ff8a00] flex items-center justify-center shadow-[0_0_40px_rgba(255,78,0,0.4)]">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-5xl font-serif font-light tracking-tight mb-4">EchoLens</h1>
            <p className="text-white/50 text-lg font-light">Preserve your unspoken memories as cinematic stories.</p>
          </div>
          <button 
            onClick={handleLogin}
            className="w-full glass-panel py-4 flex items-center justify-center space-x-3 hover:bg-white/10 transition-all duration-300 rounded-full border border-white/10 hover:border-white/20 hover:shadow-[0_0_30px_rgba(255,78,0,0.2)]"
          >
            <span className="font-medium tracking-wide">Sign in with Google</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex text-white overflow-hidden bg-[#0a0502]">
      <div className="atmosphere"></div>
      
      {/* Sidebar Navigation */}
      <motion.nav 
        initial={false}
        animate={{ width: isCollapsed ? 100 : 288 }}
        className="border-r border-white/5 glass-panel m-6 rounded-[2rem] flex flex-col relative z-20 shadow-2xl bg-black/20 backdrop-blur-xl transition-all duration-500 ease-[0.16,1,0.3,1]"
      >
        <div className={`p-8 flex items-center ${isCollapsed ? 'justify-center' : 'space-x-4'} transition-all duration-500`}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff4e00] to-[#ff8a00] flex items-center justify-center shadow-[0_0_20px_rgba(255,78,0,0.3)] shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <motion.span 
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="text-2xl font-serif tracking-wide whitespace-nowrap"
            >
              EchoLens
            </motion.span>
          )}
        </div>
        
        <div className="flex-1 px-4 space-y-3 mt-8">
          <NavLink to="/" icon={<Mic />} label="Studio" active={location.pathname === '/'} collapsed={isCollapsed} />
          <NavLink to="/story" icon={<BookOpen />} label="Storyteller" active={location.pathname === '/story'} collapsed={isCollapsed} />
          <NavLink to="/archive" icon={<History />} label="Archive" active={location.pathname === '/archive'} collapsed={isCollapsed} />
        </div>

        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-4 top-12 w-8 h-8 rounded-full bg-black border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors z-30"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-500 ${isCollapsed ? 'rotate-180' : ''}`}>
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        <div className="p-6 border-t border-white/5 flex flex-col space-y-4">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} text-white/30 text-sm`} title="System Online">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] shrink-0"></div>
            {!isCollapsed && <span className="whitespace-nowrap">System Online</span>}
          </div>
          <button 
            onClick={handleLogout}
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} text-white/40 hover:text-white transition-colors`}
            title="Sign Out"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="text-sm font-medium whitespace-nowrap">Sign Out</span>}
          </button>
        </div>
      </motion.nav>

      {/* Main Content Area */}
      <main className="flex-1 relative p-10 overflow-y-auto flex flex-col">
        <div className="max-w-6xl mx-auto flex-1 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <Routes location={location}>
                <Route path="/" element={<Studio />} />
                <Route path="/story" element={<Storyteller />} />
                <Route path="/archive" element={<Archive />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Footer */}
        <footer className="mt-12 py-6 border-t border-white/10 text-center text-white/40 text-sm font-light tracking-wide shrink-0">
          <p>Developed by Ritish for EchoLens &copy; {new Date().getFullYear()}. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}

function NavLink({ to, icon, label, active, collapsed }: { to: string, icon: React.ReactNode, label: string, active: boolean, collapsed?: boolean }) {
  return (
    <Link 
      to={to} 
      className={`flex items-center ${collapsed ? 'justify-center p-4' : 'space-x-4 px-5 py-4'} rounded-2xl transition-all duration-300 group relative ${
        active 
          ? 'bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]' 
          : 'text-white/40 hover:text-white hover:bg-white/5'
      }`}
      title={collapsed ? label : undefined}
    >
      <div className={`transition-transform duration-300 ${active ? 'scale-110 text-[#ff4e00]' : 'group-hover:scale-110'}`}>
        {React.cloneElement(icon as React.ReactElement, { 
          className: `w-5 h-5 ${active ? 'text-[#ff4e00]' : ''}` 
        })}
      </div>
      {!collapsed && <span className="font-medium tracking-wide">{label}</span>}
      {active && !collapsed && (
        <motion.div 
          layoutId="activeNav"
          className="absolute right-4 w-1.5 h-1.5 rounded-full bg-[#ff4e00]"
        />
      )}
    </Link>
  );
}
