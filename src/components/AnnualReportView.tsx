import React, { useState, useMemo } from 'react';
import { Asset, ConsumableMaterial, AppSettings, RepairLog, MaterialRequisitionLog } from '../types/asset';
import { calculateDepreciation } from '../utils/depreciation';
import { GarudaEmblem } from './GarudaEmblem';
import {
  Printer,
  Download,
  Calendar,
  FileText,
  CheckCircle2,
  Filter,
  Layers,
  FileSpreadsheet,
  FileDown,
  Building2,
  Sparkles,
  TrendingUp,
  Clock,
  Eye
} from 'lucide-react';

interface AnnualReportViewProps {
  assets: Asset[];
  materials: ConsumableMaterial[];
  repairs: RepairLog[];
  requisitions?: MaterialRequisitionLog[];
  settings: AppSettings;
  onNavigateToDashboard: () => void;
}

const THAI_MONTHS = [
  { value: 1, name: 'มกราคม' },
  { value: 2, name: 'กุมภาพันธ์' },
  { value: 3, name: 'มีนาคม' },
  { value: 4, name: 'เมษายน' },
  { value: 5, name: 'พฤษภาคม' },
  { value: 6, name: 'มิถุนายน' },
  { value: 7, name: 'กรกฎาคม' },
  { value: 8, name: 'สิงหาคม' },
  { value: 9, name: 'กันยายน' },
  { value: 10, name: 'ตุลาคม' },
  { value: 11, name: 'พฤศจิกายน' },
  { value: 12, name: 'ธันวาคม' }
];

export const AnnualReportView: React.FC<AnnualReportViewProps> = ({
  assets,
  materials,
  repairs,
  requisitions = [],
  settings,
  onNavigateToDashboard
}) => {
  // Period Mode: Annual or Monthly
  const [periodType, setPeriodType] = useState<'annual' | 'monthly'>('annual');
  const [targetFiscalYear, setTargetFiscalYear] = useState<number>(settings.fiscal_year);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedCalendarYear, setSelectedCalendarYear] = useState<number>(new Date().getFullYear());

  // Report File Switcher (Separated files requirement)
  const [activeReportTab, setActiveReportTab] = useState<'asset_report' | 'material_report'>('asset_report');
  const [a4PreviewMode, setA4PreviewMode] = useState<boolean>(false);

  // 1. Annual Assets Needing Replacement (Useful life >= 5 years or repair cost > 50% or disposed)
  const assetsNeedingReplacement = useMemo(() => {
    return assets.filter(asset => {
      const dep = calculateDepreciation(asset);
      const assetRepairs = repairs.filter(r => r.asset_id === asset.id);
      const totalRepairCost = assetRepairs.reduce((sum, r) => sum + (Number(r.repair_cost) || 0), 0);
      const repairExceedsHalf = totalRepairCost > (Number(asset.cost) || 0) * 0.5;

      return dep.isFullyDepreciated || repairExceedsHalf || asset.status === 'disposed';
    });
  }, [assets, repairs]);

  const estimatedAssetReplacementBudget = useMemo(() => {
    return assetsNeedingReplacement.reduce((sum, a) => sum + (Number(a.cost) || 0), 0);
  }, [assetsNeedingReplacement]);

  // 2. Annual Consumables Projection
  const lowMaterials = useMemo(() => {
    return materials.filter(m => (Number(m.stock_quantity) || 0) <= (Number(m.min_threshold) || 0));
  }, [materials]);

  const annualConsumableBudget = useMemo(() => {
    return materials.reduce((sum, m) => {
      const annualNeeded = (Number(m.monthly_usage_avg) || 0) * 12;
      return sum + (annualNeeded * (Number(m.unit_price) || 0));
    }, 0);
  }, [materials]);

  // 3. Monthly Filtered Data
  const monthlyAssetsAcquired = useMemo(() => {
    return assets.filter(a => {
      if (!a.acquisition_date) return false;
      const d = new Date(a.acquisition_date);
      return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedCalendarYear;
    });
  }, [assets, selectedMonth, selectedCalendarYear]);

  const monthlyRepairs = useMemo(() => {
    return repairs.filter(r => {
      if (!r.report_date) return false;
      const d = new Date(r.report_date);
      return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedCalendarYear;
    });
  }, [repairs, selectedMonth, selectedCalendarYear]);

  const monthlyRepairTotalCost = useMemo(() => {
    return monthlyRepairs.reduce((sum, r) => sum + (Number(r.repair_cost) || 0), 0);
  }, [monthlyRepairs]);

  const monthlyRequisitions = useMemo(() => {
    return requisitions.filter(req => {
      if (!req.requisition_date) return false;
      const d = new Date(req.requisition_date);
      return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedCalendarYear;
    });
  }, [requisitions, selectedMonth, selectedCalendarYear]);

  const monthlyRequisitionCost = useMemo(() => {
    return monthlyRequisitions.reduce((sum, req) => {
      const mat = materials.find(m => m.id === req.material_id);
      const unitPrice = mat ? Number(mat.unit_price) || 0 : 0;
      return sum + ((Number(req.quantity) || 0) * unitPrice);
    }, 0);
  }, [monthlyRequisitions, materials]);

  const selectedMonthName = THAI_MONTHS.find(m => m.value === selectedMonth)?.name || '';
  const thaiBuddhistYear = selectedCalendarYear + 543;

  // Print A4 Handler
  const handlePrint = () => {
    window.print();
  };

  // Export File 1: Excel HTML-formatted for Asset Report (A4 Landscape Ready)
  const handleExportAssetExcel = () => {
    const isMonthly = periodType === 'monthly';
    const periodTitle = isMonthly
      ? `ประจำเดือน ${selectedMonthName} พ.ศ. ${thaiBuddhistYear}`
      : `ประจำปีงบประมาณ พ.ศ. ${targetFiscalYear}`;

    const dataItems = isMonthly
      ? monthlyAssetsAcquired
      : assetsNeedingReplacement;

    const tableRows = dataItems.map((a, idx) => {
      const dep = calculateDepreciation(a);
      const reason = isMonthly
        ? 'ตรวจรับเข้าพัสดุในงวดเดือนนี้'
        : (dep.isFullyDepreciated ? 'ครบกำหนดอายุใช้งาน 5 ปี (มูลค่าสุทธิ 1 บาท)' : 'ซ่อมบำรุงไม่คุ้มค่า เสนอจัดซื้อใหม่');

      return `
        <tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td style="mso-number-format:'\\@';">${a.asset_code}</td>
          <td style="mso-number-format:'\\@';">${a.gfmis_code || '-'}</td>
          <td>${a.name}</td>
          <td>${a.brand_model}</td>
          <td>${a.department}</td>
          <td style="text-align:center;">${a.acquisition_date}</td>
          <td style="text-align:center;">${dep.ageYears}</td>
          <td style="text-align:right;">${(Number(a.cost) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
          <td>${reason}</td>
        </tr>
      `;
    }).join('');

    const totalCost = isMonthly
      ? monthlyAssetsAcquired.reduce((s, a) => s + (Number(a.cost) || 0), 0)
      : estimatedAssetReplacementBudget;

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>แผนครุภัณฑ์คอมพิวเตอร์</x:Name>
                <x:WorksheetOptions>
                  <x:Print>
                    <x:ValidPrinterInfo/>
                    <x:PaperSizeIndex>9</x:PaperSizeIndex> <!-- A4 Paper -->
                    <x:HorizontalResolution>600</x:HorizontalResolution>
                    <x:VerticalResolution>600</x:VerticalResolution>
                  </x:Print>
                  <x:PageSetup>
                    <x:Layout x:Orientation="Landscape"/>
                  </x:PageSetup>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Sarabun', 'TH Sarabun New', sans-serif; }
          table { border-collapse: collapse; width: 100%; font-size: 11pt; }
          th { background-color: #e2e8f0; border: 1px solid #64748b; padding: 6px; font-weight: bold; }
          td { border: 1px solid #cbd5e1; padding: 6px; }
          .header-title { font-size: 14pt; font-weight: bold; text-align: center; }
          .header-sub { font-size: 11pt; text-align: center; }
          .total-row { background-color: #f1f5f9; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header-title">รายงานการตรวจสอบและแผนจัดหาครุภัณฑ์คอมพิวเตอร์ (${periodTitle})</div>
        <div class="header-sub">${settings.organization_name} ${settings.sub_organization ? ' - ' + settings.sub_organization : ''}</div>
        <div class="header-sub">ตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560</div>
        <br/>
        <table>
          <thead>
            <tr>
              <th>ลำดับ</th>
              <th>รหัสครุภัณฑ์</th>
              <th>รหัส GFMIS</th>
              <th>รายการครุภัณฑ์คอมพิวเตอร์</th>
              <th>ยี่ห้อ / รุ่น</th>
              <th>หน่วยงานผู้ครอบครอง</th>
              <th>วันที่ได้มา</th>
              <th>อายุใช้งาน(ปี)</th>
              <th>ราคาทุน(บาท)</th>
              <th>เหตุผลความจำเป็น / สถานะ</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
            <tr class="total-row">
              <td colspan="8" style="text-align:right;">รวมวงเงินงบประมาณทั้งสิ้น (${dataItems.length} รายการ):</td>
              <td style="text-align:right;">${totalCost.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
              <td>บาท</td>
            </tr>
          </tbody>
        </table>
        <br/><br/>
        <table style="border:none;">
          <tr style="border:none;">
            <td style="border:none; text-align:center; width:33%;">
              ลงชื่อ...................................................<br/>
              (${settings.procurement_officer})<br/>
              เจ้าหน้าที่พัสดุ ผู้จัดทำรายงาน
            </td>
            <td style="border:none; text-align:center; width:33%;">
              ลงชื่อ...................................................<br/>
              (${settings.chief_procurement_officer})<br/>
              หัวหน้าเจ้าหน้าที่พัสดุ ผู้ตรวจสอบ
            </td>
            <td style="border:none; text-align:center; width:33%;">
              ลงชื่อ...................................................<br/>
              (${settings.approver_officer})<br/>
              ผู้อำนวยการ / หัวหน้าหน่วยงานของรัฐ ผู้อนุมัติ
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `รายงานแผนครุภัณฑ์คอมพิวเตอร์_${isMonthly ? 'รายเดือน_' + selectedMonth : 'รายปี_' + targetFiscalYear}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export File 2: Excel HTML-formatted for Material Report (A4 Landscape Ready)
  const handleExportMaterialExcel = () => {
    const isMonthly = periodType === 'monthly';
    const periodTitle = isMonthly
      ? `ประจำเดือน ${selectedMonthName} พ.ศ. ${thaiBuddhistYear}`
      : `ประมาณการงบประมาณประจำปี พ.ศ. ${targetFiscalYear}`;

    let tableRows = '';
    let totalEstimated = 0;

    if (isMonthly) {
      // Monthly Requisitions List
      tableRows = monthlyRequisitions.map((req, idx) => {
        const mat = materials.find(m => m.id === req.material_id);
        const price = mat ? Number(mat.unit_price) || 0 : 0;
        const totalLine = (Number(req.quantity) || 0) * price;
        totalEstimated += totalLine;

        return `
          <tr>
            <td style="text-align:center;">${idx + 1}</td>
            <td style="text-align:center;">${req.requisition_date}</td>
            <td style="mso-number-format:'\\@';">${req.material_code}</td>
            <td>${req.material_name}</td>
            <td style="text-align:right;">${req.quantity} ${req.unit}</td>
            <td>${req.recipient_name}</td>
            <td>${req.department}</td>
            <td>${req.location}</td>
            <td>${req.purpose}</td>
            <td style="text-align:right;">${totalLine.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
          </tr>
        `;
      }).join('');
    } else {
      // Annual Projection List
      tableRows = materials.map((m, idx) => {
        const annualNeeded = (Number(m.monthly_usage_avg) || 0) * 12;
        const annualCost = annualNeeded * (Number(m.unit_price) || 0);
        totalEstimated += annualCost;
        const isLow = (Number(m.stock_quantity) || 0) <= (Number(m.min_threshold) || 0);

        return `
          <tr>
            <td style="text-align:center;">${idx + 1}</td>
            <td style="mso-number-format:'\\@';">${m.code}</td>
            <td>${m.name}</td>
            <td>${m.category}</td>
            <td style="text-align:center;">${m.unit}</td>
            <td style="text-align:right;">${m.stock_quantity}</td>
            <td style="text-align:right;">${m.min_threshold}</td>
            <td style="text-align:right;">${m.monthly_usage_avg}</td>
            <td style="text-align:right;">${(Number(m.unit_price) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
            <td style="text-align:right;">${annualCost.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
            <td>${isLow ? 'ใกล้หมดสต็อก เร่งด่วน' : 'ปกติ ตามรอบปี'}</td>
          </tr>
        `;
      }).join('');
    }

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>รายงานวัสดุคอมพิวเตอร์</x:Name>
                <x:WorksheetOptions>
                  <x:Print>
                    <x:ValidPrinterInfo/>
                    <x:PaperSizeIndex>9</x:PaperSizeIndex>
                  </x:Print>
                  <x:PageSetup>
                    <x:Layout x:Orientation="Landscape"/>
                  </x:PageSetup>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Sarabun', 'TH Sarabun New', sans-serif; }
          table { border-collapse: collapse; width: 100%; font-size: 11pt; }
          th { background-color: #e2e8f0; border: 1px solid #64748b; padding: 6px; font-weight: bold; }
          td { border: 1px solid #cbd5e1; padding: 6px; }
          .header-title { font-size: 14pt; font-weight: bold; text-align: center; }
          .header-sub { font-size: 11pt; text-align: center; }
          .total-row { background-color: #f1f5f9; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header-title">${isMonthly ? 'รายงานสรุปการเบิกจ่ายวัสดุคอมพิวเตอร์' : 'รายงานประมาณการงบประมาณจัดซื้อวัสดุคอมพิวเตอร์'} (${periodTitle})</div>
        <div class="header-sub">${settings.organization_name} ${settings.sub_organization ? ' - ' + settings.sub_organization : ''}</div>
        <div class="header-sub">ตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560</div>
        <br/>
        <table>
          <thead>
            ${
              isMonthly
                ? `
                <tr>
                  <th>ลำดับ</th>
                  <th>วันที่เบิก</th>
                  <th>รหัสวัสดุ</th>
                  <th>รายการวัสดุ</th>
                  <th>จำนวนเบิก</th>
                  <th>ผู้ขอเบิก (ใคร)</th>
                  <th>หน่วยงาน</th>
                  <th>สถานที่นำไปใช้ (ที่ไหน)</th>
                  <th>วัตถุประสงค์ (อย่างไร)</th>
                  <th>มูลค่ารวม (บาท)</th>
                </tr>
              `
                : `
                <tr>
                  <th>ลำดับ</th>
                  <th>รหัสวัสดุ</th>
                  <th>ชื่อรายการวัสดุคอมพิวเตอร์</th>
                  <th>หมวดหมู่</th>
                  <th>หน่วยนับ</th>
                  <th>คงเหลือสต็อก</th>
                  <th>เกณฑ์เตือน</th>
                  <th>ใช้เฉลี่ย/เดือน</th>
                  <th>ราคาต่อหน่วย(บาท)</th>
                  <th>ประมาณการ 12 เดือน(บาท)</th>
                  <th>สถานะความต้องการ</th>
                </tr>
              `
            }
          </thead>
          <tbody>
            ${tableRows}
            <tr class="total-row">
              <td colspan="${isMonthly ? 9 : 9}" style="text-align:right;">รวมมูลค่างบประมาณทั้งสิ้น:</td>
              <td style="text-align:right;">${totalEstimated.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
              ${!isMonthly ? '<td>บาท</td>' : ''}
            </tr>
          </tbody>
        </table>
        <br/><br/>
        <table style="border:none;">
          <tr style="border:none;">
            <td style="border:none; text-align:center; width:33%;">
              ลงชื่อ...................................................<br/>
              (${settings.procurement_officer})<br/>
              เจ้าหน้าที่พัสดุ ผู้จัดทำรายงาน
            </td>
            <td style="border:none; text-align:center; width:33%;">
              ลงชื่อ...................................................<br/>
              (${settings.chief_procurement_officer})<br/>
              หัวหน้าเจ้าหน้าที่พัสดุ ผู้ตรวจสอบ
            </td>
            <td style="border:none; text-align:center; width:33%;">
              ลงชื่อ...................................................<br/>
              (${settings.approver_officer})<br/>
              ผู้อำนวยการ / หัวหน้าหน่วยงานของรัฐ ผู้อนุมัติ
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `รายงานแผนวัสดุคอมพิวเตอร์_${isMonthly ? 'รายเดือน_' + selectedMonth : 'รายปี_' + targetFiscalYear}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Print Style Injector for strict A4 Layout */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm 12mm 12mm 12mm;
          }
          body {
            font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .a4-print-sheet {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
        }
      `}</style>

      {/* Control Panel & Mode Switcher (Web View) */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-gradient-to-br from-sky-500 to-indigo-600 text-white rounded-xl shadow-xs">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-900 leading-tight">
                  ระบบรายงานแผนพัสดุ & ประมาณการงบประมาณ (แยก 2 ไฟล์อิสระ)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  ตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* A4 Preview Mode Toggle */}
            <button
              onClick={() => setA4PreviewMode(!a4PreviewMode)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                a4PreviewMode
                  ? 'bg-sky-50 border-sky-300 text-sky-800'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
              title="สลับโหมดดูตัวอย่างแผ่น A4"
            >
              <Eye className="w-4 h-4 text-sky-600" />
              <span>{a4PreviewMode ? 'ปิดตัวอย่าง A4' : 'ดูตัวอย่างหน้า A4'}</span>
            </button>

            {/* Print A4 Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์ขนาด A4 / เซฟเป็น PDF</span>
            </button>

            {/* Excel Export Button */}
            <button
              onClick={activeReportTab === 'asset_report' ? handleExportAssetExcel : handleExportMaterialExcel}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>ส่งออก Excel (.xls แบบ A4)</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          {/* Period Type: Annual vs Monthly */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
              ช่วงเวลารายงาน:
            </label>
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setPeriodType('annual')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                  periodType === 'annual'
                    ? 'bg-white text-sky-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                รายงานประจำปี
              </button>
              <button
                onClick={() => setPeriodType('monthly')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                  periodType === 'monthly'
                    ? 'bg-white text-sky-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                รายงานประจำเดือน
              </button>
            </div>
          </div>

          {/* Conditional Controls based on Annual vs Monthly */}
          {periodType === 'annual' ? (
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                ปีงบประมาณเสนอตั้งคำขอ:
              </label>
              <select
                value={targetFiscalYear}
                onChange={e => setTargetFiscalYear(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              >
                <option value={settings.fiscal_year}>ปีงบประมาณปัจจุบัน (พ.ศ. {settings.fiscal_year})</option>
                <option value={settings.fiscal_year + 1}>ปีงบประมาณถัดไป (พ.ศ. {settings.fiscal_year + 1})</option>
                <option value={settings.fiscal_year + 2}>ปีงบประมาณล่วงหน้า (พ.ศ. {settings.fiscal_year + 2})</option>
              </select>
            </div>
          ) : (
            <>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  เลือกเดือน:
                </label>
                <select
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  {THAI_MONTHS.map(m => (
                    <option key={m.value} value={m.value}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  เลือกปี พ.ศ.:
                </label>
                <select
                  value={selectedCalendarYear}
                  onChange={e => setSelectedCalendarYear(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  <option value={2026}>พ.ศ. 2569 (2026)</option>
                  <option value={2025}>พ.ศ. 2568 (2025)</option>
                  <option value={2024}>พ.ศ. 2567 (2024)</option>
                </select>
              </div>
            </>
          )}

          {/* Quick Stats Highlights */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs flex flex-col justify-center">
            <span className="text-slate-500 text-[10px]">
              {periodType === 'annual' ? 'งบประมาณรวมทั้งสิ้น (1 ปี):' : `สรุปงวดเดือน ${selectedMonthName}:`}
            </span>
            <span className="font-bold text-slate-900 text-sm font-mono mt-0.5">
              {activeReportTab === 'asset_report'
                ? (periodType === 'annual'
                    ? `${estimatedAssetReplacementBudget.toLocaleString()} บาท`
                    : `${monthlyAssetsAcquired.reduce((s, a) => s + (Number(a.cost) || 0), 0).toLocaleString()} บาท`)
                : (periodType === 'annual'
                    ? `${annualConsumableBudget.toLocaleString()} บาท`
                    : `${monthlyRequisitionCost.toLocaleString()} บาท`)}
            </span>
          </div>
        </div>

        {/* Separated Report File Switcher Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
          <button
            onClick={() => setActiveReportTab('asset_report')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeReportTab === 'asset_report'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>1. รายงานครุภัณฑ์คอมพิวเตอร์ (ไฟล์แยกเฉพาะครุภัณฑ์)</span>
            <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">
              {periodType === 'annual' ? assetsNeedingReplacement.length : monthlyAssetsAcquired.length} รายการ
            </span>
          </button>

          <button
            onClick={() => setActiveReportTab('material_report')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeReportTab === 'material_report'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>2. รายงานวัสดุคอมพิวเตอร์ (ไฟล์แยกเฉพาะวัสดุ)</span>
            <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">
              {periodType === 'annual' ? materials.length : monthlyRequisitions.length} รายการ
            </span>
          </button>
        </div>
      </div>

      {/* A4 PRINT & PREVIEW SHEET CONTAINER */}
      <div
        className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-12 transition-all ${
          a4PreviewMode
            ? 'max-w-[297mm] mx-auto border-2 border-sky-400 shadow-xl'
            : 'w-full'
        } a4-print-sheet`}
      >
        {/* Official Header */}
        <div className="flex flex-col items-center text-center space-y-2 pb-6 border-b border-slate-300">
          <div className="mb-1">
            <GarudaEmblem
              size={56}
              type={settings.garuda_symbol_type}
              customUrl={settings.garuda_custom_url}
            />
          </div>

          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
            {activeReportTab === 'asset_report'
              ? `รายงานการตรวจสอบและแผนจัดหาครุภัณฑ์คอมพิวเตอร์ทดแทน`
              : (periodType === 'monthly' ? `รายงานสรุปการเบิกจ่ายวัสดุคอมพิวเตอร์สิ้นเปลือง` : `รายงานการใช้วัสดุคอมพิวเตอร์และประมาณการงบประมาณรายปี`)}
          </h1>

          <div className="text-xs text-slate-700 font-medium">
            {periodType === 'annual' ? (
              <span>สำหรับเสนอตั้งคำของบประมาณรายจ่าย ประจำปีงบประมาณ พ.ศ. {targetFiscalYear}</span>
            ) : (
              <span>ประจำเดือน {selectedMonthName} พ.ศ. {thaiBuddhistYear}</span>
            )}
          </div>

          <div className="text-xs text-slate-600">
            <strong>ส่วนราชการ / หน่วยงาน:</strong> {settings.organization_name}
            {settings.sub_organization && <span> &nbsp;|&nbsp; <strong>สำนัก/กอง:</strong> {settings.sub_organization}</span>}
          </div>

          <div className="text-[11px] text-slate-500">
            ตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560 (ข้อ 215 และหมวด 9 การจำหน่ายพัสดุ)
          </div>
        </div>

        {/* REPORT CONTENT 1: ASSET REPORT */}
        {activeReportTab === 'asset_report' && (
          <div className="mt-6 space-y-6">
            <div className="text-xs text-slate-800 font-semibold flex items-center justify-between">
              <span>
                {periodType === 'annual'
                  ? `บัญชีรายการครุภัณฑ์คอมพิวเตอร์ที่ครบอายุการใช้งาน / ซ่อมบำรุงไม่คุ้มค่า เสนอขอจัดซื้อทดแทน (รวม ${assetsNeedingReplacement.length} รายการ)`
                  : `รายการครุภัณฑ์คอมพิวเตอร์ที่มีการตรวจรับเข้า / ดำเนินการในงวดเดือน ${selectedMonthName} (รวม ${monthlyAssetsAcquired.length} รายการ)`}
              </span>
              <span className="text-slate-500 text-[11px]">หน่วยเงิน: บาท</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-left border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-semibold">
                    <th className="border border-slate-300 px-2 py-2 text-center w-10">ลำดับ</th>
                    <th className="border border-slate-300 px-2.5 py-2">รหัสครุภัณฑ์</th>
                    <th className="border border-slate-300 px-2 py-2">รหัส GFMIS</th>
                    <th className="border border-slate-300 px-3 py-2">รายการครุภัณฑ์คอมพิวเตอร์</th>
                    <th className="border border-slate-300 px-2.5 py-2">ยี่ห้อ / รุ่น</th>
                    <th className="border border-slate-300 px-2.5 py-2">หน่วยงานผู้ครอบครอง</th>
                    <th className="border border-slate-300 px-2 py-2 text-center">วันที่ได้มา</th>
                    <th className="border border-slate-300 px-2 py-2 text-center">อายุใช้งาน</th>
                    <th className="border border-slate-300 px-2.5 py-2 text-right">ราคาทุนเดิม</th>
                    <th className="border border-slate-300 px-3 py-2">เหตุผลความจำเป็น / สภาพพัสดุ</th>
                  </tr>
                </thead>
                <tbody>
                  {(periodType === 'annual' ? assetsNeedingReplacement : monthlyAssetsAcquired).length > 0 ? (
                    (periodType === 'annual' ? assetsNeedingReplacement : monthlyAssetsAcquired).map((asset, idx) => {
                      const dep = calculateDepreciation(asset);
                      const isFully = dep.isFullyDepreciated;

                      return (
                        <tr key={asset.id} className="hover:bg-slate-50/80">
                          <td className="border border-slate-300 px-2 py-2 text-center">{idx + 1}</td>
                          <td className="border border-slate-300 px-2.5 py-2 font-mono text-[10px] font-medium">{asset.asset_code}</td>
                          <td className="border border-slate-300 px-2 py-2 font-mono text-[10px] text-slate-500">{asset.gfmis_code || '-'}</td>
                          <td className="border border-slate-300 px-3 py-2 font-medium">{asset.name}</td>
                          <td className="border border-slate-300 px-2.5 py-2 text-slate-600">{asset.brand_model}</td>
                          <td className="border border-slate-300 px-2.5 py-2">{asset.department}</td>
                          <td className="border border-slate-300 px-2 py-2 text-center font-mono text-[10px]">{asset.acquisition_date}</td>
                          <td className="border border-slate-300 px-2 py-2 text-center">{dep.ageYears} ปี</td>
                          <td className="border border-slate-300 px-2.5 py-2 text-right font-mono font-medium">
                            {(Number(asset.cost) || 0).toLocaleString()}
                          </td>
                          <td className="border border-slate-300 px-3 py-2 text-[10px] text-slate-700">
                            {periodType === 'annual' ? (
                              isFully ? (
                                <span className="text-amber-800 font-medium">
                                  ครบอายุการใช้งาน 5 ปี / มูลค่าสุทธิคงเหลือ 1 บาท ควรจัดซื้อทดแทน
                                </span>
                              ) : (
                                <span className="text-rose-800 font-medium">
                                  ค่าซ่อมบำรุงสูงเกินเกณฑ์ 50% หรือชำรุด เสนอจำหน่าย
                                </span>
                              )
                            ) : (
                              <span className="text-emerald-800 font-medium">
                                ครุภัณฑ์ตรวจรับเข้าประจำงวด {selectedMonthName}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={10} className="border border-slate-300 py-6 text-center text-slate-500">
                        {periodType === 'annual'
                          ? 'ไม่มีครุภัณฑ์คอมพิวเตอร์ที่ครบอายุการใช้งานหรือต้องจัดซื้อใหม่ในปีนี้'
                          : `ไม่มีรายการครุภัณฑ์คอมพิวเตอร์ตรวจรับเข้าในเดือน ${selectedMonthName} พ.ศ. ${thaiBuddhistYear}`}
                      </td>
                    </tr>
                  )}

                  {/* Summary Row */}
                  <tr className="bg-slate-100 font-bold text-slate-900">
                    <td colSpan={8} className="border border-slate-300 px-3 py-2.5 text-right">
                      รวมวงเงินประมาณการงบประมาณจัดซื้อครุภัณฑ์ทดแทนทั้งสิ้น:
                    </td>
                    <td className="border border-slate-300 px-2.5 py-2.5 text-right font-mono text-xs text-sky-800">
                      {(periodType === 'annual'
                        ? estimatedAssetReplacementBudget
                        : monthlyAssetsAcquired.reduce((s, a) => s + (Number(a.cost) || 0), 0)
                      ).toLocaleString()}{' '}
                      บาท
                    </td>
                    <td className="border border-slate-300 px-3 py-2.5 text-[10px]">
                      (จำนวน{' '}
                      {periodType === 'annual' ? assetsNeedingReplacement.length : monthlyAssetsAcquired.length}{' '}
                      รายการ)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Monthly Repair Addendum (If in monthly view) */}
            {periodType === 'monthly' && monthlyRepairs.length > 0 && (
              <div className="mt-6 space-y-3">
                <h3 className="text-xs font-bold text-slate-800">
                  ภาคผนวก: สรุปรายการส่งซ่อมและค่าใช้จ่ายซ่อมบำรุงในเดือน {selectedMonthName} (รวม {monthlyRepairs.length} รายการ, ค่าใช้จ่ายรวม {monthlyRepairTotalCost.toLocaleString()} บาท)
                </h3>
                <table className="w-full text-[11px] text-left border-collapse border border-slate-300">
                  <thead className="bg-slate-100 text-slate-800">
                    <tr>
                      <th className="border border-slate-300 px-2 py-1.5 text-center w-10">ลำดับ</th>
                      <th className="border border-slate-300 px-2.5 py-1.5">รหัสครุภัณฑ์</th>
                      <th className="border border-slate-300 px-3 py-1.5">ชื่อครุภัณฑ์</th>
                      <th className="border border-slate-300 px-3 py-1.5">อาการชำรุด</th>
                      <th className="border border-slate-300 px-2.5 py-1.5">ผู้แจ้ง/หน่วยงาน</th>
                      <th className="border border-slate-300 px-2.5 py-1.5 text-right">ค่าซ่อม (บาท)</th>
                      <th className="border border-slate-300 px-2.5 py-1.5 text-center">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyRepairs.map((r, i) => (
                      <tr key={r.id}>
                        <td className="border border-slate-300 px-2 py-1.5 text-center">{i + 1}</td>
                        <td className="border border-slate-300 px-2.5 py-1.5 font-mono">{r.asset_code}</td>
                        <td className="border border-slate-300 px-3 py-1.5">{r.asset_name}</td>
                        <td className="border border-slate-300 px-3 py-1.5 text-slate-600">{r.issue_description}</td>
                        <td className="border border-slate-300 px-2.5 py-1.5">{r.reporter_name} ({r.reporter_department})</td>
                        <td className="border border-slate-300 px-2.5 py-1.5 text-right font-mono">{(Number(r.repair_cost) || 0).toLocaleString()}</td>
                        <td className="border border-slate-300 px-2.5 py-1.5 text-center font-medium">
                          {r.status === 'completed' ? 'ซ่อมสำเร็จ' : r.status === 'in_progress' ? 'กำลังซ่อม' : 'รอส่งซ่อม'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* REPORT CONTENT 2: MATERIAL REPORT */}
        {activeReportTab === 'material_report' && (
          <div className="mt-6 space-y-6">
            <div className="text-xs text-slate-800 font-semibold flex items-center justify-between">
              <span>
                {periodType === 'annual'
                  ? `ประมาณการความต้องการใช้วัสดุคอมพิวเตอร์และวงเงินงบประมาณรายปี (รวม ${materials.length} รายการ)`
                  : `สรุปรายการเบิกจ่ายพัสดุวัสดุคอมพิวเตอร์ในงวดเดือน ${selectedMonthName} พ.ศ. ${thaiBuddhistYear} (รวม ${monthlyRequisitions.length} รายการ)`}
              </span>
              <span className="text-slate-500 text-[11px]">หน่วยเงิน: บาท</span>
            </div>

            <div className="overflow-x-auto">
              {periodType === 'annual' ? (
                // Annual Consumables Table
                <table className="w-full text-[11px] text-left border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-semibold">
                      <th className="border border-slate-300 px-2 py-2 text-center w-10">ลำดับ</th>
                      <th className="border border-slate-300 px-2.5 py-2">รหัสพัสดุ</th>
                      <th className="border border-slate-300 px-3 py-2">รายการวัสดุคอมพิวเตอร์</th>
                      <th className="border border-slate-300 px-2.5 py-2">หมวดหมู่</th>
                      <th className="border border-slate-300 px-2 py-2 text-center">หน่วยนับ</th>
                      <th className="border border-slate-300 px-2 py-2 text-right">คงเหลือสต็อก</th>
                      <th className="border border-slate-300 px-2 py-2 text-right">เกณฑ์เตือน</th>
                      <th className="border border-slate-300 px-2 py-2 text-right">ใช้เฉลี่ย/ด.</th>
                      <th className="border border-slate-300 px-2.5 py-2 text-right">ราคาต่อหน่วย</th>
                      <th className="border border-slate-300 px-2.5 py-2 text-right">ประมาณการ 12 เดือน</th>
                      <th className="border border-slate-300 px-3 py-2">สถานะความต้องการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((m, idx) => {
                      const isLow = (Number(m.stock_quantity) || 0) <= (Number(m.min_threshold) || 0);
                      const annualQuantity = (Number(m.monthly_usage_avg) || 0) * 12;
                      const annualCost = annualQuantity * (Number(m.unit_price) || 0);

                      return (
                        <tr key={m.id} className="hover:bg-slate-50/80">
                          <td className="border border-slate-300 px-2 py-2 text-center">{idx + 1}</td>
                          <td className="border border-slate-300 px-2.5 py-2 font-mono text-[10px] font-medium">{m.code}</td>
                          <td className="border border-slate-300 px-3 py-2 font-medium">{m.name}</td>
                          <td className="border border-slate-300 px-2.5 py-2 text-slate-600">{m.category}</td>
                          <td className="border border-slate-300 px-2 py-2 text-center">{m.unit}</td>
                          <td className="border border-slate-300 px-2 py-2 text-right font-mono font-medium">
                            <span className={isLow ? 'text-amber-800 font-bold' : ''}>{m.stock_quantity}</span>
                          </td>
                          <td className="border border-slate-300 px-2 py-2 text-right font-mono text-slate-500">{m.min_threshold}</td>
                          <td className="border border-slate-300 px-2 py-2 text-right font-mono">{m.monthly_usage_avg}</td>
                          <td className="border border-slate-300 px-2.5 py-2 text-right font-mono">{(Number(m.unit_price) || 0).toLocaleString()}</td>
                          <td className="border border-slate-300 px-2.5 py-2 text-right font-mono font-bold text-slate-900">
                            {annualCost.toLocaleString()}
                          </td>
                          <td className="border border-slate-300 px-3 py-2 text-[10px]">
                            {isLow ? (
                              <span className="text-amber-800 font-bold">ใกล้หมดสต็อก จัดซื้อเร่งด่วน</span>
                            ) : (
                              <span className="text-slate-600">ปกติ จัดซื้อตามรอบปี</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Summary Row */}
                    <tr className="bg-slate-100 font-bold text-slate-900">
                      <td colSpan={9} className="border border-slate-300 px-3 py-2.5 text-right">
                        รวมวงเงินประมาณการงบประมาณจัดซื้อวัสดุคอมพิวเตอร์ประจำปีทั้งสิ้น:
                      </td>
                      <td className="border border-slate-300 px-2.5 py-2.5 text-right font-mono text-xs text-indigo-800">
                        {annualConsumableBudget.toLocaleString()} บาท
                      </td>
                      <td className="border border-slate-300 px-3 py-2.5 text-[10px]">
                        (เตือนสต็อก {lowMaterials.length} รายการ)
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                // Monthly Requisitions Log Table (Know who, where, why!)
                <table className="w-full text-[11px] text-left border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-semibold">
                      <th className="border border-slate-300 px-2 py-2 text-center w-10">ลำดับ</th>
                      <th className="border border-slate-300 px-2 py-2 text-center">วันที่เบิก</th>
                      <th className="border border-slate-300 px-2.5 py-2">รหัสพัสดุ</th>
                      <th className="border border-slate-300 px-3 py-2">รายการวัสดุคอมพิวเตอร์</th>
                      <th className="border border-slate-300 px-2 py-2 text-right">จำนวน</th>
                      <th className="border border-slate-300 px-2.5 py-2">เบิกไปให้ใคร (ผู้รับ)</th>
                      <th className="border border-slate-300 px-2.5 py-2">หน่วยงาน/สังกัด</th>
                      <th className="border border-slate-300 px-2.5 py-2">ที่ไหน (สถานที่ใช้)</th>
                      <th className="border border-slate-300 px-3 py-2">อย่างไร (วัตถุประสงค์)</th>
                      <th className="border border-slate-300 px-2.5 py-2 text-right">มูลค่ารวม</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyRequisitions.length > 0 ? (
                      monthlyRequisitions.map((req, idx) => {
                        const mat = materials.find(m => m.id === req.material_id);
                        const price = mat ? Number(mat.unit_price) || 0 : 0;
                        const lineTotal = (Number(req.quantity) || 0) * price;

                        return (
                          <tr key={req.id} className="hover:bg-slate-50/80">
                            <td className="border border-slate-300 px-2 py-2 text-center">{idx + 1}</td>
                            <td className="border border-slate-300 px-2 py-2 text-center font-mono text-[10px]">{req.requisition_date}</td>
                            <td className="border border-slate-300 px-2.5 py-2 font-mono text-[10px]">{req.material_code}</td>
                            <td className="border border-slate-300 px-3 py-2 font-medium">{req.material_name}</td>
                            <td className="border border-slate-300 px-2 py-2 text-right font-mono font-medium">{req.quantity} {req.unit}</td>
                            <td className="border border-slate-300 px-2.5 py-2 font-medium">{req.recipient_name}</td>
                            <td className="border border-slate-300 px-2.5 py-2 text-slate-600">{req.department}</td>
                            <td className="border border-slate-300 px-2.5 py-2">{req.location}</td>
                            <td className="border border-slate-300 px-3 py-2 text-slate-600">{req.purpose}</td>
                            <td className="border border-slate-300 px-2.5 py-2 text-right font-mono font-medium">
                              {lineTotal.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={10} className="border border-slate-300 py-6 text-center text-slate-500">
                          ไม่มีประวัติการเบิกจ่ายวัสดุคอมพิวเตอร์ในเดือน {selectedMonthName} พ.ศ. {thaiBuddhistYear}
                        </td>
                      </tr>
                    )}

                    {/* Monthly Total Row */}
                    <tr className="bg-slate-100 font-bold text-slate-900">
                      <td colSpan={9} className="border border-slate-300 px-3 py-2.5 text-right">
                        รวมมูลค่าการเบิกจ่ายวัสดุคอมพิวเตอร์ประจำเดือน {selectedMonthName}:
                      </td>
                      <td className="border border-slate-300 px-2.5 py-2.5 text-right font-mono text-xs text-indigo-800">
                        {monthlyRequisitionCost.toLocaleString()} บาท
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Official Signatures Section (3 Signature Blocks according to Thai Gov Regulations) */}
        <div className="mt-12 pt-8 border-t border-slate-300 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs text-slate-800">
          <div className="space-y-1">
            <div>ลงชื่อ............................................................</div>
            <div className="font-semibold">({settings.procurement_officer})</div>
            <div className="text-[11px] text-slate-500">เจ้าหน้าที่พัสดุ (ผู้จัดทำรายงาน)</div>
            <div className="text-[10px] text-slate-400 mt-1">วันที่ ........ / .................... / พ.ศ. ........</div>
          </div>

          <div className="space-y-1">
            <div>ลงชื่อ............................................................</div>
            <div className="font-semibold">({settings.chief_procurement_officer})</div>
            <div className="text-[11px] text-slate-500">หัวหน้าเจ้าหน้าที่พัสดุ (ผู้ตรวจสอบ)</div>
            <div className="text-[10px] text-slate-400 mt-1">วันที่ ........ / .................... / พ.ศ. ........</div>
          </div>

          <div className="space-y-1">
            <div>ลงชื่อ............................................................</div>
            <div className="font-semibold">({settings.approver_officer})</div>
            <div className="text-[11px] text-slate-500">หัวหน้าหน่วยงานของรัฐ / ผู้อำนวยการ (ผู้อนุมัติ)</div>
            <div className="text-[10px] text-slate-400 mt-1">วันที่ ........ / .................... / พ.ศ. ........</div>
          </div>
        </div>
      </div>
    </div>
  );
};
