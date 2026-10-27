import React, { useState } from 'react';
import { 
  Sparkles, 
  Store, 
  MapPin, 
  Phone, 
  FileText, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  KeyRound, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  RotateCcw
} from 'lucide-react';
import { 
  getAccount, 
  saveAccount, 
  saveAuthUser, 
  maskEmail 
} from '../services/storage';
import { soundEngine } from '../services/audioService';

export const AuthView = ({ onLoginSuccess }) => {
  // Existing registered account (if any)
  const [existingAccount, setExistingAccount] = useState(() => getAccount());

  // Current view: 'login' | 'register' | 'forgot_otp' | 'forgot_reset'
  const [view, setView] = useState(() => (getAccount() ? 'login' : 'register'));

  // Form states
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Registration form (NO Owner Name!)
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [gstin, setGstin] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Forgot password OTP & Reset form
  const [simulatedOtp, setSimulatedOtp] = useState('482910');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Handle Register
  const handleRegister = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!shopName.trim()) {
      setErrorMessage('Please enter your Shop Name.');
      return;
    }
    if (!shopAddress.trim()) {
      setErrorMessage('Please enter your Shop Address for billing.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Please enter your Phone Number.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setErrorMessage('Please enter a valid Email ID.');
      return;
    }
    if (regPassword.length < 4) {
      setErrorMessage('Password must be at least 4 characters.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    const newAccountData = {
      shopName: shopName.trim(),
      shopAddress: shopAddress.trim(),
      phone: phone.trim(),
      gstin: gstin.trim().toUpperCase() || 'GST-UNREGISTERED',
      email: regEmail.trim().toLowerCase(),
      password: regPassword,
      registeredAt: Date.now()
    };

    saveAccount(newAccountData);
    setExistingAccount(newAccountData);
    saveAuthUser({ email: newAccountData.email, shopName: newAccountData.shopName });

    soundEngine.playCashDrawerDing();
    soundEngine.speak(`Welcome to SmartMart AI! ${newAccountData.shopName} has been registered.`);

    onLoginSuccess(newAccountData);
  };

  // Handle Standard Login
  const handleLogin = (e) => {
    e.preventDefault();
    setErrorMessage('');

    const account = getAccount();
    if (!account) {
      // If no account exists yet, direct to registration
      setView('register');
      setErrorMessage('No store registered yet. Please create an account first.');
      return;
    }

    const inputEmail = loginEmail.trim().toLowerCase();
    const storedEmail = account.email.toLowerCase();

    if (inputEmail !== storedEmail) {
      setErrorMessage('No store account found with this Email ID.');
      soundEngine.playErrorBuzz();
      return;
    }

    if (loginPassword !== account.password) {
      setErrorMessage('Incorrect Password. Please check or use Forgot Password.');
      soundEngine.playErrorBuzz();
      return;
    }

    // Login successful
    saveAuthUser({ email: account.email, shopName: account.shopName });
    soundEngine.playScannerBeep();
    soundEngine.speak(`Welcome back, ${account.shopName}!`);
    onLoginSuccess(account);
  };

  // Trigger Forgot Password -> Immediately show OTP screen
  const handleStartForgotPassword = () => {
    setErrorMessage('');
    const account = getAccount();
    
    // Generate fresh 6-digit mock OTP
    const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
    setSimulatedOtp(generatedOtp);
    setEnteredOtp('');

    // Immediately switch to OTP verification view
    setView('forgot_otp');
    soundEngine.playScannerBeep();
  };

  // Verify OTP
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (enteredOtp.trim() !== simulatedOtp.trim()) {
      setErrorMessage('Invalid OTP code. Please enter the correct code.');
      soundEngine.playErrorBuzz();
      return;
    }

    soundEngine.playScannerBeep();
    setView('forgot_reset');
  };

  // Save New Password
  const handleSaveNewPassword = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (newPassword.length < 4) {
      setErrorMessage('New password must be at least 4 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    const account = getAccount();
    if (account) {
      const updated = {
        ...account,
        password: newPassword
      };
      saveAccount(updated);
      setExistingAccount(updated);
    }

    soundEngine.playCashDrawerDing();
    setSuccessMessage('Password reset successfully! You can now log in.');
    setView('login');
    setLoginPassword(newPassword);
  };

  // Determine email to display in masked format
  const targetEmail = existingAccount?.email || loginEmail || 'store@smartmart.ai';
  const displayedMaskedEmail = maskEmail(targetEmail);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none antialiased">
      {/* Background cyber grid & gradient glows */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(6,182,212,0.15),rgba(255,255,255,0))]" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative w-full max-w-lg z-10 animate-fadeIn">
        {/* Top Brand Logo & Status */}
        <div className="text-center mb-6 space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-xl shadow-cyan-500/30 text-white mb-2">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300 bg-clip-text text-transparent">
            SmartMart AI
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Autonomous Next-Gen Retail POS & AI Experience Terminal
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-[11px] font-mono text-cyan-300 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            30-Day Full Access Free Trial Included
          </div>
        </div>

        {/* Card Box */}
        <div className="bg-[#0c1222]/90 border border-cyan-500/30 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Messages Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* VIEW 1: STANDARD LOGIN */}
          {view === 'login' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-lg font-black text-white">Merchant Login</h2>
                  <p className="text-xs text-slate-400">Access your store counter & POS dashboard</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-mono text-cyan-300">
                  Terminal-04
                </span>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Registered Email ID *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="store@domain.com"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-slate-100 text-sm font-medium outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      Login Password *
                    </label>
                    <button
                      type="button"
                      onClick={handleStartForgotPassword}
                      className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-slate-100 text-sm font-mono outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm shadow-lg shadow-cyan-500/25 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>Open Main POS Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Toggle to Create New Account */}
              <div className="pt-3 border-t border-slate-800 text-center">
                <p className="text-xs text-slate-400">
                  New to SmartMart AI?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage('');
                      setView('register');
                    }}
                    className="font-bold text-cyan-400 hover:underline"
                  >
                    Create New Account (Free 30-Day Trial)
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* VIEW 2: CREATE NEW ACCOUNT (REGISTRATION FORM) */}
          {view === 'register' && (
            <div className="space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-lg font-black text-white">Create New Merchant Account</h2>
                <p className="text-xs text-slate-400">
                  These store details will be automatically printed on customer receipts
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-3.5">
                {/* Shop Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Shop / Store Name * (Printed on Bill)
                  </label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
                    <input
                      type="text"
                      required
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      placeholder="e.g. SmartMart Supermarket"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-slate-100 text-xs font-semibold outline-none"
                    />
                  </div>
                </div>

                {/* Shop Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Shop Address * (Printed on Bill)
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
                    <input
                      type="text"
                      required
                      value={shopAddress}
                      onChange={(e) => setShopAddress(e.target.value)}
                      placeholder="e.g. 12/A Metro Station Road, Bangalore - 560038"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-slate-100 text-xs outline-none"
                    />
                  </div>
                </div>

                {/* Phone & GSTIN 2-column */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Phone Number * (Printed on Bill)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-slate-100 text-xs font-mono outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      GST Number (Optional)
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
                      <input
                        type="text"
                        value={gstin}
                        onChange={(e) => setGstin(e.target.value.toUpperCase())}
                        placeholder="29AAECS1234F1Z8"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-slate-100 text-xs font-mono uppercase outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Email ID */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Store Email ID * (Used for Login & OTPs)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="owner@domain.com"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-slate-100 text-xs outline-none"
                    />
                  </div>
                </div>

                {/* Password & Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-slate-100 text-xs font-mono outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="password"
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-slate-100 text-xs font-mono outline-none"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/25 transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Register Store & Start 30-Day Free Trial</span>
                </button>
              </form>

              {/* Toggle back to Login */}
              {existingAccount && (
                <div className="pt-2 border-t border-slate-800 text-center">
                  <p className="text-xs text-slate-400">
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage('');
                        setView('login');
                      }}
                      className="font-bold text-cyan-400 hover:underline"
                    >
                      Sign In to Store
                    </button>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: INSTANT MASKED EMAIL OTP SCREEN */}
          {view === 'forgot_otp' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="border-b border-slate-800 pb-3">
                <span className="px-2.5 py-1 rounded-full bg-cyan-950 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 font-bold uppercase tracking-wider">
                  Instant Verification
                </span>
                <h2 className="text-lg font-black text-white mt-2">Enter Verification Code</h2>
                {/* Instant Masked Email message as required! */}
                <p className="text-xs text-slate-300 mt-1">
                  OTP has been sent to your email:{' '}
                  <strong className="text-cyan-300 font-mono text-xs">{displayedMaskedEmail}</strong>
                </p>
              </div>

              {/* Helper Demo Banner to make testing friction-free */}
              <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/20 text-xs flex items-center justify-between">
                <div className="text-[11px] text-slate-300">
                  <span>Demo OTP Code: </span>
                  <strong className="text-emerald-400 font-mono tracking-widest text-sm">{simulatedOtp}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => setEnteredOtp(simulatedOtp)}
                  className="px-2 py-1 rounded-lg bg-cyan-800/80 hover:bg-cyan-700 text-cyan-200 text-[10px] font-bold"
                >
                  Auto-Fill OTP
                </button>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 text-center">
                    Enter 6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full p-3 rounded-xl bg-slate-950 border border-cyan-500/50 text-cyan-300 font-mono text-center tracking-widest text-2xl font-bold outline-none focus:border-cyan-400"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm shadow-lg shadow-cyan-500/25 transition-all active:scale-95"
                >
                  Verify OTP & Proceed
                </button>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const newCode = String(Math.floor(100000 + Math.random() * 900000));
                      setSimulatedOtp(newCode);
                      setSuccessMessage(`New OTP sent to ${displayedMaskedEmail}`);
                      setTimeout(() => setSuccessMessage(''), 3000);
                    }}
                    className="text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Resend OTP</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage('');
                      setView('login');
                    }}
                    className="text-slate-400 hover:text-white"
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* VIEW 4: CREATE NEW PASSWORD */}
          {view === 'forgot_reset' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="border-b border-slate-800 pb-3">
                <span className="px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-500/40 text-[10px] font-mono text-emerald-300 font-bold uppercase tracking-wider">
                  OTP Verified
                </span>
                <h2 className="text-lg font-black text-white mt-2">Create New Password</h2>
                <p className="text-xs text-slate-400">
                  Set a new password for account:{' '}
                  <strong className="text-cyan-300 font-mono">{displayedMaskedEmail}</strong>
                </p>
              </div>

              <form onSubmit={handleSaveNewPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    New Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-slate-100 text-sm font-mono outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-slate-100 text-sm font-mono outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/25 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Save New Password & Sign In</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-slate-500 font-mono">
          SmartMart Autonomous Retail Terminal • Cloud-Ready 100% Client-Side Engine
        </div>
      </div>
    </div>
  );
};
