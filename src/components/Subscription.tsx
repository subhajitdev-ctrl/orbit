import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { 
  Check, 
  Zap, 
  Crown, 
  Star,
  ShieldCheck,
  Globe,
  CreditCard,
  Lock,
  Loader2,
  X,
  ChevronDown
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { UserProfile, Tier } from '../types';
import { cn } from '../lib/utils';

interface SubscriptionProps {
  user: UserProfile;
  onUpgrade: (tier: 'premium' | 'vip') => void;
}

export const Subscription = ({ user, onUpgrade }: SubscriptionProps) => {
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'details' | 'processing' | 'success'>('details');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbanking' | 'paypal'>('paypal');

  const tiers: Tier[] = [
    {
      id: 'free',
      name: 'Free',
      price: '0',
      description: 'Basic support for everyone',
      features: [
        'Daily task generation (Limited)',
        'Basic AI mentorship',
        'Voice support (TTS)',
        'Progress tracking',
        'Community access'
      ],
      icon: <Star className="h-6 w-6 text-zinc-400" />,
      color: 'bg-zinc-50'
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '99',
      description: 'Advanced expert mentorship',
      features: [
        'Expert-level AI mentorship',
        'Personalized pathfinding',
        'Ad-free experience',
        'Priority task generation'
      ],
      icon: <Zap className="h-6 w-6 text-primary" />,
      color: 'bg-[#E8EEEB] border-primary/10',
      popular: true
    },
    {
      id: 'vip',
      name: 'VIP',
      price: '299',
      description: 'High-profile expert coaching',
      features: [
        'All Premium features',
        'One-to-one human expert calls',
        'VIP career pathfinding',
        '24/7 priority support',
        'Exclusive wellness retreats'
      ],
      icon: <Crown className="h-6 w-6 text-amber-500" />,
      color: 'bg-[#F2F0ED] border-amber-200'
    }
  ];

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'INR': '₹',
      'JPY': '¥',
      'AUD': 'A$',
      'CAD': 'C$',
      'CNY': '¥',
      'BRL': 'R$',
      'RUB': '₽',
    };
    return symbols[currency] || currency;
  };

  const handlePayment = () => {
    setPaymentStep('processing');
    setTimeout(() => {
      setPaymentStep('success');
      setTimeout(() => {
        if (selectedTier && selectedTier.id !== 'free') {
          onUpgrade(selectedTier.id);
        }
        setSelectedTier(null);
        setPaymentStep('details');
      }, 2000);
    }, 3000);
  };

  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;

  return (
    <PayPalScriptProvider options={{ clientId: paypalClientId || "test" }}>
      <div className="space-y-8 pb-32">
      <div className="space-y-2">
        <h1 className="text-4xl font-display font-bold text-zinc-900">Choose Your Path</h1>
        <p className="text-sm text-zinc-500 leading-relaxed font-medium">
          Invest in your growth. Our expert mentorship is designed to be accessible and transformative.
        </p>
      </div>

      <div className="space-y-6">
        {tiers.map((tier, index) => (
          <motion.div
            key={tier.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={cn(
              "p-8 rounded-[2.5rem] border-none relative overflow-hidden transition-all",
              tier.color,
              user.subscription === tier.id && "ring-2 ring-primary shadow-lg"
            )}>
              {tier.popular && (
                <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold uppercase tracking-widest py-2 px-4 rounded-bl-3xl">
                  Most Popular
                </div>
              )}
              
              <div className="flex items-start justify-between mb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    {tier.icon}
                    <h3 className="text-xl font-bold text-zinc-900">{tier.name}</h3>
                  </div>
                  <p className="text-xs text-zinc-500 font-medium">{tier.description}</p>
                </div>
                <div className="text-right">
                  <div className="flex flex-col items-end">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-primary">{getCurrencySymbol(user.currency)}{tier.price}</span>
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">/month</span>
                    </div>
                    <p className="text-[8px] font-bold text-primary uppercase tracking-widest">Billed Monthly</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <ul className="grid grid-cols-1 gap-3">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-xs text-zinc-600 font-medium">
                      <div className="h-5 w-5 rounded-full bg-white/50 flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  onClick={() => tier.id !== 'free' && setSelectedTier(tier)}
                  disabled={user.subscription === tier.id}
                  className={cn(
                    "w-full h-14 rounded-2xl font-bold text-sm transition-all",
                    user.subscription === tier.id 
                      ? "bg-zinc-200 text-zinc-500" 
                      : tier.id === 'premium' 
                        ? "bg-primary text-white shadow-lg shadow-primary/20" 
                        : "bg-white text-zinc-900 shadow-sm border border-zinc-100"
                  )}
                >
                  {user.subscription === tier.id ? 'Active Plan' : `Upgrade to ${tier.name}`}
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="p-8 bg-zinc-50 dark:bg-zinc-900 rounded-[2.5rem] flex items-center gap-6">
        <div className="h-14 w-14 rounded-2xl bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm">
          <ShieldCheck className="h-7 w-7 text-primary" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Secure & Private</h4>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
            Your data is encrypted and never shared. We prioritize your mental safety and privacy above all.
          </p>
        </div>
      </div>

      <div className="p-6 border border-zinc-100 dark:border-zinc-800 rounded-[2rem]">
        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
          <strong className="font-bold">Transparency Notice:</strong> ORBIT is a wellness and coaching platform. It is NOT a medical service. Our AI mentors provide guidance based on wellness principles and are not a substitute for clinical diagnosis or treatment.
        </p>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {selectedTier && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md"
            >
              <Card className="p-8 space-y-6 bg-white dark:bg-zinc-950 border-none shadow-2xl relative">
                <button 
                  onClick={() => setSelectedTier(null)}
                  className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600"
                >
                  <X className="h-5 w-5" />
                </button>

                {paymentStep === 'details' && (
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CreditCard className="h-8 w-8 text-primary" />
                      </div>
                      <h2 className="text-xl font-bold">Secure Checkout</h2>
                      <p className="text-sm text-zinc-500">Upgrade to {selectedTier.name} for {user.currency} {selectedTier.price}/mo</p>
                    </div>

                    <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl">
                      <button 
                        onClick={() => setPaymentMethod('paypal')}
                        className={cn(
                          "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                          paymentMethod === 'paypal' ? "bg-zinc-50 dark:bg-zinc-800 shadow-sm" : "text-zinc-500"
                        )}
                      >
                        PayPal
                      </button>
                      <button 
                        onClick={() => setPaymentMethod('card')}
                        className={cn(
                          "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                          paymentMethod === 'card' ? "bg-zinc-50 dark:bg-zinc-800 shadow-sm" : "text-zinc-500"
                        )}
                      >
                        Card
                      </button>
                      <button 
                        onClick={() => setPaymentMethod('upi')}
                        className={cn(
                          "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                          paymentMethod === 'upi' ? "bg-zinc-50 dark:bg-zinc-800 shadow-sm" : "text-zinc-500"
                        )}
                      >
                        UPI
                      </button>
                    </div>

                    <div className="space-y-4">
                      {paymentMethod === 'paypal' && (
                        <div className="space-y-4">
                          <p className="text-[10px] text-zinc-500 text-center uppercase tracking-widest font-bold">Pay safely with your PayPal account</p>
                          <PayPalButtons 
                            style={{ layout: "vertical", shape: "pill", label: "pay" }}
                            createOrder={async () => {
                              const response = await fetch("/api/paypal/create-order", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  amount: selectedTier.price,
                                  currency: user.currency
                                })
                              });
                              const order = await response.json();
                              return order.id;
                            }}
                            onApprove={async (data) => {
                              setPaymentStep('processing');
                              const response = await fetch("/api/paypal/capture-order", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ orderID: data.orderID })
                              });
                              const details = await response.json();
                              if (details.status === "COMPLETED") {
                                setPaymentStep('success');
                                setTimeout(() => {
                                  onUpgrade(selectedTier.id as 'premium' | 'vip');
                                  setSelectedTier(null);
                                  setPaymentStep('details');
                                }, 2000);
                              }
                            }}
                          />
                        </div>
                      )}

                      {paymentMethod === 'card' && (
                        <>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Card Details</label>
                            <div className="relative">
                              <input 
                                type="text" 
                                placeholder="4242 4242 4242 4242"
                                className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-xl p-4 text-sm font-mono text-zinc-500"
                              />
                              <Lock className="absolute right-4 top-4 h-4 w-4 text-zinc-400" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Expiry</label>
                              <input 
                                type="text" 
                                placeholder="MM/YY"
                                className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-xl p-4 text-sm font-mono text-zinc-500"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">CVC</label>
                              <input 
                                type="text" 
                                placeholder="123"
                                className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-xl p-4 text-sm font-mono text-zinc-500"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {paymentMethod === 'upi' && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">UPI ID</label>
                          <input 
                            type="text" 
                            placeholder="username@upi"
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-xl p-4 text-sm font-mono text-zinc-500"
                          />
                        </div>
                      )}

                      {paymentMethod === 'netbanking' && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Select Bank</label>
                          <div className="relative">
                            <select className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-xl p-4 pr-10 text-sm appearance-none text-zinc-500">
                              <option>State Bank of India</option>
                              <option>HDFC Bank</option>
                              <option>ICICI Bank</option>
                              <option>Axis Bank</option>
                              <option>Other Bank</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                              <ChevronDown className="h-4 w-4" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {paymentMethod !== 'paypal' && (
                      <Button 
                        className="w-full py-6 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-lg font-bold"
                        onClick={handlePayment}
                      >
                        Pay {user.currency} {selectedTier.price}
                      </Button>
                    )}
                    
                    <p className="text-[10px] text-center text-zinc-400 uppercase tracking-widest">
                      Powered by ORBIT Secure Pay
                    </p>
                  </div>
                )}

                {paymentStep === 'processing' && (
                  <div className="py-12 text-center space-y-6">
                    <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
                    <div className="space-y-2">
                      <h2 className="text-xl font-bold">Processing Payment</h2>
                      <p className="text-sm text-zinc-500">Securing your expert mentorship path...</p>
                    </div>
                  </div>
                )}

                {paymentStep === 'success' && (
                  <div className="py-12 text-center space-y-6">
                    <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto scale-110">
                      <Check className="h-10 w-10 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold">Payment Successful!</h2>
                      <p className="text-sm text-zinc-500">Welcome to {selectedTier.name} membership.</p>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
    </PayPalScriptProvider>
  );
};

