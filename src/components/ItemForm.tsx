import React, { useState, useEffect } from 'react';
import { X, Save, Image as ImageIcon, Camera, Upload } from 'lucide-react';
import { motion } from 'motion/react';
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

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        nibar: item.nibar || '',
        register_code: item.register_code || '',
        item_code: item.item_code || '',
        specifications: item.specifications || '',
        brand_type: item.brand_type || '',
        procurement_year: item.procurement_year,
        user_name: item.user_name || '',
        user_status: item.user_status || '',
        user_position: item.user_position || '',
        location: item.location,
        condition: item.condition,
        photo_url: item.photo_url || '',
        notes: item.notes || ''
      });
    }
  }, [item]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = item ? `/api/items/${item.id}` : '/api/items';
      const method = item ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        onSuccess();
      }
    } catch (err) {
      console.error('Failed to save item', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-zinc-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-3xl rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] overflow-hidden border border-white/20"
      >
        <div className="px-10 py-8 border-b border-zinc-100 flex items-center justify-between bg-[#fafafa]">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">{item ? 'Edit Aset' : 'Registrasi Aset Baru'}</h2>
            <p className="text-zinc-400 text-xs font-medium mt-1">Lengkapi informasi detail inventaris sesuai format LHI</p>
          </div>
          <button onClick={onClose} className="p-3 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-2xl transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 ml-1">Nama Barang</label>
              <input 
                required
                type="text"
                className="w-full px-5 py-3.5 bg-zinc-50/50 border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all placeholder:text-zinc-300 font-medium text-sm"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="misal: Laptop"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 ml-1">Merek / Tipe</label>
              <input 
                required
                type="text"
                className="w-full px-5 py-3.5 bg-zinc-50/50 border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all placeholder:text-zinc-300 font-medium text-sm"
                value={formData.brand_type}
                onChange={e => setFormData({ ...formData, brand_type: e.target.value })}
                placeholder="misal: ASUS VIVOBOOK"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 ml-1">NIBAR</label>
              <input 
                type="text"
                className="w-full px-5 py-3.5 bg-zinc-50/50 border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all placeholder:text-zinc-300 font-medium text-sm"
                value={formData.nibar}
                onChange={e => setFormData({ ...formData, nibar: e.target.value })}
                placeholder="Nomor Induk Barang"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 ml-1">Kode Barang</label>
                <input 
                  required
                  type="text"
                  className="w-full px-5 py-3.5 bg-zinc-50/50 border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all placeholder:text-zinc-300 font-medium text-sm"
                  value={formData.item_code}
                  onChange={e => setFormData({ ...formData, item_code: e.target.value })}
                  placeholder="1.3.2.10.001.001"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 ml-1">Kode Register</label>
                <input 
                  required
                  type="text"
                  className="w-full px-5 py-3.5 bg-zinc-50/50 border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all placeholder:text-zinc-300 font-medium text-sm"
                  value={formData.register_code}
                  onChange={e => setFormData({ ...formData, register_code: e.target.value })}
                  placeholder="56"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 ml-1">Nama Pemakai</label>
              <input 
                required
                type="text"
                className="w-full px-5 py-3.5 bg-zinc-50/50 border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all placeholder:text-zinc-300 font-medium text-sm"
                value={formData.user_name}
                onChange={e => setFormData({ ...formData, user_name: e.target.value })}
                placeholder="Nama lengkap pemakai"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 ml-1">Status Pemakai</label>
                <input 
                  required
                  type="text"
                  className="w-full px-5 py-3.5 bg-zinc-50/50 border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all placeholder:text-zinc-300 font-medium text-sm"
                  value={formData.user_status}
                  onChange={e => setFormData({ ...formData, user_status: e.target.value })}
                  placeholder="PNS / PPPK / Honorer"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 ml-1">Jabatan Pemakai</label>
                <input 
                  required
                  type="text"
                  className="w-full px-5 py-3.5 bg-zinc-50/50 border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all placeholder:text-zinc-300 font-medium text-sm"
                  value={formData.user_position}
                  onChange={e => setFormData({ ...formData, user_position: e.target.value })}
                  placeholder="Jabatan"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 ml-1">Tahun Perolehan</label>
                <input 
                  required
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  className="w-full px-5 py-3.5 bg-zinc-50/50 border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all font-medium text-sm"
                  value={formData.procurement_year}
                  onChange={e => setFormData({ ...formData, procurement_year: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 ml-1">Kondisi Fisik</label>
                <select 
                  className="w-full px-5 py-3.5 bg-zinc-50/50 border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all bg-white font-medium text-sm appearance-none cursor-pointer"
                  value={formData.condition}
                  onChange={e => setFormData({ ...formData, condition: e.target.value as any })}
                >
                  <option value="B">B (Baik)</option>
                  <option value="RR">RR (Rusak Ringan)</option>
                  <option value="RB">RB (Rusak Berat)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 ml-1">Ruang / Bagian</label>
              <input 
                required
                type="text"
                className="w-full px-5 py-3.5 bg-zinc-50/50 border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all placeholder:text-zinc-300 font-medium text-sm"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                placeholder="misal: Sub Bagian Umum"
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 ml-1">Dokumentasi Visual</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="relative group">
                <input 
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center justify-center gap-4 p-10 border-2 border-dashed border-zinc-100 rounded-[32px] group-hover:border-emerald-500 group-hover:bg-emerald-50/30 transition-all duration-300 bg-zinc-50/30">
                  <div className="p-4 bg-white rounded-2xl text-zinc-400 group-hover:text-emerald-600 shadow-sm transition-all group-hover:scale-110">
                    <Camera size={28} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-zinc-700">Unggah Foto</p>
                    <p className="text-[10px] text-zinc-400 font-medium mt-1">Klik atau seret gambar ke sini</p>
                  </div>
                </div>
              </div>

              {formData.photo_url && (
                <div className="relative rounded-[32px] overflow-hidden border border-zinc-100 aspect-video sm:aspect-auto shadow-lg group">
                  <img 
                    src={formData.photo_url} 
                    alt="Preview" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, photo_url: '' })}
                    className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur text-red-600 rounded-xl shadow-xl hover:bg-white transition-all scale-90 group-hover:scale-100"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 ml-1">Spesifikasi Barang</label>
              <textarea 
                rows={4}
                className="w-full px-6 py-4 bg-zinc-50/50 border border-zinc-200 rounded-[32px] focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all resize-none font-medium text-sm italic serif"
                value={formData.specifications}
                onChange={e => setFormData({ ...formData, specifications: e.target.value })}
                placeholder="Contoh:&#10;Prosesor: Intel i7 13th Gen&#10;RAM: 16GB DDR5&#10;Storage: 512GB NVMe"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 ml-1">Keterangan (Ket.)</label>
              <textarea 
                rows={4}
                className="w-full px-6 py-4 bg-zinc-50/50 border border-zinc-200 rounded-[32px] focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all resize-none font-medium text-sm italic serif"
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Catatan tambahan..."
              />
            </div>
          </div>

          <div className="pt-6 flex gap-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-8 py-4 border border-zinc-200 text-zinc-500 rounded-2xl hover:bg-zinc-50 transition-all font-bold text-xs uppercase tracking-widest"
            >
              Batalkan
            </button>
            <button 
              disabled={loading}
              type="submit"
              className="flex-1 px-8 py-4 bg-zinc-900 text-white rounded-2xl hover:bg-zinc-800 transition-all font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-zinc-900/10"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={18} />
                  <span>{item ? 'Simpan Perubahan' : 'Daftarkan Aset'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
