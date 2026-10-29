import React from 'react';
import { GarudaEmblem } from './GarudaEmblem';
import { AppSettings } from '../types/asset';
import { AppView } from './Sidebar';
import {
  Menu,
  QrCode,
  Plus,
  Settings,
  Sparkles,
  Cloud,
  CheckCircle2,
  LogIn
} from 'lucide-react';

interface TopBarProps {
  settings: AppSettings;
  activeView: AppView;
  onOpenMobileMenu: () => void;
  onOpenNewAsset: () => void;
  onOpenScanner: () => void;
  onOpenSettings: () => void;
  googleConnected: boolean;
  googleEmail?: string | null;
  onConnectGoogle: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  settings,
  activeView,
  onOpenMobileMenu,
  onOpenNewAsset,
  onOpenScanner,
  onOpenSettings,
  googleConnected,
  googleEmail,
  onConnectGoogle
}) => {
  const viewTitles: Record<AppView, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'แดชบอร์ดภาพรวม & คลังครุภัณฑ์ 3D (Warehouse Digital Twin)',
      subtitle: 'สรุปสถานะ สถิติจำนวนครุภัณฑ์ และการแจ้งเตือนวัสดุคอมพิวเตอร์ใกล้หมดสต็อก'
    },
    assets: {
      title: 'ทะเบียนครุภัณฑ์คอมพิวเตอร์และทรัพย์สิน',
      subtitle: 'ค้นหา ตรวจสอบ คัดกรอง คำนวณค่าเสื่อมราคา และพิมพ์ป้ายทะเบียนพร้อม QR Code'
    },
    materials: {
      title: 'ระบบบริหารคลังวัสดุสิ้นเปลืองคอมพิวเตอร์',
      subtitle: 'จัดการสต็อก เบิกจ่ายพัสดุ บันทึกผู้รับ วัตถุประสงค์ และสถานที่ใช้งาน'
    },
    borrows: {
      title: 'ระบบบันทึกการยืม - คืนครุภัณฑ์คอมพิวเตอร์',
      subtitle: 'บันทึกประวัติการยืมใช้งานภายนอก กำหนดวันส่งคืน และตรวจสอบสภาพหลังคืน'
    },
    repairs: {
      title: 'ระบบส่งซ่อมและบันทึกประวัติการบำรุงรักษา',
      subtitle: 'บันทึกอาการเสีย ติดตามการซ่อม บันทึกค่าใช้จ่าย และข้อเสนอจำหน่ายพัสดุชำรุด'
    },
    annual_reports: {
      title: 'รายงานแผนพัสดุ & ประมาณการงบประมาณรายปีและรายเดือน',
      subtitle: 'ตามระเบียบกระทรวงการคลังฯ พ.ศ. 2560 รองรับการพิมพ์ A4 และส่งออก Excel / PDF'
    }
  };

  const currentInfo = viewTitles[activeView] || viewTitles.dashboard;

  return (
    <header className="no-print sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs h-16 transition-all">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="เปิดเมนู"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 min-w-0">
            {/* Small emblem badge */}
            <div className="hidden sm:flex shrink-0 items-center justify-center w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/80 p-1">
              {settings.logo_url ? (
                <img src={settings.logo_url} alt="Logo" className="w-7 h-7 object-contain rounded" />
              ) : (
                <GarudaEmblem
                  size={26}
                  type={settings.garuda_symbol_type}
                  customUrl={settings.garuda_custom_url}
                />
              )}
            </div>

            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate leading-tight">
                {currentInfo.title}
              </h2>
              <p className="hidden md:block text-[11px] text-slate-500 truncate">
                {currentInfo.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Google Drive Auth Status & Quick Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Google Drive Account Pill */}
          {googleConnected ? (
            <div
              onClick={onOpenSettings}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium cursor-pointer hover:bg-emerald-100 transition-colors"
              title="Google Drive เชื่อมต่อแล้ว (บันทึกโลโก้และตราสัญลักษณ์ลงไดรฟ์อัตโนมัติ)"
            >
              <Cloud className="w-3.5 h-3.5 text-emerald-600" />
              <span className="truncate max-w-[130px]">{googleEmail || 'Google Drive'}</span>
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
            </div>
          ) : (
            <button
              onClick={onConnectGoogle}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-sky-50 border border-slate-200 text-slate-700 hover:text-sky-700 text-[11px] font-medium transition-colors"
              title="เชื่อมต่อ Google Drive เพื่อบันทึกโลโก้และตราสัญลักษณ์"
            >
              <LogIn className="w-3.5 h-3.5 text-slate-500" />
              <span>ซิงก์ Google Drive</span>
            </button>
          )}

          {/* Quick Scanner */}
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200/80 transition-colors shadow-2xs"
            title="เปิดกล้องสแกน QR Code"
          >
            <QrCode className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden sm:inline">สแกน QR</span>
          </button>

          {/* Quick Add Asset */}
          <button
            onClick={onOpenNewAsset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">เพิ่มครุภัณฑ์</span>
          </button>
        </div>
      </div>
    </header>
  );
};
