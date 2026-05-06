import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare,
  Calendar,
  Sparkles,
  Send, 
  Mic, 
  Volume2, 
  VolumeX, 
  Orbit, 
  AlertCircle,
  Loader2,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Smile,
  Trash2,
  StopCircle,
  Play,
  Pause,
  Download,
  X,
  Video,
  Lock
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { CustomAudioPlayer } from './ui/CustomAudioPlayer';
import { AdBanner } from './AdBanner';
import { Message, UserProfile, Attachment } from '../types';
import { getMentorResponse, generateSpeech, transcribeAudio } from '../services/geminiService';
import { compressImage } from '../lib/imageUtils';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { db } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, limit, doc, updateDoc } from 'firebase/firestore';
import { auth as firebaseAuth } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

interface MentorshipChatProps {
  user: UserProfile;
}

export const MentorshipChat = ({ user }: MentorshipChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isCommandMode, setIsCommandMode] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mentorAudioUrl, setMentorAudioUrl] = useState<string | null>(null);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const toggleSpeech = () => {
    if (isSpeechEnabled) {
      stopSpeak();
    }
    setIsSpeechEnabled(!isSpeechEnabled);
  };
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const emojis = [
    '😊', '🙏', '💪', '🌱', '✨', '🧘', '🧠', '❤️', '🌟', '🙌', '💡', '🔥',
    '😔', '😟', '😤', '😴', '🤝', '🌈', '🌊', '🍃', '☀️', '🌙', '⭐', '🍀',
    '🎯', '📝', '🏃', '🚶', '🛌', '🍎', '🍵', '🎨', '🎵', '📚', '🌍', '🏠'
  ];

  useEffect(() => {
    const q = query(
      collection(db, 'users', user.uid, 'chats'),
      orderBy('timestamp', 'asc'),
      limit(50)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as Message);
      if (data.length === 0) {
        // Initial message if no history
        const initial: Message = {
          id: '1',
          role: 'mentor',
          content: `Hello ${user.name}. I am your dedicated expert mentor. I remember you're working on ${user.goals.join(', ')}. How are you feeling today?`,
          timestamp: Date.now(),
        };
        setMessages([initial]);
      } else {
        setMessages(data);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/chats`);
    });
    return () => unsubscribe();
  }, [user.uid]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      stopSpeak();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async (mode: 'message' | 'command' = 'message') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setIsCommandMode(mode === 'command');

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          const base64Data = base64.split(',')[1];
          
          if (mode === 'message') {
            // Add temporary attachment with loading state
            const tempId = Date.now().toString();
            setAttachments(prev => [...prev, {
              type: 'audio',
              url: base64,
              name: `Voice Message ${new Date().toLocaleTimeString()}`,
              transcription: 'Transcribing...'
            }]);

            try {
              const transcription = await transcribeAudio(base64Data);
              setAttachments(prev => prev.map(att => 
                att.url === base64 ? { ...att, transcription: transcription || 'Could not transcribe' } : att
              ));
            } catch (error) {
              console.error("Transcription error:", error);
              setAttachments(prev => prev.map(att => 
                att.url === base64 ? { ...att, transcription: 'Transcription failed' } : att
              ));
            }
          } else {
            // Command Mode
            try {
              const transcription = await transcribeAudio(base64Data);
              if (transcription) {
                processVoiceCommand(transcription);
              }
            } catch (error) {
              console.error("Command transcription error:", error);
            }
          }
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      console.error("Recording error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      if (err instanceof Error && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
        alert("Microphone access was denied. Please enable it in your browser settings to use voice features.");
      } else {
        alert("Could not start recording: " + errorMessage);
      }
    }
  };

  const processVoiceCommand = (text: string) => {
    const cleanText = text.toLowerCase().replace(/[.?!,]/g, '').trim();
    
    if (cleanText === 'send message' || cleanText === 'send') {
      handleSend();
    } else if (cleanText === 'clear') {
      setInput('');
    } else if (cleanText === 'stop' || cleanText === 'quiet') {
      stopSpeak();
    } else if (cleanText === 'play' || cleanText === 'replay' || cleanText === 'repeat') {
      const lastMentorMessage = [...messages].reverse().find(m => m.role === 'mentor');
      if (lastMentorMessage) {
        handleSpeak(lastMentorMessage.content);
      }
    } else if (cleanText === 'help') {
      alert("Voice Commands: 'Send', 'Clear', 'Stop', 'Play', 'Repeat', or just speak to dictate.");
    } else {
      // Default to dictation
      setInput(prev => (prev ? prev + ' ' : '') + text);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        
        if (file.type.startsWith('image/')) {
          try {
            const compressedBase64 = await compressImage(base64, 800, 800, 0.7);
            setAttachments(prev => [...prev, {
              type: 'image',
              url: compressedBase64,
              name: file.name,
              size: file.size
            }]);
          } catch (err) {
            console.error("Image compression failed", err);
          }
        } else {
          let type: Attachment['type'] = 'document';
          if (file.type.startsWith('video/')) type = 'video';
          else if (file.type.startsWith('audio/')) type = 'audio';

          setAttachments(prev => [...prev, {
            type,
            url: base64,
            name: file.name,
            size: file.size
          }]);
        }
      };
      reader.readAsDataURL(file);
    });
    // Reset input so same file can be uploaded again
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const addEmoji = (emoji: string) => {
    setInput(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleSend = async () => {
    const currentInput = input.trim();
    const currentAttachments = [...attachments];
    
    if (!currentInput && currentAttachments.length === 0) return;
    if (isLoading) return;

    setInput('');
    setAttachments([]);
    setShowEmojiPicker(false);
    setIsLoading(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: currentInput,
      timestamp: Date.now(),
    };

    if (currentAttachments.length > 0) {
      userMessage.attachments = currentAttachments;
    }

    try {
      // Crisis Detection
      const crisisKeywords = ['suicide', 'self-harm', 'kill myself', 'end my life', 'want to die', 'hurt myself'];
      const isCrisis = crisisKeywords.some(keyword => currentInput.toLowerCase().includes(keyword));
      
      if (isCrisis) {
        setShowCrisisModal(true);
      }

      // Add to Firestore
      await addDoc(collection(db, 'users', user.uid, 'chats'), userMessage);
      
      // Update Revolution Score
      const currentRevolution = typeof user.revolution === 'number' && !isNaN(user.revolution) ? user.revolution : 15;
      const newRevolution = Math.min(currentRevolution + 1, 100);
      await updateDoc(doc(db, 'users', user.uid), { revolution: newRevolution });
      
      // Get AI Response
      const mentorContent = await getMentorResponse([...messages, userMessage], user);
      const mentorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'mentor',
        content: mentorContent || "I'm here to listen. Could you tell me more?",
        timestamp: Date.now(),
      };
      
      await addDoc(collection(db, 'users', user.uid, 'chats'), mentorMessage);
      
      if (mentorContent && isSpeechEnabled) {
        handleSpeak(mentorContent);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/chats`);
      // Restore input if failed
      setInput(currentInput);
      setAttachments(currentAttachments);
    } finally {
      setIsLoading(false);
    }
  };

  const stopSpeak = () => {
    if (mentorAudioUrl) {
      URL.revokeObjectURL(mentorAudioUrl);
    }
    setMentorAudioUrl(null);
    setIsSpeaking(false);
  };

  const handleSpeak = async (text: string) => {
    if (!text) return;
    
    try {
      stopSpeak();
      setIsSpeaking(true);
      const voiceName = user.mentorVoice === 'male' ? 'Puck' : 'Kore';
      const base64 = await generateSpeech(text, voiceName);
      
      if (base64) {
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Check if it already has a WAV header (starts with RIFF)
        const isWav = binaryString.startsWith('RIFF');
        
        let blob: Blob;
        if (isWav) {
          blob = new Blob([bytes], { type: 'audio/wav' });
        } else {
          // Create a WAV header for the PCM data (assuming 24kHz, 16-bit mono)
          const wavHeader = new ArrayBuffer(44);
          const view = new DataView(wavHeader);
          
          const writeString = (offset: number, string: string) => {
            for (let i = 0; i < string.length; i++) {
              view.setUint8(offset + i, string.charCodeAt(i));
            }
          };

          writeString(0, 'RIFF');
          view.setUint32(4, 36 + bytes.length, true);
          writeString(8, 'WAVE');
          writeString(12, 'fmt ');
          view.setUint32(16, 16, true);
          view.setUint16(20, 1, true); // PCM
          view.setUint16(22, 1, true); // Mono
          view.setUint32(24, 24000, true); // Sample rate
          view.setUint32(28, 48000, true); // Byte rate
          view.setUint16(32, 2, true); // Block align
          view.setUint16(34, 16, true); // Bits per sample
          writeString(36, 'data');
          view.setUint32(40, bytes.length, true);

          blob = new Blob([wavHeader, bytes], { type: 'audio/wav' });
        }
        
        const url = URL.createObjectURL(blob);
        setMentorAudioUrl(url);
      }
    } catch (error) {
      console.error("Speech error:", error);
      setIsSpeaking(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] space-y-6">
      {messages.length <= 1 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-8"
        >
          {/* Mentor Profile Card */}
          <Card className="p-8 bg-white rounded-[2.5rem] shadow-sm border border-zinc-50 text-center space-y-6">
            <div className="relative mx-auto w-32 h-32">
              <div className="w-full h-full rounded-3xl overflow-hidden bg-zinc-900 flex items-center justify-center">
                <Orbit className="h-16 w-16 text-white" />
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-full border-2 border-white">
                Online
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Lead Mentor</p>
                <span className="px-2 py-0.5 bg-zinc-100 text-zinc-500 text-[8px] font-bold uppercase tracking-widest rounded-full border border-zinc-200">
                  AI Assistant
                </span>
                {user.subscription === 'vip' && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-600 text-[8px] font-black uppercase tracking-widest rounded-full border border-amber-200">
                    VIP Priority
                  </span>
                )}
              </div>
              <h2 className="text-3xl font-display font-bold text-zinc-900">Dr. Elena Sterling</h2>
              <p className="text-xs text-zinc-500 leading-relaxed max-w-[240px] mx-auto">
                Clinical Psychologist & Mindfulness Coach with 12+ years of experience in restorative mental health.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4">
              <button 
                onClick={toggleSpeech}
                className="flex flex-col items-center gap-2 group"
              >
                <div className={cn(
                  "h-12 w-12 rounded-full flex items-center justify-center transition-all group-hover:scale-110",
                  isSpeechEnabled ? "bg-[#E8EEEB] text-primary" : "bg-zinc-100 text-zinc-400"
                )}>
                  {isSpeechEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </div>
                <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-400">
                  {isSpeechEnabled ? "Voice On" : "Voice Off"}
                </span>
              </button>
              <button className="flex flex-col items-center gap-2 group">
                <div className="h-12 w-12 rounded-full bg-[#E1E9F4] flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-400">Message</span>
              </button>
              <button 
                onClick={() => user.subscription === 'vip' && setShowBookingModal(true)}
                className={cn(
                  "flex flex-col items-center gap-2 group",
                  user.subscription !== 'vip' && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="h-12 w-12 rounded-full bg-[#F2F0ED] flex items-center justify-center text-zinc-600 group-hover:scale-110 transition-transform">
                  {user.subscription === 'vip' ? <Calendar className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                </div>
                <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-400">
                  {user.subscription === 'vip' ? "Book Session" : "VIP Only"}
                </span>
              </button>
            </div>
          </Card>

          {/* Immediate Presence */}
          <Card className="p-8 bg-[#E8EEEB] rounded-[2.5rem] border-none text-center space-y-4">
            <div className="space-y-1">
              <h3 className="font-bold text-zinc-900">Immediate Presence</h3>
              <p className="text-[10px] text-zinc-500 font-medium">Available 24/7 for guided grounding.</p>
            </div>
            <button 
              onClick={() => {
                const groundingMsg: Message = {
                  id: Date.now().toString(),
                  role: 'mentor',
                  content: "Take a deep breath. Let's focus on the present. Tell me three things you can see right now.",
                  timestamp: Date.now()
                };
                setMessages([...messages, groundingMsg]);
                if (isSpeechEnabled) {
                  handleSpeak(groundingMsg.content);
                }
              }}
              className="mx-auto h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-primary hover:scale-105 transition-transform"
            >
              <Volume2 className="h-8 w-8" />
            </button>
          </Card>

          <Button 
            onClick={() => setMessages([...messages, { id: 'temp', role: 'mentor', content: 'How can I help you today?', timestamp: Date.now() }])}
            className="w-full h-16 rounded-[2rem] bg-zinc-900 text-white font-bold text-lg shadow-xl"
          >
            Start Conversation
          </Button>
        </motion.div>
      )}

      {messages.length > 1 && (
        <div className="flex-1 overflow-y-auto space-y-6 p-2 scrollbar-hide relative">
          <div className="sticky top-0 z-10 flex justify-center pb-4">
            <button
              onClick={toggleSpeech}
              className={cn(
                "px-4 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-sm border transition-all flex items-center gap-2",
                isSpeechEnabled 
                  ? "bg-white text-primary border-zinc-100" 
                  : "bg-zinc-900 text-white border-zinc-800"
              )}
            >
              {isSpeechEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
              {isSpeechEnabled ? "Voice Enabled" : "Voice Muted"}
            </button>
          </div>
          <AdBanner user={user} slotId="MENTOR_CHAT_SLOT" />

          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-end gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className="flex-shrink-0 mb-1">
                  {m.role === 'mentor' ? (
                    <div className="h-10 w-10 bg-zinc-900 rounded-2xl overflow-hidden shadow-sm flex items-center justify-center">
                      <Orbit className="h-5 w-5 text-white" />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-2xl overflow-hidden border-2 border-white shadow-sm bg-primary flex items-center justify-center">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-xs font-bold text-white">{user.name.charAt(0)}</span>
                      )}
                    </div>
                  )}
                </div>
                <div 
                  className={`max-w-[80%] p-5 rounded-[2rem] shadow-sm ${
                    m.role === 'user' 
                      ? 'bg-primary text-white rounded-br-none' 
                      : 'bg-white border border-zinc-50 text-zinc-900 rounded-bl-none'
                  }`}
                >
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>

                  {m.attachments && m.attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {m.attachments.map((att, idx) => (
                        <div key={idx} className="rounded-2xl overflow-hidden border border-zinc-100 bg-zinc-50/50">
                          {att.type === 'image' && (
                            <img src={att.url} alt={att.name} className="w-full h-auto max-h-60 object-cover" referrerPolicy="no-referrer" />
                          )}
                          {att.type === 'video' && (
                            <video src={att.url} controls className="w-full h-auto max-h-60" />
                          )}
                          {att.type === 'audio' && (
                            <div className="p-3 space-y-3">
                              <CustomAudioPlayer 
                                url={att.url} 
                                className="bg-transparent border-none p-0"
                              />
                              {att.transcription && (
                                <div className="bg-zinc-50/50 p-3 rounded-xl border border-zinc-100">
                                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Transcription</p>
                                  <p className="text-xs text-zinc-600 italic leading-relaxed">
                                    "{att.transcription}"
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                          {att.type === 'document' && (
                            <div className="p-3 flex items-center gap-3">
                              <div className="h-8 w-8 bg-zinc-100 rounded-full flex items-center justify-center">
                                <FileText className="h-4 w-4 text-zinc-500" />
                              </div>
                              <span className="text-xs font-medium truncate flex-1">{att.name}</span>
                              <Download className="h-4 w-4 text-zinc-400" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showCrisisModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-900/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl space-y-6 border border-zinc-100 dark:border-zinc-800"
            >
              <div className="h-16 w-16 bg-red-50 rounded-3xl flex items-center justify-center mx-auto">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">You're Not Alone</h2>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  It sounds like you're going through a lot. Please reach out to someone who can help right now.
                </p>
              </div>
              <div className="space-y-3">
                <a 
                  href="tel:988" 
                  className="flex items-center justify-between p-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-colors"
                >
                  <span>988 Suicide & Crisis Lifeline</span>
                  <Volume2 className="h-4 w-4" />
                </a>
                <a 
                  href="https://988lifeline.org/chat/" 
                  target="_blank"
                  className="flex items-center justify-between p-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-2xl font-bold hover:bg-zinc-200 transition-colors"
                >
                  <span>Chat Online (988)</span>
                  <MessageSquare className="h-4 w-4" />
                </a>
              </div>
              <Button 
                variant="ghost" 
                className="w-full h-12 rounded-xl text-zinc-400 font-bold"
                onClick={() => setShowCrisisModal(false)}
              >
                Close
              </Button>
            </motion.div>
          </div>
        )}

        {showBookingModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-900/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl space-y-6 border border-zinc-100 dark:border-zinc-800"
            >
              <div className="h-16 w-16 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto">
                <Calendar className="h-8 w-8 text-amber-600" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Book VIP Session</h2>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  As a VIP member, you have priority access to live sessions with our expert human mentors.
                </p>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Available Slots</span>
                  <span className="font-bold text-emerald-600">3 Today</span>
                </div>
                <div className="h-1 w-full bg-zinc-200 rounded-full overflow-hidden">
                  <div className="h-full w-[60%] bg-emerald-500" />
                </div>
              </div>
              <Button 
                className="w-full h-14 rounded-2xl bg-zinc-900 text-white font-bold"
                onClick={() => {
                  alert("Booking request sent! A human mentor will contact you within 2 hours.");
                  setShowBookingModal(false);
                }}
              >
                Request Call Now
              </Button>
              <Button 
                variant="ghost" 
                className="w-full h-12 rounded-xl text-zinc-400 font-bold"
                onClick={() => setShowBookingModal(false)}
              >
                Cancel
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mentor Speaking Overlay */}
      <AnimatePresence>
        {(isSpeaking || mentorAudioUrl) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 w-full max-w-md px-6 z-50"
          >
            <Card className="p-4 bg-zinc-900 text-white rounded-[2rem] shadow-2xl border-none flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Orbit className={cn("h-6 w-6 text-primary", (isSpeaking && !mentorAudioUrl) ? "animate-spin" : "animate-pulse")} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                  {mentorAudioUrl ? "Mentor Speaking" : "Mentor is preparing voice..."}
                </p>
                {mentorAudioUrl ? (
                  <CustomAudioPlayer 
                    url={mentorAudioUrl} 
                    className="bg-transparent border-none p-0"
                    onEnded={() => stopSpeak()}
                  />
                ) : (
                  <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ x: "-100%" }}
                      animate={{ x: "100%" }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                      className="h-full w-1/2 bg-primary"
                    />
                  </div>
                )}
              </div>
              <button 
                onClick={stopSpeak}
                className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="mt-auto relative">
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute bottom-full left-8 mb-2 flex items-center gap-2"
            >
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Mentor is typing...</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full left-0 mb-4 p-4 bg-white rounded-[2rem] shadow-2xl border border-zinc-100 grid grid-cols-6 gap-2 z-50 w-full"
            >
              {emojis.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => addEmoji(emoji)}
                  className="h-10 w-10 flex items-center justify-center text-xl hover:bg-zinc-50 rounded-xl transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-4 bg-white rounded-[2.5rem] shadow-sm border border-zinc-50">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {attachments.map((att, i) => (
                <div key={i} className="relative group bg-zinc-50 p-2 rounded-2xl flex items-center gap-2 max-w-[150px]">
                  <div className="h-6 w-6 rounded-lg bg-white flex items-center justify-center">
                    {att.type === 'image' ? <ImageIcon className="h-3 w-3 text-primary" /> : 
                     att.type === 'audio' ? <Mic className="h-3 w-3 text-primary" /> :
                     <FileText className="h-3 w-3 text-zinc-400" />}
                  </div>
                  <span className="text-[10px] truncate flex-1 font-medium">{att.name}</span>
                  <button onClick={() => removeAttachment(i)} className="p-1 hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            {isRecording ? (
              <div className={cn(
                "flex-1 flex items-center justify-between rounded-2xl px-4 py-2",
                isCommandMode ? "bg-primary/10" : "bg-red-50"
              )}>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "h-2 w-2 rounded-full animate-pulse",
                    isCommandMode ? "bg-primary" : "bg-red-500"
                  )} />
                  <span className={cn(
                    "text-xs font-mono",
                    isCommandMode ? "text-primary" : "text-red-500"
                  )}>
                    {isCommandMode ? 'Listening for command...' : `${recordingTime}s`}
                  </span>
                </div>
                <button 
                  onClick={stopRecording} 
                  className={isCommandMode ? "text-primary" : "text-red-500"}
                >
                  <StopCircle className="h-6 w-6" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => user.subscription === 'free' ? null : fileInputRef.current?.click()} 
                    className={cn(
                      "p-2.5 rounded-2xl bg-zinc-50 text-zinc-400 hover:text-primary transition-colors",
                      user.subscription === 'free' && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {user.subscription === 'free' ? <Lock className="h-5 w-5" /> : <Paperclip className="h-5 w-5" />}
                  </button>
                  <button 
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
                    className={cn(
                      "p-2.5 rounded-2xl transition-colors",
                      showEmojiPicker ? "bg-primary/10 text-primary" : "bg-zinc-50 text-zinc-400 hover:text-primary"
                    )}
                  >
                    <Smile className="h-5 w-5" />
                  </button>
                  <button 
                    onMouseDown={() => user.subscription === 'free' ? null : startRecording('message')}
                    onMouseUp={stopRecording}
                    onClick={() => user.subscription === 'free' ? null : (!isRecording && startRecording('command'))}
                    className={cn(
                      "p-2.5 rounded-2xl transition-colors",
                      isRecording ? "bg-primary/20 text-primary" : "bg-zinc-50 text-zinc-400 hover:text-primary",
                      user.subscription === 'free' && "opacity-50 cursor-not-allowed"
                    )}
                    title={user.subscription === 'free' ? "Premium Feature" : "Click for Command, Hold for Voice Message"}
                  >
                    {user.subscription === 'free' ? <Lock className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </button>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple className="hidden" />
                
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="What's on your mind?"
                    className="w-full bg-zinc-50 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-primary/20 text-sm placeholder:text-zinc-400 text-zinc-500"
                  />
                </div>
              </>
            )}
            <Button 
              size="icon" 
              onClick={handleSend}
              disabled={(!input.trim() && attachments.length === 0) || isLoading || isRecording}
              className="h-12 w-12 rounded-2xl bg-primary text-white shadow-lg shadow-primary/20"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
