import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Camera } from 'lucide-react';
import { motion } from 'motion/react';

export default function Scanner() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        // Expected format: https://.../item/123
        try {
          const url = new URL(decodedText);
          const pathParts = url.pathname.split('/');
          const itemId = pathParts[pathParts.length - 1];
          
          if (decodedText.includes('/item/') && itemId) {
            scanner.clear();
            navigate(`/item/${itemId}`);
          } else {
            setError("Invalid QR code format for this system.");
          }
        } catch (e) {
          setError("Scanned text is not a valid URL.");
        }
      },
      (errorMessage) => {
        // Silently ignore scan errors (they happen every frame)
      }
    );

    return () => {
      scanner.clear().catch(error => console.error("Failed to clear scanner", error));
    };
  }, [navigate]);

  const handleBack = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    navigate(user.role === 'admin' ? '/admin' : '/user');
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans">
      <div className="p-6 flex items-center justify-between bg-zinc-900/50 backdrop-blur-xl border-b border-white/5">
        <button 
          onClick={handleBack}
          className="p-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-2xl transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
            <img 
              src="https://pemda.lamandaukab.go.id/wp-content/uploads/2020/02/LOGO-KABUPATEN-LAMANDAU.png" 
              alt="Lamandau Logo" 
              className="w-6 h-auto"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h1 className="text-white font-bold tracking-tight">Pindai QR Aset</h1>
            <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest">VEN Setda Lamandau</p>
          </div>
        </div>
        <div className="w-12"></div>
      </div>

      <div className="flex-grow flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md bg-white rounded-[40px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10 relative">
          <div id="reader" className="w-full h-full"></div>
          <div className="absolute inset-0 pointer-events-none border-[40px] border-black/20" />
        </div>

        <div className="mt-12 text-center max-w-xs space-y-6">
          <div className="inline-flex p-4 bg-white/5 rounded-full text-white/80 shadow-inner">
            <Camera size={28} strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <p className="text-white font-bold text-sm tracking-tight">Arahkan Kamera</p>
            <p className="text-white/40 text-[11px] font-medium leading-relaxed">
              Posisikan kode QR di dalam kotak pemindai untuk verifikasi aset otomatis.
            </p>
          </div>
          {error && (
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 text-red-400 text-[10px] font-bold uppercase tracking-widest bg-red-400/10 py-3 px-6 rounded-2xl border border-red-400/20"
            >
              {error}
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );
}
