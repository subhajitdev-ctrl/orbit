import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Lock, 
  Phone, 
  ArrowRight, 
  Orbit, 
  AlertCircle,
  Loader2,
  UserPlus,
  LogIn
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { UserProfile } from '../types';

interface AuthProps {
  onAuthSuccess: (user: UserProfile) => void;
}

export const Auth = ({ onAuthSuccess }: AuthProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [agreedToDisclaimer, setAgreedToDisclaimer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isLogin && !isForgot && !agreedToDisclaimer) {
      setError("You must agree to the Medical Disclaimer to continue.");
      return;
    }

    setLoading(true);

    try {
      await setPersistence(auth, browserLocalPersistence);
      if (isForgot) {
        await sendPasswordResetEmail(auth, email);
        setError("Password reset email sent!");
        setIsForgot(false);
      } else if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (userDoc.exists()) {
          onAuthSuccess(userDoc.data() as UserProfile);
        } else {
          // This shouldn't happen if they signed up correctly, but handle it
          setError("User profile not found. Please sign up.");
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        
        const newUser: UserProfile = {
          uid: userCredential.user.uid,
          name: name,
          email: email,
          phoneNumber: phoneNumber,
          level: 28,
          revolution: 15,
          symptoms: [],
          goals: [],
          subscription: 'free',
          language: navigator.language || 'en-US',
          currency: 'USD', // Default, will be updated by localization
          createdAt: new Date().toISOString()
        };

        await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
        onAuthSuccess(newUser);
      }
    } catch (err: unknown) {
      if (err instanceof Error && (err as any).code === 'auth/operation-not-allowed') {
        setError("Email/Password login is not enabled in Firebase. Please enable it in the Firebase Console (Authentication > Sign-in method).");
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-100 dark:bg-zinc-900">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            className="inline-flex p-4 bg-zinc-900 dark:bg-white rounded-3xl mb-6 shadow-2xl shadow-zinc-500/20"
          >
            <Orbit className="h-10 w-10 text-white dark:text-zinc-900" />
          </motion.div>
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight font-serif">
            ORBIT
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-3 text-lg font-medium">
            Your path to clarity.
          </p>
        </div>

        <Card className="p-10 border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] dark:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] rounded-[2.5rem]">
          <form onSubmit={handleAuth} className="space-y-6">
            <AnimatePresence mode="wait">
              {!isLogin && !isForgot && (
              <>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Full Name</label>
                  <div className="relative">
                    <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                    <input 
                      type="text" 
                      required 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4"
                >
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Phone Number (Optional)</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                    <input 
                      type="tel" 
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl"
                >
                  <div className="flex gap-3">
                    <input 
                      type="checkbox" 
                      id="disclaimer"
                      checked={agreedToDisclaimer}
                      onChange={(e) => setAgreedToDisclaimer(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="disclaimer" className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      <strong className="font-bold">Medical Disclaimer:</strong> ORBIT is a wellness and coaching platform. It is NOT a medical service or a substitute for professional clinical advice. If you are in a crisis, please contact emergency services immediately.
                    </label>
                  </div>
                </motion.div>
              </>
            )}
            </AnimatePresence>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {!isForgot && (
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                  <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-900/30"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <Button 
              type="submit" 
              className="w-full py-4 text-lg" 
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <div className="flex items-center gap-2">
                  {isForgot ? 'Reset Password' : isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="h-5 w-5" />
                </div>
              )}
            </Button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-3">
            {!isForgot && (
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-primary transition-colors"
              >
                {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
              </button>
            )}
            <button 
              onClick={() => {
                setIsForgot(!isForgot);
                setIsLogin(true);
                setError(null);
              }}
              className="text-sm text-zinc-500 dark:text-zinc-500 hover:text-primary transition-colors"
            >
              {isForgot ? "Back to Login" : "Forgot Password?"}
            </button>
          </div>
        </Card>

        <p className="text-center text-xs text-zinc-400 mt-10 px-4 font-medium uppercase tracking-widest">
          By continuing, you agree to ORBIT's Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
};
