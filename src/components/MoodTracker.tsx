import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smile, 
  Frown, 
  Meh, 
  Zap, 
  Cloud, 
  Wind,
  Check,
  Loader2,
  Calendar
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Mood, MoodEntry, UserProfile } from '../types';
import { db } from '../firebase';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

interface MoodTrackerProps {
  user: UserProfile;
}

export const MoodTracker = ({ user }: MoodTrackerProps) => {
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [todayEntry, setTodayEntry] = useState<MoodEntry | null>(null);

  const moods: { type: Mood; icon: React.ElementType; label: string; color: string }[] = [
    { type: 'motivated', icon: Zap, label: 'Motivated', color: 'bg-yellow-400' },
    { type: 'calm', icon: Wind, label: 'Calm', color: 'bg-primary' },
    { type: 'neutral', icon: Meh, label: 'Neutral', color: 'bg-zinc-400' },
    { type: 'stressed', icon: Cloud, label: 'Stressed', color: 'bg-orange-400' },
    { type: 'anxious', icon: Wind, label: 'Anxious', color: 'bg-purple-400' },
    { type: 'depressed', icon: Frown, label: 'Depressed', color: 'bg-blue-400' },
  ];

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid, 'moods', today), (doc) => {
      if (doc.exists()) {
        setTodayEntry(doc.data() as MoodEntry);
        setSelectedMood(doc.data().mood);
        setNote(doc.data().note || '');
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/moods/${today}`);
    });
    return () => unsubscribe();
  }, [user.uid]);

  const handleSave = async () => {
    if (!selectedMood) return;
    setIsSaving(true);
    const today = new Date().toISOString().split('T')[0];
    const entry: MoodEntry = {
      date: today,
      mood: selectedMood,
      note: note.trim(),
      timestamp: Date.now()
    };

    try {
      await setDoc(doc(db, 'users', user.uid, 'moods', today), entry);
      
      // Update Revolution Score
      const currentRevolution = typeof user.revolution === 'number' && !isNaN(user.revolution) ? user.revolution : 15;
      const newRevolution = Math.min(currentRevolution + 5, 100);
      await setDoc(doc(db, 'users', user.uid), { revolution: newRevolution }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/moods/${today}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="p-8 bg-white rounded-[2.5rem] shadow-sm border border-zinc-50 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Daily Check-in</p>
          <h3 className="text-2xl font-display font-bold text-zinc-900">How are you feeling?</h3>
        </div>
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <Calendar className="h-6 w-6" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {moods.map((m) => {
          const Icon = m.icon;
          const isSelected = selectedMood === m.type;
          return (
            <button
              key={m.type}
              onClick={() => setSelectedMood(m.type)}
              className={cn(
                "flex flex-col items-center gap-3 p-4 rounded-3xl transition-all border-2",
                isSelected 
                  ? "border-primary bg-primary/5 scale-105" 
                  : "border-transparent bg-zinc-50 hover:bg-zinc-100"
              )}
            >
              <div className={cn(
                "h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-black/5",
                isSelected ? m.color : "bg-zinc-300"
              )}>
                <Icon className="h-6 w-6" />
              </div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-widest",
                isSelected ? "text-primary" : "text-zinc-400"
              )}>
                {m.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Any specific triggers or thoughts? (Optional)"
          className="w-full bg-zinc-50 border-none rounded-3xl py-4 px-6 text-sm placeholder:text-zinc-400 focus:ring-2 focus:ring-primary/20 min-h-[100px] resize-none text-zinc-500"
        />

        <Button 
          onClick={handleSave}
          disabled={!selectedMood || isSaving}
          className="w-full h-14 rounded-2xl bg-zinc-900 text-white font-bold shadow-xl disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : todayEntry ? (
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5" />
              Update Entry
            </div>
          ) : (
            "Log Mood"
          )}
        </Button>
      </div>
    </Card>
  );
};
