import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types/asset';
import { GarudaEmblem } from './GarudaEmblem';
import { SUPABASE_SQL_SCHEMA } from '../lib/supabase';
import {
  initAuth,
  googleSignIn,
  googleSignOut,
  uploadImageToGoogleDrive,
  getAccessToken,
  isGoogleDriveConnected
} from '../lib/googleDriveAuth';
import { User } from 'firebase/auth';
import {
  X,
  Save,
  Building,
  UserCheck,
  FolderSync,
  Database,
  Copy,
  Check,
  Plus,
  Trash2,
  ExternalLink,
  Shield,
  Palette,
  Upload,
  Cloud,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Image as ImageIcon,
  LogIn,
  LogOut,
  Info
} from 'lucide-react';

interface SettingsModalProps {
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
  onClose: () => void;
  supabaseConnected: boolean;
  googleConnected: boolean;
  googleUser: User | null;
  onGoogleAuthChange?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSave,
  onClose,
  supabaseConnected,
  googleConnected,
  googleUser,
  onGoogleAuthChange
}) => {
  const [activeTab, setActiveTab] = useState<'branding' | 'officers' | 'departments' | 'drive' | 'supabase'>('branding');

  // Form State
  const [appTitle, setAppTitle] = useState(settings.app_title);
  const [orgName, setOrgName] = useState(settings.organization_name);
  const [subOrg, setSubOrg] = useState(settings.sub_organization);
  const [garudaType, setGarudaType] = useState<AppSettings['garuda_symbol_type']>(settings.garuda_symbol_type);
  const [garudaCustomUrl, setGarudaCustomUrl] = useState(settings.garuda_custom_url || '');
  const [garudaDriveFileId, setGarudaDriveFileId] = useState(settings.garuda_drive_file_id || '');
  const [logoUrl, setLogoUrl] = useState(settings.logo_url || '');
  const [logoDriveFileId, setLogoDriveFileId] = useState(settings.logo_drive_file_id || '');

  const [chiefOfficer, setChiefOfficer] = useState(settings.chief_procurement_officer);
  const [procurementOfficer, setProcurementOfficer] = useState(settings.procurement_officer);
  const [approverOfficer, setApproverOfficer] = useState(settings.approver_officer);
  const [committee, setCommittee] = useState<string[]>(settings.inspection_committee);
  const [newCommitteeMember, setNewCommitteeMember] = useState('');

  const [departments, setDepartments] = useState<string[]>(settings.departments);
  const [newDept, setNewDept] = useState('');

  const [categories, setCategories] = useState<string[]>(settings.categories);
  const [newCategory, setNewCategory] = useState('');

  const [driveUrl, setDriveUrl] = useState(settings.google_drive_folder_url);
  const [fiscalYear, setFiscalYear] = useState<number>(settings.fiscal_year);

  // Uploading states
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingEmblem, setUploadingEmblem] = useState(false);
  const [logoUploadMsg, setLogoUploadMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [emblemUploadMsg, setEmblemUploadMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Auth local state & popup blocker alert
  const [currentUser, setCurrentUser] = useState<User | null>(googleUser);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [popupBlockedWarning, setPopupBlockedWarning] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    setCurrentUser(googleUser);
  }, [googleUser]);

  const handleSignInGoogle = async () => {
    setIsSigningIn(true);
    setPopupBlockedWarning(false);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        if (onGoogleAuthChange) onGoogleAuthChange();
      }
    } catch (err: any) {
      if (err?.code === 'auth/popup-blocked' || err?.message === 'POPUP_BLOCKED') {
        setPopupBlockedWarning(true);
      } else {
        console.warn('Google Sign-in warning:', err);
        alert(`การเชื่อมต่อ Google: ${err.message || 'โปรดลองใหม่อีกครั้ง'}`);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOutGoogle = async () => {
    try {
      await googleSignOut();
      setCurrentUser(null);
      if (onGoogleAuthChange) onGoogleAuthChange();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Upload Logo to system & Google Drive (Safe from popup-blocked)
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setLogoUploadMsg(null);

    // 1. Read locally for immediate zero-latency display
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setLogoUrl(dataUrl);

      // 2. If Google Drive is authenticated, upload in background
      if (currentUser && isGoogleDriveConnected()) {
        try {
          const result = await uploadImageToGoogleDrive(
            file,
            `app_logo_${Date.now()}.${file.name.split('.').pop() || 'png'}`
          );
          setLogoUrl(result.directUrl);
          setLogoDriveFileId(result.fileId);
          setLogoUploadMsg({
            type: 'success',
            text: `อัปโหลดและบันทึกลง Google Drive สำเร็จ! (File ID: ${result.fileId.substring(0, 12)}...)`
          });
          if (onGoogleAuthChange) onGoogleAuthChange();
        } catch (gErr: any) {
          console.warn('Google Drive background sync:', gErr);
          setLogoUploadMsg({
            type: 'info',
            text: 'นำรูปภาพโลโก้มาใช้งานในระบบแล้ว (หากต้องการสำรองลง Google Drive กรุณากดเชื่อมต่อ Google)'
          });
        }
      } else {
        setLogoUploadMsg({
          type: 'info',
          text: 'นำรูปภาพโลโก้มาใช้งานในระบบแล้ว (กดบันทึกการตั้งค่าเพื่อใช้งาน หรือเชื่อมต่อ Google Drive เพื่อสำรองไฟล์)'
        });
      }
      setUploadingLogo(false);
    };

    reader.onerror = () => {
      setUploadingLogo(false);
      setLogoUploadMsg({
        type: 'error',
        text: 'ไม่สามารถอ่านไฟล์รูปภาพได้ โปรดลองใหม่อีกครั้ง'
      });
    };

    reader.readAsDataURL(file);
  };

  // Upload Custom Emblem (Safe from popup-blocked)
  const handleEmblemFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingEmblem(true);
    setEmblemUploadMsg(null);

    // 1. Read locally for immediate zero-latency display
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setGarudaType('custom');
      setGarudaCustomUrl(dataUrl);

      // 2. If Google Drive is authenticated, upload in background
      if (currentUser && isGoogleDriveConnected()) {
        try {
          const result = await uploadImageToGoogleDrive(
            file,
            `agency_emblem_${Date.now()}.${file.name.split('.').pop() || 'png'}`
          );
          setGarudaCustomUrl(result.directUrl);
          setGarudaDriveFileId(result.fileId);
          setEmblemUploadMsg({
            type: 'success',
            text: `อัปโหลดตราสัญลักษณ์บันทึกลง Google Drive สำเร็จ! (File ID: ${result.fileId.substring(0, 12)}...)`
          });
          if (onGoogleAuthChange) onGoogleAuthChange();
        } catch (gErr: any) {
          console.warn('Google Drive emblem sync:', gErr);
          setEmblemUploadMsg({
            type: 'info',
            text: 'นำตราสัญลักษณ์มาใช้งานในระบบแล้ว (หากต้องการสำรองลง Google Drive กรุณากดเชื่อมต่อ Google)'
          });
        }
      } else {
        setEmblemUploadMsg({
          type: 'info',
          text: 'นำตราสัญลักษณ์มาใช้งานในระบบแล้ว (กดบันทึกการตั้งค่าเพื่อใช้งาน หรือเชื่อมต่อ Google Drive เพื่อสำรองไฟล์)'
        });
      }
      setUploadingEmblem(false);
    };

    reader.onerror = () => {
      setUploadingEmblem(false);
      setEmblemUploadMsg({
        type: 'error',
        text: 'ไม่สามารถอ่านไฟล์รูปภาพได้ โปรดลองใหม่อีกครั้ง'
      });
    };

    reader.readAsDataURL(file);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleAddDept = () => {
    if (!newDept.trim() || departments.includes(newDept.trim())) return;
    setDepartments([...departments, newDept.trim()]);
    setNewDept('');
  };

  const handleRemoveDept = (deptToRemove: string) => {
    setDepartments(departments.filter(d => d !== deptToRemove));
  };

  const handleAddCategory = () => {
    if (!newCategory.trim() || categories.includes(newCategory.trim())) return;
    setCategories([...categories, newCategory.trim()]);
    setNewCategory('');
  };

  const handleRemoveCategory = (catToRemove: string) => {
    setCategories(categories.filter(c => c !== catToRemove));
  };

  const handleAddCommitteeMember = () => {
    if (!newCommitteeMember.trim()) return;
    setCommittee([...committee, newCommitteeMember.trim()]);
    setNewCommitteeMember('');
  };

  const handleRemoveCommitteeMember = (index: number) => {
    setCommittee(committee.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updated: AppSettings = {
      app_title: appTitle.trim() || 'ระบบบริหารจัดการครุภัณฑ์คอมพิวเตอร์และทรัพย์สิน',
      organization_name: orgName.trim() || 'ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร',
      sub_organization: subOrg.trim(),
      garuda_symbol_type: garudaType,
      garuda_custom_url: garudaCustomUrl.trim(),
      garuda_drive_file_id: garudaDriveFileId.trim(),
      logo_url: logoUrl.trim(),
      logo_drive_file_id: logoDriveFileId.trim(),
      chief_procurement_officer: chiefOfficer.trim(),
      procurement_officer: procurementOfficer.trim(),
      approver_officer: approverOfficer.trim(),
      inspection_committee: committee,
      google_drive_folder_url: driveUrl.trim() || 'https://drive.google.com/drive/folders/1RlYuiMK968PVSDKwhkPItNgUgQSginGU?usp=sharing',
      departments,
      categories,
      fiscal_year: Number(fiscalYear) || 2568
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-6 overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <h3 className="font-semibold text-slate-800 text-base">ตั้งค่าระบบ & ปรับแต่งอัตลักษณ์หน่วยงาน</h3>
            <p className="text-xs text-slate-500">
              จัดการโลโก้และตราสัญลักษณ์ (บันทึกลง Google Drive), ตราครุฑ, รายชื่อเจ้าหน้าที่, และฐานข้อมูล
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 px-6 pt-2 border-b border-slate-200 bg-slate-50/40 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('branding')}
            className={`px-3 py-2 font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'branding'
                ? 'border-sky-600 text-sky-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>โลโก้ & ตราสัญลักษณ์ (Google Drive)</span>
          </button>

          <button
            onClick={() => setActiveTab('officers')}
            className={`px-3 py-2 font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'officers'
                ? 'border-sky-600 text-sky-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>เจ้าหน้าที่ & ผู้ลงนาม</span>
          </button>

          <button
            onClick={() => setActiveTab('departments')}
            className={`px-3 py-2 font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'departments'
                ? 'border-sky-600 text-sky-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>หน่วยงาน & หมวดหมู่</span>
          </button>

          <button
            onClick={() => setActiveTab('drive')}
            className={`px-3 py-2 font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'drive'
                ? 'border-sky-600 text-sky-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FolderSync className="w-3.5 h-3.5" />
            <span>Google Drive จัดเก็บ</span>
          </button>

          <button
            onClick={() => setActiveTab('supabase')}
            className={`px-3 py-2 font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'supabase'
                ? 'border-sky-600 text-sky-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Supabase & SQL</span>
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[65vh] overflow-y-auto text-xs">
          {/* TAB 1: BRANDING & GOOGLE DRIVE LOGO UPLOAD */}
          {activeTab === 'branding' && (
            <div className="space-y-5">
              {/* Google Drive Status & Connect Card */}
              <div className="p-4 bg-gradient-to-r from-sky-50 via-indigo-50 to-white border border-sky-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-sky-600 text-white rounded-xl shadow-xs">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 text-xs flex items-center gap-2">
                      <span>สถานะการเชื่อมต่อ Google Drive</span>
                      {currentUser ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          เชื่อมต่อแล้ว
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold">
                          ยังไม่ได้เชื่อมต่อ
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {currentUser
                        ? `บัญชี: ${currentUser.email} (ไฟล์โลโก้และตราจะบันทึกลงโฟลเดอร์ Assetcom_Branding)`
                        : 'เชื่อมต่อ Google Drive เพื่อให้ไฟล์โลโก้และตราสัญลักษณ์ที่อัปโหลดถูกบันทึกขึ้นคลาวด์อัตโนมัติ'}
                    </p>
                  </div>
                </div>

                {currentUser ? (
                  <button
                    type="button"
                    onClick={handleSignOutGoogle}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium transition-colors text-xs shrink-0"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>ออกจากระบบ</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSignInGoogle}
                    disabled={isSigningIn}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium shadow-xs transition-colors text-xs shrink-0 disabled:opacity-50"
                  >
                    {isSigningIn ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <LogIn className="w-3.5 h-3.5" />
                    )}
                    <span>ลงชื่อเข้าใช้ด้วย Google</span>
                  </button>
                )}
              </div>

              {/* Popup Blocked Guidance Alert Banner */}
              {popupBlockedWarning && (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs space-y-2">
                  <div className="font-semibold flex items-center gap-1.5 text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>เบราว์เซอร์บล็อกหน้าต่างป็อปอัป (Popup Blocked)</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    เนื่องจากความปลอดภัยของเบราว์เซอร์ที่เปิดแอปพลิเคชันภายในหน้าต่าง iFrame ได้ทำการบล็อกหน้าต่างป็อปอัป Google:
                  </p>
                  <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-0.5 ml-1">
                    <li>คลิกที่ไอคอนป็อปอัปหรือรูปแม่กุญแจที่แถบ URL ของเบราว์เซอร์ (มุมขวาหรือซ้ายของแถบที่อยู่)</li>
                    <li>เลือก <strong>"อนุญาตป็อปอัปสำหรับเว็บไซต์นี้เสมอ (Always allow popups)"</strong> แล้วกดยืนยัน</li>
                    <li>จากนั้นกดปุ่ม <strong>"ลองเปิดหน้าต่างใหม่อีกครั้ง"</strong> ด้านล่างนี้</li>
                  </ul>
                  <div className="pt-1 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPopupBlockedWarning(false);
                        handleSignInGoogle();
                      }}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-2xs flex items-center gap-1.5"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>ลองเปิดหน้าต่างใหม่อีกครั้ง</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPopupBlockedWarning(false)}
                      className="px-3 py-1.5 border border-amber-300 text-amber-800 hover:bg-amber-100 rounded-lg text-xs"
                    >
                      ปิดการแจ้งเตือน
                    </button>
                  </div>
                </div>
              )}

              {/* SECTION A: Web App Logo Upload (Saved to Google Drive) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800 text-xs block">
                      1. โลโก้เว็บแอปพลิเคชัน (Web App Logo) - อัปโหลดบันทึกลง Google Drive
                    </span>
                    <span className="text-[11px] text-slate-500">
                      แสดงที่แถบเมนูด้านซ้ายและส่วนหัวของระบบ (รองรับ PNG, JPG, SVG, WebP)
                    </span>
                  </div>
                  {logoDriveFileId && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px]">
                      <Cloud className="w-3 h-3" /> บน Google Drive
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-xl border border-slate-200">
                  {/* Logo Preview */}
                  <div className="w-20 h-20 shrink-0 border border-dashed border-slate-300 rounded-xl flex items-center justify-center p-1 bg-slate-50 overflow-hidden relative group">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo Preview" className="w-full h-full object-contain" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 text-center">
                        <ImageIcon className="w-6 h-6 text-slate-300" />
                        <span className="text-[9px] mt-1">ไม่มีโลโก้</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors shadow-xs">
                        {uploadingLogo ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>{uploadingLogo ? 'กำลังบันทึกลง Google Drive...' : 'อัปโหลดโลโก้ใหม่'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoFileChange}
                          disabled={uploadingLogo}
                          className="hidden"
                        />
                      </label>

                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setLogoUrl('');
                            setLogoDriveFileId('');
                            setLogoUploadMsg(null);
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs transition-colors"
                        >
                          ลบโลโก้
                        </button>
                      )}
                    </div>

                    {logoUploadMsg && (
                      <div
                        className={`text-[11px] flex items-center gap-1.5 p-2 rounded-lg ${
                          logoUploadMsg.type === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : logoUploadMsg.type === 'info'
                            ? 'bg-sky-50 text-sky-800 border border-sky-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {logoUploadMsg.type === 'success' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : logoUploadMsg.type === 'info' ? (
                          <Info className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        )}
                        <span>{logoUploadMsg.text}</span>
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400">
                      URL ปัจจุบัน: <span className="font-mono truncate inline-block max-w-[280px] align-bottom">{logoUrl || '(ใช้ตราสัญลักษณ์เริ่มต้น)'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION B: Agency Emblem / Garuda Customizer (Saved to Google Drive) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="font-semibold text-slate-800 text-xs block">
                  2. ตราสัญลักษณ์หน่วยงาน / ตราครุฑพ่าห์ ในรายงานและป้ายครุภัณฑ์:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label
                    onClick={() => setGarudaType('official_gold')}
                    className={`flex items-center gap-3 p-3 bg-white border rounded-xl cursor-pointer transition-all ${
                      garudaType === 'official_gold' ? 'border-amber-500 ring-2 ring-amber-200 shadow-xs' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <GarudaEmblem size={38} type="official_gold" />
                    <div>
                      <strong className="block text-slate-800 text-xs">ตราครุฑสีทอง</strong>
                      <span className="text-[11px] text-slate-500">มาตรฐานราชการไทย</span>
                    </div>
                  </label>

                  <label
                    onClick={() => setGarudaType('official_red')}
                    className={`flex items-center gap-3 p-3 bg-white border rounded-xl cursor-pointer transition-all ${
                      garudaType === 'official_red' ? 'border-rose-500 ring-2 ring-rose-200 shadow-xs' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <GarudaEmblem size={38} type="official_red" />
                    <div>
                      <strong className="block text-slate-800 text-xs">ตราครุฑสีชาด (แดง)</strong>
                      <span className="text-[11px] text-slate-500">หนังสือราชการ</span>
                    </div>
                  </label>

                  <label
                    onClick={() => setGarudaType('custom')}
                    className={`flex items-center gap-3 p-3 bg-white border rounded-xl cursor-pointer transition-all ${
                      garudaType === 'custom' ? 'border-sky-500 ring-2 ring-sky-200 shadow-xs' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-10 h-10 border border-dashed border-slate-300 rounded-lg flex items-center justify-center p-0.5 overflow-hidden bg-slate-50">
                      {garudaCustomUrl ? (
                        <img src={garudaCustomUrl} alt="Custom Emblem" className="w-full h-full object-contain" />
                      ) : (
                        <Upload className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <strong className="block text-slate-800 text-xs">ตราสัญลักษณ์กำหนดเอง</strong>
                      <span className="text-[11px] text-slate-500">อัปโหลดลง Google Drive</span>
                    </div>
                  </label>
                </div>

                {/* Upload Custom Emblem File */}
                {garudaType === 'custom' && (
                  <div className="bg-white p-3.5 rounded-xl border border-sky-200 space-y-3">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="w-16 h-16 shrink-0 border border-slate-200 rounded-xl flex items-center justify-center p-1 bg-slate-50 overflow-hidden">
                        {garudaCustomUrl ? (
                          <img src={garudaCustomUrl} alt="Emblem" className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-[10px] text-slate-400">ตัวอย่างตรา</span>
                        )}
                      </div>

                      <div className="flex-1 space-y-2 w-full">
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs transition-colors shadow-xs">
                            {uploadingEmblem ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Upload className="w-3.5 h-3.5" />
                            )}
                            <span>{uploadingEmblem ? 'กำลังบันทึกลง Google Drive...' : 'อัปโหลดตราสัญลักษณ์ (บันทึกลง Google Drive)'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleEmblemFileChange}
                              disabled={uploadingEmblem}
                              className="hidden"
                            />
                          </label>
                        </div>

                        {emblemUploadMsg && (
                          <div
                            className={`text-[11px] flex items-center gap-1.5 p-2 rounded-lg ${
                              emblemUploadMsg.type === 'success'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : emblemUploadMsg.type === 'info'
                                ? 'bg-sky-50 text-sky-800 border border-sky-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {emblemUploadMsg.type === 'success' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : emblemUploadMsg.type === 'info' ? (
                              <Info className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            )}
                            <span>{emblemUploadMsg.text}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={garudaCustomUrl}
                            onChange={e => setGarudaCustomUrl(e.target.value)}
                            placeholder="หรือระบุ URL รูปภาพตราสัญลักษณ์โดยตรง"
                            className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Names & Titles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">
                    ชื่อระบบเว็บแอปพลิเคชัน (Web App Title) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={appTitle}
                    onChange={e => setAppTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-700 block mb-1">
                    ปีงบประมาณปัจจุบัน (พ.ศ.)
                  </label>
                  <input
                    type="number"
                    value={fiscalYear}
                    onChange={e => setFiscalYear(parseInt(e.target.value) || 2568)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-700 block mb-1">
                    ชื่อส่วนราชการ / หน่วยงานหลัก <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={e => setOrgName(e.target.value)}
                    placeholder="เช่น ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-700 block mb-1">
                    สำนัก / กอง / ศูนย์ย่อย
                  </label>
                  <input
                    type="text"
                    value={subOrg}
                    onChange={e => setSubOrg(e.target.value)}
                    placeholder="เช่น กลุ่มงานพัฒนาระบบและโครงสร้างพื้นฐานดิจิทัล"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OFFICERS & SIGNATORIES */}
          {activeTab === 'officers' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
                <strong>ระเบียบกระทรวงการคลังฯ พ.ศ. 2560:</strong> รายชื่อผู้ลงนามจะถูกนำไปพิมพ์ลงในเอกสารรายงานตรวจสอบพัสดุประจำปี, แบบฟอร์มขออนุมัติจัดซื้อทดแทน, และใบเบิกจ่ายพัสดุ
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">
                    เจ้าหน้าที่พัสดุ (ผู้จัดทำรายงาน)
                  </label>
                  <input
                    type="text"
                    value={procurementOfficer}
                    onChange={e => setProcurementOfficer(e.target.value)}
                    placeholder="เช่น นางสาวกนกพร เลิศรัตนชัย (เจ้าหน้าที่พัสดุ)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-700 block mb-1">
                    หัวหน้าเจ้าหน้าที่พัสดุ (ผู้ตรวจรายงาน)
                  </label>
                  <input
                    type="text"
                    value={chiefOfficer}
                    onChange={e => setChiefOfficer(e.target.value)}
                    placeholder="เช่น นายสมชาย วัฒนากิจ (หัวหน้าเจ้าหน้าที่พัสดุ)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="font-medium text-slate-700 block mb-1">
                    หัวหน้าหน่วยงานของรัฐ / ผู้อำนวยการ (ผู้อนุมัติ)
                  </label>
                  <input
                    type="text"
                    value={approverOfficer}
                    onChange={e => setApproverOfficer(e.target.value)}
                    placeholder="เช่น ดร.ธนกฤต ประเสริฐสุข (ผู้อำนวยการศูนย์ฯ)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Committee Members */}
              <div className="space-y-2 pt-2">
                <label className="font-medium text-slate-700 block">
                  คณะกรรมการตรวจสอบและตรวจนับพัสดุประจำปี:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCommitteeMember}
                    onChange={e => setNewCommitteeMember(e.target.value)}
                    placeholder="ระบุชื่อ-ตำแหน่งกรรมการใหม่"
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCommitteeMember}
                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg flex items-center gap-1 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มกรรมการ</span>
                  </button>
                </div>

                <div className="space-y-1.5 mt-2">
                  {committee.map((member, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <span>{member}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCommitteeMember(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DEPARTMENTS & CATEGORIES */}
          {activeTab === 'departments' && (
            <div className="space-y-5">
              {/* Departments */}
              <div className="space-y-2">
                <label className="font-semibold text-slate-800 block text-xs">
                  รายชื่อหน่วยงาน / กลุ่มงาน / กอง (Departments):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDept}
                    onChange={e => setNewDept(e.target.value)}
                    placeholder="เพิ่มชื่อกลุ่มงานหรือกองใหม่..."
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddDept}
                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg flex items-center gap-1 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มหน่วยงาน</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {departments.map(dept => (
                    <div
                      key={dept}
                      className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <span className="truncate">{dept}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDept(dept)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="font-semibold text-slate-800 block text-xs">
                  หมวดหมู่ครุภัณฑ์คอมพิวเตอร์ (Categories):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    placeholder="เพิ่มหมวดหมู่ครุภัณฑ์ใหม่..."
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg flex items-center gap-1 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มหมวดหมู่</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {categories.map(cat => (
                    <div
                      key={cat}
                      className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <span className="truncate">{cat}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(cat)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GOOGLE DRIVE SETTINGS */}
          {activeTab === 'drive' && (
            <div className="space-y-4">
              <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl space-y-2">
                <div className="font-semibold text-sky-900 flex items-center gap-1.5">
                  <FolderSync className="w-4 h-4 text-sky-600" />
                  <span>การจัดเก็บบน Google Drive</span>
                </div>
                <p className="text-slate-600 text-xs">
                  ระบบเชื่อมต่อ Google Drive โดยตรงเพื่อจัดเก็บไฟล์โลโก้เว็บแอป, ตราสัญลักษณ์หน่วยงาน, และสำเนาเอกสารรายงานแผนพัสดุ
                </p>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  URL โฟลเดอร์ Google Drive สำหรับคลังเอกสารและรูปภาพส่วนกลาง:
                </label>
                <input
                  type="text"
                  value={driveUrl}
                  onChange={e => setDriveUrl(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-[11px]"
                />
              </div>

              {driveUrl && (
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-slate-600 text-xs">เปิดดูโฟลเดอร์ Google Drive ในหน้าต่างใหม่:</span>
                  <a
                    href={driveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-sky-600 hover:text-sky-800 font-semibold underline text-xs"
                  >
                    <span>เปิด Google Drive</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SUPABASE & SQL */}
          {activeTab === 'supabase' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-emerald-600" />
                    สถานะการเชื่อมต่อ Supabase Database
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      supabaseConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {supabaseConnected ? 'เชื่อมต่อออนไลน์แล้ว' : 'ใช้หน่วยความจำแคชในเครื่อง'}
                  </span>
                </div>
                <p className="text-slate-500 text-[11px]">
                  เมื่อมี URL และ Anon Key ข้อมูลครุภัณฑ์ วัสดุ การยืม-คืน และประวัติส่งซ่อมทั้งหมดจะถูกซิงก์แบบ Realtime สู่ Supabase อัตโนมัติ
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-medium text-slate-700 text-xs">
                    SQL Schema สำหรับสร้างตารางใน Supabase (SQL Editor):
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSql ? 'คัดลอกแล้ว' : 'คัดลอก SQL ทั้งหมด'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[10px] overflow-x-auto max-h-48 whitespace-pre leading-relaxed">
                  {SUPABASE_SQL_SCHEMA}
                </pre>
              </div>
            </div>
          )}

          {/* Footer Save Button */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-medium transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white rounded-xl font-semibold flex items-center gap-1.5 shadow-md shadow-sky-950/20 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกการตั้งค่าทั้งหมด</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
