import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Info, Package, User, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import type { InventoryItem } from '../types';

export default function ItemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await fetch(`/api/items/${id}`);
        if (res.ok) {
          const data = await res.json();
          setItem(data);
        }
      } catch (err) {
        console.error('Failed to fetch item', err);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Package size={64} className="text-zinc-300 mb-4" />
        <h1 className="text-2xl font-bold text-zinc-900">Barang Tidak Ditemukan</h1>
        <p className="text-zinc-500 mb-6">Barang yang Anda cari tidak ada atau telah dihapus.</p>
        <Link to="/" className="px-6 py-2 bg-zinc-900 text-white rounded-lg">Kembali ke Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col items-center mb-16">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-zinc-100 mb-6">
            <img 
              src="https://pemda.lamandaukab.go.id/wp-content/uploads/2020/02/LOGO-KABUPATEN-LAMANDAU.png" 
              alt="Lamandau Logo" 
              className="w-12 h-auto"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">VEN Setda</h2>
            <p className="text-[10px] text-zinc-400 uppercase tracking-[0.3em] font-bold mt-1">Kabupaten Lamandau</p>
          </div>
        </header>

        <div className="flex items-center justify-start mb-8">
          <button 
            onClick={() => {
              const user = JSON.parse(localStorage.getItem('user') || '{}');
              navigate(user.role === 'admin' ? '/admin' : '/user');
            }}
            className="group flex items-center gap-3 text-zinc-400 hover:text-zinc-900 transition-all font-bold text-xs uppercase tracking-widest"
          >
            <div className="p-2 bg-white rounded-xl shadow-sm border border-zinc-100 group-hover:border-zinc-200 transition-all">
              <ArrowLeft size={16} />
            </div>
            <span>Kembali ke Inventaris</span>
          </button>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-zinc-100 rounded-[40px] overflow-hidden shadow-[0_40px_80px_-20px_rgba(0,0,0,0.06)]"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-5 aspect-square lg:aspect-auto bg-zinc-50 relative">
              {item.photo_url ? (
                <img 
                  src={item.photo_url} 
                  alt={item.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-200">
                  <Package size={120} strokeWidth={1} />
                </div>
              )}
              <div className="absolute bottom-8 left-8">
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl backdrop-blur-md ${
                  item.condition === 'Good' ? 'bg-emerald-500/90 text-white' :
                  item.condition === 'Fair' ? 'bg-amber-500/90 text-white' :
                  item.condition === 'Poor' ? 'bg-orange-500/90 text-white' :
                  'bg-red-500/90 text-white'
                }`}>
                  Kondisi: {item.condition === 'Good' ? 'Baik' : 
                            item.condition === 'Fair' ? 'Cukup' : 
                            item.condition === 'Poor' ? 'Kurang' : 'Rusak'}
                </span>
              </div>
            </div>
            
            <div className="lg:col-span-7 p-10 lg:p-16 flex flex-col">
              <div className="mb-12">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em] mb-4">Detail Aset Elektronik</p>
                <h1 className="text-4xl lg:text-5xl font-bold text-zinc-900 tracking-tight leading-[1.1]">{item.name}</h1>
                <p className="text-zinc-400 font-mono text-xs mt-4">ASET ID: #{item.id.toString().padStart(5, '0')}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 mb-12">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <MapPin size={14} />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Lokasi Penempatan</p>
                  </div>
                  <p className="text-zinc-900 font-semibold text-lg">{item.location}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <User size={14} />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Penanggung Jawab</p>
                  </div>
                  <p className="text-zinc-900 font-semibold text-lg">{item.user_name}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Calendar size={14} />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Tahun Pengadaan</p>
                  </div>
                  <p className="text-zinc-900 font-semibold text-lg">{item.procurement_year}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <ShieldCheck size={14} />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Status Verifikasi</p>
                  </div>
                  <p className="text-emerald-600 font-bold text-lg">Terverifikasi</p>
                </div>
              </div>

              <div className="space-y-4 p-8 bg-zinc-50 rounded-[32px] border border-zinc-100/50">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Info size={16} />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Spesifikasi Teknis</p>
                </div>
                <p className="text-zinc-600 leading-relaxed text-sm font-medium whitespace-pre-wrap italic serif">{item.specifications || 'Tidak ada spesifikasi tambahan.'}</p>
              </div>

              <div className="mt-12 pt-8 border-t border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-3 text-zinc-300 text-[10px] font-bold uppercase tracking-widest">
                  <span>Sekretariat Daerah Lamandau</span>
                </div>
                <Package size={20} className="text-zinc-100" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
