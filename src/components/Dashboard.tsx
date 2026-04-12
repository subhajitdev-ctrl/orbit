import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  Orbit, 
  Target, 
  Calendar, 
  Activity,
  ArrowRight,
  Sparkles,
  Zap,
  Moon,
  Sun,
  Wind,
  Plus,
  MessageSquare,
  Bell
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { ProgressBar } from './ui/ProgressBar';
import { Button } from './ui/Button';
import { UserProfile, ProgressData, MoodEntry, DailyRitual, BioInsight } from '../types';
import { MoodTracker } from './MoodTracker';
import { AdBanner } from './AdBanner';
import { 
  AreaChart, 
  Area, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface DashboardProps {
  user: UserProfile;
  progress: ProgressData[];
  moods: MoodEntry[];
  rituals: DailyRitual[];
  insights: BioInsight[];
  onToggleRitual: (id: string) => void;
  onAddRitual: (title: string) => void;
  onRefreshInsights: () => void;
  onNavigate: (tab: string) => void;
}

export const Dashboard = ({ user, progress, moods, rituals, insights, onToggleRitual, onAddRitual, onRefreshInsights, onNavigate }: DashboardProps) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const yesterdayData = progress.find(p => p.date === yesterdayStr);

  const moodValues: Record<string, number> = {
    motivated: 100,
    calm: 80,
    neutral: 60,
    stressed: 40,
    anxious: 20,
    depressed: 0
  };

  const chartData = [...new Set([...progress.map(p => p.date), ...moods.map(m => m.date)])]
    .sort()
    .map(date => {
      const p = progress.find(p => p.date === date);
      const m = moods.find(m => m.date === date);
      return {
        date,
        progressScore: p ? p.score : null,
        moodScore: m ? moodValues[m.mood] : null,
        moodLabel: m ? m.mood : null
      };
    })
    .slice(-30);

  const completedRitualsCount = rituals.filter(r => r.completed).length;
  const [isAddingRitual, setIsAddingRitual] = React.useState(false);
  const [newRitualTitle, setNewRitualTitle] = React.useState('');
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    onRefreshInsights();
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  const handleAddRitual = () => {
    if (newRitualTitle.trim()) {
      onAddRitual(newRitualTitle);
      setNewRitualTitle('');
      setIsAddingRitual(false);
    }
  };

  const getTrendInsight = () => {
    if (progress.length < 2) return "Keep tracking to see your growth patterns.";
    const recentProgress = progress.slice(-7);
    const avgProgress = recentProgress.reduce((acc, p) => acc + p.score, 0) / recentProgress.length;
    const lastProgress = recentProgress[recentProgress.length - 1]?.score || 0;
    
    if (lastProgress > avgProgress) {
      return "You're trending upward! Your engagement this week is higher than your average.";
    } else if (lastProgress < avgProgress) {
      return "You've had a slight dip in engagement. A short meditation might help reset your focus.";
    }
    return "Your consistency is impressive. You're maintaining a steady pace toward your goals.";
  };

  const quotes = [
    "The only way to do great work is to love what you do. - Steve Jobs",
    "Believe you can and you're halfway there. - Theodore Roosevelt",
    "It does not matter how slowly you go as long as you do not stop. - Confucius",
    "Everything you've ever wanted is on the other side of fear. - George Addair",
    "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
    "Hardships often prepare ordinary people for an extraordinary destiny. - C.S. Lewis",
    "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt"
  ];
  const dailyQuote = quotes[new Date().getDate() % quotes.length];

  return (
    <div className="space-y-8 pb-32">
      {/* Evolution & Revolution Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-sm border border-zinc-50 dark:border-zinc-800 space-y-6"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Your Evolution</p>
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[8px] font-bold text-primary uppercase tracking-widest">Live</span>
                </div>
              </div>
            </div>
            <h2 className="text-base font-display font-bold text-zinc-900 dark:text-zinc-100">Zero to Hero</h2>
          </div>
          <ProgressBar value={user.level} className="h-8 bg-zinc-50 dark:bg-zinc-800" color="bg-primary" />
          <p className="text-[10px] text-zinc-500 leading-relaxed">
            Your overall progress toward your wellness goals.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-sm border border-zinc-50 dark:border-zinc-800 space-y-6"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Revolution Parameter</p>
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse" />
                  <span className="text-[8px] font-bold text-secondary uppercase tracking-widest">Live</span>
                </div>
              </div>
            </div>
            <h2 className="text-base font-display font-bold text-zinc-900 dark:text-zinc-100">Daily Engagement</h2>
          </div>
          <ProgressBar value={user.revolution} className="h-8 bg-zinc-50 dark:bg-zinc-800" color="bg-secondary" />
          <div className="grid grid-cols-2 gap-2">
            {[
              'Daily Check-in',
              'Trend Patterns',
              'Task Completion',
              'Mentor Interaction'
            ].map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <div className="h-1 w-1 rounded-full bg-secondary" />
                <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-400">{item}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Motivational Quote */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-8 bg-zinc-900 rounded-[2.5rem] text-center space-y-4 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <Orbit className="w-64 h-64 -translate-x-1/2 -translate-y-1/2 text-white" />
        </div>
        <Sparkles className="h-6 w-6 text-primary mx-auto" />
        <p className="text-lg font-display font-medium text-white leading-relaxed italic">
          "{dailyQuote}"
        </p>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Daily Inspiration</p>
      </motion.div>

      {/* Mood Tracker */}
      <MoodTracker user={user} />

      {/* Progress Chart */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-zinc-900">Trends & Patterns</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-400">Progress</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-secondary" />
              <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-400">Mood</span>
            </div>
          </div>
        </div>
        <Card className="p-6 bg-white rounded-[2.5rem] shadow-sm border border-zinc-50 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-secondary)" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="var(--color-secondary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                hide 
              />
              <YAxis hide domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '1rem', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}
                formatter={(value: number) => {
                  return [value, 'Score'];
                }}
              />
              <Area 
                type="monotone" 
                dataKey="progressScore" 
                stroke="var(--color-primary)" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorProgress)" 
                connectNulls
              />
              <Area 
                type="monotone" 
                dataKey="moodScore" 
                stroke="var(--color-secondary)" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorMood)" 
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <div className="px-4 py-3 bg-primary/5 rounded-2xl border border-primary/10 flex items-start gap-3">
          <Zap className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-[10px] font-medium text-zinc-600 leading-relaxed">
            <span className="font-bold text-primary uppercase tracking-widest mr-1">Insight:</span>
            {getTrendInsight()}
          </p>
        </div>
      </div>

      {/* Daily Rituals & Reminders */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-zinc-900">Daily Rituals & Reminders</h3>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-primary">{completedRitualsCount} of {rituals.length} Completed</span>
            <button 
              onClick={() => setIsAddingRitual(!isAddingRitual)}
              aria-label="Add new ritual"
              className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <AdBanner user={user} />
        
        <div className="space-y-3">
          <AnimatePresence>
            {isAddingRitual && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-white rounded-3xl shadow-sm border border-primary/20 space-y-3"
              >
                <input 
                  autoFocus
                  type="text"
                  placeholder="What's your new ritual?"
                  value={newRitualTitle}
                  onChange={(e) => setNewRitualTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddRitual()}
                  className="w-full bg-zinc-50 border-none rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={handleAddRitual} className="flex-1 rounded-xl">Add Ritual</Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsAddingRitual(false)} className="rounded-xl">Cancel</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {rituals.map((ritual, i) => (
            <motion.div
              key={ritual.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => onToggleRitual(ritual.id)}
              className="flex items-center gap-4 p-4 bg-white rounded-3xl shadow-sm border border-zinc-50 cursor-pointer active:scale-[0.98] transition-transform"
            >
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center transition-colors",
                ritual.completed ? "bg-primary text-white" : "bg-zinc-50 text-zinc-300 border border-zinc-100"
              )}>
                {ritual.completed ? <CheckCircle2 className="h-5 w-5" /> : <div className="h-2 w-2 rounded-full bg-zinc-200" />}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-zinc-900">{ritual.title}</h4>
                <p className="text-xs text-zinc-500">{ritual.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-300" />
            </motion.div>
          ))}
          {/* User's custom reminders if any */}
          {user.reminders?.enabled && (
            <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-3xl border border-primary/10">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Bell className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-zinc-900">Daily Check-in</h4>
                <p className="text-xs text-zinc-500">Scheduled for {user.reminders.time}</p>
              </div>
              <Zap className="h-4 w-4 text-primary animate-pulse" />
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 px-1">Quick Actions</h3>
        <div className="grid grid-cols-3 gap-4">
          <button 
            onClick={() => onNavigate('tasks')}
            className="p-4 bg-white rounded-[2rem] shadow-sm border border-zinc-50 text-left space-y-3 hover:scale-[1.02] transition-transform"
          >
            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Plus className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold text-zinc-900 block">New Task</span>
          </button>
          <button 
            onClick={() => onNavigate('chat')}
            className="p-4 bg-white rounded-[2rem] shadow-sm border border-zinc-50 text-left space-y-3 hover:scale-[1.02] transition-transform"
          >
            <div className="h-10 w-10 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
              <MessageSquare className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold text-zinc-900 block">Mentor</span>
          </button>
          <button 
            onClick={() => onNavigate('vision')}
            className="p-4 bg-white rounded-[2rem] shadow-sm border border-zinc-50 text-left space-y-3 hover:scale-[1.02] transition-transform"
          >
            <div className="h-10 w-10 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold text-zinc-900 block">Vision</span>
          </button>
        </div>
      </div>

      {/* Bio-Insights */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-zinc-900">Bio-Insights</h3>
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label="Refresh insights"
            className={cn(
              "p-1.5 rounded-lg bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition-all",
              isRefreshing && "animate-spin"
            )}
          >
            <Orbit className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          {insights.map((insight, i) => (
            <motion.div 
              key={insight.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-4 p-4 bg-white rounded-3xl shadow-sm border border-zinc-50"
            >
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center",
                insight.type === 'sleep' ? "bg-primary/10 text-primary" :
                insight.type === 'activity' ? "bg-secondary/10 text-secondary" :
                insight.type === 'stress' ? "bg-rose-500/10 text-rose-600" :
                "bg-amber-500/10 text-amber-600"
              )}>
                {insight.type === 'sleep' ? <Moon className="h-5 w-5" /> :
                 insight.type === 'activity' ? <Activity className="h-5 w-5" /> :
                 insight.type === 'stress' ? <Wind className="h-5 w-5" /> :
                 <Zap className="h-5 w-5" />}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-zinc-900">{insight.title}</h4>
                <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full mt-2 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${insight.score}%` }}
                    className={cn(
                      "h-full rounded-full",
                      insight.type === 'sleep' ? "bg-primary" :
                      insight.type === 'activity' ? "bg-secondary" :
                      insight.type === 'stress' ? "bg-rose-500" :
                      "bg-amber-500"
                    )} 
                  />
                </div>
              </div>
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{insight.value}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
