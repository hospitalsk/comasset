import React from 'react';
import { GarudaEmblem } from './GarudaEmblem';
import { AppSettings } from '../types/asset';
import {
  LayoutDashboard,
  Computer,
  Boxes,
  ArrowLeftRight,
  Wrench,
  FileSpreadsheet,
  Settings,
  QrCode,
  Github,
  Database,
  Cloud,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Menu,
  X,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export type AppView =
  | 'dashboard'
  | 'assets'
  | 'materials'
  | 'borrows'
  | 'repairs'
  | 'annual_reports';

interface SidebarProps {
  settings: AppSettings;
  activeView: AppView;
  onSelectView: (view: AppView) => void;
  onOpenNewAsset: () => void;
  onOpenScanner: () => void;
  onOpenSettings: () => void;
  onOpenGitHubGuide: () => void;
  supabaseConnected: boolean;
  googleConnected: boolean;
  googleEmail?: string | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  counts: {
    totalAssets: number;
    repairing: number;
    borrowed: number;
    lowMaterials: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  settings,
  activeView,
  onSelectView,
  onOpenNewAsset,
  onOpenScanner,
  onOpenSettings,
  onOpenGitHubGuide,
  supabaseConnected,
  googleConnected,
  googleEmail,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  counts
}) => {
  const menuItems = [
    {
      id: 'dashboard' as AppView,
      label: 'แดชบอร์ดภาพรวม & คลัง 3D',
      sublabel: 'สถิติครุภัณฑ์ & แบบจำลองดิจิทัล',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'assets' as AppView,
      label: 'ทะเบียนครุภัณฑ์คอมพิวเตอร์',
      sublabel: 'ค้นหา ตรวจสอบ พิมพ์ป้าย QR',
      icon: Computer,
      badge: counts.totalAssets > 0 ? `${counts.totalAssets}` : null,
      badgeColor: 'bg-slate-100 text-slate-700'
    },
    {
      id: 'materials' as AppView,
      label: 'คลังวัสดุสิ้นเปลือง',
      sublabel: 'หมึก อะไหล่ เบิกจ่ายบันทึกผู้รับ',
      icon: Boxes,
      badge: counts.lowMaterials > 0 ? `เตือน ${counts.lowMaterials}` : null,
      badgeColor: 'bg-amber-100 text-amber-800 animate-pulse'
    },
    {
      id: 'borrows' as AppView,
      label: 'บันทึกการยืม-คืน',
      sublabel: 'ตรวจติดตาม ยืมใช้งานนอกสถานที่',
      icon: ArrowLeftRight,
      badge: counts.borrowed > 0 ? `${counts.borrowed} ยืม` : null,
      badgeColor: 'bg-indigo-100 text-indigo-700'
    },
    {
      id: 'repairs' as AppView,
      label: 'ประวัติและส่งซ่อม',
      sublabel: 'แจ้งซ่อม บันทึกค่าใช้จ่าย เสนอจำหน่าย',
      icon: Wrench,
      badge: counts.repairing > 0 ? `${counts.repairing} ซ่อม` : null,
      badgeColor: 'bg-rose-100 text-rose-700'
    },
    {
      id: 'annual_reports' as AppView,
      label: 'รายงานแผนพัสดุ & งบประมาณ',
      sublabel: 'รายงานรายปี/รายเดือน พิมพ์ A4 / Excel',
      icon: FileSpreadsheet,
      badge: 'A4 / Excel',
      badgeColor: 'bg-emerald-100 text-emerald-800 font-semibold'
    }
  ];

  const handleItemClick = (view: AppView) => {
    onSelectView(view);
    if (mobileOpen) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Main Sidebar Aside */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-slate-900 text-slate-200 border-r border-slate-800 transition-all duration-300 ease-in-out select-none ${
          collapsed ? 'w-20' : 'w-72'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-20 px-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Logo or Garuda Emblem */}
            <div className="shrink-0 relative group">
              {settings.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt="App Logo"
                  className="w-10 h-10 object-contain rounded-lg bg-white/10 p-1 border border-white/20 shadow-xs"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center p-1">
                  <GarudaEmblem
                    size={32}
                    type={settings.garuda_symbol_type}
                    customUrl={settings.garuda_custom_url}
                  />
                </div>
              )}
            </div>

            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-xs font-bold text-white tracking-tight truncate leading-snug">
                    {settings.app_title}
                  </h1>
                </div>
                <p className="text-[10px] text-slate-400 truncate font-medium">
                  {settings.organization_name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 text-[9px] rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-medium">
                    ปีงบประมาณ {settings.fiscal_year}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Toggle Collapse Button on Desktop */}
          <button
            onClick={onToggleCollapse}
            title={collapsed ? 'ขยายเมนู' : 'ย่อเมนู'}
            className="hidden lg:flex p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Close button on mobile */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Shortcuts (Quick Scan & Add Asset) */}
        <div className="p-3 border-b border-slate-800/60 bg-slate-900/60 space-y-1.5">
          <button
            onClick={() => {
              onOpenNewAsset();
              if (mobileOpen) onCloseMobile();
            }}
            className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-sky-950/40 transition-all ${
              collapsed ? 'px-0' : ''
            }`}
            title="เพิ่มรายการครุภัณฑ์ใหม่"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            {!collapsed && <span>เพิ่มครุภัณฑ์ใหม่</span>}
          </button>

          <button
            onClick={() => {
              onOpenScanner();
              if (mobileOpen) onCloseMobile();
            }}
            className={`w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700/80 transition-colors ${
              collapsed ? 'px-0' : ''
            }`}
            title="สแกน QR Code ตรวจสอบ/ยืม-คืน"
          >
            <QrCode className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            {!collapsed && <span>สแกนกล้อง QR Code</span>}
          </button>
        </div>

        {/* Navigation Menu List */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1 text-xs">
          {!collapsed && (
            <div className="px-3 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              เมนูหลักของระบบ
            </div>
          )}

          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                title={collapsed ? `${item.label} (${item.sublabel})` : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-600/30 to-indigo-600/20 text-white border border-sky-500/40 shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                } ${collapsed ? 'justify-center px-0' : ''}`}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-sky-400 rounded-r-md" />
                )}

                <div
                  className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                    isActive
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'bg-slate-800/70 text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`truncate font-medium ${isActive ? 'font-bold text-white' : ''}`}>
                        {item.label}
                      </span>
                      {item.badge && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] shrink-0 font-medium ${
                            item.badgeColor || 'bg-slate-700 text-slate-200'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 truncate block">
                      {item.sublabel}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Integration Status & System Footers */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 space-y-2 text-xs">
          {!collapsed ? (
            <div className="space-y-1.5">
              {/* Google Drive Status */}
              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
                <div className="flex items-center gap-1.5 truncate">
                  <Cloud className={`w-3.5 h-3.5 ${googleConnected ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <span className="truncate text-slate-300">
                    {googleConnected ? (googleEmail ? googleEmail : 'Google Drive เชื่อมต่อแล้ว') : 'Google Drive (พร้อมซิงก์)'}
                  </span>
                </div>
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    googleConnected ? 'bg-emerald-400 ring-2 ring-emerald-400/30' : 'bg-amber-400'
                  }`}
                />
              </div>

              {/* Supabase Status */}
              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <Database className={`w-3.5 h-3.5 ${supabaseConnected ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className="text-slate-300">
                    {supabaseConnected ? 'Supabase Realtime' : 'ระบบแคชข้อมูลออฟไลน์'}
                  </span>
                </div>
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    supabaseConnected ? 'bg-emerald-400 ring-2 ring-emerald-400/30' : 'bg-slate-400'
                  }`}
                />
              </div>

              {/* Settings & GitHub Guide Buttons */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  onClick={() => {
                    onOpenSettings();
                    if (mobileOpen) onCloseMobile();
                  }}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium border border-slate-700/60 transition-colors"
                  title="ตั้งค่าระบบและโลโก้"
                >
                  <Settings className="w-3.5 h-3.5 text-sky-400" />
                  <span>ตั้งค่าระบบ</span>
                </button>

                <button
                  onClick={() => {
                    onOpenGitHubGuide();
                    if (mobileOpen) onCloseMobile();
                  }}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium border border-slate-700/60 transition-colors"
                  title="วิธีเชื่อมต่อและ Deploy GitHub"
                >
                  <Github className="w-3.5 h-3.5 text-slate-300" />
                  <span>ต่อ GitHub</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={onOpenSettings}
                title="ตั้งค่าระบบและโลโก้ Google Drive"
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Settings className="w-4 h-4 text-sky-400" />
              </button>
              <button
                onClick={onOpenGitHubGuide}
                title="วิธีต่อ GitHub"
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Github className="w-4 h-4 text-slate-300" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
