import { QRCodeSVG } from 'qrcode.react';
import { X, Download, Share2, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import type { InventoryItem } from '../types';

interface QRCodeDisplayProps {
  item: InventoryItem;
  onClose: () => void;
}

export default function QRCodeDisplay({ item, onClose }: QRCodeDisplayProps) {
  const itemUrl = `${window.location.origin}/item/${item.id}`;

  const downloadQR = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = 1000;
      canvas.height = 1000;
      ctx?.drawImage(img, 0, 0, 1000, 1000);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR_${item.name.replace(/\s+/g, '_')}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-zinc-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-sm rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] overflow-hidden border border-white/20"
      >
        <div className="p-10 flex flex-col items-center text-center">
          <div className="w-full flex justify-end mb-4">
            <button onClick={onClose} className="p-3 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-2xl transition-all">
              <X size={20} />
            </button>
          </div>

          <div className="mb-8">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em] mb-2">Label QR Aset</p>
            <h3 className="text-2xl font-bold text-zinc-900 tracking-tight leading-tight">{item.name}</h3>
            <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mt-2">ID: #{item.id.toString().padStart(5, '0')}</p>
          </div>

          <div className="p-8 bg-white rounded-[32px] mb-10 border border-zinc-100 shadow-inner relative group">
            <div className="absolute inset-0 bg-zinc-50/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-[32px]" />
            <QRCodeSVG 
              id="qr-code-svg"
              value={itemUrl} 
              size={200}
              level="H"
              includeMargin={false}
              className="w-full h-auto relative z-10"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            <button 
              onClick={downloadQR}
              className="flex items-center justify-center gap-2 py-4 bg-zinc-900 text-white rounded-2xl hover:bg-zinc-800 transition-all font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-zinc-900/10"
            >
              <Download size={16} />
              <span>Unduh PNG</span>
            </button>
            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: item.name,
                    text: `Detail inventaris untuk ${item.name}`,
                    url: itemUrl,
                  });
                }
              }}
              className="flex items-center justify-center gap-2 py-4 border border-zinc-200 text-zinc-600 rounded-2xl hover:bg-zinc-50 transition-all font-bold text-[10px] uppercase tracking-widest"
            >
              <Share2 size={16} />
              <span>Bagikan</span>
            </button>
          </div>

          <a 
            href={itemUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 flex items-center gap-2 text-zinc-400 hover:text-emerald-600 transition-colors text-[10px] font-bold uppercase tracking-widest"
          >
            <ExternalLink size={12} />
            <span>Buka Tautan Publik</span>
          </a>
        </div>
      </motion.div>
    </div>
  );
}
