import React, { useState, useEffect } from 'react';
import { 
  X, 
  Lock, 
  KeyRound, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Mail, 
  RotateCcw,
  Sparkles,
  Zap
} from 'lucide-react';
import { 
  getSettingsPassword, 
  saveSettingsPassword, 
  getAccount, 
  maskEmail 
} from '../services/storage';
import { soundEngine } from '../services/audioService';

export const SettingsGateModal = ({ isOpen, onClose, onUnlockSuccess }) => {
  const [existingPassword, setExistingPassword] = useState(() => getSettingsPassword());

  // Modes: 'create' (first-time) | 'unlock' (subsequent) | 'otp' | 'reset'
  const [mode, setMode] = useState(() => (getSettingsPassword() ? 'unlock' : 'create'));

  // Form states
  const [enteredPassword, setEnteredPassword] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createConfirmPassword, setCreateConfirmPassword] = useState('');

  // OTP states
  const [simulatedOtp, setSimulatedOtp] = useState('654321');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [newSettingsPassword, setNewSettingsPassword] = useState('');
  const [confirmNewSettingsPassword, setConfirmNewSettingsPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Reset states on open
  useEffect(() => {
    if (isOpen) {
      const pwd = getSettingsPassword();
      setExistingPassword(pwd);
      setMode(pwd ? 'unlock' : 'create');
      setEnteredPassword('');
      setCreatePassword('');
      setCreateConfirmPassword('');
      setEnteredOtp('');
      setNewSettingsPassword('');
      setConfirmNewSettingsPassword('');
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const account = getAccount();
  const registeredEmail = account?.email || 'owner@smartmart.ai';
  const displayedMaskedEmail = maskEmail(registeredEmail);

  // 1. First-time: Create Settings Password
  const handleCreatePassword = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (createPassword.length < 4) {
      setErrorMessage('Settings password must be at least 4 characters.');
      soundEngine.playErrorBuzz();
      return;
    }
    if (createPassword !== createConfirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      soundEngine.playErrorBuzz();
      return;
    }

    saveSettingsPassword(createPassword);
    setExistingPassword(createPassword);
    soundEngine.playCashDrawerDing();

    // Immediately open inner Settings panel as required!
    onUnlockSuccess();
  };

  // 2. Subsequent: Unlock with Settings Password
  const handleUnlock = (e) => {
    e.preventDefault();
    setErrorMessage('');

    const savedPwd = getSettingsPassword();
    if (enteredPassword !== savedPwd) {
      setErrorMessage('Incorrect Settings Password. Try again or use Forgot Password.');
      soundEngine.playErrorBuzz();
      return;
    }

    soundEngine.playScannerBeep();
    onUnlockSuccess();
  };

  // 3. Trigger Forgot Password -> Immediately show OTP screen
  const handleStartForgotPassword = () => {
    setErrorMessage('');
    const newCode = String(Math.floor(100000 + Math.random() * 900000));
    setSimulatedOtp(newCode);
    setEnteredOtp('');
    setMode('otp');
    soundEngine.playScannerBeep();
  };

  // 4. Verify OTP on Settings Lock
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (enteredOtp.trim() !== simulatedOtp.trim()) {
      setErrorMessage('Invalid OTP code. Please enter the correct code.');
      soundEngine.playErrorBuzz();
      return;
    }

    soundEngine.playScannerBeep();
    setMode('reset');
  };

  // 5. Reset Settings Password upon OTP verification
  const handleResetPassword = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (newSettingsPassword.length < 4) {
      setErrorMessage('New password must be at least 4 characters.');
      soundEngine.playErrorBuzz();
      return;
    }
    if (newSettingsPassword !== confirmNewSettingsPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      soundEngine.playErrorBuzz();
      return;
    }

    saveSettingsPassword(newSettingsPassword);
    setExistingPassword(newSettingsPassword);
    soundEngine.playCashDrawerDing();

    // Immediately open inner Settings panel
    onUnlockSuccess();
  };

  // Temporary Testing / Dev Bypass Handler
  const handleDevBypass = () => {
    soundEngine.playScannerBeep();
    soundEngine.speak("Dev Bypass activated. Settings unlocked.");
    onUnlockSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0c1222] border border-cyan-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">
                {mode === 'create' && 'Create Settings Password'}
                {mode === 'unlock' && 'Settings Gatekeeper'}
                {mode === 'otp' && 'Verify Store Owner OTP'}
                {mode === 'reset' && 'Set New Settings Password'}
              </h3>
              <p className="text-xs text-slate-400">
                {mode === 'create' && 'First-Time Setup: Protect your terminal settings'}
                {mode === 'unlock' && 'Protected Area: Enter password to configure terminal'}
                {mode === 'otp' && 'Instant verification code sent to masked email'}
                {mode === 'reset' && 'Define a new secure password for Settings'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Temporary Testing / Dev Bypass Button Banner */}
          <div className="p-2.5 rounded-2xl bg-amber-950/30 border border-amber-500/40 flex items-center justify-between gap-2 shadow-inner">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
              <span className="text-[11px] font-bold text-amber-300">
                Testing / Dev Mode
              </span>
            </div>
            <button
              type="button"
              onClick={handleDevBypass}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
              title="Temporary Dev Bypass: Open Settings immediately without password"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Skip / Dev Bypass</span>
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* MODE 1: FIRST-TIME SETTINGS CLICK -> "CREATE A NEW PASSWORD" */}
          {mode === 'create' && (
            <form onSubmit={handleCreatePassword} className="space-y-4 animate-fadeIn">
              <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-300">
                <p className="font-bold flex items-center gap-1.5 mb-0.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  First-Time Settings Configuration
                </p>
                <p className="text-slate-400 text-[11px]">
                  Please create a secure password to protect terminal settings, UPI QR, and discount slabs.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  New Settings Password *
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-slate-100 text-sm font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Confirm Settings Password *
                </label>
                <input
                  type="password"
                  required
                  value={createConfirmPassword}
                  onChange={(e) => setCreateConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-slate-100 text-sm font-mono outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Save Password & Open Settings</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* MODE 2: SUBSEQUENT CLICKS -> UNLOCK SETTINGS */}
          {mode === 'unlock' && (
            <form onSubmit={handleUnlock} className="space-y-4 animate-fadeIn">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Enter Settings Password *
                  </label>
                  <button
                    type="button"
                    onClick={handleStartForgotPassword}
                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  autoFocus
                  value={enteredPassword}
                  onChange={(e) => setEnteredPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-slate-100 text-sm font-mono outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Unlock Settings Panel</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* MODE 3: FORGOT PASSWORD -> INSTANT MASKED EMAIL OTP SCREEN */}
          {mode === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4 animate-fadeIn">
              <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs">
                <span className="text-[10px] uppercase font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-900 border border-cyan-500/40">
                  Instant Verification
                </span>
                <p className="text-slate-200 mt-2 font-medium">
                  OTP sent to:{' '}
                  <strong className="text-cyan-300 font-mono text-xs">{displayedMaskedEmail}</strong>
                </p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  No security questions required. Enter the 6-digit code below to reset password.
                </p>
              </div>

              {/* Demo Helper Pill */}
              <div className="flex items-center justify-between text-xs px-2 py-1 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px]">Demo OTP: <strong className="text-emerald-400 font-mono">{simulatedOtp}</strong></span>
                <button
                  type="button"
                  onClick={() => setEnteredOtp(simulatedOtp)}
                  className="text-[10px] text-cyan-400 font-bold hover:underline"
                >
                  Auto-Fill
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 text-center">
                  Enter 6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-cyan-500/50 text-cyan-300 font-mono text-center tracking-widest text-xl font-bold outline-none focus:border-cyan-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition-all active:scale-95"
              >
                Verify Code & Set New Password
              </button>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const newCode = String(Math.floor(100000 + Math.random() * 900000));
                    setSimulatedOtp(newCode);
                    setSuccessMessage(`New code sent to ${displayedMaskedEmail}`);
                    setTimeout(() => setSuccessMessage(''), 2500);
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
                    setMode('unlock');
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  Back to Password
                </button>
              </div>
            </form>
          )}

          {/* MODE 4: SET NEW SETTINGS PASSWORD */}
          {mode === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4 animate-fadeIn">
              <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300">
                <p className="font-bold">Identity Verified!</p>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Enter your new Settings Password below to unlock the Settings panel.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  New Settings Password *
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={newSettingsPassword}
                  onChange={(e) => setNewSettingsPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-slate-100 text-sm font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Confirm New Settings Password *
                </label>
                <input
                  type="password"
                  required
                  value={confirmNewSettingsPassword}
                  onChange={(e) => setConfirmNewSettingsPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-slate-100 text-sm font-mono outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>Save Password & Unlock Settings</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
