import React, { useEffect, useState, useMemo } from 'react';
import { Asset, ConsumableMaterial, MaterialRequisitionLog, BorrowLog, RepairLog, AppSettings, AssetStatus } from './types/asset';
import { dataService, normalizeAsset, normalizeMaterial } from './services/dataService';
import { calculateDepreciation } from './utils/depreciation';
import { supabase } from './lib/supabase';
import { initAuth, googleSignIn, getAccessToken } from './lib/googleDriveAuth';
import { User } from 'firebase/auth';

// Navigation & Layout Components
import { Sidebar, AppView } from './components/Sidebar';
import { TopBar } from './components/TopBar';

// Feature Components
import { ThreeAssetVisualizer } from './components/ThreeAssetVisualizer';
import { DashboardCharts } from './components/DashboardCharts';
import { AssetQRModal } from './components/AssetQRModal';
import { QRScannerModal } from './components/QRScannerModal';
import { AssetFormModal } from './components/AssetFormModal';
import { AssetDetailModal } from './components/AssetDetailModal';
import { AssetRegisterForm } from './components/AssetRegisterForm';
import { BorrowModal } from './components/BorrowModal';
import { RepairModal } from './components/RepairModal';
import { ConsumablesPanel } from './components/ConsumablesPanel';
import { AnnualReportView } from './components/AnnualReportView';
import { SettingsModal } from './components/SettingsModal';
import { GitHubGuideModal } from './components/GitHubGuideModal';

// Icons
import {
  Search,
  Plus,
  QrCode,
  FileText,
  Wrench,
  ArrowLeftRight,
  Eye,
  Package,
  Server,
  Layers,
  BarChart3,
  Cpu,
  ArrowRight,
  SlidersHorizontal,
  Download,
  AlertTriangle,
  Building,
  Calendar,
  CheckCircle2,
  Trash2,
  Edit,
  Sparkles
} from 'lucide-react';

export default function App() {
  // Main datasets
  const [assets, setAssets] = useState<Asset[]>([]);
  const [materials, setMaterials] = useState<ConsumableMaterial[]>([]);
  const [requisitions, setRequisitions] = useState<MaterialRequisitionLog[]>([]);
  const [borrows, setBorrows] = useState<BorrowLog[]>([]);
  const [repairs, setRepairs] = useState<RepairLog[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    app_title: 'ระบบบริหารจัดการครุภัณฑ์คอมพิวเตอร์และทรัพย์สิน',
    organization_name: 'ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร',
    sub_organization: 'กลุ่มงานพัฒนาระบบและโครงสร้างพื้นฐานดิจิทัล',
    garuda_symbol_type: 'official_gold',
    chief_procurement_officer: 'นายสมชาย วัฒนากิจ (หัวหน้าเจ้าหน้าที่พัสดุ)',
    procurement_officer: 'นางสาวกนกพร เลิศรัตนชัย (เจ้าหน้าที่พัสดุ)',
    approver_officer: 'ดร.ธนกฤต ประเสริฐสุข (ผู้อำนวยการศูนย์ฯ)',
    inspection_committee: [
      'นายสุรเดช สุขสวัสดิ์ (ประธานกรรมการตรวจนับ)',
      'นางสาวพิมพ์ชนก รัตนพร (กรรมการ)',
      'นายอภิสิทธิ์ มงคลชัย (กรรมการและเลขานุการ)'
    ],
    google_drive_folder_url: 'https://drive.google.com/drive/folders/1RlYuiMK968PVSDKwhkPItNgUgQSginGU?usp=sharing',
    departments: [
      'กลุ่มงานเทคโนโลยีสารสนเทศและการสื่อสาร',
      'กลุ่มงานบริหารงานทั่วไปและสารบรรณ',
      'กองคลังและพัสดุ',
      'กลุ่มงานวิชาการและวางแผนงาน',
      'ศูนย์บริการประชาชนและรับเรื่องร้องเรียน'
    ],
    categories: [
      'คอมพิวเตอร์ตั้งโต๊ะ (Desktop PC)',
      'คอมพิวเตอร์โน้ตบุ๊ก (Notebook)',
      'เครื่องแม่ข่าย (Server)',
      'จอแสดงผล (Monitor)',
      'เครื่องพิมพ์และสแกนเนอร์ (Printer/Scanner)',
      'อุปกรณ์เครือข่าย (Network Switch/Router)',
      'เครื่องสำรองไฟฟ้า (UPS)'
    ],
    fiscal_year: 2568
  });

  const [loading, setLoading] = useState(true);
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [activeView, setActiveView] = useState<AppView>('dashboard');
  const [dashboardDisplayMode, setDashboardDisplayMode] = useState<'both' | '3d_only' | 'charts_only'>('both');

  // Sidebar Layout State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Google Drive Auth State
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleConnected, setGoogleConnected] = useState(false);

  // Search & Filters for Asset Register View
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modals state
  const [selectedAssetForQR, setSelectedAssetForQR] = useState<Asset | null>(null);
  const [selectedAssetForRegister, setSelectedAssetForRegister] = useState<Asset | null>(null);
  const [selectedAssetForDetail, setSelectedAssetForDetail] = useState<Asset | null>(null);
  const [assetFormModalOpen, setAssetFormModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const [borrowModalAsset, setBorrowModalAsset] = useState<Asset | null>(null);
  const [activeBorrowLog, setActiveBorrowLog] = useState<BorrowLog | undefined>(undefined);

  const [repairModalAsset, setRepairModalAsset] = useState<Asset | null>(null);
  const [activeRepairLog, setActiveRepairLog] = useState<RepairLog | undefined>(undefined);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [githubGuideOpen, setGithubGuideOpen] = useState(false);

  // 1. Initial Load & Auth Setup
  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      try {
        const [assetRes, matRes, borrowRes, repairRes, reqRes, setRes] = await Promise.all([
          dataService.getAssets(),
          dataService.getMaterials(),
          dataService.getBorrows(),
          dataService.getRepairs(),
          dataService.getRequisitions(),
          dataService.getSettings()
        ]);

        if (assetRes.data) setAssets(assetRes.data);
        if (matRes.data) setMaterials(matRes.data);
        if (borrowRes) setBorrows(borrowRes);
        if (repairRes) setRepairs(repairRes);
        if (reqRes) setRequisitions(reqRes);
        if (setRes) setSettings(setRes);
      } catch (err) {
        console.error('Error loading initial data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAll();

    // Check Google Drive Auth state
    const unsubscribeAuth = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleConnected(true);
      },
      () => {
        setGoogleUser(null);
        setGoogleConnected(false);
      }
    );

    // 2. Realtime Subscriptions
    const channel = supabase
      .channel('applet-realtime-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assets' }, payload => {
        if (payload.eventType === 'INSERT') {
          setAssets(prev => [normalizeAsset(payload.new), ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setAssets(prev => prev.map(a => (a.id === (payload.new as Asset).id ? normalizeAsset(payload.new) : a)));
        } else if (payload.eventType === 'DELETE') {
          setAssets(prev => prev.filter(a => a.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'consumable_materials' }, payload => {
        if (payload.eventType === 'INSERT') {
          setMaterials(prev => [normalizeMaterial(payload.new), ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setMaterials(prev => prev.map(m => (m.id === (payload.new as ConsumableMaterial).id ? normalizeMaterial(payload.new) : m)));
        } else if (payload.eventType === 'DELETE') {
          setMaterials(prev => prev.filter(m => m.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'material_requisitions' }, payload => {
        if (payload.eventType === 'INSERT') {
          setRequisitions(prev => [payload.new as MaterialRequisitionLog, ...prev]);
        } else if (payload.eventType === 'DELETE') {
          setRequisitions(prev => prev.filter(r => r.id !== payload.old.id));
        }
      })
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
          setSupabaseConnected(true);
        }
      });

    return () => {
      supabase.removeChannel(channel);
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, []);

  const handleConnectGoogle = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleConnected(true);
      }
    } catch (e: any) {
      if (e?.code === 'auth/popup-blocked' || e?.message === 'POPUP_BLOCKED') {
        alert('เบราว์เซอร์บล็อกหน้าต่างป็อปอัป (Popup Blocked):\nโปรดคลิกที่ไอคอนแม่กุญแจหรือสัญลักษณ์ป็อปอัปที่แถบ URL ของเบราว์เซอร์ แล้วเลือก "อนุญาตป็อปอัปเสมอ (Always allow popups)" จากนั้นคลิกใหม่อีกครั้ง');
      } else {
        console.warn('Google connect:', e);
      }
    }
  };

  // CRUD Handlers
  const handleSaveAsset = async (asset: Asset) => {
    const res = await dataService.saveAsset(asset);
    setAssets(prev => {
      const idx = prev.findIndex(a => a.id === asset.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = res.data;
        return copy;
      }
      return [res.data, ...prev];
    });
    setAssetFormModalOpen(false);
    setEditingAsset(null);
  };

  const handleDeleteAsset = async (id: string) => {
    if (!window.confirm('คุณต้องการลบข้อมูลครุภัณฑ์นี้ออกจากระบบใช่หรือไม่?')) return;
    await dataService.deleteAsset(id);
    setAssets(prev => prev.filter(a => a.id !== id));
  };

  const handleSaveMaterial = async (mat: ConsumableMaterial) => {
    const res = await dataService.saveMaterial(mat);
    setMaterials(prev => {
      const idx = prev.findIndex(m => m.id === mat.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = res.data;
        return copy;
      }
      return [res.data, ...prev];
    });
  };

  const handleDeleteMaterial = async (id: string) => {
    await dataService.deleteMaterial(id);
    setMaterials(prev => prev.filter(m => m.id !== id));
  };

  const handleSaveRequisition = async (req: MaterialRequisitionLog) => {
    const saved = await dataService.saveRequisition(req);
    setRequisitions(prev => [saved, ...prev]);
    const matRes = await dataService.getMaterials();
    setMaterials(matRes.data);
  };

  const handleSaveBorrow = async (log: BorrowLog) => {
    const res = await dataService.saveBorrow(log);
    setBorrows(prev => {
      const idx = prev.findIndex(b => b.id === log.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = res;
        return copy;
      }
      return [res, ...prev];
    });

    const assetRes = await dataService.getAssets();
    setAssets(assetRes.data);
  };

  const handleSaveRepair = async (log: RepairLog) => {
    const res = await dataService.saveRepair(log);
    setRepairs(prev => {
      const idx = prev.findIndex(r => r.id === log.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = res;
        return copy;
      }
      return [res, ...prev];
    });

    const assetRes = await dataService.getAssets();
    setAssets(assetRes.data);
  };

  const handleSaveSettings = async (newSettings: AppSettings) => {
    await dataService.saveSettings(newSettings);
    setSettings(newSettings);
  };

  // Filtered Assets Computation
  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesCode = (asset.asset_code || '').toLowerCase().includes(q);
        const matchesSN = (asset.serial_number || '').toLowerCase().includes(q);
        const matchesName = (asset.name || '').toLowerCase().includes(q);
        const matchesUser = (asset.current_user || '').toLowerCase().includes(q);
        const matchesGFMIS = (asset.gfmis_code || '').toLowerCase().includes(q);
        if (!matchesCode && !matchesSN && !matchesName && !matchesUser && !matchesGFMIS) {
          return false;
        }
      }

      if (statusFilter !== 'all' && asset.status !== statusFilter) return false;
      if (deptFilter !== 'all' && asset.department !== deptFilter) return false;
      if (categoryFilter !== 'all' && asset.category !== categoryFilter) return false;

      return true;
    });
  }, [assets, searchQuery, statusFilter, deptFilter, categoryFilter]);

  // Aggregate Metrics for Dashboard
  const totalCost = assets.reduce((sum, a) => sum + (Number(a?.cost) || 0), 0);
  const totalBookValue = assets.reduce((sum, a) => {
    const dep = calculateDepreciation(a);
    return sum + (Number(dep?.netBookValue) || 0);
  }, 0);

  const inUseCount = assets.filter(a => a.status === 'in_use').length;
  const availableCount = assets.filter(a => a.status === 'available').length;
  const repairingCount = assets.filter(a => a.status === 'repairing').length;
  const borrowedCount = assets.filter(a => a.status === 'borrowed').length;
  const lowMaterialsCount = materials.filter(m => (Number(m.stock_quantity) || 0) <= (Number(m.min_threshold) || 0)).length;

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800 font-sans antialiased">
      {/* 1. Modern Left Sidebar Navigation */}
      <Sidebar
        settings={settings}
        activeView={activeView}
        onSelectView={setActiveView}
        onOpenNewAsset={() => {
          setEditingAsset(null);
          setAssetFormModalOpen(true);
        }}
        onOpenScanner={() => setScannerOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenGitHubGuide={() => setGithubGuideOpen(true)}
        supabaseConnected={supabaseConnected}
        googleConnected={googleConnected}
        googleEmail={googleUser?.email}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        counts={{
          totalAssets: assets.length,
          repairing: repairingCount,
          borrowed: borrowedCount,
          lowMaterials: lowMaterialsCount
        }}
      />

      {/* 2. Main App Content Container (Offset by sidebar width) */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'
        }`}
      >
        {/* Modern Top App Bar */}
        <TopBar
          settings={settings}
          activeView={activeView}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenNewAsset={() => {
            setEditingAsset(null);
            setAssetFormModalOpen(true);
          }}
          onOpenScanner={() => setScannerOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          googleConnected={googleConnected}
          googleEmail={googleUser?.email}
          onConnectGoogle={handleConnectGoogle}
        />

        {/* Dynamic Viewport */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* ======================================================== */}
          {/* VIEW 1: แดชบอร์ดภาพรวม & คลัง 3D (DASHBOARD ONLY) */}
          {/* ======================================================== */}
          {activeView === 'dashboard' && (
            <div className="space-y-6">
              {/* Top KPI Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div
                  onClick={() => setActiveView('assets')}
                  className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-sky-300 transition-all cursor-pointer group"
                >
                  <span className="text-slate-500 text-[11px] block font-medium">ครุภัณฑ์ทั้งหมด</span>
                  <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block group-hover:text-sky-600 transition-colors">
                    {assets.length}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block flex items-center gap-1">
                    <span>เปิดดูทะเบียน</span>
                    <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                  <span className="text-slate-500 text-[11px] block font-medium">กำลังใช้งาน</span>
                  <span className="text-2xl font-bold font-mono text-blue-600 mt-1 block">{inUseCount}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">ประจำจุดปฏิบัติการ</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                  <span className="text-slate-500 text-[11px] block font-medium">ว่าง / พร้อมใช้</span>
                  <span className="text-2xl font-bold font-mono text-emerald-600 mt-1 block">{availableCount}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">พร้อมจ่ายใช้งาน</span>
                </div>

                <div
                  onClick={() => setActiveView('repairs')}
                  className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-amber-300 transition-all cursor-pointer"
                >
                  <span className="text-slate-500 text-[11px] block font-medium">กำลังส่งซ่อม</span>
                  <span className="text-2xl font-bold font-mono text-amber-600 mt-1 block">{repairingCount}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">อยู่ระหว่างบำรุงรักษา</span>
                </div>

                <div
                  onClick={() => setActiveView('borrows')}
                  className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-purple-300 transition-all cursor-pointer"
                >
                  <span className="text-slate-500 text-[11px] block font-medium">อยู่ระหว่างยืม</span>
                  <span className="text-2xl font-bold font-mono text-purple-600 mt-1 block">{borrowedCount}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">ยืมใช้งานภายนอก</span>
                </div>

                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-2xl shadow-sm">
                  <span className="text-slate-300 text-[11px] block font-medium">มูลค่าสุทธิทางบัญชี</span>
                  <span className="text-xl font-bold font-mono text-sky-400 mt-1 block">
                    {(totalBookValue || 0).toLocaleString()} ฿
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
                    ราคาทุนรวม {(totalCost || 0).toLocaleString()} ฿
                  </span>
                </div>
              </div>

              {/* Display Mode Toolbar for 3D Visualizer & Analytics Charts */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-sky-100 text-sky-700 rounded-lg">
                      <Cpu className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                        แบบจำลองคลังครุภัณฑ์ดิจิทัล 3D (Warehouse Digital Twin) & กราฟสถิติ
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        คลิกที่อุปกรณ์ 3D เพื่อดูรายละเอียด สแกน QR และบันทึกยืม/ส่งซ่อมได้ทันที
                      </p>
                    </div>
                  </div>

                  {/* Mode switcher tabs */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium">
                    <button
                      onClick={() => setDashboardDisplayMode('both')}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        dashboardDisplayMode === 'both'
                          ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      3D + กราฟสรุป
                    </button>
                    <button
                      onClick={() => setDashboardDisplayMode('3d_only')}
                      className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                        dashboardDisplayMode === '3d_only'
                          ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Server className="w-3.5 h-3.5" />
                      <span>เฉพาะ 3D คลัง</span>
                    </button>
                    <button
                      onClick={() => setDashboardDisplayMode('charts_only')}
                      className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                        dashboardDisplayMode === 'charts_only'
                          ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>เฉพาะกราฟสถิติ</span>
                    </button>
                  </div>
                </div>

                {/* 3D Visualizer Component */}
                {(dashboardDisplayMode === 'both' || dashboardDisplayMode === '3d_only') && (
                  <ThreeAssetVisualizer
                    assets={assets}
                    materials={materials}
                    onSelectAsset={asset => setSelectedAssetForDetail(asset)}
                    onOpenQR={asset => setSelectedAssetForQR(asset)}
                    onOpenBorrow={asset => {
                      setBorrowModalAsset(asset);
                      setActiveBorrowLog(undefined);
                    }}
                    onOpenRepair={asset => {
                      setRepairModalAsset(asset);
                      setActiveRepairLog(undefined);
                    }}
                  />
                )}

                {/* Charts Breakdown */}
                {(dashboardDisplayMode === 'both' || dashboardDisplayMode === 'charts_only') && (
                  <DashboardCharts assets={assets} />
                )}
              </div>

              {/* Bottom Navigation Shortcut to Asset Registry */}
              <div className="p-4 bg-gradient-to-r from-sky-50 via-indigo-50 to-white rounded-2xl border border-sky-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-sky-600 text-white rounded-xl shadow-xs">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                      ต้องการค้นหา ตรวจสอบ หรือจัดการทะเบียนครุภัณฑ์แบบละเอียด?
                    </h4>
                    <p className="text-[11px] text-slate-600">
                      เข้าสู่หน้าทะเบียนครุภัณฑ์เพื่อค้นหาด้วย S/N, พิมพ์ป้าย QR Code, และคำนวณค่าเสื่อมราคา
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveView('assets')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shrink-0 shadow-xs"
                >
                  <span>ไปที่ทะเบียนครุภัณฑ์</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 2: ทะเบียนครุภัณฑ์คอมพิวเตอร์ (ASSET REGISTRY ONLY) */}
          {/* ======================================================== */}
          {activeView === 'assets' && (
            <div className="space-y-4">
              {/* Toolbar & Search Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="ค้นหาด้วย Serial Number, รหัสครุภัณฑ์, ชื่อรายการ, หรือผู้ใช้งาน..."
                      className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-2 text-xs text-slate-400 hover:text-slate-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Multi-Filters */}
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                    >
                      <option value="all">ทุกสถานะครุภัณฑ์</option>
                      <option value="available">พร้อมใช้งานในคลัง ({availableCount})</option>
                      <option value="in_use">กำลังใช้งาน ({inUseCount})</option>
                      <option value="borrowed">อยู่ระหว่างยืม ({borrowedCount})</option>
                      <option value="repairing">ส่งซ่อมบำรุง ({repairingCount})</option>
                      <option value="disposed">จำหน่ายแล้ว</option>
                    </select>

                    <select
                      value={deptFilter}
                      onChange={e => setDeptFilter(e.target.value)}
                      className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white max-w-[180px]"
                    >
                      <option value="all">ทุกหน่วยงาน</option>
                      {settings.departments.map(d => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>

                    <select
                      value={categoryFilter}
                      onChange={e => setCategoryFilter(e.target.value)}
                      className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white max-w-[180px]"
                    >
                      <option value="all">ทุกหมวดหมู่ครุภัณฑ์</option>
                      {settings.categories.map(c => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => {
                        setEditingAsset(null);
                        setAssetFormModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>เพิ่มครุภัณฑ์ใหม่</span>
                    </button>
                  </div>
                </div>

                {/* Filter Feedback */}
                {(statusFilter !== 'all' || deptFilter !== 'all' || categoryFilter !== 'all' || searchQuery) && (
                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 border-t border-slate-100">
                    <span>กำลังแสดง {filteredAssets.length} จากทั้งหมด {assets.length} รายการ</span>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setStatusFilter('all');
                        setDeptFilter('all');
                        setCategoryFilter('all');
                      }}
                      className="text-sky-600 hover:text-sky-800 underline font-medium"
                    >
                      ล้างตัวกรองทั้งหมด
                    </button>
                  </div>
                )}
              </div>

              {/* Asset Data Grid Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                      <tr>
                        <th className="px-4 py-3">รหัสครุภัณฑ์ / GFMIS</th>
                        <th className="px-3 py-3">รายการ / ยี่ห้อ / รุ่น</th>
                        <th className="px-3 py-3">Serial Number (S/N)</th>
                        <th className="px-3 py-3">หน่วยงาน / ผู้ครอบครอง</th>
                        <th className="px-3 py-3 text-right">ราคาทุนเดิม</th>
                        <th className="px-3 py-3 text-right">มูลค่าสุทธิ (NBV)</th>
                        <th className="px-3 py-3 text-center">สถานะ</th>
                        <th className="px-4 py-3 text-right">การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredAssets.length > 0 ? (
                        filteredAssets.map(asset => {
                          const dep = calculateDepreciation(asset);
                          return (
                            <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3">
                                <span className="font-mono font-bold text-slate-900 block">{asset.asset_code}</span>
                                {asset.gfmis_code && (
                                  <span className="font-mono text-[10px] text-slate-400 block">GFMIS: {asset.gfmis_code}</span>
                                )}
                              </td>

                              <td className="px-3 py-3">
                                <div className="font-medium text-slate-800 max-w-xs truncate">{asset.name}</div>
                                <div className="text-[11px] text-slate-500 font-mono">{asset.brand_model}</div>
                              </td>

                              <td className="px-3 py-3 font-mono text-slate-700">
                                {asset.serial_number}
                              </td>

                              <td className="px-3 py-3">
                                <div className="text-slate-800 truncate max-w-[170px]">{asset.department}</div>
                                <div className="text-[11px] text-slate-400">{asset.current_user}</div>
                              </td>

                              <td className="px-3 py-3 text-right font-mono text-slate-800">
                                {(Number(asset?.cost) || 0).toLocaleString()} ฿
                              </td>

                              <td className="px-3 py-3 text-right font-mono font-bold text-sky-700">
                                {(Number(dep?.netBookValue) || 0).toLocaleString()} ฿
                                {dep?.isFullyDepreciated && (
                                  <span className="block text-[9px] text-amber-600 font-sans font-normal">ครบอายุ 5 ปี</span>
                                )}
                              </td>

                              <td className="px-3 py-3 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                                  asset.status === 'available' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                  asset.status === 'in_use' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                  asset.status === 'borrowed' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                                  asset.status === 'repairing' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                  'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}>
                                  {asset.status === 'available' ? 'พร้อมใช้' :
                                   asset.status === 'in_use' ? 'กำลังใช้' :
                                   asset.status === 'borrowed' ? 'อยู่ระหว่างยืม' :
                                   asset.status === 'repairing' ? 'ส่งซ่อม' : 'จำหน่ายแล้ว'}
                                </span>
                              </td>

                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => setSelectedAssetForDetail(asset)}
                                    className="p-1.5 text-slate-500 hover:text-sky-700 rounded-lg hover:bg-sky-50 transition-colors"
                                    title="ดูรายละเอียดครุภัณฑ์และประวัติ"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => setSelectedAssetForQR(asset)}
                                    className="p-1.5 text-slate-500 hover:text-sky-700 rounded-lg hover:bg-sky-50 transition-colors"
                                    title="พิมพ์ป้ายครุภัณฑ์พร้อม QR Code"
                                  >
                                    <QrCode className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => setSelectedAssetForRegister(asset)}
                                    className="p-1.5 text-slate-500 hover:text-sky-700 rounded-lg hover:bg-sky-50 transition-colors"
                                    title="พิมพ์ใบทะเบียนคุมทรัพย์สิน (พด. 4)"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                  </button>

                                  {asset.status === 'borrowed' ? (
                                    <button
                                      onClick={() => {
                                        setBorrowModalAsset(asset);
                                        const active = borrows.find(b => b.asset_id === asset.id && b.status === 'borrowed');
                                        setActiveBorrowLog(active);
                                      }}
                                      className="p-1.5 text-purple-600 hover:text-purple-800 rounded-lg hover:bg-purple-50 transition-colors"
                                      title="รับคืนพัสดุ"
                                    >
                                      <ArrowLeftRight className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setBorrowModalAsset(asset);
                                        setActiveBorrowLog(undefined);
                                      }}
                                      className="p-1.5 text-slate-500 hover:text-purple-700 rounded-lg hover:bg-purple-50 transition-colors"
                                      title="ยืมครุภัณฑ์"
                                    >
                                      <ArrowLeftRight className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  <button
                                    onClick={() => {
                                      setRepairModalAsset(asset);
                                      setActiveRepairLog(undefined);
                                    }}
                                    className="p-1.5 text-slate-500 hover:text-amber-700 rounded-lg hover:bg-amber-50 transition-colors"
                                    title="แจ้งส่งซ่อมบำรุง"
                                  >
                                    <Wrench className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => {
                                      setEditingAsset(asset);
                                      setAssetFormModalOpen(true);
                                    }}
                                    className="p-1.5 text-slate-500 hover:text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors"
                                    title="แก้ไขข้อมูลครุภัณฑ์"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => handleDeleteAsset(asset.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                                    title="ลบครุภัณฑ์"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-400">
                            <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                            <p className="font-medium text-slate-600">ไม่พบข้อมูลครุภัณฑ์ที่ตรงกับเงื่อนไขการค้นหา</p>
                            <p className="text-[11px] text-slate-400 mt-1">ลองเปลี่ยนคำค้นหา หรือกดปุ่ม "เพิ่มครุภัณฑ์ใหม่"</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 3: คลังวัสดุคอมพิวเตอร์สิ้นเปลือง */}
          {/* ======================================================== */}
          {activeView === 'materials' && (
            <ConsumablesPanel
              materials={materials}
              requisitions={requisitions}
              settings={settings}
              onSaveMaterial={handleSaveMaterial}
              onDeleteMaterial={handleDeleteMaterial}
              onSaveRequisition={handleSaveRequisition}
            />
          )}

          {/* ======================================================== */}
          {/* VIEW 4: บันทึกการยืม-คืนพัสดุ */}
          {/* ======================================================== */}
          {activeView === 'borrows' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">ประวัติและทะเบียนการยืม-คืนพัสดุคอมพิวเตอร์</h3>
                  <p className="text-xs text-slate-500">บันทึกควบคุมการยืมอุปกรณ์ใช้งานชั่วคราวตามระเบียบพัสดุฯ</p>
                </div>
                <button
                  onClick={() => {
                    const available = assets.find(a => a.status === 'available');
                    if (available) {
                      setBorrowModalAsset(available);
                      setActiveBorrowLog(undefined);
                    } else {
                      alert('ไม่มีครุภัณฑ์ที่มีสถานะพร้อมใช้งานในคลัง');
                    }
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>บันทึกการยืมใหม่</span>
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                    <tr>
                      <th className="px-4 py-3">รหัส / รายการครุภัณฑ์</th>
                      <th className="px-3 py-3">ผู้ยืม / หน่วยงาน</th>
                      <th className="px-3 py-3">วัตถุประสงค์</th>
                      <th className="px-3 py-3 text-center">วันที่ยืม</th>
                      <th className="px-3 py-3 text-center">กำหนดส่งคืน</th>
                      <th className="px-3 py-3 text-center">สถานะ</th>
                      <th className="px-4 py-3 text-right">ดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {borrows.map(b => (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <strong className="font-mono text-slate-900 block">{b.asset_code}</strong>
                          <span className="text-slate-500 text-[11px]">{b.asset_name}</span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="font-medium text-slate-800 block">{b.borrower_name}</span>
                          <span className="text-slate-400 text-[11px]">{b.borrower_department}</span>
                        </td>
                        <td className="px-3 py-3 text-slate-600 max-w-xs">{b.purpose}</td>
                        <td className="px-3 py-3 text-center font-mono">{b.borrow_date}</td>
                        <td className="px-3 py-3 text-center font-mono">{b.expected_return_date}</td>
                        <td className="px-3 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                            b.status === 'returned' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}>
                            {b.status === 'returned' ? 'คืนแล้ว' : 'กำลังยืม'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {b.status === 'borrowed' && (
                            <button
                              onClick={() => {
                                const assetObj = assets.find(a => a.id === b.asset_id || a.asset_code === b.asset_code);
                                if (assetObj) {
                                  setBorrowModalAsset(assetObj);
                                  setActiveBorrowLog(b);
                                }
                              }}
                              className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg font-medium text-xs"
                            >
                              รับคืนพัสดุ
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 5: บันทึกและประวัติการส่งซ่อมบำรุง */}
          {/* ======================================================== */}
          {activeView === 'repairs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">ประวัติและทะเบียนการส่งซ่อมบำรุง</h3>
                  <p className="text-xs text-slate-500">บันทึกค่าใช้จ่ายและผลการซ่อมบำรุงเพื่อพิจารณาความคุ้มค่าตามระเบียบ</p>
                </div>
                <button
                  onClick={() => {
                    if (assets.length > 0) {
                      setRepairModalAsset(assets[0]);
                      setActiveRepairLog(undefined);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>แจ้งซ่อมบำรุง</span>
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                    <tr>
                      <th className="px-4 py-3">รหัส / รายการครุภัณฑ์</th>
                      <th className="px-3 py-3">อาการชำรุด / ปัญหา</th>
                      <th className="px-3 py-3">ผู้แจ้ง / หน่วยงาน</th>
                      <th className="px-3 py-3">ผู้ซ่อม / ศูนย์บริการ</th>
                      <th className="px-3 py-3 text-right">ค่าใช้จ่าย (บาท)</th>
                      <th className="px-3 py-3 text-center">สถานะ</th>
                      <th className="px-4 py-3 text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {repairs.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <strong className="font-mono text-slate-900 block">{r.asset_code}</strong>
                          <span className="text-slate-500 text-[11px]">{r.asset_name}</span>
                        </td>
                        <td className="px-3 py-3 text-slate-700 max-w-xs">{r.issue_description}</td>
                        <td className="px-3 py-3">
                          <span className="font-medium text-slate-800 block">{r.reporter_name}</span>
                          <span className="text-slate-400 text-[11px]">{r.reporter_department}</span>
                        </td>
                        <td className="px-3 py-3 text-slate-600">{r.repair_vendor || '-'}</td>
                        <td className="px-3 py-3 text-right font-mono font-bold text-slate-800">
                          {(Number(r?.repair_cost) || 0).toLocaleString()} ฿
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                            r.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            r.status === 'in_progress' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            r.status === 'unrepairable' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {r.status === 'completed' ? 'ซ่อมเสร็จแล้ว' :
                             r.status === 'in_progress' ? 'กำลังซ่อม' :
                             r.status === 'unrepairable' ? 'ไม่คุ้มค่าซ่อม' : 'รอตรวจเช็ค'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              const assetObj = assets.find(a => a.id === r.asset_id || a.asset_code === r.asset_code) || assets[0];
                              setRepairModalAsset(assetObj);
                              setActiveRepairLog(r);
                            }}
                            className="px-2.5 py-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium text-xs"
                          >
                            อัปเดตสถานะ
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 6: รายงานแผนพัสดุ & ประมาณการงบประมาณ (แยก 2 ไฟล์ + รายเดือน) */}
          {/* ======================================================== */}
          {activeView === 'annual_reports' && (
            <AnnualReportView
              assets={assets}
              materials={materials}
              repairs={repairs}
              requisitions={requisitions}
              settings={settings}
              onNavigateToDashboard={() => setActiveView('dashboard')}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="no-print mt-auto border-t border-slate-200 bg-white py-4 px-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">{settings.organization_name}</span>
            <span>·</span>
            <span>ระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className={`w-2 h-2 rounded-full ${supabaseConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              {supabaseConnected ? 'Supabase Realtime เชื่อมต่อแล้ว' : 'Supabase (Offline Cache)'}
            </span>
          </div>
        </footer>
      </div>

      {/* ======================================================== */}
      {/* ALL INTERACTIVE MODALS */}
      {/* ======================================================== */}

      {/* 1. Asset Form Modal (Add / Edit) */}
      {assetFormModalOpen && (
        <AssetFormModal
          initialAsset={editingAsset}
          settings={settings}
          onSave={handleSaveAsset}
          onClose={() => {
            setAssetFormModalOpen(false);
            setEditingAsset(null);
          }}
        />
      )}

      {/* 2. QR Code Label Modal */}
      {selectedAssetForQR && (
        <AssetQRModal
          asset={selectedAssetForQR}
          settings={settings}
          onClose={() => setSelectedAssetForQR(null)}
          onOpenBorrow={asset => {
            setSelectedAssetForQR(null);
            setBorrowModalAsset(asset);
            setActiveBorrowLog(undefined);
          }}
          onOpenRepair={asset => {
            setSelectedAssetForQR(null);
            setRepairModalAsset(asset);
            setActiveRepairLog(undefined);
          }}
        />
      )}

      {/* 3. Asset Detail Modal */}
      {selectedAssetForDetail && (
        <AssetDetailModal
          asset={selectedAssetForDetail}
          repairs={repairs.filter(r => r.asset_id === selectedAssetForDetail.id)}
          borrows={borrows.filter(b => b.asset_id === selectedAssetForDetail.id)}
          settings={settings}
          onClose={() => setSelectedAssetForDetail(null)}
          onOpenQR={asset => {
            setSelectedAssetForDetail(null);
            setSelectedAssetForQR(asset);
          }}
          onOpenRegisterForm={asset => {
            setSelectedAssetForDetail(null);
            setSelectedAssetForRegister(asset);
          }}
          onOpenBorrow={asset => {
            setSelectedAssetForDetail(null);
            setBorrowModalAsset(asset);
            setActiveBorrowLog(undefined);
          }}
          onOpenRepair={asset => {
            setSelectedAssetForDetail(null);
            setRepairModalAsset(asset);
            setActiveRepairLog(undefined);
          }}
          onEdit={asset => {
            setSelectedAssetForDetail(null);
            setEditingAsset(asset);
            setAssetFormModalOpen(true);
          }}
          onDelete={id => {
            handleDeleteAsset(id);
            setSelectedAssetForDetail(null);
          }}
        />
      )}

      {/* 4. Official Asset Register Card Form (พด. 4) */}
      {selectedAssetForRegister && (
        <AssetRegisterForm
          asset={selectedAssetForRegister}
          settings={settings}
          onClose={() => setSelectedAssetForRegister(null)}
        />
      )}

      {/* 5. Borrow Modal */}
      {borrowModalAsset && (
        <BorrowModal
          asset={borrowModalAsset}
          existingBorrow={activeBorrowLog}
          settings={settings}
          onSave={handleSaveBorrow}
          onClose={() => {
            setBorrowModalAsset(null);
            setActiveBorrowLog(undefined);
          }}
        />
      )}

      {/* 6. Repair Modal */}
      {repairModalAsset && (
        <RepairModal
          asset={repairModalAsset}
          existingRepair={activeRepairLog}
          settings={settings}
          onSave={handleSaveRepair}
          onClose={() => {
            setRepairModalAsset(null);
            setActiveRepairLog(undefined);
          }}
        />
      )}

      {/* 7. QR Scanner Modal */}
      {scannerOpen && (
        <QRScannerModal
          assets={assets}
          onClose={() => setScannerOpen(false)}
          onScanMatch={(matchedAsset: Asset) => {
            setScannerOpen(false);
            setSelectedAssetForDetail(matchedAsset);
          }}
        />
      )}

      {/* 8. Settings Modal (Branding Google Drive, Officers, Supabase) */}
      {settingsOpen && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setSettingsOpen(false)}
          supabaseConnected={supabaseConnected}
          googleConnected={googleConnected}
          googleUser={googleUser}
          onGoogleAuthChange={() => {
            const token = getAccessToken();
            setGoogleConnected(!!token);
          }}
        />
      )}

      {/* 9. GitHub Guide Modal */}
      {githubGuideOpen && (
        <GitHubGuideModal onClose={() => setGithubGuideOpen(false)} />
      )}
    </div>
  );
}
