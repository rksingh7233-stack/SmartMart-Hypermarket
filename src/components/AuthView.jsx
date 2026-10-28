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
  RotateCcw, 
  Zap,
  ShoppingCart,
  LayoutDashboard,
  Check
} from 'lucide-react';
import { 
  dataService,
  maskEmail 
} from '../services/dataService';
import { soundEngine } from '../services/audioService';

const BRAND_NAME = "SmartMart Technologies";

export const AuthView = ({ onLoginSuccess }) => {
  // Dual Sliding Login Mode Selector: 'billing' | 'manager'
  const [loginMode, setLoginMode] = useState('billing');

  // Current view: 'login' | 'register' | 'forgot_email' | 'forgot_otp' | 'forgot_reset'
  const [view, setView] = useState('login');

  // Form states
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Manager Security Gate (when logging in under 'manager' slide)
  // null | 'create_pin' | 'enter_pin' | 'pin_otp' | 'pin_reset'
  const [managerGate, setManagerGate] = useState(null);
  const [pendingAccount, setPendingAccount] = useState(null);
  const [managerPinInput, setManagerPinInput] = useState('');
  const [createManagerPin, setCreateManagerPin] = useState('');
  const [confirmManagerPin, setConfirmManagerPin] = useState('');
  const [managerOtp, setManagerOtp] = useState('741852');
  const [enteredManagerOtp, setEnteredManagerOtp] = useState('');

  // Registration form (NO Owner Name!)
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [gstin, setGstin] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Registration Email OTP verification states
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [regOtp, setRegOtp] = useState('');
  const [enteredRegOtp, setEnteredRegOtp] = useState('');

  // Forgot password OTP & Reset form
  const [forgotTargetEmail, setForgotTargetEmail] = useState('');
  const [simulatedForgotOtp, setSimulatedForgotOtp] = useState('482910');
  const [enteredForgotOtp, setEnteredForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // ==========================================
  // DEMO QUICK LOGIN (RESPECTS CURRENT SLIDE)
  // ==========================================
  const handleDemoQuickLogin = async () => {
    setErrorMessage('');
    const demoEmail = "store@smartmart.ai";
    let demoAccount = await dataService.getAccountByEmail(demoEmail);

    if (!demoAccount) {
      demoAccount = {
        shopName: "SmartMart Hypermarket",
        shopAddress: "Plot 42, Cyber City, Sector 29, Gurugram, Haryana - 122002",
        phone: "+91 98765 43210",
        gstin: "07AAAAA0000A1Z5",
        email: demoEmail,
        password: "admin",
        registeredAt: Date.now()
      };
      await dataService.saveAccount(demoAccount);
    }

    setLoginEmail(demoAccount.email);
    setLoginPassword(demoAccount.password);

    dataService.saveAuthUser({ 
      email: demoAccount.email, 
      shopName: demoAccount.shopName,
      role: loginMode 
    });

    soundEngine.playCashDrawerDing();
    soundEngine.speak(`Demo Quick Login successful. Entering ${loginMode === 'manager' ? 'Manager Dashboard' : 'Billing Counter'}!`);
    
    onLoginSuccess(demoAccount, loginMode);
  };

  // ==========================================
  // REGISTRATION: EMAIL OTP DISPATCH & VERIFY
  // ==========================================
  const handleSendRegEmailOtp = () => {
    setErrorMessage('');
    if (!regEmail.trim() || !regEmail.includes('@') || !regEmail.includes('.')) {
      setErrorMessage('Please enter a valid store Email ID before verifying.');
      soundEngine.playErrorBuzz();
      return;
    }

    const newOtp = String(Math.floor(100000 + Math.random() * 900000));
    setRegOtp(newOtp);
    setEnteredRegOtp('');
    setIsVerifyingEmail(true);
    soundEngine.playScannerBeep();
  };

  const handleConfirmRegEmailOtp = () => {
    setErrorMessage('');
    if (enteredRegOtp.trim() !== regOtp.trim()) {
      setErrorMessage('Invalid Email verification OTP code. Please verify.');
      soundEngine.playErrorBuzz();
      return;
    }

    setIsEmailVerified(true);
    setIsVerifyingEmail(false);
    soundEngine.playCashDrawerDing();
    setSuccessMessage(`Email verified successfully (${regEmail})! You may now create your store password.`);
    setTimeout(() => setSuccessMessage(''), 3500);
  };

  // ==========================================
  // REGISTRATION SUBMIT
  // ==========================================
  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!isEmailVerified) {
      setErrorMessage('Please click "Verify Email" and enter the OTP to verify your email first.');
      soundEngine.playErrorBuzz();
      return;
    }
    if (!shopName.trim()) {
      setErrorMessage('Please enter your Shop Name.');
      return;
    }
    if (!shopAddress.trim()) {
      setErrorMessage('Please enter your Shop Address.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Please enter your Phone Number.');
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

    // Check if account already exists
    const existing = await dataService.getAccountByEmail(regEmail);
    if (existing) {
      setErrorMessage('An account with this Email ID already exists. Please log in.');
      soundEngine.playErrorBuzz();
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

    await dataService.saveAccount(newAccountData);
    dataService.saveAuthUser({ 
      email: newAccountData.email, 
      shopName: newAccountData.shopName,
      role: loginMode 
    });

    soundEngine.playCashDrawerDing();
    soundEngine.speak(`Welcome to SmartMart AI! ${newAccountData.shopName} registered with a clean fresh catalog.`);

    onLoginSuccess(newAccountData, loginMode);
  };

  // ==========================================
  // STANDARD LOGIN (SHARED CREDENTIALS)
  // ==========================================
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const inputEmail = loginEmail.trim().toLowerCase();
    const account = await dataService.getAccountByEmail(inputEmail);

    if (!account) {
      setErrorMessage('No store account found with this Email ID. Please register first.');
      soundEngine.playErrorBuzz();
      return;
    }

    if (loginPassword !== account.password) {
      setErrorMessage('Incorrect Password. Please check or use Forgot Password.');
      soundEngine.playErrorBuzz();
      return;
    }

    // If logging into Billing Counter -> Enter immediately!
    if (loginMode === 'billing') {
      dataService.saveAuthUser({ 
        email: account.email, 
        shopName: account.shopName,
        role: 'billing' 
      });
      soundEngine.playScannerBeep();
      soundEngine.speak(`Welcome to Billing Counter, ${account.shopName}!`);
      onLoginSuccess(account, 'billing');
      return;
    }

    // If logging into Manager Dashboard -> Check Manager Security PIN!
    setPendingAccount(account);
    const existingPin = await dataService.getManagerPin(account.email);
    if (!existingPin) {
      setManagerGate('create_pin');
    } else {
      setManagerGate('enter_pin');
    }
  };

  // ==========================================
  // MANAGER SECURITY PIN HANDLERS & DEV BYPASS
  // ==========================================
  const handleDevBypassManager = () => {
    soundEngine.playScannerBeep();
    soundEngine.speak("Dev Bypass activated. Entering Manager Dashboard.");
    dataService.saveAuthUser({ 
      email: pendingAccount.email, 
      shopName: pendingAccount.shopName,
      role: 'manager' 
    });
    setManagerGate(null);
    onLoginSuccess(pendingAccount, 'manager');
  };

  const handleCreateManagerPinSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (createManagerPin.length < 4) {
      setErrorMessage('Manager PIN must be at least 4 digits/characters.');
      soundEngine.playErrorBuzz();
      return;
    }
    if (createManagerPin !== confirmManagerPin) {
      setErrorMessage('Manager PINs do not match. Please verify.');
      soundEngine.playErrorBuzz();
      return;
    }

    await dataService.saveManagerPin(createManagerPin, pendingAccount.email);
    dataService.saveAuthUser({ 
      email: pendingAccount.email, 
      shopName: pendingAccount.shopName,
      role: 'manager' 
    });
    soundEngine.playCashDrawerDing();
    soundEngine.speak("Manager Security PIN established. Welcome to Manager Dashboard!");
    setManagerGate(null);
    onLoginSuccess(pendingAccount, 'manager');
  };

  const handleEnterManagerPinSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    const savedPin = await dataService.getManagerPin(pendingAccount.email);
    if (managerPinInput.trim() !== savedPin) {
      setErrorMessage('Incorrect Manager PIN. Try again or use Forgot PIN / Dev Bypass.');
      soundEngine.playErrorBuzz();
      return;
    }

    dataService.saveAuthUser({ 
      email: pendingAccount.email, 
      shopName: pendingAccount.shopName,
      role: 'manager' 
    });
    soundEngine.playCashDrawerDing();
    setManagerGate(null);
    onLoginSuccess(pendingAccount, 'manager');
  };

  // ==========================================
  // FORGOT PASSWORD FLOW
  // ==========================================
  const handleStartForgotPassword = () => {
    setErrorMessage('');
    setForgotTargetEmail(loginEmail.trim());
    setView('forgot_email');
  };

  const handleSendForgotOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!forgotTargetEmail.trim() || !forgotTargetEmail.includes('@')) {
      setErrorMessage('Please enter a valid registered Email ID.');
      return;
    }

    const account = await dataService.getAccountByEmail(forgotTargetEmail);
    if (!account) {
      setErrorMessage('No registered store account found with this email.');
      soundEngine.playErrorBuzz();
      return;
    }

    const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
    setSimulatedForgotOtp(generatedOtp);
    setEnteredForgotOtp('');
    setView('forgot_otp');
    soundEngine.playScannerBeep();
  };

  const handleVerifyForgotOtp = (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (enteredForgotOtp.trim() !== simulatedForgotOtp.trim()) {
      setErrorMessage('Invalid OTP code. Please enter the correct 6-digit code.');
      soundEngine.playErrorBuzz();
      return;
    }
    setView('forgot_reset');
    soundEngine.playScannerBeep();
  };

  const handleSaveNewPassword = async (e) => {
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

    const account = await dataService.getAccountByEmail(forgotTargetEmail);
    if (account) {
      const updated = { ...account, password: newPassword };
      await dataService.saveAccount(updated);
    }

    soundEngine.playCashDrawerDing();
    setSuccessMessage('Password reset successfully! You can now log in.');
    setLoginEmail(forgotTargetEmail);
    setLoginPassword(newPassword);
    setView('login');
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between p-4 relative overflow-hidden font-sans select-none antialiased">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(6,182,212,0.12),rgba(255,255,255,0))]" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative w-full max-w-lg mx-auto my-auto z-10 animate-fadeIn py-6">
        {/* Top Brand Logo */}
        <div className="text-center mb-5 space-y-1.5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-xl shadow-cyan-500/30 text-white mb-1">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300 bg-clip-text text-transparent">
            SmartMart AI
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Autonomous Retail POS & AI Experience Terminal • 100% Free Forever
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-[#0c1222]/90 border border-cyan-500/30 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
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

          {/* VIEW: STANDARD LOGIN WITH DUAL SLIDING MODE SELECTOR */}
          {view === 'login' && !managerGate && (
            <div className="space-y-5">
              {/* 1. DUAL SLIDING MODE SELECTOR (BILLING COUNTER VS MANAGER DASHBOARD) */}
              <div className="p-1 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-2 gap-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode('billing');
                    soundEngine.playScannerBeep();
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                    loginMode === 'billing'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/30 scale-[1.02]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>🛒 Billing Counter</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLoginMode('manager');
                    soundEngine.playScannerBeep();
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                    loginMode === 'manager'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30 scale-[1.02]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>📊 Manager Dashboard</span>
                </button>
              </div>

              {/* Login Sub-header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-lg font-black text-white">Merchant Login</h2>
                  <p className="text-xs text-slate-400">
                    {loginMode === 'billing' 
                      ? "Direct access to Billing Counter & Checkout" 
                      : "Manager Access: Analytics, Margins & Settings"}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase ${
                  loginMode === 'billing' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40' : 'bg-purple-950 text-purple-300 border border-purple-500/40'
                }`}>
                  {loginMode === 'billing' ? 'Counter POS' : 'Manager'}
                </span>
              </div>

              {/* Demo Quick Login Button */}
              <button
                type="button"
                onClick={handleDemoQuickLogin}
                className="w-full py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 hover:border-amber-400 text-amber-300 font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 group"
                title={`Auto-fill and log straight into ${loginMode === 'manager' ? 'Manager Dashboard' : 'Billing Counter'}`}
              >
                <Zap className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
                <span>⚡ Demo Quick Login ({loginMode === 'manager' ? 'Manager' : 'Counter'})</span>
              </button>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Registered Store Email ID *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="store@domain.com"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-slate-100 text-sm outline-none transition-colors"
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
                  className={`w-full py-3 rounded-xl font-black text-sm shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                    loginMode === 'billing'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-500/25'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/25'
                  }`}
                >
                  <span>Enter {loginMode === 'billing' ? "Billing Counter" : "Manager Dashboard"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Toggle to Create New Account */}
              <div className="pt-3 border-t border-slate-800 text-center">
                <p className="text-xs text-slate-400">
                  New store owner?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage('');
                      setView('register');
                    }}
                    className="font-bold text-cyan-400 hover:underline"
                  >
                    Create New Account (100% Free Forever)
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* MANAGER GATE: PROMPT TO ENTER OR CREATE MANAGER PIN */}
          {managerGate && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
                <div className="p-2 rounded-xl bg-purple-950 border border-purple-500/40 text-purple-300">
                  <ShieldCheck className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {managerGate === 'create_pin' ? "Set Manager Security PIN" : "Manager Security Authentication"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {managerGate === 'create_pin'
                      ? "First-time manager login: Define a PIN to protect analytics & pricing"
                      : "Enter your secure Manager PIN to access store analytics"}
                  </p>
                </div>
              </div>

              {/* DEV BYPASS BUTTON (PROMINENT DIRECT ENTER) */}
              <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between gap-3 shadow-inner">
                <div>
                  <span className="text-[11px] font-extrabold text-amber-300 block">
                    ⚡ Dev Testing Mode
                  </span>
                  <span className="text-[10px] text-amber-400/80">
                    Skip PIN during testing
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDevBypassManager}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                  title="Direct Dev Bypass into Manager Dashboard without typing PIN"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Dev Bypass (Direct Enter)</span>
                </button>
              </div>

              {/* Mode A: Create PIN */}
              {managerGate === 'create_pin' && (
                <form onSubmit={handleCreateManagerPinSubmit} className="space-y-3.5">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">New Manager PIN *</label>
                    <input
                      type="password"
                      required
                      autoFocus
                      value={createManagerPin}
                      onChange={(e) => setCreateManagerPin(e.target.value)}
                      placeholder="e.g. 1234"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono text-slate-100 outline-none focus:border-purple-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Confirm Manager PIN *</label>
                    <input
                      type="password"
                      required
                      value={confirmManagerPin}
                      onChange={(e) => setConfirmManagerPin(e.target.value)}
                      placeholder="e.g. 1234"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono text-slate-100 outline-none focus:border-purple-400"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all"
                  >
                    Save PIN & Open Manager Dashboard
                  </button>
                </form>
              )}

              {/* Mode B: Enter Existing PIN */}
              {managerGate === 'enter_pin' && (
                <form onSubmit={handleEnterManagerPinSubmit} className="space-y-3.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-300">Enter Manager PIN *</label>
                      <button
                        type="button"
                        onClick={() => {
                          const otp = String(Math.floor(100000 + Math.random() * 900000));
                          setManagerOtp(otp);
                          setManagerGate('pin_otp');
                        }}
                        className="text-xs font-bold text-purple-400 hover:underline"
                      >
                        Forgot PIN?
                      </button>
                    </div>
                    <input
                      type="password"
                      required
                      autoFocus
                      value={managerPinInput}
                      onChange={(e) => setManagerPinInput(e.target.value)}
                      placeholder="••••"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono text-slate-100 outline-none focus:border-purple-400 text-center tracking-widest"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all"
                  >
                    Unlock Manager Dashboard
                  </button>
                </form>
              )}

              {/* Mode C: Forgot PIN OTP */}
              {managerGate === 'pin_otp' && (
                <div className="space-y-3.5">
                  <div className="p-3 rounded-2xl bg-slate-950 border border-purple-500/30 text-xs">
                    <span className="text-[10px] uppercase font-mono font-bold text-purple-400">PIN Recovery OTP</span>
                    <p className="text-slate-300 mt-1">OTP sent to: <strong>{maskEmail(pendingAccount?.email)}</strong></p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Demo OTP: <strong className="text-emerald-400 font-mono">{managerOtp}</strong></p>
                  </div>

                  <input
                    type="text"
                    maxLength={6}
                    value={enteredManagerOtp}
                    onChange={(e) => setEnteredManagerOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-purple-500/50 text-purple-300 font-mono text-center tracking-widest text-lg font-bold outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      if (enteredManagerOtp.trim() === managerOtp.trim()) {
                        setManagerGate('create_pin');
                      } else {
                        setErrorMessage('Invalid OTP code');
                        soundEngine.playErrorBuzz();
                      }
                    }}
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
                  >
                    Verify OTP & Reset PIN
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setManagerGate(null)}
                className="w-full py-2 text-xs text-slate-400 hover:text-white text-center"
              >
                Back to Login
              </button>
            </div>
          )}

          {/* VIEW: REGISTRATION WITH EMAIL OTP FLOW */}
          {view === 'register' && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-lg font-black text-white">Create New Merchant Account</h2>
                <p className="text-xs text-slate-400">
                  New accounts start 100% clean (0 dummy products, 0 saved customers)
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-3">
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
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs font-semibold outline-none focus:border-cyan-400"
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
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                {/* Phone & GSTIN */}
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
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono outline-none focus:border-cyan-400"
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
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono uppercase outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Email ID with Verify Email OTP button */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Store Email ID * (Must verify via OTP to proceed)
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
                      <input
                        type="email"
                        required
                        disabled={isEmailVerified}
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="owner@domain.com"
                        className={`w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border text-slate-100 text-xs outline-none ${
                          isEmailVerified ? 'border-emerald-500/60 text-emerald-300' : 'border-slate-700 focus:border-cyan-400'
                        }`}
                      />
                    </div>

                    <button
                      type="button"
                      disabled={isEmailVerified}
                      onClick={handleSendRegEmailOtp}
                      className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                        isEmailVerified
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 cursor-default'
                          : 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 shadow-md active:scale-95'
                      }`}
                    >
                      {isEmailVerified ? "Verified ✅" : "Verify Email"}
                    </button>
                  </div>
                </div>

                {/* Email Verification OTP Box (Revealed upon clicking "Verify Email") */}
                {isVerifyingEmail && !isEmailVerified && (
                  <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 space-y-2 animate-fadeIn">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] text-cyan-300 font-semibold">
                        OTP sent to: <strong>{maskEmail(regEmail)}</strong>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Demo: <strong className="text-emerald-400">{regOtp}</strong>
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={enteredRegOtp}
                        onChange={(e) => setEnteredRegOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 6-digit OTP"
                        className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-cyan-500/60 text-center font-mono text-cyan-300 font-bold text-sm outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleConfirmRegEmailOtp}
                        className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                      >
                        Confirm OTP
                      </button>
                    </div>
                  </div>
                )}

                {/* Password & Confirm Password (REVEALED ONLY AFTER EMAIL IS VERIFIED) */}
                {isEmailVerified ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fadeIn">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Create Password *
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Confirm Password *
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-amber-400/90 font-mono bg-amber-950/20 p-2.5 rounded-xl border border-amber-500/20">
                    ℹ️ Please click "Verify Email" to unlock the password setup and finalize registration.
                  </p>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={!isEmailVerified}
                    className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 ${
                      isEmailVerified
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-emerald-500/25 active:scale-95 cursor-pointer'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <span>Complete Signup & Launch {loginMode === 'manager' ? 'Manager Dashboard' : 'Billing Counter'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>

              <div className="pt-2 border-t border-slate-800 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    setView('login');
                  }}
                  className="text-xs text-cyan-400 font-bold hover:underline"
                >
                  Already registered? Return to Login
                </button>
              </div>
            </div>
          )}

          {/* VIEW: FORGOT PASSWORD FLOW (EMAIL -> OTP -> RESET) */}
          {view === 'forgot_email' && (
            <form onSubmit={handleSendForgotOtp} className="space-y-4 animate-fadeIn">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">Reset Store Password</h3>
                <p className="text-xs text-slate-400">Enter your registered store email to receive a recovery OTP</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Registered Email ID *</label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={forgotTargetEmail}
                  onChange={(e) => setForgotTargetEmail(e.target.value)}
                  placeholder="store@domain.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 outline-none focus:border-cyan-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs"
              >
                Send OTP
              </button>

              <button
                type="button"
                onClick={() => setView('login')}
                className="w-full text-center text-xs text-slate-400 hover:text-white"
              >
                Cancel and return to Login
              </button>
            </form>
          )}

          {view === 'forgot_otp' && (
            <form onSubmit={handleVerifyForgotOtp} className="space-y-4 animate-fadeIn">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">Verify Recovery OTP</h3>
                <p className="text-xs text-slate-400">
                  OTP sent to: <strong>{maskEmail(forgotTargetEmail)}</strong>
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Simulated OTP: <strong className="text-emerald-400 font-mono">{simulatedForgotOtp}</strong>
                </p>
              </div>

              <input
                type="text"
                maxLength={6}
                required
                autoFocus
                value={enteredForgotOtp}
                onChange={(e) => setEnteredForgotOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-cyan-500/60 text-center font-mono text-cyan-300 font-bold text-lg outline-none"
              />

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs"
              >
                Verify Code & Set New Password
              </button>

              <button
                type="button"
                onClick={() => setView('login')}
                className="w-full text-center text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </form>
          )}

          {view === 'forgot_reset' && (
            <form onSubmit={handleSaveNewPassword} className="space-y-4 animate-fadeIn">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">Create New Password</h3>
                <p className="text-xs text-slate-400">Identity verified. Enter your new store password below.</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">New Password *</label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-slate-100 outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Confirm New Password *</label>
                <input
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-slate-100 outline-none focus:border-cyan-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
              >
                Save New Password & Log In
              </button>
            </form>
          )}
        </div>
      </div>

      {/* OFFICIAL COPYRIGHT FOOTER LINE */}
      <footer className="relative z-10 py-3 text-center">
        <p className="text-xs text-slate-400 font-sans">
          <span className="underline decoration-slate-600 underline-offset-4">
            Copyright &copy; 2026 SmartMart AI POS. All Rights Reserved. Powered by {BRAND_NAME}.
          </span>
        </p>
      </footer>
    </div>
  );
};
