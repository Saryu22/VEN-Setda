import { useState, useEffect } from 'react';
import { Plus, Search, QrCode, Package, MapPin, AlertCircle, User, Edit2, Trash2, LogOut, Download, FileText, AlertTriangle, Calendar as CalendarIcon, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import type { InventoryItem, DamageReport } from '../types';
import ItemForm from '../components/ItemForm';
import QRCodeDisplay from '../components/QRCodeDisplay';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function Dashboard() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [reports, setReports] = useState<DamageReport[]>([]);
  const [activeTab, setActiveTab] = useState<'inventory' | 'reports'>('inventory');
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [selectedQR, setSelectedQR] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [repairUpdateReport, setRepairUpdateReport] = useState<{ id: number, status: DamageReport['status'] } | null>(null);
  const [repairForm, setRepairForm] = useState({
    repair_location: '',
    repair_date: new Date().toISOString().split('T')[0],
    repair_description: ''
  });
  const navigate = useNavigate();

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/items');
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error('Failed to fetch items', err);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      setReports(data);
    } catch (err) {
      console.error('Failed to fetch reports', err);
    }
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin') {
      navigate(user.username ? '/user' : '/');
    }
    
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchItems(), fetchReports()]);
      setLoading(false);
    };
    
    loadData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus barang ini?')) return;
    try {
      await fetch('/api/items/' + id, { method: 'DELETE' });
      fetchItems();
    } catch (err) {
      console.error('Failed to delete item', err);
    }
  };

  const downloadCSV = () => {
    if (items.length === 0) return;
    
    const headers = ['ID', 'Nama', 'Pengguna', 'Tahun Pengadaan', 'Lokasi', 'Kondisi', 'Spesifikasi'];
    const csvRows = [
      headers.join(','),
      ...items.map(item => [
        item.id,
        `"${item.name.replace(/"/g, '""')}"`,
        `"${(item.user_name || '').replace(/"/g, '""')}"`,
        item.procurement_year,
        `"${item.location.replace(/"/g, '""')}"`,
        item.condition,
        `"${(item.specifications || '').replace(/"/g, '""')}"`
      ].join(','))
    ];
    
    const csvContent = "\uFEFF" + csvRows.join('\n'); // Add BOM for Excel
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Inventaris_VEN_Setda_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadExcel = () => {
    if (items.length === 0) return;
    
    const data = items.map(item => ({
      'ID': item.id,
      'Nama Barang': item.name,
      'Penanggung Jawab': item.user_name || '-',
      'Tahun Pengadaan': item.procurement_year,
      'Lokasi': item.location,
      'Kondisi': item.condition === 'Good' ? 'Baik' : 
                 item.condition === 'Fair' ? 'Cukup' : 
                 item.condition === 'Poor' ? 'Kurang' : 'Rusak',
      'Spesifikasi': item.specifications || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventaris");
    
    // Set column widths
    const wscols = [
      {wch: 10}, {wch: 30}, {wch: 25}, {wch: 15}, {wch: 25}, {wch: 15}, {wch: 40}
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `Inventaris_VEN_Setda_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const downloadPDF = () => {
    if (items.length === 0) return;
    
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString('id-ID', { 
      day: 'numeric', month: 'long', year: 'numeric' 
    });

    // Header
    doc.setFontSize(18);
    doc.text('Laporan Inventaris Aset Elektronik', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text('Sekretariat Daerah Kabupaten Lamandau', 14, 30);
    doc.text(`Tanggal Laporan: ${dateStr}`, 14, 36);
    
    // Table
    const tableData = items.map(item => [
      item.id,
      item.name,
      item.user_name || '-',
      item.procurement_year,
      item.location,
      item.condition === 'Good' ? 'Baik' : 
      item.condition === 'Fair' ? 'Cukup' : 
      item.condition === 'Poor' ? 'Kurang' : 'Rusak'
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['ID', 'Nama Barang', 'Pengguna', 'Tahun', 'Lokasi', 'Kondisi']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 3 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    doc.save(`Laporan_Inventaris_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleStatusUpdate = async (id: number, status: DamageReport['status'], repairDetails?: any) => {
    try {
      await fetch(`/api/reports/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...repairDetails })
      });
      fetchReports();
      setRepairUpdateReport(null);
      setRepairForm({
        repair_location: '',
        repair_date: new Date().toISOString().split('T')[0],
        repair_description: ''
      });
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const downloadDamageReportPDF = (report: DamageReport) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.text('Laporan Kerusakan Barang', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text('Sekretariat Daerah Kabupaten Lamandau', 14, 30);
    doc.text(`ID Laporan: #${report.id.toString().padStart(4, '0')}`, 14, 36);
    doc.text(`Status: ${
      report.status === 'pending' ? 'Menunggu' : 
      report.status === 'processing' ? 'Diproses' : 
      report.status === 'completed' ? 'Selesai' : 'Ditolak'
    }`, 14, 42);

    // Content
    const tableBody = [
      ['Nama Barang', report.item_name],
      ['Pelapor', report.user_name],
      ['Lokasi', report.location],
      ['Tanggal Kejadian', new Date(report.report_date).toLocaleDateString('id-ID')],
      ['Tanggal Laporan', new Date(report.created_at).toLocaleString('id-ID')],
      ['Deskripsi Kerusakan', report.description]
    ];

    if (report.repair_location) tableBody.push(['Tempat Perbaikan', report.repair_location]);
    if (report.repair_date) tableBody.push(['Tanggal Selesai', new Date(report.repair_date).toLocaleDateString('id-ID')]);
    if (report.repair_description) tableBody.push(['Deskripsi Perbaikan', report.repair_description]);

    autoTable(doc, {
      startY: 50,
      head: [['Field', 'Informasi']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } }
    });

    doc.save(`Laporan_Kerusakan_${report.id}_${report.item_name.replace(/\s+/g, '_')}.pdf`);
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
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
                <span className="px-2 py-0.5 bg-zinc-900 text-white text-[9px] font-bold uppercase tracking-widest rounded-md">Admin</span>
              </div>
              <p className="text-zinc-500 text-sm font-medium">Sistem Manajemen Inventaris Elektronik</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
              <button 
                onClick={downloadExcel}
                className="flex items-center gap-2 px-4 py-2.5 text-zinc-700 hover:bg-zinc-50 transition-all font-semibold text-xs border-r border-zinc-100"
                title="Unduh Excel (Tabel)"
              >
                <Download size={16} />
                <span className="hidden lg:inline">Excel</span>
              </button>
              <button 
                onClick={downloadCSV}
                className="flex items-center gap-2 px-4 py-2.5 text-zinc-700 hover:bg-zinc-50 transition-all font-semibold text-xs border-r border-zinc-100"
                title="Unduh CSV"
              >
                <Download size={16} />
                <span className="hidden lg:inline">CSV</span>
              </button>
              <button 
                onClick={downloadPDF}
                className="flex items-center gap-2 px-4 py-2.5 text-zinc-700 hover:bg-zinc-50 transition-all font-semibold text-xs"
                title="Unduh Laporan PDF"
              >
                <FileText size={16} />
                <span className="hidden lg:inline">PDF</span>
              </button>
            </div>
            <Link 
              to="/scan"
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-50 transition-all font-semibold text-sm shadow-sm"
            >
              <QrCode size={18} />
              <span>Pindai Aset</span>
            </Link>
            <button 
              onClick={() => { setEditingItem(null); setIsFormOpen(true); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-semibold text-sm shadow-lg shadow-emerald-600/20"
            >
              <Plus size={18} />
              <span>Tambah Barang</span>
            </button>
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

        <div className="flex items-center gap-4 mb-10 border-b border-zinc-200">
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`px-6 py-4 text-sm font-bold uppercase tracking-widest transition-all relative ${
              activeTab === 'inventory' ? 'text-emerald-600' : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <Package size={18} />
              <span>Inventaris Barang</span>
            </div>
            {activeTab === 'inventory' && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-600 rounded-t-full" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            className={`px-6 py-4 text-sm font-bold uppercase tracking-widest transition-all relative ${
              activeTab === 'reports' ? 'text-red-600' : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} />
              <span>Laporan Kerusakan</span>
              {reports.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] rounded-full">
                  {reports.length}
                </span>
              )}
            </div>
            {activeTab === 'reports' && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-red-600 rounded-t-full" />
            )}
          </button>
        </div>

        {activeTab === 'inventory' ? (
          <>
            <div className="relative mb-10">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input 
                type="text"
                placeholder="Cari berdasarkan nama, lokasi, atau penanggung jawab..."
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
                <AnimatePresence mode="popLayout">
                  {filteredItems.map((item) => (
                    <motion.div 
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white border border-zinc-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col"
                    >
                      <div className="aspect-[16/10] bg-zinc-50 relative overflow-hidden">
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
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                          <button 
                            onClick={() => { setEditingItem(item); setIsFormOpen(true); }}
                            className="p-2.5 bg-white/95 backdrop-blur rounded-xl shadow-lg hover:bg-white text-zinc-700 hover:text-emerald-600 transition-all"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-2.5 bg-white/95 backdrop-blur rounded-xl shadow-lg hover:bg-red-50 text-zinc-700 hover:text-red-600 transition-all"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="absolute top-4 left-4">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm ${
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
                          <h3 className="font-bold text-lg text-zinc-900 leading-tight mb-1 group-hover:text-emerald-600 transition-colors">{item.name}</h3>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">ID: #{item.id.toString().padStart(5, '0')}</p>
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
                              <User size={12} className="text-zinc-300" />
                              <span className="text-xs font-semibold truncate">{item.user_name}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-auto pt-5 border-t border-zinc-50 flex items-center justify-between">
                          <Link 
                            to={`/item/${item.id}`}
                            className="text-emerald-600 font-bold hover:text-emerald-700 text-xs uppercase tracking-widest transition-colors"
                          >
                            Lihat Detail
                          </Link>
                          <button 
                            onClick={() => setSelectedQR(item)}
                            className="p-2 text-zinc-300 hover:text-zinc-900 transition-colors"
                            title="Tampilkan Kode QR"
                          >
                            <QrCode size={18} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {filteredItems.length === 0 && !loading && (
              <div className="text-center py-32 bg-white rounded-[40px] border-2 border-dashed border-zinc-100">
                <Package size={64} className="mx-auto text-zinc-100 mb-6" />
                <h3 className="text-xl font-bold text-zinc-900 mb-2">Barang tidak ditemukan</h3>
                <p className="text-zinc-400 text-sm">Coba sesuaikan kata kunci pencarian Anda.</p>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-6">
            {reports.length === 0 ? (
              <div className="text-center py-32 bg-white rounded-[40px] border-2 border-dashed border-zinc-100">
                <AlertCircle size={64} className="mx-auto text-zinc-100 mb-6" />
                <h3 className="text-xl font-bold text-zinc-900 mb-2">Belum ada laporan kerusakan</h3>
                <p className="text-zinc-400 text-sm">Semua aset elektronik dalam kondisi terpantau.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {reports.map((report, index) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    key={report.id}
                    className="bg-white p-8 rounded-[32px] border border-zinc-100 shadow-sm flex flex-col md:flex-row gap-8 items-start"
                  >
                    <div className="p-4 bg-red-50 text-red-600 rounded-2xl">
                      <AlertTriangle size={24} />
                    </div>
                    <div className="flex-grow space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-zinc-900">{report.item_name || 'Tanpa Nama Barang'}</h3>
                          <p className="text-zinc-400 text-xs font-medium mt-1">Laporan #{report.id.toString().padStart(4, '0')} • {new Date(report.created_at).toLocaleString('id-ID')}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${
                            report.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            report.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                            report.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {report.status === 'pending' ? 'Menunggu' : 
                             report.status === 'processing' ? 'Diproses' : 
                             report.status === 'completed' ? 'Selesai' : 'Ditolak'}
                          </span>
                          <button 
                            onClick={() => downloadDamageReportPDF(report)}
                            className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all"
                            title="Unduh PDF Laporan Ini"
                          >
                            <Download size={18} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 py-4 border-y border-zinc-50">
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Barang</p>
                          <div className="flex items-center gap-2 text-zinc-700">
                            <Package size={14} className="text-zinc-300" />
                            <span className="text-sm font-semibold truncate">{report.item_name}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Pelapor</p>
                          <div className="flex items-center gap-2 text-zinc-700">
                            <User size={14} className="text-zinc-300" />
                            <span className="text-sm font-semibold">{report.user_name}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Lokasi</p>
                          <div className="flex items-center gap-2 text-zinc-700">
                            <MapPin size={14} className="text-zinc-300" />
                            <span className="text-sm font-semibold">{report.location}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Tanggal Kejadian</p>
                          <div className="flex items-center gap-2 text-zinc-700">
                            <CalendarIcon size={14} className="text-zinc-300" />
                            <span className="text-sm font-semibold">{new Date(report.report_date).toLocaleDateString('id-ID')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Deskripsi Kerusakan</p>
                        <p className="text-zinc-600 text-sm leading-relaxed bg-zinc-50 p-4 rounded-2xl italic">
                          "{report.description}"
                        </p>
                      </div>

                      {(report.repair_location || report.repair_description) && (
                        <div className="bg-emerald-50/50 p-6 rounded-[24px] border border-emerald-100/50 space-y-4">
                          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                            <CheckCircle2 size={12} />
                            Informasi Perbaikan
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {report.repair_location && (
                              <div className="space-y-1">
                                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Tempat Perbaikan</p>
                                <p className="text-sm font-semibold text-zinc-700">{report.repair_location}</p>
                              </div>
                            )}
                            {report.repair_date && (
                              <div className="space-y-1">
                                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Tanggal Selesai</p>
                                <p className="text-sm font-semibold text-zinc-700">{new Date(report.repair_date).toLocaleDateString('id-ID')}</p>
                              </div>
                            )}
                          </div>
                          {report.repair_description && (
                            <div className="space-y-1">
                              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Deskripsi Perbaikan</p>
                              <p className="text-sm text-zinc-600 leading-relaxed">{report.repair_description}</p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="pt-4 flex flex-wrap gap-3">
                        {report.status === 'pending' && (
                          <button 
                            onClick={() => {
                              setRepairUpdateReport({ id: report.id, status: 'processing' });
                              setRepairForm({ ...repairForm, repair_location: report.repair_location || '' });
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-all"
                          >
                            <Clock size={14} />
                            <span>Proses Perbaikan</span>
                          </button>
                        )}
                        {report.status === 'processing' && (
                          <button 
                            onClick={() => {
                              setRepairUpdateReport({ id: report.id, status: 'completed' });
                              setRepairForm({ 
                                repair_location: report.repair_location || '',
                                repair_date: new Date().toISOString().split('T')[0],
                                repair_description: report.repair_description || ''
                              });
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-all"
                          >
                            <CheckCircle2 size={14} />
                            <span>Tandai Selesai</span>
                          </button>
                        )}
                        {(report.status === 'pending' || report.status === 'processing') && (
                          <button 
                            onClick={() => handleStatusUpdate(report.id, 'rejected')}
                            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl text-xs font-bold transition-all"
                          >
                            <XCircle size={14} />
                            <span>Tolak Laporan</span>
                          </button>
                        )}
                        {report.status === 'completed' && (
                          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold">
                            <CheckCircle2 size={14} />
                            <span>Perbaikan Selesai</span>
                          </div>
                        )}
                        {report.status === 'rejected' && (
                          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-xl text-xs font-bold">
                            <XCircle size={14} />
                            <span>Laporan Ditolak</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {isFormOpen && (
        <ItemForm 
          item={editingItem} 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={() => { setIsFormOpen(false); fetchItems(); }}
        />
      )}

      {selectedQR && (
        <QRCodeDisplay 
          item={selectedQR} 
          onClose={() => setSelectedQR(null)} 
        />
      )}

      {repairUpdateReport && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">Detail Perbaikan</h2>
                  <p className="text-zinc-400 text-xs font-medium mt-1">Lengkapi informasi perbaikan barang</p>
                </div>
                <button 
                  onClick={() => setRepairUpdateReport(null)}
                  className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all"
                >
                  <XCircle size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Tempat Perbaikan</label>
                  <input 
                    type="text"
                    placeholder="Contoh: Bengkel IT, Toko Komputer, dll"
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                    value={repairForm.repair_location}
                    onChange={(e) => setRepairForm({ ...repairForm, repair_location: e.target.value })}
                  />
                </div>

                {repairUpdateReport.status === 'completed' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Tanggal Selesai</label>
                      <input 
                        type="date"
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                        value={repairForm.repair_date}
                        onChange={(e) => setRepairForm({ ...repairForm, repair_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Deskripsi Perbaikan</label>
                      <textarea 
                        placeholder="Apa saja yang diperbaiki? (Ganti RAM, Install Ulang, dll)"
                        rows={3}
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm resize-none"
                        value={repairForm.repair_description}
                        onChange={(e) => setRepairForm({ ...repairForm, repair_description: e.target.value })}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="mt-10 flex gap-3">
                <button 
                  onClick={() => setRepairUpdateReport(null)}
                  className="flex-1 px-6 py-3 border border-zinc-200 text-zinc-600 rounded-xl hover:bg-zinc-50 transition-all font-bold text-sm"
                >
                  Batal
                </button>
                <button 
                  onClick={() => handleStatusUpdate(repairUpdateReport.id, repairUpdateReport.status, repairForm)}
                  className="flex-1 px-6 py-3 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-all font-bold text-sm shadow-lg shadow-zinc-900/20"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
