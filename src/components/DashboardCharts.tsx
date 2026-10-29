import React from 'react';
import { Asset } from '../types/asset';
import { calculateDepreciation } from '../utils/depreciation';
import { PieChart, BarChart3, Building, ShieldCheck, AlertCircle } from 'lucide-react';

interface DashboardChartsProps {
  assets: Asset[];
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ assets }) => {
  // 1. Status Breakdown
  const inUse = assets.filter(a => a.status === 'in_use').length;
  const available = assets.filter(a => a.status === 'available').length;
  const repairing = assets.filter(a => a.status === 'repairing').length;
  const borrowed = assets.filter(a => a.status === 'borrowed').length;
  const total = Math.max(1, assets.length);

  const statusData = [
    { label: 'กำลังใช้งาน', count: inUse, percent: Math.round((inUse / total) * 100), color: '#0284c7', bg: 'bg-sky-600' },
    { label: 'ว่าง / พร้อมใช้งาน', count: available, percent: Math.round((available / total) * 100), color: '#16a34a', bg: 'bg-emerald-600' },
    { label: 'กำลังส่งซ่อม', count: repairing, percent: Math.round((repairing / total) * 100), color: '#d97706', bg: 'bg-amber-500' },
    { label: 'อยู่ระหว่างยืม', count: borrowed, percent: Math.round((borrowed / total) * 100), color: '#9333ea', bg: 'bg-purple-600' }
  ];

  // 2. Category Breakdown
  const categoryCounts: Record<string, number> = {};
  assets.forEach(a => {
    // Simplify category name for scannability
    const shortCat = a.category.split('(')[0].trim();
    categoryCounts[shortCat] = (categoryCounts[shortCat] || 0) + 1;
  });

  const sortedCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const maxCatCount = Math.max(1, ...sortedCategories.map(c => c[1]));

  // 3. Department Breakdown
  const deptCounts: Record<string, number> = {};
  assets.forEach(a => {
    const dept = a.department.replace('กลุ่มงาน', 'กง.').replace('และสารบรรณ', '').trim();
    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
  });

  const sortedDepts = Object.entries(deptCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const maxDeptCount = Math.max(1, ...sortedDepts.map(d => d[1]));

  // 4. Age / Useful Life Distribution (<2 yrs, 2-4 yrs, >= 5 yrs)
  let under2 = 0;
  let between2and4 = 0;
  let over5 = 0;

  assets.forEach(a => {
    const dep = calculateDepreciation(a);
    if (dep.ageYears < 2) under2++;
    else if (dep.ageYears < 5) between2and4++;
    else over5++;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Chart 1: Status Distribution */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
            <PieChart className="w-4 h-4 text-sky-600" />
            สัดส่วนสถานะครุภัณฑ์
          </span>
          <span className="text-[10px] text-slate-400 font-mono">100% รวม</span>
        </div>

        {/* Stacked Progress Bar */}
        <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden">
          {statusData.map((s, idx) => (
            <div
              key={idx}
              style={{ width: `${s.percent}%` }}
              className={`${s.bg} transition-all duration-500`}
              title={`${s.label}: ${s.count} รายการ (${s.percent}%)`}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="space-y-1.5 pt-1 text-[11px]">
          {statusData.map((s, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-sm ${s.bg}`} />
                <span className="text-slate-600">{s.label}</span>
              </div>
              <span className="font-mono text-slate-800 font-medium">
                {s.count} ({s.percent}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart 2: Category Breakdown */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-sky-600" />
            แยกตามประเภทอุปกรณ์
          </span>
          <span className="text-[10px] text-slate-400">Top 5</span>
        </div>

        <div className="space-y-2 pt-1">
          {sortedCategories.map(([cat, count], idx) => {
            const widthPct = Math.round((count / maxCatCount) * 100);
            return (
              <div key={idx} className="space-y-0.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-700 truncate max-w-[140px]">{cat}</span>
                  <span className="font-mono text-slate-900 font-semibold">{count}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${widthPct}%` }}
                    className="h-full bg-sky-500 rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart 3: Department Distribution */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
            <Building className="w-4 h-4 text-sky-600" />
            หน่วยงานที่ครอบครอง
          </span>
          <span className="text-[10px] text-slate-400">การกระจาย</span>
        </div>

        <div className="space-y-2 pt-1">
          {sortedDepts.map(([dept, count], idx) => {
            const widthPct = Math.round((count / maxDeptCount) * 100);
            return (
              <div key={idx} className="space-y-0.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-700 truncate max-w-[140px]">{dept}</span>
                  <span className="font-mono text-slate-900 font-semibold">{count}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${widthPct}%` }}
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart 4: Useful Life & Depreciation Age */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            อายุการใช้งาน & สภาพ
          </span>
          <span className="text-[10px] text-slate-400">เกณฑ์ 5 ปี</span>
        </div>

        <div className="space-y-2 pt-1 text-[11px]">
          <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-between">
            <span className="text-emerald-900 font-medium">สภาพใหม่ (&lt; 2 ปี)</span>
            <span className="font-mono font-bold text-emerald-700">{under2} เครื่อง</span>
          </div>

          <div className="p-2 bg-sky-50 border border-sky-100 rounded-lg flex items-center justify-between">
            <span className="text-sky-900 font-medium">ใช้งานปกติ (2 - 4 ปี)</span>
            <span className="font-mono font-bold text-sky-700">{between2and4} เครื่อง</span>
          </div>

          <div className="p-2 bg-amber-50 border border-amber-100 rounded-lg flex items-center justify-between">
            <span className="text-amber-900 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              ครบ 5 ปี (ควรจัดหาทดแทน)
            </span>
            <span className="font-mono font-bold text-amber-700">{over5} เครื่อง</span>
          </div>
        </div>
      </div>
    </div>
  );
};
