import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  MessageSquare, 
  CheckSquare, 
  CreditCard, 
  Moon, 
  Sun,
  User,
  Settings,
  Orbit,
  Sparkles,
  LogOut,
  Loader2,
  Calendar,
  Bell,
  X,
  Plus,
  Check,
  ChevronDown,
  CheckCircle2,
  Upload,
  Trash2,
  AlertCircle,
  Smartphone,
  Download
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { MentorshipChat } from './components/MentorshipChat';
import { TaskTracker } from './components/TaskTracker';
import { Subscription } from './components/Subscription';
import { VisionBoard } from './components/VisionBoard';
import { Auth } from './components/Auth';
import { Card } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { UserProfile, ProgressData, MoodEntry, Message, DailyRitual, BioInsight } from './types';
import { cn } from './lib/utils';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, onSnapshot, query, orderBy, limit, updateDoc, deleteDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './lib/firestoreUtils';
import { sendInAppNotification, sendEmailMock, subscribeToNotifications, Notification } from './services/notificationService';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark';
    }
    return false;
  });
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [progress, setProgress] = useState<ProgressData[]>([]);
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [rituals, setRituals] = useState<DailyRitual[]>([]);
  const [insights, setInsights] = useState<BioInsight[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsNavVisible(false);
      } else {
        setIsNavVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    const applyTheme = () => {
      const theme = user?.theme || 'light';
      const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      
      if (isDark) {
        document.documentElement.classList.add('dark');
        setIsDarkMode(true);
      } else {
        document.documentElement.classList.remove('dark');
        setIsDarkMode(false);
      }
    };

    applyTheme();
    
    if (user?.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [user?.theme]);

  useEffect(() => {
    const accent = user?.accentColor || 'emerald';
    // Remove all previous accent classes
    const accentClasses = ['accent-emerald', 'accent-blue', 'accent-purple', 'accent-rose', 'accent-amber'];
    document.documentElement.classList.remove(...accentClasses);
    document.documentElement.classList.add(`accent-${accent}`);
  }, [user?.accentColor]);

  useEffect(() => {
    let unsubscribeUser: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Set up real-time listener for user profile
        unsubscribeUser = onSnapshot(doc(db, 'users', firebaseUser.uid), (snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.data() as UserProfile;
            // Ensure revolution and level are valid numbers
            userData.level = typeof userData.level === 'number' && !isNaN(userData.level) ? userData.level : 28;
            userData.revolution = typeof userData.revolution === 'number' && !isNaN(userData.revolution) ? userData.revolution : 15;
            
            setUser(userData);
            if (!userData.symptoms || userData.symptoms.length === 0) {
              setShowSetup(true);
            }
          } else {
            setShowSetup(true);
          }
          setIsAuthReady(true);
        }, (error) => {
          console.error("User profile listener error:", error);
          setIsAuthReady(true);
        });
      } else {
        if (unsubscribeUser) unsubscribeUser();
        setUser(null);
        setIsAuthReady(true);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
    };
  }, []);

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'users', user.uid, 'progress'),
        orderBy('date', 'asc'),
        limit(30)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => doc.data() as ProgressData);
        setProgress(data);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}/progress`);
      });
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'users', user.uid, 'moods'),
        orderBy('date', 'asc'),
        limit(30)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => doc.data() as MoodEntry);
        setMoods(data);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}/moods`);
      });
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToNotifications(user.uid, (data) => {
        setNotifications(data);
      });
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'users', user.uid, 'rituals'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => doc.data() as DailyRitual);
        if (data.length === 0) {
          // Initialize default rituals
          const defaults: DailyRitual[] = [
            { id: 'r1', title: "Meditate for 10 min", description: "Morning stillness session", completed: false },
            { id: 'r2', title: "Drink 2L water", description: "Stay hydrated throughout the day", completed: false },
            { id: 'r3', title: "Sleep at 10 PM", description: "Consistent circadian rhythm", completed: false },
          ];
          defaults.forEach(r => {
            setDoc(doc(db, 'users', user.uid, 'rituals', r.id), r);
          });
        } else {
          // Reset rituals if it's a new day
          const today = new Date().toISOString().split('T')[0];
          data.forEach(async (r) => {
            if (r.completed && r.lastCompletedDate !== today) {
              await updateDoc(doc(db, 'users', user.uid, 'rituals', r.id), { completed: false });
            }
          });
          setRituals(data);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}/rituals`);
      });
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'users', user.uid, 'insights'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => doc.data() as BioInsight);
        if (data.length === 0) {
          // Initialize default insights
          const defaults: BioInsight[] = [
            { id: 'i1', title: "Sleep Quality", value: "8.2h", score: 85, type: 'sleep' },
            { id: 'i2', title: "Daily Activity", value: "6.4k steps", score: 65, type: 'activity' },
            { id: 'i3', title: "Stress Level", value: "Low", score: 20, type: 'stress' },
          ];
          defaults.forEach(i => {
            setDoc(doc(db, 'users', user.uid, 'insights', i.id), i);
          });
        } else {
          setInsights(data);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}/insights`);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleTaskComplete = async (taskId: string) => {
    if (!user) return;
    const currentLevel = typeof user.level === 'number' && !isNaN(user.level) ? user.level : 28;
    const currentRevolution = typeof user.revolution === 'number' && !isNaN(user.revolution) ? user.revolution : 15;
    
    const newLevel = Math.min(currentLevel + 2, 100);
    const newRevolution = Math.min(currentRevolution + 5, 100);
    const today = new Date().toISOString().split('T')[0];
    
    try {
      await setDoc(doc(db, 'users', user.uid), { ...user, level: newLevel, revolution: newRevolution }, { merge: true });
      await setDoc(doc(db, 'users', user.uid, 'progress', today), { date: today, score: newLevel });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const handleToggleRitual = async (ritualId: string) => {
    if (!user) return;
    const ritual = rituals.find(r => r.id === ritualId);
    if (!ritual) return;

    const today = new Date().toISOString().split('T')[0];
    const newCompleted = !ritual.completed;
    
    try {
      await updateDoc(doc(db, 'users', user.uid, 'rituals', ritualId), { 
        completed: newCompleted,
        lastCompletedDate: newCompleted ? today : ritual.lastCompletedDate
      });

      if (newCompleted) {
        const currentRevolution = typeof user.revolution === 'number' && !isNaN(user.revolution) ? user.revolution : 15;
        await updateDoc(doc(db, 'users', user.uid), { revolution: Math.min(currentRevolution + 2, 100) });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/rituals/${ritualId}`);
    }
  };

  const handleAddRitual = async (title: string) => {
    if (!user || !title.trim()) return;
    const id = `r_${Date.now()}`;
    const newRitual: DailyRitual = {
      id,
      title,
      description: "Custom daily ritual",
      completed: false
    };
    try {
      await setDoc(doc(db, 'users', user.uid, 'rituals', id), newRitual);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/rituals/${id}`);
    }
  };

  const handleRefreshInsights = async () => {
    if (!user) return;
    
    // Simulate AI analysis of progress and moods
    const recentMoods = moods.slice(-7);
    const avgMoodScore = recentMoods.length > 0 
      ? recentMoods.reduce((acc, m) => {
          const values: Record<string, number> = { motivated: 100, calm: 80, neutral: 60, stressed: 40, anxious: 20, depressed: 0 };
          return acc + values[m.mood];
        }, 0) / recentMoods.length
      : 60;

    const newInsights: BioInsight[] = [
      { 
        id: 'i1', 
        title: "Sleep Quality", 
        value: avgMoodScore > 70 ? "8.4h" : "6.8h", 
        score: Math.round(avgMoodScore), 
        type: 'sleep' 
      },
      { 
        id: 'i2', 
        title: "Daily Activity", 
        value: `${Math.round(user.level * 100)} steps`, 
        score: Math.round(user.level), 
        type: 'activity' 
      },
      { 
        id: 'i3', 
        title: "Stress Level", 
        value: avgMoodScore > 60 ? "Low" : "Moderate", 
        score: Math.round(100 - avgMoodScore), 
        type: 'stress' 
      },
      {
        id: 'i4',
        title: "Focus Score",
        value: user.revolution > 50 ? "High" : "Normal",
        score: Math.round(user.revolution),
        type: 'focus'
      }
    ];

    try {
      for (const insight of newInsights) {
        await setDoc(doc(db, 'users', user.uid, 'insights', insight.id), insight);
      }
      
      await sendInAppNotification(
        user.uid,
        'Insights Updated',
        'AI has analyzed your recent trends and updated your Bio-Insights.',
        'info'
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/insights`);
    }
  };

  const handleUpgrade = async (tier: 'premium' | 'vip') => {
    if (!user) return;
    try {
      const price = tier === 'premium' ? '99' : '299';
      await setDoc(doc(db, 'users', user.uid), { ...user, subscription: tier }, { merge: true });
      
      // Send In-App Notification
      await sendInAppNotification(
        user.uid, 
        'Plan Upgraded!', 
        `Welcome to ${tier.toUpperCase()}! You now have access to all ${tier} features.`,
        'success'
      );

      // Send Mock Email
      await sendEmailMock(
        user.email,
        `Order Receipt - ORBIT ${tier.toUpperCase()}`,
        `Hello ${user.name},\n\nThank you for upgrading to ORBIT ${tier.toUpperCase()}! Your payment of ${user.currency} ${price} has been processed successfully.\n\nEnjoy your new expert mentorship features!\n\nBest,\nThe ORBIT Team`
      );

      setActiveTab('dashboard');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const markNotificationAsRead = async (id: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'notifications', id), { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const clearNotifications = async () => {
    if (!user) return;
    try {
      // For simplicity, we just mark all as read or delete them
      // Here we'll just mark as read
      notifications.forEach(async (n) => {
        if (!n.read) await markNotificationAsRead(n.id);
      });
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const handleSetupComplete = async (symptoms: string[], goals: string[], ageRange: string) => {
    if (!auth.currentUser) return;
    
    // Localization logic
    const language = navigator.language || 'en-US';
    const currencyMap: { [key: string]: string } = {
      'en-IN': 'INR',
      'hi-IN': 'INR',
      'bn-IN': 'INR',
      'en-US': 'USD',
      'en-GB': 'GBP',
      'de-DE': 'EUR',
      'fr-FR': 'EUR',
    };
    const currency = currencyMap[language] || 'USD';

    const newUser: UserProfile = {
      uid: auth.currentUser.uid,
      name: auth.currentUser.displayName || 'User',
      email: auth.currentUser.email || '',
      level: 28, // Initial level as requested
      revolution: 15, // Initial revolution score
      symptoms,
      goals,
      ageRange,
      subscription: 'free',
      language,
      currency,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), newUser);
      setUser(newUser);
      setShowSetup(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${auth.currentUser.uid}`);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user && !showSetup) {
    return <Auth onAuthSuccess={(u) => setUser(u)} />;
  }

  if (showSetup) {
    return <SetupScreen onComplete={handleSetupComplete} />;
  }

  const renderContent = () => {
    if (!user) return null;
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            user={user} 
            progress={progress} 
            moods={moods} 
            rituals={rituals}
            insights={insights}
            onToggleRitual={handleToggleRitual}
            onAddRitual={handleAddRitual}
            onRefreshInsights={handleRefreshInsights}
            onNavigate={setActiveTab} 
          />
        );
      case 'chat':
        return <MentorshipChat user={user} />;
      case 'tasks':
        return <TaskTracker user={user} onTaskComplete={handleTaskComplete} />;
      case 'vision':
        return <VisionBoard user={user} />;
      case 'subscription':
        return <Subscription user={user} onUpgrade={handleUpgrade} />;
      case 'settings':
        return <SettingsScreen user={user} onUpdate={setUser} deferredPrompt={deferredPrompt} onInstall={handleInstallClick} />;
      default:
        return (
          <Dashboard 
            user={user} 
            progress={progress} 
            moods={moods} 
            rituals={rituals}
            insights={insights}
            onToggleRitual={handleToggleRitual}
            onAddRitual={handleAddRitual}
            onRefreshInsights={handleRefreshInsights}
            onNavigate={setActiveTab} 
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-neutral text-main transition-colors duration-300 font-sans selection:bg-primary/20">
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-neutral/80 backdrop-blur-xl px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Orbit className="h-6 w-6 text-white" />
            </div>
            <span className="font-display font-black text-2xl tracking-tighter text-main uppercase">
              ORBIT
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end -space-y-0.5">
              <span className="text-[10px] font-bold text-main uppercase tracking-tight">
                {user.name}
              </span>
              <div className="flex items-center gap-1.5">
                <div className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center min-w-[3rem] whitespace-nowrap">
                  <span className="text-[9px] font-black text-primary uppercase tracking-tight tabular-nums">
                    LVL {Math.round(user.level || 0)}
                  </span>
                </div>
                <div className="px-2 py-0.5 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center min-w-[3rem] whitespace-nowrap">
                  <span className="text-[9px] font-black text-secondary uppercase tracking-tight tabular-nums">
                    REV {Math.round(user.revolution || 0)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Toggle notifications"
                className="p-2.5 rounded-full bg-card shadow-sm text-zinc-600 dark:text-zinc-400 hover:text-primary transition-colors relative group active:scale-95 border border-card-border"
              >
                <Bell className="h-5 w-5 group-hover:animate-ring" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-primary rounded-full border-2 border-card-bg"></span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden z-[60]"
                  >
                    <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Notifications</h3>
                      <button 
                        onClick={clearNotifications}
                        className="text-[10px] font-bold text-primary uppercase tracking-widest hover:opacity-70"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto scrollbar-hide">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div 
                            key={n.id} 
                            onClick={() => markNotificationAsRead(n.id)}
                            className={cn(
                              "p-4 border-b border-zinc-50 dark:border-zinc-800/50 cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
                              !n.read && "bg-primary/5"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "h-2 w-2 rounded-full mt-1.5 flex-shrink-0",
                                n.type === 'success' ? "bg-emerald-500" : n.type === 'warning' ? "bg-amber-500" : "bg-primary"
                              )} />
                              <div className="space-y-1">
                                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{n.title}</p>
                                <p className="text-[10px] text-zinc-500 leading-relaxed">{n.message}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center space-y-2">
                          <Bell className="h-8 w-8 text-zinc-200 mx-auto" />
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">No new alerts</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="h-10 w-10 rounded-full border-2 border-card-bg shadow-sm overflow-hidden bg-card flex-shrink-0">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-zinc-400 bg-zinc-50 dark:bg-zinc-800">
                    <User className="h-5 w-5" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-32 px-6 max-w-md mx-auto min-h-screen relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
        
        {/* Footer */}
        <div className="py-12 text-center space-y-6">
          <div className="max-w-xs mx-auto p-4 border border-zinc-100 dark:border-zinc-800 rounded-2xl">
            <p className="text-[9px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
              <strong className="font-bold">Medical Disclaimer:</strong> ORBIT is a wellness and coaching platform. It is NOT a medical service or a substitute for professional clinical advice. If you are in a crisis, please contact emergency services immediately.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.4em]">By STUDIO OCTO</p>
            <p className="text-[10px] text-zinc-400 font-medium">© 2026 ORBIT. All rights reserved.</p>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <motion.nav 
        initial={{ y: 0 }}
        animate={{ y: isNavVisible ? 0 : 100 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border-t border-zinc-100 dark:border-zinc-800 px-6 py-4 pb-8"
      >
        <div className="max-w-md mx-auto flex items-center justify-between">
          <NavButton 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')}
            icon={<Home className="h-5 w-5" />}
            label="Dashboard"
          />
          <NavButton 
            active={activeTab === 'tasks'} 
            onClick={() => setActiveTab('tasks')}
            icon={<CheckSquare className="h-5 w-5" />}
            label="Tasks"
          />
          <NavButton 
            active={activeTab === 'chat'} 
            onClick={() => setActiveTab('chat')}
            icon={<MessageSquare className="h-5 w-5" />}
            label="Mentorship"
          />
          <NavButton 
            active={activeTab === 'vision'} 
            onClick={() => setActiveTab('vision')}
            icon={<Sparkles className="h-5 w-5" />}
            label="Vision"
          />
          <NavButton 
            active={activeTab === 'subscription'} 
            onClick={() => setActiveTab('subscription')}
            icon={<CreditCard className="h-5 w-5" />}
            label="Plans"
          />
          <NavButton 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')}
            icon={<User className="h-5 w-5" />}
            label="Profile"
          />
        </div>
      </motion.nav>
    </div>
  );
}

function SettingsScreen({ 
  user, 
  onUpdate, 
  deferredPrompt, 
  onInstall 
}: { 
  user: UserProfile, 
  onUpdate: (u: UserProfile) => void,
  deferredPrompt: any,
  onInstall: () => void
}) {
  const [reminders, setReminders] = useState(user.reminders || { enabled: false, time: '09:00' });
  const [language, setLanguage] = useState(user.language || 'en-US');
  const [currency, setCurrency] = useState(user.currency || 'USD');
  const [mentorVoice, setMentorVoice] = useState<'male' | 'female'>(user.mentorVoice || 'female');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(user.theme || 'light');
  const [accentColor, setAccentColor] = useState<'emerald' | 'blue' | 'purple' | 'rose' | 'amber'>(user.accentColor || 'emerald');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 200;
          const MAX_HEIGHT = 200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setAvatarUrl(dataUrl);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const updatedUser = { ...user, reminders, language, currency, avatarUrl, mentorVoice, theme, accentColor };
      await setDoc(doc(db, 'users', user.uid), updatedUser, { merge: true });
      onUpdate(updatedUser);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-32">
      <div className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 px-1">Identity & Preferences</p>
        <h1 className="text-4xl font-display font-bold text-zinc-900">Profile Settings</h1>
      </div>

      {deferredPrompt && (
        <Card className="p-8 bg-primary/5 dark:bg-primary/10 rounded-[2.5rem] border border-primary/20 text-center space-y-6">
          <div className="h-16 w-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto">
            <Smartphone className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Install ORBIT App</h3>
            <p className="text-xs text-zinc-500">Install ORBIT on your home screen for a native experience.</p>
          </div>
          <Button onClick={onInstall} className="w-full h-14 rounded-2xl shadow-lg shadow-primary/20">
            <Download className="h-5 w-5 mr-2" />
            Install Now
          </Button>
        </Card>
      )}
      
      {/* Appearance Settings */}
      <Card className="p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-sm border border-zinc-50 dark:border-zinc-800 space-y-8">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Appearance</h3>
          <p className="text-xs text-zinc-500">Customize how ORBIT looks on your device.</p>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Theme</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
              { id: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
              { id: 'system', label: 'System', icon: <Settings className="h-4 w-4" /> }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id as UserProfile['theme'])}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                  theme === t.id 
                    ? "border-primary bg-primary/5 text-primary" 
                    : "border-zinc-100 dark:border-zinc-800 text-zinc-500 hover:border-zinc-200"
                )}
              >
                {t.icon}
                <span className="text-[10px] font-bold uppercase tracking-widest">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Accent Color</label>
          <div className="flex flex-wrap gap-4">
            {[
              { id: 'emerald', color: '#10b981' },
              { id: 'blue', color: '#3b82f6' },
              { id: 'purple', color: '#a855f7' },
              { id: 'rose', color: '#f43f5e' },
              { id: 'amber', color: '#f59e0b' }
            ].map((c) => (
              <button
                key={c.id}
                onClick={() => setAccentColor(c.id as UserProfile['accentColor'])}
                className={cn(
                  "h-10 w-10 rounded-full border-4 transition-all hover:scale-110",
                  accentColor === c.id ? "border-zinc-900 dark:border-white" : "border-transparent"
                )}
                style={{ backgroundColor: c.color }}
              />
            ))}
          </div>
        </div>
      </Card>
      <Card className="p-8 bg-white rounded-[2.5rem] shadow-sm border border-zinc-50 text-center space-y-6">
        <div className="relative mx-auto w-32 h-32">
          <div className="w-full h-full rounded-3xl overflow-hidden bg-primary flex items-center justify-center shadow-xl border-4 border-white">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="text-4xl font-bold text-white">{user.name.charAt(0)}</span>
            )}
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-2 -right-2 p-3 bg-zinc-900 text-white rounded-2xl shadow-lg hover:scale-110 transition-transform"
          >
            <Upload className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-bold text-zinc-900">{user.name}</h2>
          <p className="text-xs text-zinc-500">{user.email}</p>
        </div>

        <div className="flex gap-3 justify-center">
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl h-10 px-4 bg-zinc-50 border-none text-zinc-600 hover:bg-zinc-100"
          >
            Change Photo
          </Button>
          {avatarUrl && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setAvatarUrl('')}
              className="rounded-xl h-10 px-4 text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              Remove
            </Button>
          )}
        </div>
      </Card>

      {/* Reminders Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 px-1">Daily Rituals & Reminders</h3>
        <Card className="p-6 bg-white rounded-[2.5rem] shadow-sm border border-zinc-50 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-900">Daily Check-in</h4>
                <p className="text-[10px] text-zinc-500">Main app reminder</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {reminders.enabled && (
                <input 
                  type="time" 
                  value={reminders.time} 
                  onChange={(e) => setReminders({ ...reminders, time: e.target.value })}
                  className="bg-zinc-50 border-none rounded-lg p-2 text-xs font-bold text-zinc-500"
                />
              )}
              <button 
                onClick={() => setReminders({ ...reminders, enabled: !reminders.enabled })}
                className={cn(
                  "w-12 h-6 rounded-full transition-colors relative",
                  reminders.enabled ? "bg-primary" : "bg-zinc-200"
                )}
              >
                <div className={cn(
                  "absolute top-1 h-4 w-4 rounded-full bg-white transition-all",
                  reminders.enabled ? "right-1" : "left-1"
                )} />
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* Preferences Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 px-1">Preferences</h3>
        <Card className="p-6 bg-white rounded-[2.5rem] shadow-sm border border-zinc-50 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Language</label>
              <div className="relative">
                <select 
                  value={language} 
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-zinc-50 border-none rounded-2xl p-4 pr-10 text-sm font-bold text-zinc-500 appearance-none"
                >
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="hi-IN">Hindi (India)</option>
                  <option value="bn-IN">Bengali (India)</option>
                  <option value="es-ES">Spanish</option>
                  <option value="fr-FR">French</option>
                  <option value="de-DE">German</option>
                  <option value="ja-JP">Japanese</option>
                  <option value="zh-CN">Chinese (Simplified)</option>
                  <option value="ar-SA">Arabic</option>
                  <option value="pt-BR">Portuguese (Brazil)</option>
                  <option value="ru-RU">Russian</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Currency</label>
              <div className="relative">
                <select 
                  value={currency} 
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-zinc-50 border-none rounded-2xl p-4 pr-10 text-sm font-bold text-zinc-500 appearance-none"
                >
                  <option value="USD">USD ($)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="AUD">AUD (A$)</option>
                  <option value="CAD">CAD (C$)</option>
                  <option value="CNY">CNY (¥)</option>
                  <option value="AED">AED (د.إ)</option>
                  <option value="SAR">SAR (ر.س)</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Mentor Voice</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setMentorVoice('female')}
                className={cn(
                  "p-4 rounded-2xl border text-sm font-bold transition-all",
                  mentorVoice === 'female' 
                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                    : "bg-zinc-50 border-zinc-100 text-zinc-500 hover:bg-zinc-100"
                )}
              >
                Female Voice
              </button>
              <button 
                onClick={() => setMentorVoice('male')}
                className={cn(
                  "p-4 rounded-2xl border text-sm font-bold transition-all",
                  mentorVoice === 'male' 
                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                    : "bg-zinc-50 border-zinc-100 text-zinc-500 hover:bg-zinc-100"
                )}
              >
                Male Voice
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* Privacy & Security Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 px-1">Privacy & Security</h3>
        <Card className="p-6 bg-white rounded-[2.5rem] shadow-sm border border-zinc-50 space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-zinc-900">Data Protection</h4>
                <p className="text-[10px] text-zinc-500 leading-relaxed">Your data is encrypted and stored securely in our private cloud. We do not sell your personal information.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Settings className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-zinc-900">Global Compliance</h4>
                <p className="text-[10px] text-zinc-500 leading-relaxed">ORBIT follows global wellness standards. We prioritize your privacy and give you full control over your data.</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="w-full h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/5"
              onClick={() => window.open('https://orbit-wellness.com/privacy', '_blank')}
            >
              View Full Privacy Policy
            </Button>
          </div>
        </Card>
      </div>

      {/* Save Button */}
      <Button 
        className={cn(
          "w-full h-16 rounded-[2rem] text-lg font-bold transition-all duration-500 shadow-xl",
          saveSuccess 
            ? "bg-primary text-white shadow-primary/20" 
            : "bg-zinc-900 text-white shadow-zinc-900/20"
        )} 
        onClick={handleSave}
        disabled={isSaving}
      >
        {isSaving ? (
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        ) : saveSuccess ? (
          <div className="flex items-center justify-center gap-2">
            <Check className="h-6 w-6" />
            <span>Profile Updated</span>
          </div>
        ) : (
          "Save Changes"
        )}
      </Button>

      <Button 
        variant="ghost" 
        className="w-full h-14 rounded-2xl text-zinc-400 font-bold hover:text-red-500 hover:bg-red-50 transition-colors"
        onClick={() => auth.signOut()}
      >
        <LogOut className="h-5 w-5 mr-2" />
        Sign Out
      </Button>
    </div>
  );
}

function SetupScreen({ onComplete }: { onComplete: (symptoms: string[], goals: string[], ageRange: string) => void }) {
  const [step, setStep] = useState(1);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedAge, setSelectedAge] = useState<string>('');
  const [agreedToDisclaimer, setAgreedToDisclaimer] = useState(false);

  const symptoms = ["Depression", "Anxiety", "Trauma", "Addiction", "Stress", "Career Confusion"];
  const goals = ["Inner Peace", "Career Success", "Better Relationships", "Self Understanding", "Goal Achievement"];
  const ageRanges = ["Under 18", "18-24", "25-34", "35-44", "45-54", "55+"];

  const toggle = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-100 dark:bg-zinc-900">
      <Card className="w-full max-w-md p-8 rounded-[2.5rem]">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 text-center"
            >
              <div className="h-16 w-16 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="h-8 w-8 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold">Important Notice</h2>
              <div className="p-4 border border-zinc-100 dark:border-zinc-800 rounded-2xl text-left">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  <strong className="font-bold">Medical Disclaimer:</strong> ORBIT is a wellness and coaching platform. It is NOT a medical service or a substitute for professional clinical advice. Our AI mentors provide guidance based on wellness principles, not clinical diagnosis.
                </p>
              </div>
              <div className="flex items-start gap-3 text-left">
                <input 
                  type="checkbox" 
                  id="setup-disclaimer"
                  checked={agreedToDisclaimer}
                  onChange={(e) => setAgreedToDisclaimer(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary"
                />
                <label htmlFor="setup-disclaimer" className="text-xs text-zinc-500 font-medium">
                  I understand that ORBIT is a wellness tool and not a medical service.
                </label>
              </div>
              <Button className="w-full h-14 rounded-2xl" onClick={() => setStep(2)} disabled={!agreedToDisclaimer}>
                I Understand & Agree
              </Button>
            </motion.div>
          ) : step === 2 ? (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold">What is your age?</h2>
              <p className="text-zinc-500">This helps your mentor understand your life stage.</p>
              <div className="grid grid-cols-2 gap-3">
                {ageRanges.map(a => (
                  <button
                    key={a}
                    onClick={() => setSelectedAge(a)}
                    className={cn(
                      "p-3 rounded-xl border text-sm transition-all",
                      selectedAge === a 
                        ? "bg-primary text-white border-primary" 
                        : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-800"
                    )}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <Button className="w-full h-14 rounded-2xl" onClick={() => setStep(3)} disabled={!selectedAge}>
                Next
              </Button>
            </motion.div>
          ) : step === 3 ? (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold">What are you facing?</h2>
              <p className="text-zinc-500">Select all that apply. Your mentor will use this to guide you.</p>
              <div className="grid grid-cols-2 gap-3">
                {symptoms.map(s => (
                  <button
                    key={s}
                    onClick={() => toggle(selectedSymptoms, setSelectedSymptoms, s)}
                    className={cn(
                      "p-3 rounded-xl border text-sm transition-all",
                      selectedSymptoms.includes(s) 
                        ? "bg-primary text-white border-primary" 
                        : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-800"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1 h-14 rounded-2xl" onClick={() => setStep(2)}>Back</Button>
                <Button className="flex-[2] h-14 rounded-2xl" onClick={() => setStep(4)} disabled={selectedSymptoms.length === 0}>
                  Next
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold">What are your goals?</h2>
              <p className="text-zinc-500">What do you want to achieve with ORBIT?</p>
              <div className="grid grid-cols-2 gap-3">
                {goals.map(g => (
                  <button
                    key={g}
                    onClick={() => toggle(selectedGoals, setSelectedGoals, g)}
                    className={cn(
                      "p-3 rounded-xl border text-sm transition-all",
                      selectedGoals.includes(g) 
                        ? "bg-primary text-white border-primary" 
                        : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-800"
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1 h-14 rounded-2xl" onClick={() => setStep(3)}>Back</Button>
                <Button className="flex-[2] h-14 rounded-2xl" onClick={() => onComplete(selectedSymptoms, selectedGoals, selectedAge)} disabled={selectedGoals.length === 0}>
                  Complete Setup
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 transition-all duration-300 relative",
        active 
          ? "text-zinc-900 dark:text-white" 
          : "text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400"
      )}
    >
      <div className={cn(
        "p-2 rounded-2xl transition-all duration-300",
        active && "bg-zinc-100 dark:bg-zinc-800"
      )}>
        {icon}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{label}</span>
      {active && (
        <motion.div 
          layoutId="nav-indicator"
          className="absolute -bottom-1 h-1 w-1 rounded-full bg-zinc-900 dark:bg-white"
        />
      )}
    </button>
  );
}

