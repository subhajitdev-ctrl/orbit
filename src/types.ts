export type Mood = 'calm' | 'anxious' | 'depressed' | 'stressed' | 'motivated' | 'neutral';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phoneNumber?: string;
  ageRange?: string;
  avatarUrl?: string;
  level: number; // 0 to 100 (Zero to Hero)
  revolution: number; // Engagement score (0 to 100)
  symptoms: string[];
  goals: string[];
  subscription: 'free' | 'premium' | 'vip';
  language: string;
  currency: string;
  country?: string;
  createdAt?: string;
  mentorVoice?: 'male' | 'female';
  reminders?: {
    enabled: boolean;
    time: string; // "HH:mm"
  };
  theme?: 'light' | 'dark' | 'system';
  accentColor?: 'emerald' | 'blue' | 'purple' | 'rose' | 'amber';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  category: 'Mental Health' | 'Habit Building' | 'Career Development' | 'Physical Health';
  dueDate: string;
}

export interface Attachment {
  type: 'image' | 'video' | 'document' | 'audio';
  url: string;
  name?: string;
  size?: number;
  transcription?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'mentor';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
}

export interface ProgressData {
  date: string;
  score: number;
}

export interface MoodEntry {
  date: string;
  mood: Mood;
  note?: string;
  timestamp: number;
}

export interface DailyRitual {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  lastCompletedDate?: string;
}

export interface BioInsight {
  id: string;
  title: string;
  value: string;
  score: number;
  type: 'sleep' | 'activity' | 'stress' | 'focus';
}

export interface Tier {
  id: 'free' | 'premium' | 'vip';
  name: string;
  price: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
  color: string;
  popular?: boolean;
}

export interface VisionBoardItem {
  id: string;
  type: 'affirmation' | 'goal';
  prompt: string;
  imageUrl: string;
  timestamp: number;
}
