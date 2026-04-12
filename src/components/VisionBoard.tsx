import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Target, 
  Heart, 
  Plus, 
  Loader2, 
  Download, 
  Trash2,
  Image as ImageIcon,
  Wand2,
  X,
  Lock
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { VisionBoardItem, UserProfile } from '../types';
import { generateImage } from '../services/geminiService';
import { compressImage } from '../lib/imageUtils';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

interface VisionBoardProps {
  user: UserProfile;
}

export const VisionBoard = ({ user }: VisionBoardProps) => {
  const [items, setItems] = useState<VisionBoardItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [type, setType] = useState<'affirmation' | 'goal'>('affirmation');
  const [showCreator, setShowCreator] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'users', user.uid, 'vision-board'),
      orderBy('timestamp', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as VisionBoardItem);
      setItems(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/vision-board`);
    });
    return () => unsubscribe();
  }, [user.uid]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (user.subscription === 'free' && items.length >= 3) {
      alert("Free plan is limited to 3 vision board items. Upgrade to Premium for unlimited manifestions!");
      return;
    }
    setIsGenerating(true);
    
    // Enhance prompt for better art results
    const enhancedPrompt = type === 'affirmation' 
      ? `A beautiful, inspiring, artistic visualization of the affirmation: "${prompt}". Style: ethereal, vibrant, high-quality digital art, no text.`
      : `A powerful, symbolic visualization of the goal: "${prompt}". Style: cinematic, epic, motivational digital art, high-quality, no text.`;

    try {
      const rawImageUrl = await generateImage(enhancedPrompt);
      if (rawImageUrl) {
        // Compress image to stay under Firestore's 1MB limit
        const imageUrl = await compressImage(rawImageUrl, 800, 800, 0.8);
        
        const id = Date.now().toString();
        const newItem: VisionBoardItem = {
          id,
          type,
          prompt: prompt.trim(),
          imageUrl,
          timestamp: Date.now()
        };
        await setDoc(doc(db, 'users', user.uid, 'vision-board', id), newItem);
        setPrompt('');
        setShowCreator(false);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/vision-board/${Date.now().toString()}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to remove this from your vision board?")) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'vision-board', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/vision-board/${id}`);
      }
    }
  };

  return (
    <div className="space-y-8 pb-32">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-display font-bold text-zinc-900">Vision Board</h1>
          <p className="text-sm text-zinc-500 leading-relaxed font-medium">
            Visualize your future. Manifest your intentions through AI-generated art.
          </p>
        </div>
        <Button 
          onClick={() => setShowCreator(true)}
          className="h-12 w-12 rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 flex items-center justify-center"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Creator Modal */}
      <AnimatePresence>
        {showCreator && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isGenerating && setShowCreator(false)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-display font-bold text-zinc-900">Create Vision Art</h3>
                  <button 
                    onClick={() => !isGenerating && setShowCreator(false)}
                    className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex p-1 bg-zinc-100 rounded-2xl">
                  <button
                    onClick={() => setType('affirmation')}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                      type === 'affirmation' ? "bg-white text-primary shadow-sm" : "text-zinc-400"
                    )}
                  >
                    Affirmation
                  </button>
                  <button
                    onClick={() => setType('goal')}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                      type === 'goal' ? "bg-white text-primary shadow-sm" : "text-zinc-400"
                    )}
                  >
                    Goal
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">
                    {type === 'affirmation' ? 'What is your affirmation?' : 'What is your goal?'}
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={type === 'affirmation' ? "e.g., I am worthy of love and success" : "e.g., Running my first marathon"}
                    className="w-full bg-zinc-50 border-none rounded-3xl py-4 px-6 text-sm placeholder:text-zinc-400 focus:ring-2 focus:ring-primary/20 min-h-[120px] resize-none"
                    disabled={isGenerating}
                  />
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating}
                  className="w-full h-14 rounded-2xl bg-zinc-900 text-white font-bold shadow-xl disabled:opacity-50"
                >
                  {isGenerating ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Manifesting...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Wand2 className="h-5 w-5" />
                      <span>Generate Art</span>
                    </div>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 gap-6">
        {items.length > 0 ? (
          items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group relative bg-white rounded-[2.5rem] shadow-sm border border-zinc-50 overflow-hidden"
            >
              <div className="aspect-square relative">
                <img 
                  src={item.imageUrl} 
                  alt={item.prompt}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-8 space-y-4">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = item.imageUrl;
                        link.download = `vision-${item.id}.png`;
                        link.click();
                      }}
                      className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                    >
                      <Download className="h-6 w-6" />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="h-12 w-12 rounded-2xl bg-red-500/20 backdrop-blur-md flex items-center justify-center text-red-200 hover:bg-red-500/30 transition-colors"
                    >
                      <Trash2 className="h-6 w-6" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-2">
                <div className="flex items-center gap-2">
                  {item.type === 'affirmation' ? (
                    <Heart className="h-3 w-3 text-primary" />
                  ) : (
                    <Target className="h-3 w-3 text-secondary" />
                  )}
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    {item.type}
                  </span>
                </div>
                <p className="text-sm font-bold text-zinc-900 leading-relaxed">
                  "{item.prompt}"
                </p>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-20 space-y-6">
            <div className="h-20 w-20 bg-zinc-100 rounded-[2rem] flex items-center justify-center mx-auto text-zinc-300">
              <ImageIcon className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-zinc-900">Your vision is empty</h3>
              <p className="text-sm text-zinc-500 max-w-[240px] mx-auto">
                Start manifesting your goals and affirmations through AI-generated art.
              </p>
            </div>
            <Button 
              onClick={() => setShowCreator(true)}
              className="bg-primary text-white rounded-full px-8"
            >
              Create My First Vision
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
