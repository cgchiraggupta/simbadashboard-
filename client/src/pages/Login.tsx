import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, User, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { Button, cn } from '../components/ui/design-system';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginError } = useAuthStore();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Get values from form directly (more reliable)
    const formData = new FormData(e.currentTarget);
    const formUsername = (formData.get('username') as string) || username;
    const formPassword = (formData.get('password') as string) || password;
    
    console.log('Login attempt with:', formUsername);
    
    // Attempt login
    const success = login(formUsername, formPassword);
    console.log('Login result:', success);
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-[150px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-primary/30 mb-4"
          >
            <Zap size={32} className="text-white" fill="currentColor" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            DRILL<span className="text-primary">SENSE</span>
          </h1>
          <p className="text-gray-400 mt-2">Operator Login Portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-surface/50 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {loginError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm"
              >
                <AlertCircle size={16} />
                {loginError}
              </motion.div>
            )}

            {/* Username Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Username</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  name="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className={cn(
                    "w-full pl-10 pr-4 py-3 bg-black/20 border rounded-lg",
                    "text-white placeholder:text-gray-500",
                    "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                    "border-white/10 transition-all"
                  )}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={cn(
                    "w-full pl-10 pr-12 py-3 bg-black/20 border rounded-lg",
                    "text-white placeholder:text-gray-500",
                    "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                    "border-white/10 transition-all"
                  )}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 text-lg font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Logging in...
                </div>
              ) : (
                'Login'
              )}
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-gray-500 text-center mb-3">Demo Credentials</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-black/20 rounded-lg border border-white/5">
                <p className="text-gray-400">Operator:</p>
                <p className="text-white font-mono">arvind / password123</p>
              </div>
              <div className="p-2 bg-black/20 rounded-lg border border-white/5">
                <p className="text-gray-400">Admin:</p>
                <p className="text-white font-mono">admin / admin123</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          DrillSense Monitoring System v1.0
        </p>
      </motion.div>
    </div>
  );
};
