import React, { useState, useEffect } from 'react';
import { X, Save, Camera, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { InventoryItem, NewInventoryItem } from '../types';

interface ItemFormProps {
  item: InventoryItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ItemForm({ item, onClose, onSuccess }: ItemFormProps) {
  const [formData, setFormData] = useState<NewInventoryItem>({
    name: '',
    nibar: '',
    register_code: '',
    item_code: '',
    specifications: '',
    brand_type: '',
    procurement_year: new Date().getFullYear(),
    user_name: '',
    user_status: '',
    user_position: '',
    location: '',
    condition: 'B',
    photo_url: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Efek untuk mengisi form saat tombol "Edit" diklik
  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        nibar: item.nibar || '',
        register_code: item.register_code || '',
        item_code: item.item_code || '',
        specifications: item.specifications || '',
        brand_type: item.brand_type || '',
        procurement_year: item.procurement_year || new Date().getFullYear(),
        user_name: item.user_name || '',
        user_status: item.user_status || '',
        user_position: item.user_position || '',
        location: item.location || '',
        condition: item.condition || 'B',
        photo_url: item.photo_url || '',
        notes: item.notes || ''
      });
    }
  }, [item]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Gambar terlalu besar (Maks 2MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photo_url: reader.result as string }));
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // PERBAIKAN: Pastikan URL mengarah ke ID jika sedang mode edit
      const url = item ? `/api/items/${item.id}` : '/api/items';
      const method = item ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          procurement_year: Number(formData.procurement_year)
        })
      });

      const result = await res.json();

      if (res.ok) {
        onSuccess(); // Tutup modal dan refresh data
      } else {
        throw new Error(result.error || 'Gagal menyimpan ke database');
      }
    } catch (err: any) {
      console.error('Submit Error:', err);
      setError(err.message || 'Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between bg-[#fafafa]">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">
              {item ? 'Perbarui Data Aset' : 'Registrasi Aset Baru'}
            </h2>
            <p className="text-zinc-400 text-xs font-medium mt-1 uppercase tracking-widest">
              LHI - Sistem Inventaris Elektronik
            </p>
          </div>
          <button onClick={onClose} className="p-3 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-2xl transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          
          {error && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 text-sm">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Bagian Kiri: Identitas Utama */}
            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Identitas Dasar</h3>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-zinc-400">Nama Barang</label>
                <input required type="text" className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl focus:border-emerald-500 outline-none transition-all text-sm" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-zinc-400">Kode Barang</label>
                  <input required type="text" className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl focus:border-emerald-500 outline-none text-sm" 
                    value={formData.item_code} onChange={e => setFormData({...formData, item_code: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-zinc-400">Register</label>
                  <input required type="text" className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl focus:border-emerald-500 outline-none text-sm" 
                    value={formData.register_code} onChange={e => setFormData({...formData, register_code: e.target.value})} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-zinc-400">Merek / Tipe</label>
                <input required type="text" className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl focus:border-emerald-500 outline-none text-sm" 
                  value={formData.brand_type} onChange={e => setFormData({...formData, brand_type: e.