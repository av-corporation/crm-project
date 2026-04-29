import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Checkbox } from '../components/ui/checkbox';
import { cn } from '../lib/utils';
import { Target, LogIn, Lock, Eye, EyeOff, Loader2, User, Leaf, Globe, ArrowRight, Shield, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const Login: React.FC = () => {
  const { signIn, user, profile, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState(searchParams.get('username') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Inline error states
  const [identifierError, setIdentifierError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    // Load Remember Me preference
    const savedRememberMe = localStorage.getItem('rememberMe') === 'true';
    const savedIdentifier = localStorage.getItem('lastIdentifier');
    
    if (savedRememberMe && savedIdentifier) {
      setRememberMe(true);
      setIdentifier(savedIdentifier);
    }
  }, []);

  useEffect(() => {
    if (profile?.mustChangePassword) {
      setShowPasswordChange(true);
    } else if (user && profile) {
      const targetPath = profile.role === 'admin' ? '/dashboard' : '/leads';
      navigate(targetPath);
    }
  }, [user, profile, navigate]);

  const validate = () => {
    let isValid = true;
    setIdentifierError('');
    setPasswordError('');
    setGeneralError('');

    if (!identifier.trim()) {
      setIdentifierError('Username, Email or Mobile is required');
      isValid = false;
    }

    if (!password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setGeneralError('');
    
    try {
      const profile = await signIn(identifier, password);
      
      // Save Remember Me preference
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('lastIdentifier', identifier);
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('lastIdentifier');
      }
      
      toast.success('Login successful! Redirecting...');
    } catch (error: any) {
      console.error('Login error:', error);
      setGeneralError(error.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      toast.error('New password is required');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      if (profile) {
        await updateDoc(doc(db, 'users', profile.uid), {
          password: newPassword.trim(),
          mustChangePassword: false
        });
        toast.success('Password updated successfully! Please login again.');
        logout();
        setShowPasswordChange(false);
        setPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      toast.error('Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (user && !profile?.mustChangePassword) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-white gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <div className="font-black uppercase tracking-[0.3em] text-sm animate-pulse">Logging you in...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row overflow-hidden selection:bg-blue-500/30">
      {/* Password Change Overlay */}
      <AnimatePresence>
        {showPasswordChange && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="text-blue-500 w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Security Update</h2>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Please set a new password for your account</p>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">New Password</label>
                  <Input 
                    type="password"
                    placeholder="••••••••"
                    className="h-14 bg-slate-950 border-slate-800 rounded-2xl text-white font-bold focus:ring-blue-500/20"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Confirm Password</label>
                  <Input 
                    type="password"
                    placeholder="••••••••"
                    className="h-14 bg-slate-950 border-slate-800 rounded-2xl text-white font-bold focus:ring-blue-500/20"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <Button 
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-2xl"
                >
                  {loading ? <Loader2 className="animate-spin" /> : 'Update Password'}
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* LEFT SIDE: Branding Panel */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative p-12 flex-col justify-between overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-24 -right-24 w-96 h-96 border-[40px] border-white/5 rounded-full"
          />
          <motion.div 
            animate={{ 
              y: [0, -20, 0],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-1/4 -left-12 w-64 h-64 bg-white/5 rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <span className="text-white font-black text-xl tracking-tighter uppercase italic">A V CORPORATION</span>
          </div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-5xl font-black text-white mb-6 leading-[1.1] tracking-tight">
              Eco-Friendly <br />
              <span className="text-blue-200">Innovation</span>
            </h2>
            <p className="text-blue-100 text-lg font-medium max-w-md leading-relaxed opacity-80">
              Empower your business with sustainable growth strategies and next-generation customer relationship management tools.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-8"
          >
            <div className="flex -space-x-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-12 h-12 rounded-full border-4 border-blue-700 bg-blue-500 flex items-center justify-center overflow-hidden shadow-xl">
                  <img src={`https://picsum.photos/seed/${i + 10}/100/100`} alt="User" referrerPolicy="no-referrer" />
                </div>
              ))}
              <div className="w-12 h-12 rounded-full border-4 border-blue-700 bg-blue-400 flex items-center justify-center text-white font-black text-xs shadow-xl">
                +2k
              </div>
            </div>
            <div className="text-blue-100 text-sm font-bold">
              Joined by <span className="text-white">2,000+</span> professionals <br />
              across the globe.
            </div>
          </motion.div>
        </div>

        {/* Illustration Icon */}
        <motion.div 
          animate={{ 
            y: [0, -15, 0],
            rotate: [0, 5, 0]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 right-12 w-48 h-48 bg-white/10 backdrop-blur-xl rounded-[3rem] flex items-center justify-center border border-white/20 shadow-2xl"
        >
          <Globe className="text-white w-24 h-24 opacity-40" />
          <Leaf className="text-emerald-400 w-16 h-16 absolute -bottom-4 -right-4 drop-shadow-2xl" />
        </motion.div>
      </div>

      {/* RIGHT SIDE: Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-16 bg-white relative">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center md:text-left">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 mb-4 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest"
            >
              <Shield className="w-3 h-3" />
              Secure Enterprise Access
            </motion.div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Welcome Back</h2>
            <p className="text-slate-500 font-bold text-sm">Enter your credentials to access your workspace.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <AnimatePresence mode="wait">
              {generalError && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold text-center uppercase tracking-widest"
                >
                  {generalError}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Username / Email / Mobile</label>
                <AnimatePresence>
                  {identifierError && (
                    <motion.span 
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-[9px] font-black text-red-500 uppercase tracking-widest"
                    >
                      {identifierError}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <div className="relative group">
                <User className={cn(
                  "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300",
                  identifierError ? "text-red-500" : "text-slate-400 group-focus-within:text-blue-600"
                )} />
                <Input 
                  placeholder="Username, email or mobile" 
                  className={cn(
                    "input-standard pl-12 h-14",
                    identifierError && "border-red-200 focus:border-red-500/50 focus:ring-red-500/5",
                    !identifierError && identifier && "border-emerald-200"
                  )}
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (identifierError) setIdentifierError('');
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                <AnimatePresence>
                  {passwordError && (
                    <motion.span 
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-[9px] font-black text-red-500 uppercase tracking-widest"
                    >
                      {passwordError}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <div className="relative group">
                <Lock className={cn(
                  "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300",
                  passwordError ? "text-red-500" : "text-slate-400 group-focus-within:text-blue-600"
                )} />
                <Input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  className={cn(
                    "input-standard pl-12 pr-12 h-14",
                    passwordError && "border-red-200 focus:border-red-500/50 focus:ring-red-500/5",
                    !passwordError && password && "border-emerald-200"
                  )}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember" 
                  checked={rememberMe} 
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  className="border-slate-200 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <label htmlFor="remember" className="text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer select-none">Remember Me</label>
              </div>
              <button type="button" className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors">Forgot Password?</button>
            </div>

            <Button 
              type="submit"
              disabled={loading}
              className="btn-primary w-full h-14 text-sm uppercase tracking-[0.1em] gap-3"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In to CRM
                </>
              )}
            </Button>
            
            <div className="text-center pt-4">
              <p className="text-xs font-bold text-slate-500">
                Don't have an account? <button type="button" className="text-blue-600 hover:underline">Create New Account</button>
              </p>
            </div>
          </form>

          <div className="mt-12 pt-8 border-t border-slate-100 flex justify-between items-center text-[9px] uppercase tracking-[0.25em] text-slate-400 font-black">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              AES-256 ENCRYPTED
            </div>
            <span>V2.4.0 PRO</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
