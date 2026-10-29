import React, { useState } from 'react';
import { Asset, AppSettings, BorrowLog } from '../types/asset';
import { X, ArrowLeftRight, CheckCircle, Calendar, User, FileText } from 'lucide-react';

interface BorrowModalProps {
  asset: Asset;
  settings: AppSettings;
  existingBorrow?: BorrowLog;
  onSave: (log: BorrowLog) => void;
  onClose: () => void;
}

export const BorrowModal: React.FC<BorrowModalProps> = ({
  asset,
  settings,
  existingBorrow,
  onSave,
  onClose
}) => {
  const isReturning = asset.status === 'borrowed' || Boolean(existingBorrow);

  const [borrowerName, setBorrowerName] = useState(existingBorrow?.borrower_name || '');
  const [borrowerDept, setBorrowerDept] = useState(existingBorrow?.borrower_department || settings.departments[0] || '');
  const [borrowDate, setBorrowDate] = useState(existingBorrow?.borrow_date || new Date().toISOString().split('T')[0]);
  const [expectedDate, setExpectedDate] = useState(existingBorrow?.expected_return_date || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
  const [purpose, setPurpose] = useState(existingBorrow?.purpose || 'ปฏิบัติราชการ / งานโครงการ');
  const [officerName, setOfficerName] = useState(existingBorrow?.officer_name || settings.procurement_officer);
  const [returnCondition, setReturnCondition] = useState(existingBorrow?.return_condition || 'สภาพสมบูรณ์ พร้อมอุปกรณ์ครบ');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const log: BorrowLog = {
      id: existingBorrow?.id || crypto.randomUUID(),
      asset_id: asset.id,
      asset_code: asset.asset_code,
      asset_name: asset.name,
      borrower_name: borrowerName.trim(),
      borrower_department: borrowerDept,
      borrow_date: borrowDate,
      expected_return_date: expectedDate,
      actual_return_date: isReturning ? new Date().toISOString().split('T')[0] : null,
      status: isReturning ? 'returned' : 'borrowed',
      purpose: purpose.trim(),
      officer_name: officerName.trim(),
      return_condition: isReturning ? returnCondition.trim() : undefined,
      created_at: existingBorrow?.created_at || new Date().toISOString()
    };

    onSave(log);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-100 text-sky-700 rounded-lg">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-base">
                {isReturning ? 'บันทึกการรับคืนพัสดุครุภัณฑ์' : 'บันทึกการขอยืมครุภัณฑ์คอมพิวเตอร์'}
              </h3>
              <p className="text-xs text-slate-500 font-mono">{asset.asset_code} - {asset.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">
              ชื่อผู้ขอยืม <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={isReturning}
              value={borrowerName}
              onChange={e => setBorrowerName(e.target.value)}
              placeholder="เช่น นายกิตติศักดิ์ พูลสวัสดิ์"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                หน่วยงานผู้ยืม
              </label>
              <select
                disabled={isReturning}
                value={borrowerDept}
                onChange={e => setBorrowerDept(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white disabled:bg-slate-100"
              >
                {settings.departments.map(d => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                เจ้าหน้าที่พัสดุผู้ส่งมอบ
              </label>
              <input
                type="text"
                value={officerName}
                onChange={e => setOfficerName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                วันที่ยืม <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                disabled={isReturning}
                value={borrowDate}
                onChange={e => setBorrowDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                กำหนดส่งคืน <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                disabled={isReturning}
                value={expectedDate}
                onChange={e => setExpectedDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">
              วัตถุประสงค์การยืมใช้งาน <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={isReturning}
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              placeholder="เช่น ใช้งานสัมมนาเชิงปฏิบัติการนอกสถานที่"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100"
            />
          </div>

          {isReturning && (
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 space-y-2">
              <span className="text-xs font-semibold text-emerald-900 block flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                ตรวจสอบสภาพพัสดุเมื่อรับคืน:
              </span>
              <input
                type="text"
                value={returnCondition}
                onChange={e => setReturnCondition(e.target.value)}
                placeholder="เช่น เครื่องเปิดติดปกติ อุปกรณ์สายชาร์จครบถ้วน"
                className="w-full px-3 py-2 text-xs border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white rounded-lg transition-colors ${
                isReturning ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>{isReturning ? 'ยืนยันรับคืนเข้าสต็อก' : 'ยืนยันบันทึกการยืม'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
