import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Box, ShieldCheck, Loader2, ArrowRight, Mail, Lock } from 'lucide-react';

const Login = () => {
  const { login, isAuthLoading } = useApp();
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await login(email, password);
    if (!success) {
      setError('Invalid email or password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600 rounded-full blur-[100px]"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-600 rounded-full blur-[100px]"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-700/50 p-8 pt-12">

          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl mb-6 shadow-2xl shadow-blue-500/20">
              <Box size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">AssetGuard</h1>
            <p className="text-slate-400 mt-2 font-medium">Enterprise Asset Management</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-700/30">
              <div className="flex items-center gap-4 text-slate-300 mb-6">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                  <ShieldCheck size={20} className="text-blue-400" />
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-white">Secure Access</p>
                  <p className="text-xs text-slate-500">Authorized Personnel Only</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Mail size={14} className="inline mr-2" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your@email.com"
                    required
                    disabled={isAuthLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Lock size={14} className="inline mr-2" />
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                    required
                    disabled={isAuthLoading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isAuthLoading}
                className="w-full mt-6 bg-white hover:bg-slate-100 text-slate-900 font-bold py-4 rounded-xl transition-all flex items-center justify-center group disabled:opacity-60 shadow-xl shadow-white/5 active:scale-[0.98]"
              >
                {isAuthLoading ? (
                  <Loader2 size={24} className="animate-spin text-blue-600" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform text-slate-400" />
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-950/30 p-4 rounded-xl border border-red-900/30 text-center">
                {error}
              </div>
            )}
          </form>

          <div className="mt-8 text-center text-xs text-slate-500">
            <p>Default Admin: admin@youroffice.com / admin123</p>
          </div>

          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900/50 rounded-full border border-slate-700/50">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Secure LAN Node v2.5</span>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-slate-500 text-xs">
          &copy; 2024 Your Organization IT Services. All Rights Reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;
