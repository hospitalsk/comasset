import React, { useState } from 'react';
import { Asset, AppSettings, RepairLog } from '../types/asset';
import { X, Wrench, AlertTriangle, CheckCircle, Save } from 'lucide-react';

interface RepairModalProps {
  asset: Asset;
  settings: AppSettings;
  existingRepair?: RepairLog;
  onSave: (log: RepairLog) => void;
  onClose: () => void;
}

export const RepairModal: React.FC<RepairModalProps> = ({
  asset,
  settings,
  existingRepair,
  onSave,
  onClose
}) => {
  const [issueDescription, setIssueDescription] = useState(existingRepair?.issue_description || '');
  const [reporterName, setReporterName] = useState(existingRepair?.reporter_name || asset.current_user || '');
  const [reporterDept, setReporterDept] = useState(existingRepair?.reporter_department || asset.department);
  const [reportDate, setReportDate] = useState(existingRepair?.report_date || new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<RepairLog['status']>(existingRepair?.status || 'pending');
  const [repairVendor, setRepairVendor] = useState(existingRepair?.repair_vendor || '');
  const [repairCost, setRepairCost] = useState<number>(existingRepair?.repair_cost || 0);
  const [invoiceNo, setInvoiceNo] = useState(existingRepair?.invoice_no || '');
  const [resolutionNotes, setResolutionNotes] = useState(existingRepair?.resolution_notes || '');
  const [recommendDisposal, setRecommendDisposal] = useState<boolean>(existingRepair?.recommend_disposal || false);

  // Check if repair cost exceeds 50% of original cost
  const isCostlyRepair = repairCost > asset.cost * 0.5;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const log: RepairLog = {
      id: existingRepair?.id || crypto.randomUUID(),
      asset_id: asset.id,
      asset_code: asset.asset_code,
      asset_name: asset.name,
      issue_description: issueDescription.trim(),
      reporter_name: reporterName.trim(),
      reporter_department: reporterDept,
      report_date: reportDate,
      status,
      repair_vendor: repairVendor.trim(),
      repair_cost: Number(repairCost),
      invoice_no: invoiceNo.trim() || undefined,
      completion_date: status === 'completed' ? new Date().toISOString().split('T')[0] : null,
      resolution_notes: resolutionNotes.trim() || undefined,
      recommend_disposal: recommendDisposal || isCostlyRepair,
      created_at: existingRepair?.created_at || new Date().toISOString()
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
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-base">
                {existingRepair ? 'อัปเดตสถานะการซ่อมบำรุง' : 'แจ้งส่งซ่อมบำรุงครุภัณฑ์'}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">
              อาการชำรุด / ปัญหาที่พบ <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={issueDescription}
              onChange={e => setIssueDescription(e.target.value)}
              placeholder="ระบุอาการชำรุดอย่างละเอียด เช่น เปิดไม่ติด พัดลมเสียงดัง จอภาพไม่แสดงผล..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                ผู้แจ้งซ่อม <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={reporterName}
                onChange={e => setReporterName(e.target.value)}
                placeholder="ชื่อ-นามสกุล"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                วันที่แจ้งซ่อม
              </label>
              <input
                type="date"
                required
                value={reportDate}
                onChange={e => setReportDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                สถานะการซ่อม
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              >
                <option value="pending">รอตรวจสอบอาการ</option>
                <option value="in_progress">กำลังส่งซ่อมศูนย์บริการ</option>
                <option value="completed">ซ่อมเสร็จแล้ว พร้อมใช้งาน</option>
                <option value="unrepairable">ซ่อมไม่ได้ / ไม่คุ้มค่าซ่อม</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                ศูนย์บริการ / ร้านค้าผู้ซ่อม
              </label>
              <input
                type="text"
                value={repairVendor}
                onChange={e => setRepairVendor(e.target.value)}
                placeholder="เช่น บริษัท เดลล์ คอร์ปอเรชั่น"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                ค่าใช้จ่ายในการซ่อม (บาท)
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={repairCost}
                onChange={e => setRepairCost(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-right"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                เลขที่ใบแจ้งหนี้ / ใบเสร็จ
              </label>
              <input
                type="text"
                value={invoiceNo}
                onChange={e => setInvoiceNo(e.target.value)}
                placeholder="INV-..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
              />
            </div>
          </div>

          {/* Warning if cost exceeds 50% */}
          {isCostlyRepair && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>เตือนตามระเบียบพัสดุภาครัฐ:</strong> ค่าซ่อม ({(Number(repairCost) || 0).toLocaleString()} ฿) เกินกว่า 50% ของราคาทุน ({(Number(asset?.cost) || 0).toLocaleString()} ฿) แนะนำพิจารณาเสนอปลดระวาง/จำหน่ายและจัดหาทดแทน
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">
              ผลการแก้ไข / หมายเหตุช่าง
            </label>
            <input
              type="text"
              value={resolutionNotes}
              onChange={e => setResolutionNotes(e.target.value)}
              placeholder="เช่น เปลี่ยนพาวเวอร์ซัพพลายใหม่ ทดสอบบูตเครื่องแล้วผ่านเกณฑ์"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={recommendDisposal}
                onChange={e => setRecommendDisposal(e.target.checked)}
                className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
              />
              <span>เสนอจำหน่ายพัสดุ (กรณีชำรุดจนใช้งานไม่ได้หรือไม่คุ้มค่าที่จะซ่อมแซม ตามหมวด 9)</span>
            </label>
          </div>

          {/* Submit */}
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
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกการส่งซ่อม</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
