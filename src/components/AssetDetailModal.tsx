import React, { useState } from 'react';
import { Asset, AppSettings, BorrowLog, RepairLog } from '../types/asset';
import { calculateDepreciation, generateDepreciationSchedule } from '../utils/depreciation';
import { X, QrCode, FileText, Wrench, ArrowLeftRight, Edit, Trash2, ExternalLink, Calculator, ShieldCheck, AlertTriangle } from 'lucide-react';

interface AssetDetailModalProps {
  asset: Asset;
  settings: AppSettings;
  borrows: BorrowLog[];
  repairs: RepairLog[];
  onClose: () => void;
  onEdit: (asset: Asset) => void;
  onDelete: (id: string) => void;
  onOpenQR: (asset: Asset) => void;
  onOpenRegisterForm: (asset: Asset) => void;
  onOpenBorrow: (asset: Asset) => void;
  onOpenRepair: (asset: Asset) => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  asset,
  settings,
  borrows,
  repairs,
  onClose,
  onEdit,
  onDelete,
  onOpenQR,
  onOpenRegisterForm,
  onOpenBorrow,
  onOpenRepair
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'depreciation' | 'history'>('info');
  const dep = calculateDepreciation(asset);
  const schedule = generateDepreciationSchedule(asset);

  const assetBorrows = borrows.filter(b => b.asset_id === asset.id || b.asset_code === asset.asset_code);
  const assetRepairs = repairs.filter(r => r.asset_id === asset.id || r.asset_code === asset.asset_code);

  const handleDeleteConfirm = () => {
    if (window.confirm(`ยืนยันการลบข้อมูลครุภัณฑ์ "${asset.name}" (${asset.asset_code}) หรือไม่?`)) {
      onDelete(asset.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-6 overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-sky-800 bg-sky-100/70 px-2 py-0.5 rounded">
                {asset.asset_code}
              </span>
              <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                asset.status === 'available' ? 'bg-emerald-100 text-emerald-800' :
                asset.status === 'in_use' ? 'bg-blue-100 text-blue-800' :
                asset.status === 'borrowed' ? 'bg-purple-100 text-purple-800' :
                asset.status === 'repairing' ? 'bg-amber-100 text-amber-800' :
                'bg-rose-100 text-rose-800'
              }`}>
                {asset.status === 'available' ? 'พร้อมใช้งานในคลัง' :
                 asset.status === 'in_use' ? 'กำลังใช้งาน' :
                 asset.status === 'borrowed' ? 'อยู่ระหว่างยืม' :
                 asset.status === 'repairing' ? 'ส่งซ่อมบำรุง' : 'จำหน่าย/ปลดระวาง'}
              </span>
            </div>
            <h3 className="font-semibold text-slate-900 text-base mt-1">{asset.name}</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenQR(asset)}
              className="p-2 text-slate-600 hover:text-sky-700 bg-white border border-slate-200 rounded-lg hover:bg-sky-50 transition-colors"
              title="ดูป้าย QR Code"
            >
              <QrCode className="w-4 h-4" />
            </button>
            <button
              onClick={() => onOpenRegisterForm(asset)}
              className="p-2 text-slate-600 hover:text-sky-700 bg-white border border-slate-200 rounded-lg hover:bg-sky-50 transition-colors"
              title="พิมพ์ใบทะเบียนคุมทรัพย์สิน (พด. 4)"
            >
              <FileText className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-200 bg-slate-50/40 text-xs">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'info'
                ? 'border-sky-600 text-sky-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            ข้อมูลทั่วไปและสเปก
          </button>
          <button
            onClick={() => setActiveTab('depreciation')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'depreciation'
                ? 'border-sky-600 text-sky-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>ค่าเสื่อมราคา & ทางบัญชี</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-sky-600 text-sky-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>ประวัติยืม-คืน & ส่งซ่อม</span>
            <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full">
              {assetBorrows.length + assetRepairs.length}
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-5">
          {activeTab === 'info' && (
            <div className="space-y-5">
              {/* Top Quick Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-500 text-[11px] block">ยี่ห้อ / รุ่น:</span>
                  <strong className="text-slate-800">{asset.brand_model}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Serial Number:</span>
                  <strong className="text-slate-800 font-mono">{asset.serial_number}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">ราคาทุนรวม:</span>
                  <strong className="text-sky-700 font-mono text-sm">{(Number(asset?.cost) || 0).toLocaleString()} ฿</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">วันที่ตรวจรับ:</span>
                  <strong className="text-slate-800">{asset.acquisition_date}</strong>
                </div>
              </div>

              {/* Specifications */}
              <div>
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  คุณลักษณะเฉพาะ / สเปกเครื่อง:
                </h4>
                <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap">
                  {asset.specifications || 'ไม่ได้ระบุสเปกเครื่อง'}
                </div>
              </div>

              {/* Custody and Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1 p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                  <span className="text-slate-500 block">หน่วยงานผู้ครอบครอง:</span>
                  <strong className="text-slate-800 text-sm block">{asset.department}</strong>
                  <span className="text-slate-500 block pt-1">ผู้ครอบครองปัจจุบัน:</span>
                  <span className="text-slate-800 font-medium">{asset.current_user || 'พร้อมจ่ายใช้งาน'}</span>
                </div>

                <div className="space-y-1 p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                  <span className="text-slate-500 block">สถานที่ติดตั้งใช้งาน:</span>
                  <strong className="text-slate-800 text-sm block">{asset.location}</strong>
                  <span className="text-slate-500 block pt-1">เลขที่สัญญา / PO:</span>
                  <span className="text-slate-800 font-mono">{asset.purchase_order_no || '-'}</span>
                </div>
              </div>

              {/* Photo & Drive Folder */}
              <div className="border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-800 block">รูปภาพหลักฐานและเอกสารจัดซื้อ</span>
                    <span className="text-[11px] text-slate-500">จัดเก็บบน Google Drive ของหน่วยงาน</span>
                  </div>
                </div>
                <a
                  href={asset.image_url || settings.google_drive_folder_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  <span>เปิด Google Drive</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {activeTab === 'depreciation' && (
            <div className="space-y-4">
              {/* Financial KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">ราคาทุน (Cost):</span>
                  <strong className="text-slate-900 font-mono text-base">{(Number(dep?.cost) || 0).toLocaleString()} ฿</strong>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">ค่าเสื่อมสะสม:</span>
                  <strong className="text-rose-600 font-mono text-base">{(Number(dep?.accumulatedDepreciation) || 0).toLocaleString()} ฿</strong>
                </div>
                <div className="bg-sky-50 p-3 rounded-xl border border-sky-200">
                  <span className="text-[11px] text-sky-800 block">มูลค่าสุทธิ (NBV):</span>
                  <strong className="text-sky-700 font-mono text-base">{(Number(dep?.netBookValue) || 0).toLocaleString()} ฿</strong>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">อายุการใช้งาน:</span>
                  <strong className="text-slate-900 font-mono text-base">{dep.ageYears} / {asset.lifespan_years} ปี</strong>
                </div>
              </div>

              {/* Recommendation banner */}
              <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                dep.isFullyDepreciated
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}>
                {dep.isFullyDepreciated ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-semibold block">ข้อเสนอแนะตามระเบียบพัสดุภาครัฐ พ.ศ. 2560:</span>
                  <p className="mt-0.5">{dep.recommendation}</p>
                </div>
              </div>

              {/* Schedule Table */}
              <div>
                <h4 className="text-xs font-semibold text-slate-700 mb-2">ตารางค่าเสื่อมราคารายปี:</h4>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold">
                      <tr>
                        <th className="px-3 py-2">ปีที่</th>
                        <th className="px-3 py-2">ปี พ.ศ.</th>
                        <th className="px-3 py-2 text-right">มูลค่ายกมา</th>
                        <th className="px-3 py-2 text-right">ค่าเสื่อมประจำปี</th>
                        <th className="px-3 py-2 text-right">ค่าเสื่อมสะสม</th>
                        <th className="px-3 py-2 text-right">มูลค่าสุทธิ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {schedule.map(s => (
                        <tr key={s.yearNo} className="hover:bg-slate-50">
                          <td className="px-3 py-1.5 font-sans">{s.yearNo}</td>
                          <td className="px-3 py-1.5 font-sans">พ.ศ. {s.fiscalYear}</td>
                          <td className="px-3 py-1.5 text-right">{(Number(s?.beginningBookValue) || 0).toLocaleString()}</td>
                          <td className="px-3 py-1.5 text-right text-slate-600">{(Number(s?.annualExpense) || 0).toLocaleString()}</td>
                          <td className="px-3 py-1.5 text-right text-rose-600">{(Number(s?.accumulatedExpense) || 0).toLocaleString()}</td>
                          <td className="px-3 py-1.5 text-right font-bold text-slate-900">{(Number(s?.endingBookValue) || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4 text-xs">
              {/* Borrow History */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <ArrowLeftRight className="w-4 h-4 text-sky-600" />
                    ประวัติการยืม-คืนพัสดุ ({assetBorrows.length})
                  </h4>
                  {asset.status !== 'borrowed' && (
                    <button
                      onClick={() => onOpenBorrow(asset)}
                      className="px-2.5 py-1 text-xs text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-md font-medium transition-colors"
                    >
                      + บันทึกการยืม
                    </button>
                  )}
                </div>

                {assetBorrows.length > 0 ? (
                  <div className="space-y-2">
                    {assetBorrows.map(b => (
                      <div key={b.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                        <div>
                          <strong className="text-slate-800">{b.borrower_name}</strong>
                          <span className="text-slate-500"> ({b.borrower_department})</span>
                          <p className="text-[11px] text-slate-600 mt-0.5">วัตถุประสงค์: {b.purpose}</p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            วันที่ยืม: {b.borrow_date} → กำหนดคืน: {b.expected_return_date}
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          b.status === 'returned' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {b.status === 'returned' ? 'คืนแล้ว' : 'กำลังยืม'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic p-3 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-center">
                    ไม่มีประวัติการยืม
                  </p>
                )}
              </div>

              {/* Repair History */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-amber-600" />
                    ประวัติการแจ้งซ่อมบำรุง ({assetRepairs.length})
                  </h4>
                  <button
                    onClick={() => onOpenRepair(asset)}
                    className="px-2.5 py-1 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md font-medium transition-colors"
                  >
                    + ส่งซ่อมใหม่
                  </button>
                </div>

                {assetRepairs.length > 0 ? (
                  <div className="space-y-2">
                    {assetRepairs.map(r => (
                      <div key={r.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                        <div>
                          <strong className="text-slate-800">{r.issue_description}</strong>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            ผู้แจ้ง: {r.reporter_name} | ศูนย์ซ่อม: {r.repair_vendor || '-'}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            วันที่แจ้ง: {r.report_date} | ค่าใช้จ่าย: {(Number(r?.repair_cost) || 0).toLocaleString()} ฿
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          r.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {r.status === 'completed' ? 'ซ่อมเสร็จแล้ว' : 'กำลังซ่อม'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic p-3 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-center">
                    ไม่มีประวัติการส่งซ่อม
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/70">
          <button
            onClick={handleDeleteConfirm}
            className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 px-3 py-1.5 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>ลบรายการนี้</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(asset);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>แก้ไขข้อมูล</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
