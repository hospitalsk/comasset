import React from 'react';
import { GarudaEmblem } from './GarudaEmblem';
import { AppSettings } from '../types/asset';
import { Plus, Camera, Settings, Github } from 'lucide-react';

export type AppView = 'dashboard' | 'materials' | 'borrows' | 'repairs' | 'annual_reports';

interface HeaderProps {
  settings: AppSettings;
  activeView: AppView;
  onSelectView: (view: AppView) => void;
  onOpenNewAsset: () => void;
  onOpenScanner: () => void;
  onOpenSettings: () => void;
  onOpenGitHubGuide: () => void;
  supabaseConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  activeView,
  onSelectView,
  onOpenNewAsset,
  onOpenScanner,
  onOpenSettings,
  onOpenGitHubGuide,
  supabaseConnected
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-8 h-16">
        <button
          onClick={() => onSelectView('dashboard')}
          className="flex items-center gap-2.5 whitespace-nowrap shrink-0 text-left cursor-pointer focus:outline-none"
        >
          <GarudaEmblem
            size={34}
            type={settings.garuda_symbol_type}
            customUrl={settings.garuda_custom_url}
          />
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-tight">
              {settings.app_title}
            </span>
            <span className="text-[11px] text-slate-500 font-medium truncate max-w-[220px] sm:max-w-xs">
              {settings.organization_name}
            </span>
          </div>
        </button>

        <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-600">
          <button
            onClick={() => onSelectView('dashboard')}
            className={`whitespace-nowrap shrink-0 transition-colors pb-1 border-b-2 ${
              activeView === 'dashboard'
                ? 'border-sky-600 text-sky-700 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Dashboard & ทะเบียนครุภัณฑ์
          </button>

          <button
            onClick={() => onSelectView('materials')}
            className={`whitespace-nowrap shrink-0 transition-colors pb-1 border-b-2 ${
              activeView === 'materials'
                ? 'border-sky-600 text-sky-700 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            วัสดุคอมพิวเตอร์
          </button>

          <button
            onClick={() => onSelectView('borrows')}
            className={`whitespace-nowrap shrink-0 transition-colors pb-1 border-b-2 ${
              activeView === 'borrows'
                ? 'border-sky-600 text-sky-700 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            บันทึกการยืม-คืน
          </button>

          <button
            onClick={() => onSelectView('repairs')}
            className={`whitespace-nowrap shrink-0 transition-colors pb-1 border-b-2 ${
              activeView === 'repairs'
                ? 'border-sky-600 text-sky-700 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            ประวัติส่งซ่อม
          </button>

          <button
            onClick={() => onSelectView('annual_reports')}
            className={`whitespace-nowrap shrink-0 transition-colors pb-1 border-b-2 ${
              activeView === 'annual_reports'
                ? 'border-sky-600 text-sky-700 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            แผนพัสดุ & งบประมาณรายปี
          </button>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors whitespace-nowrap shrink-0"
            title="สแกน QR Code / Barcode ครุภัณฑ์"
          >
            <Camera className="w-4 h-4 text-sky-600" />
            <span className="hidden sm:inline">สแกน QR</span>
          </button>

          <button
            onClick={onOpenGitHubGuide}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="วิธี Push โค้ดเข้า GitHub"
          >
            <Github className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="ตั้งค่าระบบ & Supabase"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenNewAsset}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-2xs transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>ลงทะเบียนครุภัณฑ์</span>
          </button>
        </div>
      </div>

      <div className="lg:hidden flex items-center gap-4 px-4 py-2 border-t border-slate-100 overflow-x-auto text-xs bg-slate-50/50">
        <button
          onClick={() => onSelectView('dashboard')}
          className={`whitespace-nowrap py-1 ${activeView === 'dashboard' ? 'text-sky-700 font-semibold' : 'text-slate-600'}`}
        >
          Dashboard & ครุภัณฑ์
        </button>
        <button
          onClick={() => onSelectView('materials')}
          className={`whitespace-nowrap py-1 ${activeView === 'materials' ? 'text-sky-700 font-semibold' : 'text-slate-600'}`}
        >
          วัสดุคอมพิวเตอร์
        </button>
        <button
          onClick={() => onSelectView('borrows')}
          className={`whitespace-nowrap py-1 ${activeView === 'borrows' ? 'text-sky-700 font-semibold' : 'text-slate-600'}`}
        >
          ยืม-คืน
        </button>
        <button
          onClick={() => onSelectView('repairs')}
          className={`whitespace-nowrap py-1 ${activeView === 'repairs' ? 'text-sky-700 font-semibold' : 'text-slate-600'}`}
        >
          ส่งซ่อม
        </button>
        <button
          onClick={() => onSelectView('annual_reports')}
          className={`whitespace-nowrap py-1 ${activeView === 'annual_reports' ? 'text-sky-700 font-semibold' : 'text-slate-600'}`}
        >
          แผนงบประมาณรายปี
        </button>
      </div>
    </header>
  );
};
