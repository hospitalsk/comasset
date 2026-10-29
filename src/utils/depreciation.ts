import { Asset, DepreciationCalculation } from '../types/asset';

/**
 * คำนวณค่าเสื่อมราคาตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560
 * และมาตรฐานการบัญชีภาครัฐ: วิธีเส้นตรง (Straight-Line Method)
 * ค่าเสื่อมราคาประจำปี = (ราคาทุน - ค่าซาก) / อายุการใช้งาน (ปี)
 * สำหรับครุภัณฑ์คอมพิวเตอร์ ปกติกำหนดอายุการใช้งาน 3 - 5 ปี (อัตราค่าเสื่อม 20% - 33.33% ต่อปี)
 * ค่าซากมักกำหนดไว้ 1 บาท
 */
export function calculateDepreciation(
  asset: Pick<Asset, 'cost' | 'salvage_value' | 'lifespan_years' | 'acquisition_date'>,
  asOfDate: Date = new Date()
): DepreciationCalculation {
  const cost = Number(asset.cost) || 0;
  const salvageValue = asset.salvage_value !== undefined ? Number(asset.salvage_value) : 1;
  const lifespanYears = Number(asset.lifespan_years) || 5;

  const acqDate = asset.acquisition_date ? new Date(asset.acquisition_date) : new Date();
  
  // คำนวณอายุการใช้งานเป็นปี (ทศนิยม 2 ตำแหน่ง)
  const diffTime = Math.max(0, asOfDate.getTime() - acqDate.getTime());
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  const ageYears = Math.min(lifespanYears, diffDays / 365.25);
  const realAgeYears = diffDays / 365.25;

  const depreciableAmount = Math.max(0, cost - salvageValue);
  const annualDepreciation = lifespanYears > 0 ? depreciableAmount / lifespanYears : 0;
  
  // ค่าเสื่อมราคาสะสม ไม่เกินราคาทุน - ค่าซาก
  const accumulatedDepreciation = Math.min(
    depreciableAmount,
    annualDepreciation * ageYears
  );

  // มูลค่าสุทธิทางบัญชี (Net Book Value: NBV)
  const netBookValue = Math.max(salvageValue, cost - accumulatedDepreciation);
  const isFullyDepreciated = realAgeYears >= lifespanYears;
  const needsReplacement = realAgeYears >= lifespanYears;

  let recommendation = 'สภาพการใช้งานปกติ ยังมีมูลค่าคงเหลือทางบัญชี';
  if (isFullyDepreciated) {
    recommendation = `ครบกำหนดอายุการใช้งาน ${lifespanYears} ปีแล้ว (คงมูลค่าซาก ${(Number(salvageValue) || 1).toLocaleString()} บาท) เสนอตั้งงบประมาณจัดหาทดแทน`;
  } else if (lifespanYears - realAgeYears <= 1) {
    recommendation = `เหลืออายุการใช้งานอีกประมาณ ${(lifespanYears - realAgeYears).toFixed(1)} ปี เตรียมบรรจุเข้าแผนคำของบประมาณปีถัดไป`;
  }

  return {
    cost,
    salvageValue,
    depreciableAmount,
    lifespanYears,
    annualDepreciation,
    ageYears: Number(realAgeYears.toFixed(2)),
    accumulatedDepreciation: Number(accumulatedDepreciation.toFixed(2)),
    netBookValue: Number(netBookValue.toFixed(2)),
    isFullyDepreciated,
    needsReplacement,
    recommendation
  };
}

/**
 * สร้างตารางค่าเสื่อมราคารายปี (Depreciation Schedule Table) สำหรับแบบฟอร์มทะเบียนคุมทรัพย์สิน (พด. 4)
 */
export interface ScheduleYear {
  yearNo: number;
  fiscalYear: number;
  beginningBookValue: number;
  annualExpense: number;
  accumulatedExpense: number;
  endingBookValue: number;
}

export function generateDepreciationSchedule(asset: Asset): ScheduleYear[] {
  const cost = Number(asset.cost) || 0;
  const salvage = Number(asset.salvage_value ?? 1);
  const years = Math.max(1, Number(asset.lifespan_years) || 5);
  const depreciable = Math.max(0, cost - salvage);
  const annual = depreciable / years;

  const acqDate = asset.acquisition_date ? new Date(asset.acquisition_date) : new Date();
  const startFiscalYear = acqDate.getFullYear() + 543; // ปี พ.ศ.

  const schedule: ScheduleYear[] = [];
  let currentAccumulated = 0;

  for (let i = 1; i <= years; i++) {
    const beginBV = cost - currentAccumulated;
    const thisYearExpense = i === years ? depreciable - currentAccumulated : annual;
    currentAccumulated += thisYearExpense;
    const endBV = Math.max(salvage, cost - currentAccumulated);

    schedule.push({
      yearNo: i,
      fiscalYear: startFiscalYear + (i - 1),
      beginningBookValue: Math.round(beginBV * 100) / 100,
      annualExpense: Math.round(thisYearExpense * 100) / 100,
      accumulatedExpense: Math.round(currentAccumulated * 100) / 100,
      endingBookValue: Math.round(endBV * 100) / 100
    });
  }

  return schedule;
}
