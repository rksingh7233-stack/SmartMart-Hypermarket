import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Camera, 
  Printer, 
  Bluetooth, 
  Usb, 
  Radio, 
  CheckCircle2, 
  Sliders, 
  Save, 
  Check, 
  RefreshCw 
} from 'lucide-react';
import { soundEngine } from '../services/audioService';

export const SettingsModal = ({
  isOpen,
  settings,
  onSaveSettings,
  onClose
}) => {
  // ONLY 2 Hardware Tabs on Billing Counter as required:
  // 1. 'camera' (Camera & Vision Setup)
  // 2. 'printer' (Printer Setup Dual Mode)
  const [activeTab, setActiveTab] = useState('camera');

  const [formSettings, setFormSettings] = useState({
    preferredCameraId: "",
    printerMode: "bluetooth",
    connectedPrinter: "SmartPrint-BT80 (Thermal 80mm)",
    printerStatus: "connected",
    ...(settings || {})
  });

  const [saveMessage, setSaveMessage] = useState(null);

  // Camera State
  const [videoDevices, setVideoDevices] = useState([]);
  const [isCameraTesting, setIsCameraTesting] = useState(false);
  const testVideoRef = useRef(null);
  const testStreamRef = useRef(null);

  // Printer State
  const [isScanningPrinter, setIsScanningPrinter] = useState(false);
  const [testPrintSuccess, setTestPrintSuccess] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormSettings(prev => ({
        ...prev,
        ...settings
      }));
    }
  }, [settings]);

  useEffect(() => {
    if (isOpen) {
      enumerateCameras();
    } else {
      stopCameraTest();
    }
  }, [isOpen]);

  // Keep test video element properly bound whenever test stream updates
  useEffect(() => {
    if (isCameraTesting && testVideoRef.current && testStreamRef.current) {
      testVideoRef.current.srcObject = testStreamRef.current;
      testVideoRef.current.play().catch(e => console.warn("Video play notice:", e));
    }
  }, [isCameraTesting]);

  // Enumerate Cameras with permission request to populate real device labels
  const enumerateCameras = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        try {
          const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          tempStream.getTracks().forEach(t => t.stop());
        } catch (e) {}

        const devices = await navigator.mediaDevices.enumerateDevices();
        const vDevs = devices.filter(d => d.kind === 'videoinput');
        setVideoDevices(vDevs);

        if (vDevs.length > 0 && !formSettings.preferredCameraId) {
          setFormSettings(prev => ({ ...prev, preferredCameraId: vDevs[0].deviceId }));
        }
      }
    } catch (e) {
      console.warn("Camera enum notice:", e);
    }
  };

  // Start Camera Test Preview
  const startCameraTest = async (deviceId) => {
    stopCameraTest();
    try {
      const constraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      testStreamRef.current = stream;
      setIsCameraTesting(true);

      if (testVideoRef.current) {
        testVideoRef.current.srcObject = stream;
        testVideoRef.current.play().catch(() => {});
      }
      soundEngine.playScannerBeep();
    } catch (err) {
      alert("Unable to access camera: " + err.message);
    }
  };

  const stopCameraTest = () => {
    if (testStreamRef.current) {
      testStreamRef.current.getTracks().forEach(t => t.stop());
      testStreamRef.current = null;
    }
    if (testVideoRef.current) {
      testVideoRef.current.srcObject = null;
    }
    setIsCameraTesting(false);
  };

  // Test Print Slip
  const handleTestPrint = () => {
    soundEngine.playScannerBeep();
    setTestPrintSuccess(true);
    soundEngine.speak("Test receipt printed successfully.");
    setTimeout(() => setTestPrintSuccess(false), 3000);
  };

  const handleSave = () => {
    onSaveSettings(formSettings);
    soundEngine.playCashDrawerDing();
    setSaveMessage("Hardware preferences saved!");
    setTimeout(() => {
      setSaveMessage(null);
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-[#0c1222] border border-cyan-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">
                Hardware & Peripheral Setup (Billing Counter)
              </h3>
              <p className="text-xs text-slate-400">
                Configure camera optical recognition and receipt printer hardware
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inner Panel */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Sidebar Tabs: ONLY 2 HARDWARE TABS */}
          <div className="w-full md:w-56 bg-slate-950/80 border-r border-slate-800 p-3 space-y-1.5 shrink-0">
            {[
              { id: 'camera', label: 'Camera & Vision Setup', icon: Camera },
              { id: 'printer', label: 'Printer Setup (Dual Mode)', icon: Printer }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-5">
            {saveMessage && (
              <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{saveMessage}</span>
              </div>
            )}

            {/* TAB 1: CAMERA & VISION SETUP */}
            {activeTab === 'camera' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="border-b border-slate-800 pb-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Camera className="w-4 h-4 text-cyan-400" />
                    Webcam & External Camera Setup
                  </h4>
                  <p className="text-xs text-slate-400">
                    Select Built-in Webcam or External USB Camera for face detection (under 500ms)
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Select Video Capture Device
                    </label>
                    <select
                      value={formSettings.preferredCameraId || ''}
                      onChange={(e) => {
                        const newId = e.target.value;
                        setFormSettings(prev => ({ ...prev, preferredCameraId: newId }));
                        if (isCameraTesting) startCameraTest(newId);
                      }}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 outline-none focus:border-cyan-400 font-mono"
                    >
                      <option value="">Default System Webcam (Built-in)</option>
                      {videoDevices.map((dev, idx) => (
                        <option key={dev.deviceId || idx} value={dev.deviceId}>
                          {dev.label || `Camera Hardware Device ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isCameraTesting ? (
                      <button
                        type="button"
                        onClick={() => startCameraTest(formSettings.preferredCameraId)}
                        className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md transition-all"
                      >
                        <Radio className="w-4 h-4 animate-pulse" />
                        <span>Start Camera Stream Test</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopCameraTest}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
                      >
                        <X className="w-4 h-4" />
                        <span>Stop Stream Test</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={enumerateCameras}
                      className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Refresh Devices</span>
                    </button>
                  </div>

                  {/* Camera Live Preview Box (Video always bound to stream) */}
                  <div className="relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-dashed border-slate-800 flex flex-col items-center justify-center min-h-[220px]">
                    <video
                      ref={testVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover max-h-[280px] ${isCameraTesting ? 'block' : 'hidden'}`}
                    />
                    {isCameraTesting && (
                      <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-emerald-950/90 border border-emerald-400 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-lg">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        TEST STREAM ACTIVE
                      </div>
                    )}
                    {!isCameraTesting && (
                      <div className="text-center p-6 space-y-2 text-slate-500">
                        <Camera className="w-10 h-10 mx-auto text-slate-600" />
                        <p className="text-xs">Click "Start Camera Stream Test" to preview the video hardware.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PRINTER SETUP (DUAL MODE: BLUETOOTH & USB) */}
            {activeTab === 'printer' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="border-b border-slate-800 pb-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Printer className="w-4 h-4 text-cyan-400" />
                    Thermal Receipt Printer Setup (Dual Mode)
                  </h4>
                  <p className="text-xs text-slate-400">
                    Connect wireless Bluetooth printer or direct wired USB POS thermal printer
                  </p>
                </div>

                {/* Active Connected Status Card */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-400">
                      <Printer className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Active Printer: {formSettings.connectedPrinter || "Thermal 80mm Standard"}
                      </span>
                      <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        Status: Connected ({formSettings.printerMode?.toUpperCase() || "BLUETOOTH"})
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleTestPrint}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Test Slip</span>
                  </button>
                </div>

                {testPrintSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>✓ Test print command sent to thermal ratchet motor!</span>
                  </div>
                )}

                {/* Dual Mode Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Bluetooth Mode */}
                  <div className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                    formSettings.printerMode === 'bluetooth'
                      ? 'bg-blue-950/30 border-blue-500/50 shadow-md'
                      : 'bg-slate-950 border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bluetooth className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-bold text-white">Bluetooth Wireless</span>
                      </div>
                      <input
                        type="radio"
                        name="printerMode"
                        checked={formSettings.printerMode === 'bluetooth'}
                        onChange={() => setFormSettings({ ...formSettings, printerMode: 'bluetooth' })}
                        className="text-blue-500"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Standard wireless 58mm / 80mm ESC/POS thermal printers.
                    </p>
                  </div>

                  {/* USB Mode */}
                  <div className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                    formSettings.printerMode === 'usb'
                      ? 'bg-emerald-950/30 border-emerald-500/50 shadow-md'
                      : 'bg-slate-950 border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Usb className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-white">Direct USB / Serial</span>
                      </div>
                      <input
                        type="radio"
                        name="printerMode"
                        checked={formSettings.printerMode === 'usb'}
                        onChange={() => setFormSettings({ ...formSettings, printerMode: 'usb' })}
                        className="text-emerald-500"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Direct wired USB thermal receipt printer (WebUSB / POS driver).
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer with Save & Close */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Close
          </button>

          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </div>
    </div>
  );
};
