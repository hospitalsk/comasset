import React from 'react';
import { Asset, AppSettings, RepairLog } from '../types/asset';
import { generateDepreciationSchedule } from '../utils/depreciation';
import { GarudaEmblem } from './GarudaEmblem';
import { Printer, X, Download } from 'lucide-react';

interface AssetRegisterFormProps {
  asset: Asset;
  settings: AppSettings;
  repairLogs?: RepairLog[];
  onClose: () => void;
}

export const AssetRegisterForm: React.FC<AssetRegisterFormProps> = ({
  asset,
  settings,
  repairLogs = [],
  onClose
}) => {
  const schedule = generateDepreciationSchedule(asset);
  const relevantRepairs = repairLogs.filter(r => r.asset_id === asset.id || r.asset_code === asset.asset_code);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-6 overflow-hidden border border-slate-200 print:shadow-none print:border-none print:m-0 print:max-w-none">
        {/* Floating Action Bar (hidden on print) */}
        <div className="no-print flex items-center justify-between px-6 py-3.5 bg-slate-800 text-white">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">พิมพ์ใบทะเบียนคุมทรัพย์สิน (แบบ พด. 4)</span>
            <span className="text-xs text-slate-400 font-mono">({asset.asset_code})</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-medium rounded-lg transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์เอกสารราชการ (A4)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Document Content */}
        <div className="p-8 sm:p-12 text-black bg-white max-h-[82vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-6">
          {/* Header with Royal Garuda */}
          <div className="text-center space-y-1 mb-6">
            <div className="flex justify-center mb-2">
              <GarudaEmblem
                size={54}
                type={settings.garuda_symbol_type}
                customUrl={settings.garuda_custom_url}
              />
            </div>
            <h2 className="text-lg font-bold tracking-tight text-black">
              ทะเบียนคุมทรัพย์สิน (แบบ พด. 4)
            </h2>
            <p className="text-xs text-gray-700">
              ตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560
            </p>
            <p className="text-xs font-semibold text-gray-900 pt-1">
              {settings.organization_name} {settings.sub_organization ? `(${settings.sub_organization})` : ''}
            </p>
          </div>

          {/* Asset Identity Block */}
          <div className="border border-black text-xs divide-y divide-black mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black bg-gray-50/70 p-2 font-medium">
              <div>
                <span className="text-gray-600 block text-[10px]">ประเภทครุภัณฑ์:</span>
                <span className="font-bold">{asset.category}</span>
              </div>
              <div>
                <span className="text-gray-600 block text-[10px]">รหัสครุภัณฑ์:</span>
                <span className="font-mono font-bold text-sm">{asset.asset_code}</span>
              </div>
              <div>
                <span className="text-gray-600 block text-[10px]">รหัสสินทรัพย์ GFMIS:</span>
                <span className="font-mono font-bold">{asset.gfmis_code || '-'}</span>
              </div>
            </div>

            <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p><span className="font-semibold">ชื่อรายการ:</span> {asset.name}</p>
                <p><span className="font-semibold">ยี่ห้อ/รุ่น/แบบ:</span> {asset.brand_model}</p>
                <p><span className="font-semibold">หมายเลขเครื่อง (Serial No.):</span> <span className="font-mono">{asset.serial_number}</span></p>
                <p><span className="font-semibold">คุณลักษณะเฉพาะ:</span> {asset.specifications || '-'}</p>
              </div>
              <div>
                <p><span className="font-semibold">สถานที่ติดตั้งใช้งาน:</span> {asset.location}</p>
                <p><span className="font-semibold">หน่วยงานที่ครอบครอง:</span> {asset.department}</p>
                <p><span className="font-semibold">ผู้ใช้งานประจำ:</span> {asset.current_user}</p>
                <p><span className="font-semibold">สถานะปัจจุบัน:</span> {asset.status === 'in_use' ? 'กำลังใช้งาน' : asset.status === 'available' ? 'พร้อมใช้งาน' : asset.status === 'repairing' ? 'ส่งซ่อม' : asset.status === 'borrowed' ? 'อยู่ระหว่างยืม' : 'จำหน่ายแล้ว'}</p>
              </div>
            </div>

            <div className="p-3 grid grid-cols-2 md:grid-cols-4 gap-2 bg-gray-50/50">
              <div>
                <span className="text-gray-600 text-[10px] block">วันที่ตรวจรับ:</span>
                <span className="font-medium">{asset.acquisition_date}</span>
              </div>
              <div>
                <span className="text-gray-600 text-[10px] block">เลขที่สัญญา/PO:</span>
                <span className="font-mono font-medium">{asset.purchase_order_no || '-'}</span>
              </div>
              <div>
                <span className="text-gray-600 text-[10px] block">วิธีการได้มา:</span>
                <span className="font-medium">{asset.acquisition_method}</span>
              </div>
              <div>
                <span className="text-gray-600 text-[10px] block">ราคาทุนรวม:</span>
                <span className="font-mono font-bold text-sm">{(Number(asset?.cost) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</span>
              </div>
            </div>
          </div>

          {/* Depreciation Schedule Table */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-black flex items-center justify-between">
              <span>ตารางการคำนวณค่าเสื่อมราคาประจำปี (อายุการใช้งาน {asset.lifespan_years} ปี / อัตรา {asset.depreciation_rate}% ต่อปี / ค่าซาก {asset.salvage_value} บาท)</span>
              <span className="text-[10px] text-gray-600">วิธีเส้นตรง (Straight-Line Method)</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border-collapse border border-black text-left">
                <thead className="bg-gray-100 font-bold border-b border-black">
                  <tr>
                    <th className="border border-black px-2 py-1.5 text-center w-12">ปีที่</th>
                    <th className="border border-black px-2 py-1.5 text-center w-24">ปีงบประมาณ</th>
                    <th className="border border-black px-2 py-1.5 text-right">มูลค่าต้นทุน/ยกมา (บาท)</th>
                    <th className="border border-black px-2 py-1.5 text-right">ค่าเสื่อมราคาประจำปี (บาท)</th>
                    <th className="border border-black px-2 py-1.5 text-right">ค่าเสื่อมราคาสะสม (บาท)</th>
                    <th className="border border-black px-2 py-1.5 text-right">มูลค่าสุทธิทางบัญชี (บาท)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black font-mono">
                  {schedule.map(row => (
                    <tr key={row.yearNo} className="hover:bg-gray-50">
                      <td className="border border-black px-2 py-1 text-center font-sans">{row.yearNo}</td>
                      <td className="border border-black px-2 py-1 text-center font-sans">พ.ศ. {row.fiscalYear}</td>
                      <td className="border border-black px-2 py-1 text-right">{(Number(row?.beginningBookValue) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                      <td className="border border-black px-2 py-1 text-right">{(Number(row?.annualExpense) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                      <td className="border border-black px-2 py-1 text-right text-rose-700">{(Number(row?.accumulatedExpense) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                      <td className="border border-black px-2 py-1 text-right font-bold">{(Number(row?.endingBookValue) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Maintenance & Repair History Log on Register Card */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-black">
              ประวัติการซ่อมบำรุงและบำรุงรักษา
            </h3>
            {relevantRepairs.length > 0 ? (
              <table className="w-full text-[11px] border-collapse border border-black text-left">
                <thead className="bg-gray-100 font-bold border-b border-black">
                  <tr>
                    <th className="border border-black px-2 py-1 text-center w-24">วันที่แจ้ง</th>
                    <th className="border border-black px-2 py-1">รายการชำรุด / อาการ</th>
                    <th className="border border-black px-2 py-1">ผู้ซ่อม / ศูนย์บริการ</th>
                    <th className="border border-black px-2 py-1 text-right w-24">ค่าซ่อม (บาท)</th>
                    <th className="border border-black px-2 py-1 text-center w-24">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {relevantRepairs.map(rep => (
                    <tr key={rep.id}>
                      <td className="border border-black px-2 py-1 text-center font-mono">{rep.report_date}</td>
                      <td className="border border-black px-2 py-1">{rep.issue_description}</td>
                      <td className="border border-black px-2 py-1">{rep.repair_vendor || '-'}</td>
                      <td className="border border-black px-2 py-1 text-right font-mono">{(Number(rep?.repair_cost) || 0).toLocaleString()}</td>
                      <td className="border border-black px-2 py-1 text-center">
                        {rep.status === 'completed' ? 'ซ่อมเสร็จแล้ว' : rep.status === 'in_progress' ? 'กำลังซ่อม' : 'รอตรวจเช็ค'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-xs text-gray-500 italic p-2 border border-dashed border-gray-400 text-center">
                ยังไม่มีประวัติการแจ้งซ่อมบำรุง ครุภัณฑ์อยู่ในสภาพสมบูรณ์
              </p>
            )}
          </div>

          {/* Official Signatures Section (ลายมือชื่อเจ้าหน้าที่ตามระเบียบพัสดุฯ) */}
          <div className="grid grid-cols-3 gap-6 pt-8 text-center text-xs text-black">
            <div className="space-y-1">
              <p className="border-b border-dotted border-black pb-8 w-4/5 mx-auto"></p>
              <p className="font-semibold">({settings.procurement_officer.split('(')[0].trim() || 'ลงชื่อเจ้าหน้าที่พัสดุ'})</p>
              <p className="text-[11px] text-gray-700">เจ้าหน้าที่พัสดุผู้จัดทำ</p>
              <p className="text-[10px] text-gray-600">วันที่ ......./......./...........</p>
            </div>

            <div className="space-y-1">
              <p className="border-b border-dotted border-black pb-8 w-4/5 mx-auto"></p>
              <p className="font-semibold">({settings.chief_procurement_officer.split('(')[0].trim() || 'ลงชื่อหัวหน้าเจ้าหน้าที่พัสดุ'})</p>
              <p className="text-[11px] text-gray-700">หัวหน้าเจ้าหน้าที่พัสดุผู้ตรวจสอบ</p>
              <p className="text-[10px] text-gray-600">วันที่ ......./......./...........</p>
            </div>

            <div className="space-y-1">
              <p className="border-b border-dotted border-black pb-8 w-4/5 mx-auto"></p>
              <p className="font-semibold">({settings.approver_officer.split('(')[0].trim() || 'ลงชื่อผู้อำนวยการ'})</p>
              <p className="text-[11px] text-gray-700">ผู้อำนวยการ / หัวหน้าหน่วยงาน</p>
              <p className="text-[10px] text-gray-600">วันที่ ......./......./...........</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
