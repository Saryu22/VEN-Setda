import { useState, useEffect } from 'react';
import { Plus, Search, QrCode, Package, MapPin, AlertCircle, User, Edit2, Trash2, LogOut, Download, FileText, AlertTriangle, Calendar as CalendarIcon, CheckCircle2, Clock, XCircle, ClipboardList, Building, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import type { InventoryItem, DamageReport, ItemRequest } from '../types';
import ItemForm from '../components/ItemForm';
import QRCodeDisplay from '../components/QRCodeDisplay';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function Dashboard() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [reports, setReports] = useState<DamageReport[]>([]);
  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'inventory' | 'reports' | 'requests'>('inventory');
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
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [selectedReportIds, setSelectedReportIds] = useState<number[]>([]);
  const [selectedRequestIds, setSelectedRequestIds] = useState<number[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('Semua Lokasi');
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
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

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/requests');
      const data = await res.json();
      setRequests(data);
    } catch (err) {
      console.error('Failed to fetch requests', err);
    }
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin') {
      navigate(user.username ? '/user' : '/');
    }
    
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchItems(), fetchReports(), fetchRequests()]);
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
    const previousItems = [...items];
    setItems(prev => prev.filter(item => item.id !== id));
    setSelectedItemIds(prev => prev.filter(itemId => itemId !== id));
    try {
      const res = await fetch('/api/items/' + id, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
    } catch (err) {
      console.error('Failed to delete item', err);
      setItems(previousItems);
      alert('Gagal menghapus barang. Silakan coba lagi.');
    }
  };

  const handleDeleteSelectedItems = async () => {
    if (selectedItemIds.length === 0) return;
    if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedItemIds.length} barang yang dipilih?`)) return;
    
    const previousItems = [...items];
    setItems(prev => prev.filter(item => !selectedItemIds.includes(item.id)));
    const idsToDelete = [...selectedItemIds];
    setSelectedItemIds([]);

    try {
      await Promise.all(idsToDelete.map(id => 
        fetch('/api/items/' + id, { method: 'DELETE' })
      ));
    } catch (err) {
      console.error('Failed to delete selected items', err);
      setItems(previousItems);
      alert('Gagal menghapus beberapa barang. Silakan coba lagi.');
    }
  };

  const handleDeleteReport = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus laporan ini?')) return;
    const previousReports = [...reports];
    setReports(prev => prev.filter(report => report.id !== id));
    setSelectedReportIds(prev => prev.filter(reportId => reportId !== id));
    try {
      const res = await fetch('/api/reports/' + id, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete report failed');
    } catch (err) {
      console.error('Failed to delete report', err);
      setReports(previousReports);
      alert('Gagal menghapus laporan. Silakan coba lagi.');
    }
  };

  const handleDeleteSelectedReports = async () => {
    if (selectedReportIds.length === 0) return;
    if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedReportIds.length} laporan yang dipilih?`)) return;
    
    const previousReports = [...reports];
    setReports(prev => prev.filter(report => !selectedReportIds.includes(report.id)));
    const idsToDelete = [...selectedReportIds];
    setSelectedReportIds([]);

    try {
      await Promise.all(idsToDelete.map(id => 
        fetch('/api/reports/' + id, { method: 'DELETE' })
      ));
    } catch (err) {
      console.error('Failed to delete selected reports', err);
      setReports(previousReports);
      alert('Gagal menghapus beberapa laporan. Silakan coba lagi.');
    }
  };

  const handleDeleteRequest = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus permintaan ini?')) return;
    const previousRequests = [...requests];
    setRequests(prev => prev.filter(req => req.id !== id));
    setSelectedRequestIds(prev => prev.filter(reqId => reqId !== id));
    try {
      const res = await fetch('/api/requests/' + id, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete request failed');
    } catch (err) {
      console.error('Failed to delete request', err);
      setRequests(previousRequests);
      alert('Gagal menghapus permintaan. Silakan coba lagi.');
    }
  };

  const handleDeleteSelectedRequests = async () => {
    if (selectedRequestIds.length === 0) return;
    if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedRequestIds.length} permintaan yang dipilih?`)) return;
    
    const previousRequests = [...requests];
    setRequests(prev => prev.filter(req => !selectedRequestIds.includes(req.id)));
    const idsToDelete = [...selectedRequestIds];
    setSelectedRequestIds([]);

    try {
      await Promise.all(idsToDelete.map(id => 
        fetch('/api/requests/' + id, { method: 'DELETE' })
      ));
    } catch (err) {
      console.error('Failed to delete selected requests', err);
      setRequests(previousRequests);
      alert('Gagal menghapus beberapa permintaan. Silakan coba lagi.');
    }
  };

  const downloadCSV = (scope: 'all' | 'location' = 'all') => {
    const dataToDownload = scope === 'location' && selectedLocation !== 'Semua Lokasi'
      ? items.filter(i => i.location === selectedLocation)
      : items;

    if (dataToDownload.length === 0) return;
    
    const headers = ['No', 'NIBAR', 'Kode Register', 'Kode Barang', 'Nama Barang', 'Spesifikasi', 'Merek/Tipe', 'Tahun Perolehan', 'Nama Pemakai', 'Status', 'Jabatan', 'B', 'RR', 'RB', 'Ket.'];
    const csvRows = [
      headers.join(','),
      ...dataToDownload.map((item, index) => [
        index + 1,
        `"${(item.nibar || '').replace(/"/g, '""')}"`,
        `"${(item.register_code || '').replace(/"/g, '""')}"`,
        `"${(item.item_code || '').replace(/"/g, '""')}"`,
        `"${item.name.replace(/"/g, '""')}"`,
        `"${(item.specifications || '').replace(/"/g, '""')}"`,
        `"${(item.brand_type || '').replace(/"/g, '""')}"`,
        item.procurement_year,
        `"${(item.user_name || '').replace(/"/g, '""')}"`,
        `"${(item.user_status || '').replace(/"/g, '""')}"`,
        `"${(item.user_position || '').replace(/"/g, '""')}"`,
        item.condition === 'B' ? '√' : '',
        item.condition === 'RR' ? '√' : '',
        item.condition === 'RB' ? '√' : '',
        `"${(item.notes || '').replace(/"/g, '""')}"`
      ].join(','))
    ];
    
    const csvContent = "\uFEFF" + csvRows.join('\n'); // Add BOM for Excel
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const filename = scope === 'location' ? `LHI_${selectedLocation.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv` : `LHI_Semua_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadExcel = (scope: 'all' | 'location' = 'all') => {
    const dataToDownload = scope === 'location' && selectedLocation !== 'Semua Lokasi'
      ? items.filter(i => i.location === selectedLocation)
      : items;

    if (dataToDownload.length === 0) return;
    
    // Prepare data for LHI format
    const data = dataToDownload.map((item, index) => ({
      'No.': index + 1,
      'NIBAR': item.nibar || '',
      'Kode Register': item.register_code || '',
      'Kode Barang': item.item_code || '',
      'Nama Barang': item.name,
      'Nama Spesifikasi Barang': item.specifications || '',
      'Merek/Tipe': item.brand_type || '',
      'Tahun Perolehan': item.procurement_year,
      'Nama Pemakai': item.user_name || '',
      'Status Jabatan/PNS/PPPK': item.user_status || '',
      'Jabatan Pemakai (A)': item.user_position || '',
      'B': item.condition === 'B' ? '√' : '',
      'RR': item.condition === 'RR' ? '√' : '',
      'RB': item.condition === 'RB' ? '√' : '',
      'Ket.': item.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "LHI");
    
    // Set column widths
    const wscols = [
      {wch: 5}, {wch: 15}, {wch: 15}, {wch: 20}, {wch: 25}, {wch: 30}, {wch: 25}, {wch: 15}, {wch: 25}, {wch: 20}, {wch: 25}, {wch: 5}, {wch: 5}, {wch: 5}, {wch: 20}
    ];
    worksheet['!cols'] = wscols;

    const filename = scope === 'location' ? `LHI_${selectedLocation.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx` : `LHI_Semua_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  const downloadPDF = (scope: 'all' | 'location' = 'all') => {
    const dataToDownload = scope === 'location' && selectedLocation !== 'Semua Lokasi'
      ? items.filter(i => i.location === selectedLocation)
      : items;

    if (dataToDownload.length === 0) return;
    
    const doc = new jsPDF({ orientation: 'landscape' });
    const dateStr = new Date().toLocaleDateString('id-ID', { 
      day: 'numeric', month: 'long', year: 'numeric' 
    });

    // Header LHI
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('LAPORAN HASIL INVENTARISASI (LHI)', 148.5, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Pengguna Barang', 14, 25);
    doc.text(': Sekretariat Daerah', 50, 25);
    doc.text('Ruang/Bagian', 14, 30);
    doc.text(`: ${scope === 'location' ? selectedLocation : 'Sekretariat Daerah Kabupaten Lamandau'}`, 50, 30);

    // Table
    const tableData = dataToDownload.map((item, index) => [
      index + 1,
      item.nibar || '',
      item.register_code || '',
      item.item_code || '',
      item.name,
      item.specifications || '',
      item.brand_type || '',
      item.procurement_year,
      item.user_name || '',
      item.user_status || '',
      item.user_position || '',
      item.condition === 'B' ? '√' : '',
      item.condition === 'RR' ? '√' : '',
      item.condition === 'RB' ? '√' : '',
      item.notes || ''
    ]);

    autoTable(doc, {
      startY: 35,
      head: [
        [
          { content: 'No.', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'NIBAR', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Kode Register', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Kode Barang', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Nama Barang', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Nama Spesifikasi Barang', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Merek/Tipe', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Tahun Perolehan', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Pemakai **)', colSpan: 3, styles: { halign: 'center' } },
          { content: 'Kondisi Fisik Setelah Inventarisasi (√)', colSpan: 3, styles: { halign: 'center' } },
          { content: 'Ket.', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }
        ],
        [
          { content: 'Nama Pemakai', styles: { halign: 'center' } },
          { content: 'Status Jabatan/PNS/PPPK', styles: { halign: 'center' } },
          { content: 'Jabatan Pemakai (A)', styles: { halign: 'center' } },
          { content: 'B', styles: { halign: 'center' } },
          { content: 'RR', styles: { halign: 'center' } },
          { content: 'RB', styles: { halign: 'center' } }
        ]
      ],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.1, fontStyle: 'bold' },
      styles: { fontSize: 7, cellPadding: 1.5, lineColor: [0, 0, 0], lineWidth: 0.1 },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 15 },
        2: { cellWidth: 15 },
        3: { cellWidth: 20 },
        4: { cellWidth: 25 },
        5: { cellWidth: 30 },
        6: { cellWidth: 25 },
        7: { cellWidth: 15 },
        8: { cellWidth: 20 },
        9: { cellWidth: 15 },
        10: { cellWidth: 20 },
        11: { cellWidth: 8 },
        12: { cellWidth: 8 },
        13: { cellWidth: 8 },
        14: { cellWidth: 15 }
      }
    });

    doc.save(scope === 'location' ? `LHI_${selectedLocation.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf` : `LHI_Semua_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const downloadRequestsPDF = () => {
    if (requests.length === 0) return;
    
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString('id-ID', { 
      day: 'numeric', month: 'long', year: 'numeric' 
    });

    // Header
    doc.setFontSize(18);
    doc.text('LAPORAN PERMINTAAN BARANG', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Sekretariat Daerah Kabupaten Lamandau', 105, 28, { align: 'center' });
    
    doc.setLineWidth(0.5);
    doc.line(14, 32, 196, 32);

    doc.setFontSize(10);
    doc.text(`Dicetak pada: ${dateStr}`, 14, 40);
    
    // Table
    const tableData = requests.map((req, index) => [
      index + 1,
      req.item_name,
      req.quantity,
      req.user_name,
      req.department,
      new Date(req.request_date).toLocaleDateString('id-ID'),
      req.status === 'pending' ? 'Menunggu' : 
      req.status === 'approved' ? 'Disetujui' : 'Ditolak'
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['No', 'Nama Barang', 'Qty', 'Pemohon', 'Bagian', 'Tanggal', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 40 },
        2: { cellWidth: 10 },
        3: { cellWidth: 35 },
        4: { cellWidth: 35 },
        5: { cellWidth: 25 },
        6: { cellWidth: 25 }
      }
    });

    doc.save(`Laporan_Permintaan_Barang_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const downloadRequestPDF = (req: ItemRequest) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.text('Formulir Permintaan Barang', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text('Sekretariat Daerah Kabupaten Lamandau', 14, 30);
    doc.text(`ID Permintaan: #${req.id.toString().padStart(4, '0')}`, 14, 36);
    doc.text(`Status: ${
      req.status === 'pending' ? 'Menunggu' : 
      req.status === 'approved' ? 'Disetujui' : 'Ditolak'
    }`, 14, 42);

    // Content
    const tableBody = [
      ['Nama Barang', req.item_name],
      ['Jumlah', `${req.quantity} Unit`],
      ['Pemohon', req.user_name],
      ['Bagian / Bidang', req.department],
      ['Tanggal Permintaan', new Date(req.request_date).toLocaleDateString('id-ID')],
      ['Tanggal Input', new Date(req.created_at).toLocaleString('id-ID')],
      ['Alasan Permintaan', req.reason]
    ];

    autoTable(doc, {
      startY: 50,
      head: [['Field', 'Informasi']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } }
    });

    doc.save(`Permintaan_Barang_${req.id}_${req.item_name.replace(/\s+/g, '_')}.pdf`);
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

  const handleRequestStatusUpdate = async (id: number, status: ItemRequest['status']) => {
    try {
      await fetch(`/api/requests/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchRequests();
    } catch (err) {
      console.error('Failed to update request status', err);
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

  const uniqueLocations = ['Semua Lokasi', ...Array.from(new Set(items.map(item => item.location)))];

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.location.toLowerCase().includes(search.toLowerCase()) ||
      (item.user_name && item.user_name.toLowerCase().includes(search.toLowerCase())) ||
      (item.brand_type && item.brand_type.toLowerCase().includes(search.toLowerCase())) ||
      (item.item_code && item.item_code.toLowerCase().includes(search.toLowerCase())) ||
      (item.nibar && item.nibar.toLowerCase().includes(search.toLowerCase()));
    
    const matchesLocation = selectedLocation === 'Semua Lokasi' || item.location === selectedLocation;
    
    return matchesSearch && matchesLocation;
  });

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
            {activeTab === 'requests' && selectedRequestIds.length > 0 && (
              <button 
                onClick={handleDeleteSelectedRequests}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-semibold text-sm shadow-sm"
              >
                <Trash2 size={18} />
                <span>Hapus Terpilih ({selectedRequestIds.length})</span>
              </button>
            )}
            {activeTab === 'reports' && selectedReportIds.length > 0 && (
              <button 
                onClick={handleDeleteSelectedReports}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-semibold text-sm shadow-sm"
              >
                <Trash2 size={18} />
                <span>Hapus Terpilih ({selectedReportIds.length})</span>
              </button>
            )}
            {activeTab === 'inventory' && selectedItemIds.length > 0 && (
              <button 
                onClick={handleDeleteSelectedItems}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-semibold text-sm shadow-sm"
              >
                <Trash2 size={18} />
                <span>Hapus Terpilih ({selectedItemIds.length})</span>
              </button>
            )}
            <div className="relative">
              <button 
                onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-50 transition-all font-semibold text-sm shadow-sm"
              >
                <Download size={18} />
                <span>Unduh Laporan</span>
              </button>
              
              <AnimatePresence>
                {downloadMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setDownloadMenuOpen(false)} 
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-72 bg-white border border-zinc-100 rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="p-4 bg-zinc-50 border-b border-zinc-100">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Pilih Cakupan Unduhan</p>
                      </div>
                      
                      <div className="p-2 space-y-1">
                        {selectedLocation !== 'Semua Lokasi' && (
                          <div className="mb-2 pb-2 border-b border-zinc-100">
                            <p className="px-3 py-2 text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Lokasi: {selectedLocation}</p>
                            <button 
                              onClick={() => { downloadPDF('location'); setDownloadMenuOpen(false); }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-zinc-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-all text-xs font-semibold"
                            >
                              <FileText size={14} />
                              <span>PDF (LHI) - Lokasi Ini</span>
                            </button>
                            <button 
                              onClick={() => { downloadExcel('location'); setDownloadMenuOpen(false); }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-zinc-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-all text-xs font-semibold"
                            >
                              <Download size={14} />
                              <span>Excel - Lokasi Ini</span>
                            </button>
                            <button 
                              onClick={() => { downloadCSV('location'); setDownloadMenuOpen(false); }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-zinc-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-all text-xs font-semibold"
                            >
                              <Download size={14} />
                              <span>CSV - Lokasi Ini</span>
                            </button>
                          </div>
                        )}
                        
                        <div>
                          <p className="px-3 py-2 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Semua Data</p>
                          <button 
                            onClick={() => { downloadPDF('all'); setDownloadMenuOpen(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-zinc-700 hover:bg-zinc-50 rounded-xl transition-all text-xs font-semibold"
                          >
                            <FileText size={14} />
                            <span>PDF (LHI) - Semua</span>
                          </button>
                          <button 
                            onClick={() => { downloadExcel('all'); setDownloadMenuOpen(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-zinc-700 hover:bg-zinc-50 rounded-xl transition-all text-xs font-semibold"
                          >
                            <Download size={14} />
                            <span>Excel - Semua</span>
                          </button>
                          <button 
                            onClick={() => { downloadCSV('all'); setDownloadMenuOpen(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-zinc-700 hover:bg-zinc-50 rounded-xl transition-all text-xs font-semibold"
                          >
                            <Download size={14} />
                            <span>CSV - Semua</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <Link 
              to="/scan"
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-50 transition-all font-semibold text-sm shadow-sm"
            >
              <QrCode size={18} />
              <span>Pindai Aset</span>
            </Link>
            {activeTab === 'inventory' && (
              <button 
                onClick={() => { setEditingItem(null); setIsFormOpen(true); }}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-semibold text-sm shadow-lg shadow-emerald-600/20"
              >
                <Plus size={18} />
                <span>Tambah Barang</span>
              </button>
            )}
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

        <div className="flex items-center gap-4 mb-8 border-b border-zinc-200">
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
          <button 
            onClick={() => setActiveTab('requests')}
            className={`px-6 py-4 text-sm font-bold uppercase tracking-widest transition-all relative ${
              activeTab === 'requests' ? 'text-blue-600' : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <ClipboardList size={18} />
              <span>Permintaan Barang</span>
              {requests.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[10px] rounded-full">
                  {requests.length}
                </span>
              )}
            </div>
            {activeTab === 'requests' && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full" />
            )}
          </button>
        </div>

        {activeTab === 'inventory' && (
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
            {uniqueLocations.map(loc => (
              <button
                key={loc}
                onClick={() => setSelectedLocation(loc)}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.1em] whitespace-nowrap transition-all duration-300 ${
                  selectedLocation === loc 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 scale-105' 
                    : 'bg-white text-zinc-400 border border-zinc-200 hover:border-emerald-200 hover:text-emerald-600'
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'inventory' ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-900">
                {selectedLocation === 'Semua Lokasi' ? 'Semua Inventaris' : `Inventaris: ${selectedLocation}`}
              </h2>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                {filteredItems.length} Barang ditemukan
              </span>
            </div>

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
                      className="bg-white border border-zinc-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col relative"
                    >
                      <div className="absolute top-4 left-4 z-10">
                        <input 
                          type="checkbox"
                          className="w-5 h-5 rounded-lg border-zinc-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          checked={selectedItemIds.includes(item.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItemIds(prev => [...prev, item.id]);
                            } else {
                              setSelectedItemIds(prev => prev.filter(id => id !== item.id));
                            }
                          }}
                        />
                      </div>
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
                        <div className="absolute top-4 left-14">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                            item.condition === 'B' ? 'bg-emerald-500 text-white' :
                            item.condition === 'RR' ? 'bg-amber-500 text-white' :
                            'bg-red-500 text-white'
                          }`}>
                            {item.condition === 'B' ? 'Baik' : 
                             item.condition === 'RR' ? 'Rusak Ringan' : 'Rusak Berat'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-6 flex-grow flex flex-col">
                        <div className="mb-6">
                          <h3 className="font-bold text-lg text-zinc-900 leading-tight mb-1 group-hover:text-emerald-600 transition-colors">{item.name}</h3>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{item.brand_type || 'Tanpa Merek'}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-8">
                          <div className="space-y-1">
                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Ruang / Bagian</p>
                            <div className="flex items-center gap-1.5 text-zinc-700">
                              <MapPin size={12} className="text-zinc-300" />
                              <span className="text-xs font-semibold truncate">{item.location}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Pemakai</p>
                            <div className="flex items-center gap-1.5 text-zinc-700">
                              <User size={12} className="text-zinc-300" />
                              <span className="text-xs font-semibold truncate">{item.user_name || 'Belum ada'}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Kode Barang</p>
                            <div className="flex items-center gap-1.5 text-zinc-700">
                              <QrCode size={12} className="text-zinc-300" />
                              <span className="text-xs font-semibold truncate">{item.item_code || '-'}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Tahun</p>
                            <div className="flex items-center gap-1.5 text-zinc-700">
                              <CalendarIcon size={12} className="text-zinc-300" />
                              <span className="text-xs font-semibold truncate">{item.procurement_year}</span>
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
        ) : activeTab === 'reports' ? (
          <div className="space-y-6">
            {reports.length === 0 ? (
              <div className="text-center py-32 bg-white rounded-[40px] border-2 border-dashed border-zinc-100">
                <AlertCircle size={64} className="mx-auto text-zinc-100 mb-6" />
                <h3 className="text-xl font-bold text-zinc-900 mb-2">Belum ada laporan kerusakan</h3>
                <p className="text-zinc-400 text-sm">Semua aset elektronik dalam kondisi terpantau.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                <AnimatePresence mode="popLayout">
                  {reports.map((report, index) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.1 }}
                      key={report.id}
                      className="bg-white p-8 rounded-[32px] border border-zinc-100 shadow-sm flex flex-col md:flex-row gap-8 items-start relative"
                    >
                      <div className="absolute top-8 left-4">
                        <input 
                          type="checkbox"
                          className="w-5 h-5 rounded-lg border-zinc-300 text-red-600 focus:ring-red-500 cursor-pointer"
                          checked={selectedReportIds.includes(report.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedReportIds(prev => [...prev, report.id]);
                            } else {
                              setSelectedReportIds(prev => prev.filter(id => id !== report.id));
                            }
                          }}
                        />
                      </div>
                    <div className="p-4 bg-red-50 text-red-600 rounded-2xl ml-8">
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
                          <button 
                            onClick={() => handleDeleteReport(report.id)}
                            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Hapus Laporan"
                          >
                            <Trash2 size={18} />
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
                </AnimatePresence>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {requests.length === 0 ? (
              <div className="text-center py-32 bg-white rounded-[40px] border-2 border-dashed border-zinc-100">
                <ClipboardList size={64} className="mx-auto text-zinc-100 mb-6" />
                <h3 className="text-xl font-bold text-zinc-900 mb-2">Belum ada permintaan barang</h3>
                <p className="text-zinc-400 text-sm">Daftar permintaan pengadaan barang akan muncul di sini.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                <AnimatePresence mode="popLayout">
                  {requests.map((req, index) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.1 }}
                      key={req.id}
                      className="bg-white p-8 rounded-[32px] border border-zinc-100 shadow-sm flex flex-col md:flex-row gap-8 items-start relative"
                    >
                      <div className="absolute top-8 left-4">
                        <input 
                          type="checkbox"
                          className="w-5 h-5 rounded-lg border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          checked={selectedRequestIds.includes(req.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRequestIds(prev => [...prev, req.id]);
                            } else {
                              setSelectedRequestIds(prev => prev.filter(id => id !== req.id));
                            }
                          }}
                        />
                      </div>
                      <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl ml-8">
                        <ClipboardList size={24} />
                      </div>
                      <div className="flex-grow space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-bold text-zinc-900">{req.item_name}</h3>
                            <p className="text-zinc-400 text-xs font-medium mt-1">Permintaan #{req.id.toString().padStart(4, '0')} • {new Date(req.created_at).toLocaleString('id-ID')}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${
                              req.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                              req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {req.status === 'pending' ? 'Menunggu' : 
                               req.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                            </span>
                            <button 
                              onClick={() => downloadRequestPDF(req)}
                              className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all"
                              title="Unduh PDF Permintaan Ini"
                            >
                              <Download size={18} />
                            </button>
                            <button 
                              onClick={() => handleDeleteRequest(req.id)}
                              className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Hapus Permintaan"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 py-4 border-y border-zinc-50">
                          <div className="space-y-1">
                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Jumlah</p>
                            <div className="flex items-center gap-2 text-zinc-700">
                              <Hash size={14} className="text-zinc-300" />
                              <span className="text-sm font-semibold">{req.quantity} Unit</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Pemohon</p>
                            <div className="flex items-center gap-2 text-zinc-700">
                              <User size={14} className="text-zinc-300" />
                              <span className="text-sm font-semibold">{req.user_name}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Bagian</p>
                            <div className="flex items-center gap-2 text-zinc-700">
                              <Building size={14} className="text-zinc-300" />
                              <span className="text-sm font-semibold">{req.department}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Tanggal</p>
                            <div className="flex items-center gap-2 text-zinc-700">
                              <CalendarIcon size={14} className="text-zinc-300" />
                              <span className="text-sm font-semibold">{new Date(req.request_date).toLocaleDateString('id-ID')}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Alasan Permintaan</p>
                          <p className="text-zinc-600 text-sm leading-relaxed bg-zinc-50 p-4 rounded-2xl italic">
                            "{req.reason}"
                          </p>
                        </div>

                        <div className="pt-4 flex flex-wrap gap-3">
                          {req.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleRequestStatusUpdate(req.id, 'approved')}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-all"
                              >
                                <CheckCircle2 size={14} />
                                <span>Setujui</span>
                              </button>
                              <button 
                                onClick={() => handleRequestStatusUpdate(req.id, 'rejected')}
                                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl text-xs font-bold transition-all"
                              >
                                <XCircle size={14} />
                                <span>Tolak</span>
                              </button>
                            </>
                          )}
                          {req.status === 'approved' && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold">
                              <CheckCircle2 size={14} />
                              <span>Disetujui</span>
                            </div>
                          )}
                          {req.status === 'rejected' && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-xl text-xs font-bold">
                              <XCircle size={14} />
                              <span>Ditolak</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
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
