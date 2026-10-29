import React, { useState } from 'react';
import { AppSettings } from '../types/asset';
import { GarudaEmblem } from './GarudaEmblem';
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SQL_SCHEMA } from '../lib/supabase';
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
  Palette
} from 'lucide-react';

interface SettingsModalProps {
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
  onClose: () => void;
  supabaseConnected: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSave,
  onClose,
  supabaseConnected
}) => {
  const [activeTab, setActiveTab] = useState<'branding' | 'officers' | 'departments' | 'drive' | 'supabase'>('branding');

  // Form State
  const [appTitle, setAppTitle] = useState(settings.app_title);
  const [orgName, setOrgName] = useState(settings.organization_name);
  const [subOrg, setSubOrg] = useState(settings.sub_organization);
  const [garudaType, setGarudaType] = useState<AppSettings['garuda_symbol_type']>(settings.garuda_symbol_type);
  const [garudaCustomUrl, setGarudaCustomUrl] = useState(settings.garuda_custom_url || '');
  const [logoUrl, setLogoUrl] = useState(settings.logo_url || '');

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

  const [copiedSql, setCopiedSql] = useState(false);

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
      logo_url: logoUrl.trim(),
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
            <h3 className="font-semibold text-slate-800 text-base">ตั้งค่าระบบ & ปรับแต่งหน่วยงาน</h3>
            <p className="text-xs text-slate-500">
              กำหนดตราครุฑ, ชื่อหน่วยงาน, รายชื่อเจ้าหน้าที่, เพิ่ม-ลบหน่วยงาน, และฐานข้อมูล Supabase
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
            <span>ตราครุฑ & อัตลักษณ์</span>
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
            <span>Google Drive</span>
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
          {/* TAB 1: BRANDING & GARUDA */}
          {activeTab === 'branding' && (
            <div className="space-y-4">
              {/* Garuda Customizer */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="font-semibold text-slate-800 text-xs block">
                  รูปแบบตราสัญลักษณ์ครุฑ (Garuda Emblem) ในรายงานและป้ายครุภัณฑ์:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label
                    onClick={() => setGarudaType('official_gold')}
                    className={`flex items-center gap-3 p-3 bg-white border rounded-xl cursor-pointer transition-all ${
                      garudaType === 'official_gold' ? 'border-amber-500 ring-2 ring-amber-200' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <GarudaEmblem size={40} type="official_gold" />
                    <div>
                      <strong className="block text-slate-800 text-xs">ตราครุฑสีทอง</strong>
                      <span className="text-[11px] text-slate-500">มาตรฐานราชการไทย</span>
                    </div>
                  </label>

                  <label
                    onClick={() => setGarudaType('official_red')}
                    className={`flex items-center gap-3 p-3 bg-white border rounded-xl cursor-pointer transition-all ${
                      garudaType === 'official_red' ? 'border-rose-500 ring-2 ring-rose-200' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <GarudaEmblem size={40} type="official_red" />
                    <div>
                      <strong className="block text-slate-800 text-xs">ตราครุฑสีชาด (แดง)</strong>
                      <span className="text-[11px] text-slate-500">แบบหนังสือราชการ</span>
                    </div>
                  </label>

                  <label
                    onClick={() => setGarudaType('custom')}
                    className={`flex items-center gap-3 p-3 bg-white border rounded-xl cursor-pointer transition-all ${
                      garudaType === 'custom' ? 'border-sky-500 ring-2 ring-sky-200' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-10 h-10 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400">
                      URL
                    </div>
                    <div>
                      <strong className="block text-slate-800 text-xs">ตราสัญลักษณ์กำหนดเอง</strong>
                      <span className="text-[11px] text-slate-500">ระบุลิงก์รูปภาพ</span>
                    </div>
                  </label>
                </div>

                {garudaType === 'custom' && (
                  <div>
                    <label className="text-[11px] font-medium text-slate-700 block mb-1">
                      URL รูปภาพตราสัญลักษณ์หน่วยงาน:
                    </label>
                    <input
                      type="text"
                      value={garudaCustomUrl}
                      onChange={e => setGarudaCustomUrl(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                )}
              </div>

              {/* Names */}
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

          {/* TAB 2: OFFICERS & COMMITTEE */}
          {activeTab === 'officers' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">
                    หัวหน้าเจ้าหน้าที่พัสดุ (สำหรับลงนามในทะเบียน พด.4)
                  </label>
                  <input
                    type="text"
                    value={chiefOfficer}
                    onChange={e => setChiefOfficer(e.target.value)}
                    placeholder="ชื่อ-สกุล พร้อมตำแหน่ง"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-700 block mb-1">
                    เจ้าหน้าที่พัสดุผู้จัดทำ
                  </label>
                  <input
                    type="text"
                    value={procurementOfficer}
                    onChange={e => setProcurementOfficer(e.target.value)}
                    placeholder="ชื่อ-สกุล พร้อมตำแหน่ง"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="font-medium text-slate-700 block mb-1">
                    ผู้อำนวยการ / ผู้มีอำนาจสั่งการ
                  </label>
                  <input
                    type="text"
                    value={approverOfficer}
                    onChange={e => setApproverOfficer(e.target.value)}
                    placeholder="ดร. ... (ผู้อำนวยการ...)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Committee Members */}
              <div className="pt-2">
                <label className="font-semibold text-slate-800 block mb-2">
                  คณะกรรมการตรวจสอบพัสดุประจำปี (สำหรับรายงานสรุปงบประมาณ):
                </label>
                <div className="space-y-2 mb-3">
                  {committee.map((member, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-slate-800 font-medium">{member}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCommitteeMember(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCommitteeMember}
                    onChange={e => setNewCommitteeMember(e.target.value)}
                    placeholder="เพิ่มชื่อ-สกุล กรรมการตรวจนับพัสดุ..."
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCommitteeMember}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg"
                  >
                    เพิ่มกรรมการ
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DEPARTMENTS & CATEGORIES */}
          {activeTab === 'departments' && (
            <div className="space-y-6">
              {/* Departments */}
              <div>
                <label className="font-semibold text-slate-800 block mb-2">
                  รายชื่อหน่วยงาน / ฝ่าย / กองภายใน ({departments.length} หน่วยงาน):
                </label>
                <div className="max-h-44 overflow-y-auto space-y-1.5 border border-slate-200 rounded-lg p-2 bg-slate-50/50">
                  {departments.map(dept => (
                    <div key={dept} className="flex items-center justify-between px-3 py-2 bg-white border border-slate-200 rounded-md">
                      <span className="text-slate-800 font-medium">{dept}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDept(dept)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded"
                        title="ลบหน่วยงานนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={newDept}
                    onChange={e => setNewDept(e.target.value)}
                    placeholder="ระบุชื่อหน่วยงานใหม่ เช่น กลุ่มงานสารสนเทศภูมิศาสตร์..."
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddDept}
                    className="flex items-center gap-1 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg"
                  >
                    <Plus className="w-4 h-4" />
                    <span>เพิ่มหน่วยงาน</span>
                  </button>
                </div>
              </div>

              {/* Asset Categories */}
              <div className="pt-2 border-t border-slate-200">
                <label className="font-semibold text-slate-800 block mb-2">
                  หมวดหมู่ครุภัณฑ์คอมพิวเตอร์ ({categories.length} หมวด):
                </label>
                <div className="max-h-40 overflow-y-auto space-y-1.5 border border-slate-200 rounded-lg p-2 bg-slate-50/50">
                  {categories.map(cat => (
                    <div key={cat} className="flex items-center justify-between px-3 py-2 bg-white border border-slate-200 rounded-md">
                      <span className="text-slate-800">{cat}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(cat)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded"
                        title="ลบหมวดหมู่นี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    placeholder="ระบุหมวดหมู่ใหม่ เช่น จอสัมผัสอัจฉริยะ (Interactive Board)..."
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="flex items-center gap-1 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg"
                  >
                    <Plus className="w-4 h-4" />
                    <span>เพิ่มหมวดหมู่</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GOOGLE DRIVE STORAGE */}
          {activeTab === 'drive' && (
            <div className="space-y-4">
              <div className="p-4 bg-sky-50 border border-sky-100 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sky-900 text-xs flex items-center gap-1.5">
                    <FolderSync className="w-4 h-4 text-sky-600" />
                    โฟลเดอร์ Google Drive เก็บรูปภาพครุภัณฑ์
                  </span>
                  <a
                    href={driveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] text-sky-700 font-medium hover:underline"
                  >
                    <span>เปิดโฟลเดอร์ในแท็บใหม่</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <p className="text-[11px] text-sky-800">
                  ระบบเชื่อมต่อกับโฟลเดอร์ Google Drive ของหน่วยงานเพื่อการจัดเก็บภาพถ่ายครุภัณฑ์และใบตรวจรับอย่างปลอดภัย
                </p>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Google Drive Shared Folder URL:
                </label>
                <input
                  type="text"
                  value={driveUrl}
                  onChange={e => setDriveUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-xs"
                />
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1.5">
                <strong className="text-slate-800 block">วิธีนำรูปภาพมาใส่ในครุภัณฑ์:</strong>
                <ol className="list-decimal list-inside space-y-1">
                  <li>ถ่ายภาพครุภัณฑ์คอมพิวเตอร์และป้ายบาร์โค้ด</li>
                  <li>อัปโหลดรูปภาพเข้าไปยังโฟลเดอร์ Google Drive ข้างต้น</li>
                  <li>คลิกขวาที่ไฟล์รูปภาพใน Drive → เลือก "แชร์ (Share)" → คัดลอกลิงก์</li>
                  <li>นำลิงก์มาวางในช่อง "รูปภาพครุภัณฑ์ & Google Drive" ในหน้าเพิ่ม/แก้ไขครุภัณฑ์</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 5: SUPABASE & SQL */}
          {activeTab === 'supabase' && (
            <div className="space-y-4">
              {/* Connection Status Banner */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <div className={`w-3 h-3 rounded-full ${supabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-500'}`} />
                  <div>
                    <strong className="text-slate-800 block text-xs">
                      {supabaseConnected ? 'เชื่อมต่อ Supabase Realtime สำเร็จ' : 'ระบบพร้อมทำงานร่วมกับ Supabase & Local Cache'}
                    </strong>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Project: ofhjsywgkoaetxclhrcn.supabase.co
                    </span>
                  </div>
                </div>

                <a
                  href="https://supabase.com/dashboard/project/ofhjsywgkoaetxclhrcn/sql"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-medium rounded-lg transition-colors text-xs"
                >
                  <span>เปิด SQL Editor ใน Supabase</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Copy SQL Schema Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-800 block">
                    สคริปต์ SQL สำหรับสร้างตาราง & Realtime ใน Supabase:
                  </label>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="flex items-center gap-1 px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-md font-medium text-xs transition-colors"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSql ? 'คัดลอก SQL แล้ว!' : 'คัดลอก SQL (1-Click)'}</span>
                  </button>
                </div>

                <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] max-h-48 overflow-y-auto border border-slate-800">
                  {SUPABASE_SQL_SCHEMA}
                </pre>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-[11px] flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>คำแนะนำ:</strong> นำโค้ด SQL ด้านบนไปวางและกด Run ที่หน้า SQL Editor ใน Supabase Dashboard ตารางทั้งหมด (assets, materials, borrow_logs, repair_logs, app_settings) จะถูกสร้างพร้อม Realtime และ RLS ทันที
                </span>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-white bg-sky-600 hover:bg-sky-700 font-medium rounded-lg shadow-sm transition-colors"
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
