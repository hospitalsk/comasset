import React, { useState } from 'react';
import { Asset, ConsumableMaterial, AppSettings, RepairLog } from '../types/asset';
import { calculateDepreciation } from '../utils/depreciation';
import { GarudaEmblem } from './GarudaEmblem';
import { Printer, Download, Laptop, Package, Calendar, FileText, CheckCircle2 } from 'lucide-react';

interface AnnualReportViewProps {
  assets: Asset[];
  materials: ConsumableMaterial[];
  repairs: RepairLog[];
  settings: AppSettings;
  onNavigateToDashboard: () => void;
}

export const AnnualReportView: React.FC<AnnualReportViewProps> = ({
  assets,
  materials,
  repairs,
  settings,
  onNavigateToDashboard
}) => {
  const [targetFiscalYear, setTargetFiscalYear] = useState<number>(settings.fiscal_year + 1);
  const [activeReportTab, setActiveReportTab] = useState<'asset_report' | 'material_report'>('asset_report');

  // 1. Assets exceeding useful life (อายุการใช้งานเกิน 5 ปี หรือ ซ่อมบ่อย)
  const assetsNeedingReplacement = assets.filter(asset => {
    const dep = calculateDepreciation(asset);
    const assetRepairs = repairs.filter(r => r.asset_id === asset.id);
    const totalRepairCost = assetRepairs.reduce((sum, r) => sum + (r.repair_cost || 0), 0);
    const repairExceedsHalf = totalRepairCost > asset.cost * 0.5;

    return dep.isFullyDepreciated || repairExceedsHalf || asset.status === 'disposed';
  });

  const estimatedAssetReplacementBudget = assetsNeedingReplacement.reduce((sum, a) => sum + a.cost, 0);

  // 2. Consumables depletion & annual budget projection
  const lowMaterials = materials.filter(m => m.stock_quantity <= m.min_threshold);
  const annualConsumableBudget = materials.reduce((sum, m) => {
    const annualNeeded = m.monthly_usage_avg * 12;
    return sum + (annualNeeded * m.unit_price);
  }, 0);

  const handlePrint = () => {
    window.print();
  };

  // Export File 1: แยกไฟล์รายงานแผนครุภัณฑ์คอมพิวเตอร์
  const handleExportAssetCSV = () => {
    const rows = [
      ['รายงานการตรวจสอบและแผนจัดหาครุภัณฑ์คอมพิวเตอร์ทดแทนประจำปี (แบบแยกเฉพาะครุภัณฑ์)'],
      [`ชื่อส่วนราชการ/หน่วยงาน: ${settings.organization_name}`],
      [`สำนัก/กอง: ${settings.sub_organization || '-'}`],
      [`สำหรับเสนอตั้งคำของบประมาณประจำปี: พ.ศ. ${targetFiscalYear}`],
      ['ตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560 (ข้อ 215 และหมวด 9)'],
      [''],
      ['ลำดับ', 'รหัสครุภัณฑ์', 'รหัส GFMIS', 'รายการครุภัณฑ์', 'ยี่ห้อ/รุ่น', 'หน่วยงานผู้ครอบครอง', 'วันที่ตรวจรับ', 'อายุการใช้งาน(ปี)', 'ราคาทุนเดิม(บาท)', 'สถานะ/เหตุผลความจำเป็นในการจัดซื้อทดแทน'],
      ...assetsNeedingReplacement.map((a, idx) => {
        const dep = calculateDepreciation(a);
        return [
          idx + 1,
          `"${a.asset_code}"`,
          `"${a.gfmis_code || '-'}"`,
          `"${a.name}"`,
          `"${a.brand_model}"`,
          `"${a.department}"`,
          a.acquisition_date,
          dep.ageYears,
          a.cost,
          dep.isFullyDepreciated ? 'ครบกำหนดอายุการใช้งาน 5 ปี / มูลค่าสุทธิคงเหลือ 1 บาท' : 'ซ่อมบำรุงไม่คุ้มค่า เสนอจำหน่าย'
        ];
      }),
      [''],
      ['สรุปจำนวนครุภัณฑ์ที่เสนอขอจัดซื้อทดแทนทั้งสิ้น', assetsNeedingReplacement.length, 'รายการ'],
      ['รวมวงเงินงบประมาณจัดซื้อครุภัณฑ์คอมพิวเตอร์ทดแทนทั้งสิ้น', estimatedAssetReplacementBudget, 'บาท']
    ];

    const csvContent = '\uFEFF' + rows.map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `รายงานแผนจัดซื้อครุภัณฑ์คอมพิวเตอร์ทดแทน_พศ_${targetFiscalYear}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export File 2: แยกไฟล์รายงานแผนงบประมาณวัสดุคอมพิวเตอร์
  const handleExportMaterialCSV = () => {
    const rows = [
      ['รายงานสรุปการใช้วัสดุคอมพิวเตอร์และประมาณการงบประมาณรายปี (แบบแยกเฉพาะวัสดุ)'],
      [`ชื่อส่วนราชการ/หน่วยงาน: ${settings.organization_name}`],
      [`สำนัก/กอง: ${settings.sub_organization || '-'}`],
      [`สำหรับเสนอตั้งคำของบประมาณประจำปี: พ.ศ. ${targetFiscalYear}`],
      ['ตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560'],
      [''],
      ['ลำดับ', 'รหัสพัสดุ', 'ชื่อรายการวัสดุคอมพิวเตอร์', 'หมวดหมู่', 'หน่วยนับ', 'คงเหลือปัจจุบัน', 'เกณฑ์เตือนขั้นต่ำ', 'ปริมาณใช้เฉลี่ยต่อเดือน', 'ราคาต่อหน่วย(บาท)', 'ประมาณการงบประมาณ 12 เดือน(บาท)', 'สถานะความต้องการ'],
      ...materials.map((m, idx) => {
        const isLow = m.stock_quantity <= m.min_threshold;
        const annualCost = m.monthly_usage_avg * 12 * m.unit_price;
        return [
          idx + 1,
          `"${m.code}"`,
          `"${m.name}"`,
          `"${m.category}"`,
          `"${m.unit}"`,
          m.stock_quantity,
          m.min_threshold,
          m.monthly_usage_avg,
          m.unit_price,
          annualCost,
          isLow ? 'ใกล้หมดสต็อก ต้องจัดซื้อเร่งด่วน' : 'ปกติ จัดซื้อตามแผนรอบปี'
        ];
      }),
      [''],
      ['สรุปจำนวนรายการวัสดุคอมพิวเตอร์ทั้งหมด', materials.length, 'รายการ'],
      ['จำนวนรายการที่ใกล้หมดสต็อก', lowMaterials.length, 'รายการ'],
      ['รวมวงเงินประมาณการงบประมาณจัดซื้อวัสดุคอมพิวเตอร์ 1 ปีทั้งสิ้น', annualConsumableBudget, 'บาท']
    ];

    const csvContent = '\uFEFF' + rows.map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `รายงานแผนงบประมาณวัสดุคอมพิวเตอร์สิ้นเปลือง_พศ_${targetFiscalYear}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & File Switcher Toolbar (Web App View) */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-sky-100 text-sky-700 rounded-lg">
                <FileText className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                รายงานแผนพัสดุ & ประมาณการงบประมาณรายปี (หน้าเว็บแอปเต็มรูปแบบ)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              ตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560 (แยกเป็น 2 ไฟล์อิสระ)
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-600 font-medium">เสนอของบประมาณ:</span>
              <select
                value={targetFiscalYear}
                onChange={e => setTargetFiscalYear(parseInt(e.target.value))}
                className="bg-white border border-slate-300 text-slate-800 font-bold px-2 py-0.5 rounded text-xs focus:outline-none"
              >
                <option value={settings.fiscal_year}>{settings.fiscal_year}</option>
                <option value={settings.fiscal_year + 1}>{settings.fiscal_year + 1}</option>
                <option value={settings.fiscal_year + 2}>{settings.fiscal_year + 2}</option>
              </select>
            </div>

            {activeReportTab === 'asset_report' ? (
              <button
                onClick={handleExportAssetCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors shadow-2xs"
              >
                <Download className="w-4 h-4 text-sky-400" />
                <span>ส่งออก CSV (ไฟล์ที่ 1: ครุภัณฑ์)</span>
              </button>
            ) : (
              <button
                onClick={handleExportMaterialCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors shadow-2xs"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>ส่งออก CSV (ไฟล์ที่ 2: วัสดุ)</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์หน้ารายงานนี้ (A4)</span>
            </button>
          </div>
        </div>

        {/* 2 Separate Report Tabs */}
        <div className="flex items-center gap-2 border-t border-slate-100 pt-3 text-xs">
          <button
            onClick={() => setActiveReportTab('asset_report')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-medium ${
              activeReportTab === 'asset_report'
                ? 'bg-sky-600 text-white font-semibold shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>ไฟล์ที่ 1: รายงานแผนครุภัณฑ์คอมพิวเตอร์ทดแทน ({assetsNeedingReplacement.length} รายการ)</span>
          </button>

          <button
            onClick={() => setActiveReportTab('material_report')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-medium ${
              activeReportTab === 'material_report'
                ? 'bg-sky-600 text-white font-semibold shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>ไฟล์ที่ 2: รายงานแผนงบประมาณวัสดุคอมพิวเตอร์ ({materials.length} รายการ)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FILE 1: รายงานแผนครุภัณฑ์คอมพิวเตอร์ (SEPARATE REPORT 1 - FULL WEB PAGE)  */}
      {/* ========================================================================= */}
      {activeReportTab === 'asset_report' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-8 sm:p-12 text-black space-y-6 print:border-none print:shadow-none print:p-0">
          {/* Official Document Header */}
          <div className="text-center space-y-1">
            <div className="flex justify-center mb-2">
              <GarudaEmblem
                size={54}
                type={settings.garuda_symbol_type}
                customUrl={settings.garuda_custom_url}
              />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-black">
              รายงานการตรวจสอบและแผนจัดหาครุภัณฑ์คอมพิวเตอร์ทดแทนประจำปี
            </h2>
            <p className="text-xs text-gray-700">
              สำหรับปีงบประมาณ พ.ศ. {targetFiscalYear} ตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560 (ข้อ 215)
            </p>
            <p className="text-xs font-semibold text-gray-900 pt-1">
              {settings.organization_name} {settings.sub_organization ? `(${settings.sub_organization})` : ''}
            </p>
          </div>

          {/* Asset Budget Summary Header Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs border border-black p-3.5 bg-gray-50/70">
            <div>
              <span className="text-gray-600 block text-[11px]">จำนวนครุภัณฑ์ที่ครบอายุการใช้งาน 5 ปี:</span>
              <strong className="text-base font-mono text-black font-bold">
                {assetsNeedingReplacement.filter(a => calculateDepreciation(a).isFullyDepreciated).length} รายการ
              </strong>
              <span className="text-[10px] text-gray-500 block">คงมูลค่าทางบัญชี 1 บาท</span>
            </div>

            <div>
              <span className="text-gray-600 block text-[11px]">จำนวนครุภัณฑ์ชำรุด/ซ่อมไม่คุ้มค่า (เสนอจำหน่าย):</span>
              <strong className="text-base font-mono text-black font-bold">
                {assetsNeedingReplacement.filter(a => !calculateDepreciation(a).isFullyDepreciated).length} รายการ
              </strong>
              <span className="text-[10px] text-gray-500 block">ตามระเบียบพัสดุฯ หมวด 9</span>
            </div>

            <div className="bg-white p-2.5 border border-black">
              <span className="text-gray-600 block text-[11px] font-bold">รวมวงเงินงบประมาณจัดซื้อทดแทน:</span>
              <strong className="text-xl font-mono text-black font-extrabold text-sky-950">
                {(Number(estimatedAssetReplacementBudget) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
              </strong>
              <span className="text-[10px] text-gray-600 block">คำของบประมาณ พ.ศ. {targetFiscalYear}</span>
            </div>
          </div>

          {/* Asset Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-black">
                บัญชีรายละเอียดครุภัณฑ์คอมพิวเตอร์ที่ขออนุมัติตั้งงบประมาณจัดซื้อทดแทน
              </h3>
              <span className="text-[10px] text-gray-600">
                เกณฑ์อายุใช้งาน 5 ปี / วงเงินอ้างอิงเกณฑ์ราคากลางกระทรวงดิจิทัลฯ
              </span>
            </div>

            {assetsNeedingReplacement.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] border-collapse border border-black text-left">
                  <thead className="bg-gray-100 font-bold border-b border-black">
                    <tr>
                      <th className="border border-black px-2 py-1.5 text-center w-10">ลำดับ</th>
                      <th className="border border-black px-2 py-1.5 font-mono">รหัสครุภัณฑ์</th>
                      <th className="border border-black px-2 py-1.5 font-mono">รหัส GFMIS</th>
                      <th className="border border-black px-2 py-1.5">รายการครุภัณฑ์</th>
                      <th className="border border-black px-2 py-1.5">หน่วยงานที่ครอบครอง</th>
                      <th className="border border-black px-2 py-1.5 text-center">วันที่ได้มา</th>
                      <th className="border border-black px-2 py-1.5 text-center">อายุ (ปี)</th>
                      <th className="border border-black px-2 py-1.5 text-right">ราคาทุนเดิม (บาท)</th>
                      <th className="border border-black px-2 py-1.5">เหตุผลความจำเป็น</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black">
                    {assetsNeedingReplacement.map((a, idx) => {
                      const dep = calculateDepreciation(a);
                      return (
                        <tr key={a.id}>
                          <td className="border border-black px-2 py-1 text-center font-mono">{idx + 1}</td>
                          <td className="border border-black px-2 py-1 font-mono font-medium">{a.asset_code}</td>
                          <td className="border border-black px-2 py-1 font-mono text-[10px]">{a.gfmis_code || '-'}</td>
                          <td className="border border-black px-2 py-1">
                            <span className="font-semibold block">{a.name}</span>
                            <span className="text-gray-600 text-[10px] font-mono">{a.brand_model} (S/N: {a.serial_number})</span>
                          </td>
                          <td className="border border-black px-2 py-1">
                            <span>{a.department}</span>
                            <span className="text-[10px] text-gray-500 block">({a.current_user})</span>
                          </td>
                          <td className="border border-black px-2 py-1 text-center font-mono">{a.acquisition_date}</td>
                          <td className="border border-black px-2 py-1 text-center font-mono">{dep.ageYears}</td>
                          <td className="border border-black px-2 py-1 text-right font-mono font-bold">
                            {(Number(a?.cost) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="border border-black px-2 py-1 text-[10px]">
                            {dep.isFullyDepreciated
                              ? 'ครบกำหนดอายุใช้งาน 5 ปี สมรรถนะตกรุ่น/มูลค่าคงเหลือ 1 บาท'
                              : 'ชำรุดซ่อมบำรุงไม่คุ้มค่า เสนอจำหน่าย'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-100 font-bold border-t border-black">
                    <tr>
                      <td colSpan={7} className="border border-black px-3 py-1.5 text-right font-semibold">
                        รวมประมาณการงบประมาณจัดซื้อครุภัณฑ์คอมพิวเตอร์ทดแทนทั้งสิ้น ({assetsNeedingReplacement.length} รายการ):
                      </td>
                      <td className="border border-black px-2 py-1.5 text-right font-mono font-extrabold text-sm">
                        {(Number(estimatedAssetReplacementBudget) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="border border-black px-2 py-1.5 text-center text-xs">บาท</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic p-6 border border-dashed border-gray-400 text-center">
                ไม่พบครุภัณฑ์คอมพิวเตอร์ที่ครบอายุการใช้งาน 5 ปีหรือชำรุด ทุกรายการอยู่ในเกณฑ์พร้อมปฏิบัติงาน
              </p>
            )}
          </div>

          {/* Official Signatures Section for File 1 */}
          <div className="pt-8">
            <h4 className="text-xs font-bold text-center text-black mb-6">
              คณะกรรมการตรวจสอบพัสดุประจำปี ขอรับรองว่าได้ตรวจสอบสภาพครุภัณฑ์คอมพิวเตอร์ถูกต้องตามความเป็นจริงทุกประการ
            </h4>

            <div className="grid grid-cols-3 gap-6 text-center text-xs text-black">
              {settings.inspection_committee.map((member, idx) => (
                <div key={idx} className="space-y-1">
                  <p className="border-b border-dotted border-black pb-8 w-4/5 mx-auto"></p>
                  <p className="font-semibold">{member}</p>
                  <p className="text-[10px] text-gray-600">วันที่ ......./......./...........</p>
                </div>
              ))}
            </div>

            <div className="pt-8 text-center text-xs text-black space-y-1">
              <p className="border-b border-dotted border-black pb-8 w-1/3 mx-auto"></p>
              <p className="font-bold text-sm">({settings.approver_officer.split('(')[0].trim() || 'ผู้อำนวยการ'})</p>
              <p className="text-gray-700 font-medium">ผู้อำนวยการ / ผู้มีอำนาจสั่งการจัดหา</p>
              <p className="text-[10px] text-gray-600">อนุมัติให้บรรจุแผนจัดหาครุภัณฑ์ทดแทนในคำของบประมาณ พ.ศ. {targetFiscalYear}</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FILE 2: รายงานแผนวัสดุคอมพิวเตอร์ (SEPARATE REPORT 2 - FULL WEB PAGE)    */}
      {/* ========================================================================= */}
      {activeReportTab === 'material_report' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-8 sm:p-12 text-black space-y-6 print:border-none print:shadow-none print:p-0">
          {/* Header */}
          <div className="text-center space-y-1">
            <div className="flex justify-center mb-2">
              <GarudaEmblem
                size={54}
                type={settings.garuda_symbol_type}
                customUrl={settings.garuda_custom_url}
              />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-black">
              รายงานการตรวจสอบสต็อกและประมาณการงบประมาณจัดซื้อวัสดุคอมพิวเตอร์ประจำปี
            </h2>
            <p className="text-xs text-gray-700">
              สำหรับปีงบประมาณ พ.ศ. {targetFiscalYear} ตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560
            </p>
            <p className="text-xs font-semibold text-gray-900 pt-1">
              {settings.organization_name} {settings.sub_organization ? `(${settings.sub_organization})` : ''}
            </p>
          </div>

          {/* Consumables Budget Summary Header Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs border border-black p-3.5 bg-gray-50/70">
            <div>
              <span className="text-gray-600 block text-[11px]">จำนวนรายการวัสดุคอมพิวเตอร์ทั้งหมด:</span>
              <strong className="text-base font-mono text-black font-bold">
                {materials.length} รายการ
              </strong>
              <span className="text-[10px] text-gray-500 block">หมึกพิมพ์, อุปกรณ์เครือข่าย, อะไหล่</span>
            </div>

            <div>
              <span className="text-gray-600 block text-[11px]">รายการที่สต็อกต่ำกว่าเกณฑ์ขั้นต่ำ:</span>
              <strong className="text-base font-mono text-red-700 font-bold">
                {lowMaterials.length} รายการ
              </strong>
              <span className="text-[10px] text-red-600 block">สมควรดำเนินการจัดหาโดยเร่งด่วน</span>
            </div>

            <div className="bg-white p-2.5 border border-black">
              <span className="text-gray-600 block text-[11px] font-bold">รวมประมาณการงบประมาณวัสดุ 1 ปี:</span>
              <strong className="text-xl font-mono text-black font-extrabold text-emerald-950">
                {(Number(annualConsumableBudget) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
              </strong>
              <span className="text-[10px] text-gray-600 block">คำของบประมาณ พ.ศ. {targetFiscalYear}</span>
            </div>
          </div>

          {/* Consumables Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-black">
                ตารางประมาณการความต้องการและงบประมาณจัดซื้อวัสดุคอมพิวเตอร์สิ้นเปลือง
              </h3>
              <span className="text-[10px] text-gray-600">
                คำนวณจากอัตราการใช้เฉลี่ยรายเดือน x 12 เดือน
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border-collapse border border-black text-left">
                <thead className="bg-gray-100 font-bold border-b border-black">
                  <tr>
                    <th className="border border-black px-2 py-1.5 text-center w-10">ลำดับ</th>
                    <th className="border border-black px-2 py-1.5 font-mono">รหัสพัสดุ</th>
                    <th className="border border-black px-2 py-1.5">ชื่อรายการวัสดุคอมพิวเตอร์</th>
                    <th className="border border-black px-2 py-1.5">หมวดหมู่</th>
                    <th className="border border-black px-2 py-1.5 text-center">คงเหลือปัจจุบัน</th>
                    <th className="border border-black px-2 py-1.5 text-center">เกณฑ์เตือน</th>
                    <th className="border border-black px-2 py-1.5 text-center">อัตราใช้/เดือน</th>
                    <th className="border border-black px-2 py-1.5 text-right">ราคา/หน่วย (บาท)</th>
                    <th className="border border-black px-2 py-1.5 text-right">งบประมาณ 12 เดือน (บาท)</th>
                    <th className="border border-black px-2 py-1.5 text-center">สถานะสต็อก</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black font-mono">
                  {materials.map((m, idx) => {
                    const isLow = m.stock_quantity <= m.min_threshold;
                    const annualCost = m.monthly_usage_avg * 12 * m.unit_price;
                    return (
                      <tr key={m.id} className={isLow ? 'bg-gray-50' : ''}>
                        <td className="border border-black px-2 py-1 text-center font-sans">{idx + 1}</td>
                        <td className="border border-black px-2 py-1">{m.code}</td>
                        <td className="border border-black px-2 py-1 font-sans">
                          <span className="font-semibold block">{m.name}</span>
                          <span className="text-[10px] text-gray-500 font-mono">จัดเก็บ: {m.location}</span>
                        </td>
                        <td className="border border-black px-2 py-1 font-sans text-[10px]">{m.category}</td>
                        <td className="border border-black px-2 py-1 text-center font-bold">
                          {m.stock_quantity} <span className="font-normal font-sans text-[10px]">{m.unit}</span>
                        </td>
                        <td className="border border-black px-2 py-1 text-center text-gray-600">
                          {m.min_threshold} <span className="font-sans text-[10px]">{m.unit}</span>
                        </td>
                        <td className="border border-black px-2 py-1 text-center text-gray-700">
                          {m.monthly_usage_avg} <span className="font-sans text-[10px]">{m.unit}</span>
                        </td>
                        <td className="border border-black px-2 py-1 text-right">
                          {(Number(m?.unit_price) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="border border-black px-2 py-1 text-right font-bold">
                          {(Number(annualCost) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="border border-black px-2 py-1 text-center font-sans text-[10px]">
                          {isLow ? (
                            <span className="font-bold text-red-700">ใกล้หมดสต็อก</span>
                          ) : (
                            <span className="text-gray-700">ปกติ</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-100 font-bold border-t border-black">
                  <tr>
                    <td colSpan={8} className="border border-black px-3 py-1.5 text-right font-semibold">
                      รวมประมาณการงบประมาณจัดซื้อวัสดุคอมพิวเตอร์ประจำปี ({materials.length} รายการ):
                    </td>
                    <td className="border border-black px-2 py-1.5 text-right font-mono font-extrabold text-sm">
                      {(Number(annualConsumableBudget) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="border border-black px-2 py-1.5 text-center text-xs">บาท</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Official Signatures Section for File 2 */}
          <div className="pt-8">
            <h4 className="text-xs font-bold text-center text-black mb-6">
              คณะกรรมการตรวจสอบพัสดุประจำปี ขอรับรองว่าได้ตรวจสอบยอดคงคลังและอัตราสิ้นเปลืองวัสดุคอมพิวเตอร์ถูกต้องตามความเป็นจริง
            </h4>

            <div className="grid grid-cols-3 gap-6 text-center text-xs text-black">
              {settings.inspection_committee.map((member, idx) => (
                <div key={idx} className="space-y-1">
                  <p className="border-b border-dotted border-black pb-8 w-4/5 mx-auto"></p>
                  <p className="font-semibold">{member}</p>
                  <p className="text-[10px] text-gray-600">วันที่ ......./......./...........</p>
                </div>
              ))}
            </div>

            <div className="pt-8 text-center text-xs text-black space-y-1">
              <p className="border-b border-dotted border-black pb-8 w-1/3 mx-auto"></p>
              <p className="font-bold text-sm">({settings.approver_officer.split('(')[0].trim() || 'ผู้อำนวยการ'})</p>
              <p className="text-gray-700 font-medium">ผู้อำนวยการ / ผู้มีอำนาจสั่งการจัดหา</p>
              <p className="text-[10px] text-gray-600">อนุมัติให้บรรจุแผนจัดหาวัสดุคอมพิวเตอร์ในคำของบประมาณ พ.ศ. {targetFiscalYear}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
