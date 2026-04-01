import React, { useState } from 'react';
import { X, Send, ClipboardList, Building, User, Calendar, Package, Hash } from 'lucide-react';
import { motion } from 'motion/react';
import type { NewItemRequest } from '../types';

interface ItemRequestFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ItemRequestForm({ onClose, onSuccess }: ItemRequestFormProps) {
  const [formData, setFormData] = useState<NewItemRequest>({
    item_name: '',
    user_name: '',
    department: '',
    request_date: new Date().toISOString().split('T')[0],
    reason: '',
    quantity: 1,
    status: 'pending'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        onSuccess();
      }
    } catch (err) {
      console.error('Failed to submit request', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-zinc-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-xl rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] overflow-hidden border border-white/20"
      >
        <div className="px-10 py-8 border-b border-zinc-100 flex items-center justify-between bg-[#f0f9ff]">
          <div>
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <ClipboardList size={20} />
              <h2 className="text-2xl font-bold tracking-tight">Permintaan Barang</h2>
            </div>
            <p className="text-zinc-500 text-xs font-medium">Ajukan permintaan pengadaan barang baru</p>
          </div>
          <button onClick={onClose} className="p-3 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-2xl transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 ml-1">Nama Barang</label>
                <div className="relative">
                  <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
                  <input 
                    required
                    type="text"
                    className="w-full pl-12 pr-5 py-3.5 bg-zinc-50/50 border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all placeholder:text-zinc-300 font-medium text-sm"
                    value={formData.item_name}
                    onChange={e => setFormData({ ...formData, item_name: e.target.value })}
                    placeholder="misal: Printer Laserjet"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 ml-1">Jumlah</label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
                  <input 
                    required
                    type="number"
                    min="1"
                    className="w-full pl-12 pr-5 py-3.5 bg-zinc-50/50 border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-medium text-sm"
                    value={formData.quantity}
                    onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 ml-1">Nama Pemohon</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
                <input 
                  required
                  type="text"
                  className="w-full pl-12 pr-5 py-3.5 bg-zinc-50/50 border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all placeholder:text-zinc-300 font-medium text-sm"
                  value={formData.user_name}
                  onChange={e => setFormData({ ...formData, user_name: e.target.value })}
                  placeholder="Nama lengkap Anda"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 ml-1">Bagian / Bidang</label>
                <div className="relative">
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
                  <input 
                    required
                    type="text"
                    className="w-full pl-12 pr-5 py-3.5 bg-zinc-50/50 border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all placeholder:text-zinc-300 font-medium text-sm"
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    placeholder="misal: Bagian Umum"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 ml-1">Tanggal Permintaan</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
                  <input 
                    required
                    type="date"
                    className="w-full pl-12 pr-5 py-3.5 bg-zinc-50/50 border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-medium text-sm"
                    value={formData.request_date}
                    onChange={e => setFormData({ ...formData, request_date: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 ml-1">Alasan Permintaan</label>
              <textarea 
                required
                rows={4}
                className="w-full px-6 py-4 bg-zinc-50/50 border border-zinc-200 rounded-[32px] focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all resize-none font-medium text-sm"
                value={formData.reason}
                onChange={e => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Jelaskan alasan pengadaan barang ini..."
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-8 py-4 border border-zinc-200 text-zinc-500 rounded-2xl hover:bg-zinc-50 transition-all font-bold text-xs uppercase tracking-widest"
            >
              Batal
            </button>
            <button 
              disabled={loading}
              type="submit"
              className="flex-1 px-8 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-blue-600/10"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={18} />
                  <span>Kirim Permintaan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
