import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, QrCode, Package, MapPin, User as UserIcon, AlertCircle, LogOut, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import type { InventoryItem } from '../types';
import QRCodeDisplay from '../components/QRCodeDisplay';
import DamageReportForm from '../components/DamageReportForm';

export default function UserDashboard() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedQR, setSelectedQR] = useState<InventoryItem | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.username) {
      navigate('/');
    }
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/items');
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error('Failed to fetch items', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-zinc-100">
              <img 
                src="https://pemda.lamandaukab.go.id/wp-content/uploads/2020/02/LOGO-KABUPATEN-LAMANDAU.png" 
                alt="Lamandau Logo" 
                className="w-10 h-auto"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">VEN Setda</h1>
                <span className="px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-bold uppercase tracking-widest rounded-md">User Portal</span>
              </div>
              <p className="text-zinc-500 text-sm font-medium">Portal Informasi Inventaris Elektronik</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsReportOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-all font-bold text-sm border border-red-100"
            >
              <AlertTriangle size={18} />
              <span className="hidden sm:inline">Lapor Kerusakan</span>
            </button>
            <Link 
              to="/scan"
              className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-2xl hover:bg-zinc-800 transition-all hover:scale-[1.02] shadow-xl shadow-zinc-900/20 font-bold text-sm"
            >
              <QrCode size={20} />
              <span>Pindai QR Aset</span>
            </Link>
            <div className="w-px h-8 bg-zinc-200 mx-2 hidden md:block" />
            <button 
              onClick={handleLogout}
              className="p-2.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
              title="Keluar"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <div className="relative mb-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input 
            type="text"
            placeholder="Cari barang berdasarkan nama atau lokasi..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all shadow-sm placeholder:text-zinc-400 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-zinc-100 border-t-emerald-600"></div>
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Memuat Data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={item.id}
                className="group bg-white rounded-3xl border border-zinc-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
              >
                <div className="aspect-[16/10] relative overflow-hidden bg-zinc-50">
                  {item.photo_url ? (
                    <img 
                      src={item.photo_url} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-200">
                      <Package size={48} />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                      item.condition === 'Good' ? 'bg-emerald-500 text-white' :
                      item.condition === 'Fair' ? 'bg-amber-500 text-white' :
                      item.condition === 'Poor' ? 'bg-orange-500 text-white' :
                      'bg-red-500 text-white'
                    }`}>
                      {item.condition === 'Good' ? 'Baik' : 
                       item.condition === 'Fair' ? 'Cukup' : 
                       item.condition === 'Poor' ? 'Kurang' : 'Rusak'}
                    </span>
                  </div>
                </div>
                
                <div className="p-6 flex-grow flex flex-col">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-zinc-900 group-hover:text-emerald-600 transition-colors line-clamp-1">{item.name}</h3>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">ID: #{item.id.toString().padStart(5, '0')}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Lokasi</p>
                      <div className="flex items-center gap-1.5 text-zinc-700">
                        <MapPin size={12} className="text-zinc-300" />
                        <span className="text-xs font-semibold truncate">{item.location}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Pengguna</p>
                      <div className="flex items-center gap-1.5 text-zinc-700">
                        <UserIcon size={12} className="text-zinc-300" />
                        <span className="text-xs font-semibold truncate">{item.user_name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-5 border-t border-zinc-50 flex items-center justify-between">
                    <Link 
                      to={`/item/${item.id}`}
                      className="px-5 py-2 bg-zinc-50 text-zinc-900 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-100 transition-colors"
                    >
                      Lihat Detail
                    </Link>
                    <button 
                      onClick={() => setSelectedQR(item)}
                      className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors"
                      title="Tampilkan Kode QR"
                    >
                      <QrCode size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {filteredItems.length === 0 && !loading && (
          <div className="text-center py-32 bg-white rounded-[40px] border-2 border-dashed border-zinc-100">
            <Package size={64} className="mx-auto text-zinc-100 mb-6" />
            <h3 className="text-xl font-bold text-zinc-900 mb-2">Barang tidak ditemukan</h3>
            <p className="text-zinc-400 text-sm">Coba sesuaikan kata kunci pencarian Anda.</p>
          </div>
        )}

        {selectedQR && (
          <QRCodeDisplay 
            item={selectedQR} 
            onClose={() => setSelectedQR(null)} 
          />
        )}

        {isReportOpen && (
          <DamageReportForm 
            onClose={() => setIsReportOpen(false)}
            onSuccess={() => {
              setIsReportOpen(false);
              alert('Laporan kerusakan berhasil dikirim. Terima kasih atas laporannya.');
            }}
          />
        )}
      </div>
    </div>
  );
}
