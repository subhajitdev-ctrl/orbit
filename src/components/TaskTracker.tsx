import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  Brain, 
  Target, 
  Briefcase, 
  Heart,
  Plus,
  RefreshCw,
  Loader2,
  Check,
  Sparkles,
  Filter,
  ArrowUpDown,
  Calendar as CalendarIcon,
  Clock,
  Lock
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Task, UserProfile } from '../types';
import { generateDailyTasks } from '../services/geminiService';
import { cn } from '../lib/utils';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, setDoc, doc, getDocs, writeBatch } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

interface TaskTrackerProps {
  user: UserProfile;
  onTaskComplete: (taskId: string) => void;
}

export const TaskTracker = ({ user, onTaskComplete }: TaskTrackerProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Completed'>('All');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const categories = ['All', 'Mental Health', 'Habit Building', 'Career Development', 'Physical Health'];

  useEffect(() => {
    const q = query(
      collection(db, 'users', user.uid, 'tasks')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as Task);
      setTasks(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/tasks`);
    });
    return () => unsubscribe();
  }, [user.uid]);

  const filteredTasks = tasks
    .filter(t => {
      const catMatch = activeFilter === 'All' || t.category === activeFilter;
      const statusMatch = statusFilter === 'All' || 
        (statusFilter === 'Active' && !t.completed) || 
        (statusFilter === 'Completed' && t.completed);
      return catMatch && statusMatch;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = a.dueDate.localeCompare(b.dueDate);
      } else if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortBy === 'category') {
        comparison = a.category.localeCompare(b.category);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const dailyTasks = await generateDailyTasks(user);
      const batch = writeBatch(db);
      dailyTasks.forEach(task => {
        const taskRef = doc(collection(db, 'users', user.uid, 'tasks'), task.id);
        batch.set(taskRef, task);
      });
      await batch.commit();
    } catch (error) {
      console.error("Failed to fetch tasks", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTask = async (task: Task) => {
    const updatedTask = { ...task, completed: !task.completed };
    try {
      await setDoc(doc(db, 'users', user.uid, 'tasks', task.id), updatedTask);
      if (updatedTask.completed) {
        onTaskComplete(task.id);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/tasks/${task.id}`);
    }
  };

  const times = ["08:00 AM", "12:30 PM", "04:00 PM", "07:00 PM", "09:30 PM"];

  const dailyTips = [
    {
      title: "Try Brahmi for focus",
      description: "Considered the 'Herb of Grace,' Brahmi supports cognitive function and calms the nervous system during intense tasks.",
      icon: <Sparkles className="h-4 w-4" />
    },
    {
      title: "Practice Box Breathing",
      description: "Inhale for 4, hold for 4, exhale for 4, and hold for 4. This simple technique can reset your nervous system in minutes.",
      icon: <Brain className="h-4 w-4" />
    },
    {
      title: "Digital Detox",
      description: "Try to stay away from screens for at least 30 minutes before bed to improve your sleep quality and mental clarity.",
      icon: <Clock className="h-4 w-4" />
    },
    {
      title: "Mindful Walking",
      description: "Take a short walk and focus entirely on the sensation of your feet hitting the ground. It's a powerful grounding exercise.",
      icon: <Target className="h-4 w-4" />
    },
    {
      title: "Hydration Check",
      description: "Dehydration can lead to fatigue and brain fog. Drink a glass of water now to refresh your mind and body.",
      icon: <Heart className="h-4 w-4" />
    },
    {
      title: "Gratitude Journaling",
      description: "Write down three things you're grateful for today. Shifting focus to the positive can rewire your brain for happiness.",
      icon: <Sparkles className="h-4 w-4" />
    },
    {
      title: "Sunlight Exposure",
      description: "Spend 10 minutes in natural sunlight this morning. It helps regulate your circadian rhythm and boosts Vitamin D.",
      icon: <Sparkles className="h-4 w-4" />
    },
    {
      title: "Ashwagandha for Stress",
      description: "This ancient adaptogen helps your body manage stress and can improve your overall sense of well-being.",
      icon: <Brain className="h-4 w-4" />
    }
  ];

  const currentTip = dailyTips[new Date().getDate() % dailyTips.length];

  return (
    <div className="space-y-8 pb-32">
      <div className="space-y-2">
        <h1 className="text-4xl font-display font-bold text-zinc-900">Today's Path</h1>
        <p className="text-sm text-zinc-500 leading-relaxed font-medium">
          Focus on the present moment. Your journey is unique, and every small step is a milestone toward balance.
        </p>
      </div>

      {/* Progress Summary */}
      <Card className="p-6 bg-white rounded-[2.5rem] shadow-sm border border-zinc-50">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Daily Progress</p>
            <h3 className="text-xl font-display font-bold text-zinc-900">
              {tasks.filter(t => t.completed).length} of {tasks.length} Completed
            </h3>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
        <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(tasks.filter(t => t.completed).length / (tasks.length || 1)) * 100}%` }}
            className="h-full bg-primary"
          />
        </div>
      </Card>

      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-zinc-900">Daily Intentions</h3>
          {tasks.length > 0 && (
            <button 
              onClick={user.subscription === 'free' ? undefined : fetchTasks}
              disabled={isLoading || user.subscription === 'free'}
              className={cn(
                "text-[10px] font-bold uppercase tracking-widest transition-opacity flex items-center gap-1.5",
                user.subscription === 'free' ? "text-zinc-400 cursor-not-allowed" : "text-primary hover:opacity-70"
              )}
            >
              {user.subscription === 'free' ? <Lock className="h-3 w-3" /> : <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />}
              {user.subscription === 'free' ? "Premium Only" : "Refresh Path"}
            </button>
          )}
        </div>

        {/* Advanced Filters & Sorting */}
        <div className="bg-zinc-50/50 p-4 rounded-[2rem] border border-zinc-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={cn(
                    "px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all",
                    activeFilter === cat 
                      ? "bg-primary text-white shadow-md shadow-primary/20" 
                      : "bg-white text-zinc-400 border border-zinc-100 hover:border-primary/30"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-zinc-100">
            <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-zinc-100">
              {(['All', 'Active', 'Completed'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all",
                    statusFilter === status 
                      ? "bg-zinc-900 text-white" 
                      : "text-zinc-400 hover:text-zinc-600"
                  )}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-zinc-100">
              <span className="pl-2 text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Sort by:</span>
              {(['date', 'title', 'category'] as const).map((sort) => (
                <button
                  key={sort}
                  onClick={() => {
                    if (sortBy === sort) {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy(sort);
                      setSortOrder('asc');
                    }
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-1",
                    sortBy === sort 
                      ? "bg-zinc-100 text-zinc-900" 
                      : "text-zinc-400 hover:text-zinc-600"
                  )}
                >
                  {sort}
                  {sortBy === sort && (
                    <ArrowUpDown className={cn("h-2.5 w-2.5 transition-transform", sortOrder === 'desc' && "rotate-180")} />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="relative space-y-8 pl-4">
          {/* Timeline Line */}
          <div className="absolute left-[21px] top-2 bottom-2 w-0.5 bg-zinc-100" />
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTasks.length > 0 ? (
            filteredTasks.map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative flex items-start gap-6"
              >
                {/* Time Dot */}
                <div className={cn(
                  "mt-1.5 h-4 w-4 rounded-full border-2 z-10 transition-colors",
                  task.completed ? "bg-primary border-primary" : "bg-white border-zinc-200"
                )}>
                  {task.completed && <Check className="h-2.5 w-2.5 text-white mx-auto mt-0.5" />}
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                        <CalendarIcon className="h-2.5 w-2.5" />
                        {task.dueDate}
                      </p>
                      <span className="text-zinc-200">|</span>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {times[i % times.length] || "Scheduled"}
                      </p>
                    </div>
                    <span className="text-[8px] font-bold text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-full">
                      {task.category}
                    </span>
                  </div>
                  <div 
                    onClick={() => toggleTask(task)}
                    className={cn(
                      "p-4 rounded-3xl transition-all cursor-pointer",
                      task.completed ? "bg-zinc-50 opacity-60" : "bg-white shadow-sm border border-zinc-50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className={cn("text-sm font-bold", task.completed ? "text-zinc-500" : "text-zinc-900")}>
                        {task.title}
                      </h4>
                      <div className={cn(
                        "h-5 w-5 rounded border flex items-center justify-center transition-colors",
                        task.completed ? "bg-primary border-primary" : "border-zinc-200"
                      )}>
                        {task.completed && <Check className="h-3 w-3 text-white" />}
                      </div>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{task.description}</p>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 space-y-4">
              <p className="text-sm text-zinc-500">
                {activeFilter === 'All' ? "No path set for today yet." : `No ${activeFilter} tasks for today.`}
              </p>
              {activeFilter === 'All' && (
                <Button onClick={fetchTasks} className="bg-primary text-white rounded-full px-8">
                  Define My Path
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tip of the Day */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-6 bg-[#F9E8D9] rounded-3xl space-y-3 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Sparkles size={80} />
        </div>
        <div className="flex items-center gap-2 text-primary">
          {currentTip.icon}
          <span className="text-[10px] font-bold uppercase tracking-widest">Tip of the Day</span>
        </div>
        <h4 className="font-bold text-zinc-900">{currentTip.title}</h4>
        <p className="text-xs text-zinc-700 leading-relaxed">
          {currentTip.description}
        </p>
      </motion.div>
    </div>
  );
};
