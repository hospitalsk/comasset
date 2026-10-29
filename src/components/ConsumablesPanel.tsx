import React, { useState } from 'react';
import { ConsumableMaterial, MaterialRequisitionLog, AppSettings } from '../types/asset';
import {
  Package,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  ArrowDownLeft,
  FileText,
  User,
  Building,
  MapPin,
  Clock,
  History,
  CheckCircle2,
  Check,
  Search
} from 'lucide-react';

interface ConsumablesPanelProps {
  materials: ConsumableMaterial[];
  requisitions: MaterialRequisitionLog[];
  settings: AppSettings;
  onSaveMaterial: (material: ConsumableMaterial) => void;
  onDeleteMaterial: (id: string) => void;
  onSaveRequisition: (req: MaterialRequisitionLog) => void;
}

export const ConsumablesPanel: React.FC<ConsumablesPanelProps> = ({
  materials,
  requisitions,
  settings,
  onSaveMaterial,
  onDeleteMaterial,
  onSaveRequisition
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'requisitions'>('inventory');
  const [filterType, setFilterType] = useState<'all' | 'low_stock'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [isRequisitionModalOpen, setIsRequisitionModalOpen] = useState(false);
  const [selectedMaterialForReq, setSelectedMaterialForReq] = useState<ConsumableMaterial | null>(null);

  // Form states for Add / Restock
  const [restockMode, setRestockMode] = useState<'existing' | 'new'>('existing');
  const [selectedExistingId, setSelectedExistingId] = useState<string>(materials[0]?.id || '');
  const [addedQuantity, setAddedQuantity] = useState<number>(10);

  // New item state
  const [newCode, setNewCode] = useState(`MAT-IT-00${materials.length + 1}`);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('หมึกพิมพ์ (Toner/Ink)');
  const [newUnit, setNewUnit] = useState('ตลับ');
  const [newStockQty, setNewStockQty] = useState(10);
  const [newMinThreshold, setNewMinThreshold] = useState(5);
  const [newUnitPrice, setNewUnitPrice] = useState(1500);
  const [newLocation, setNewLocation] = useState('ตู้พัสดุไอที ชั้น 1');
  const [newMonthlyAvg, setNewMonthlyAvg] = useState(2);

  // Requisition Form states (ใคร, ที่ไหน, อย่างไร)
  const [reqRecipient, setReqRecipient] = useState('');
  const [reqDept, setReqDept] = useState(settings.departments[0] || '');
  const [reqLocation, setReqLocation] = useState('');
  const [reqPurpose, setReqPurpose] = useState('');
  const [reqQty, setReqQty] = useState<number>(1);
  const [reqDate, setReqDate] = useState(new Date().toISOString().split('T')[0]);
  const [reqOfficer, setReqOfficer] = useState(settings.procurement_officer);

  // Filtered lists
  const lowStockItems = materials.filter(m => m.stock_quantity <= m.min_threshold);
  const displayedMaterials = materials.filter(m => {
    if (filterType === 'low_stock' && m.stock_quantity > m.min_threshold) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.location.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const nextMonthBudget = lowStockItems.reduce((sum, item) => {
    const neededQty = Math.max(0, item.min_threshold * 2 - item.stock_quantity);
    return sum + neededQty * item.unit_price;
  }, 0);

  const totalInventoryValue = materials.reduce((sum, m) => sum + m.stock_quantity * m.unit_price, 0);

  // Open Requisition Modal for a specific item
  const handleOpenRequisitionModal = (mat: ConsumableMaterial) => {
    setSelectedMaterialForReq(mat);
    setReqQty(1);
    setReqRecipient('');
    setReqLocation(mat.location || 'อาคาร 1 ห้อง 201');
    setReqPurpose(`ใช้งานประจำฝ่าย: ${settings.departments[0]}`);
    setIsRequisitionModalOpen(true);
  };

  // Submit Requisition (บันทึกการเบิก: ใคร, ที่ไหน, อย่างไร)
  const handleSubmitRequisition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterialForReq) return;

    if (reqQty <= 0) {
      alert('จำนวนที่เบิกต้องมากกว่า 0');
      return;
    }
    if (reqQty > selectedMaterialForReq.stock_quantity) {
      alert(`ยอดคงเหลือในคลังไม่เพียงพอ (มีอยู่ ${selectedMaterialForReq.stock_quantity} ${selectedMaterialForReq.unit})`);
      return;
    }

    const newReq: MaterialRequisitionLog = {
      id: crypto.randomUUID(),
      material_id: selectedMaterialForReq.id,
      material_code: selectedMaterialForReq.code,
      material_name: selectedMaterialForReq.name,
      quantity: Number(reqQty),
      unit: selectedMaterialForReq.unit,
      recipient_name: reqRecipient.trim(),
      department: reqDept,
      location: reqLocation.trim(),
      purpose: reqPurpose.trim(),
      officer_name: reqOfficer.trim(),
      requisition_date: reqDate
    };

    onSaveRequisition(newReq);
    setIsRequisitionModalOpen(false);
    setSelectedMaterialForReq(null);
  };

  // Open Restock Modal
  const handleOpenRestockModal = () => {
    setRestockMode('existing');
    if (materials.length > 0) {
      setSelectedExistingId(materials[0].id);
    }
    setAddedQuantity(10);
    setNewCode(`MAT-IT-00${materials.length + 1}`);
    setIsRestockModalOpen(true);
  };

  // Submit Add / Restock
  const handleSubmitRestock = (e: React.FormEvent) => {
    e.preventDefault();

    if (restockMode === 'existing') {
      // User selected existing item: the code, name, category follow automatically!
      const target = materials.find(m => m.id === selectedExistingId);
      if (target) {
        const updated: ConsumableMaterial = {
          ...target,
          stock_quantity: target.stock_quantity + Number(addedQuantity),
          last_restocked: new Date().toISOString().split('T')[0]
        };
        onSaveMaterial(updated);
      }
    } else {
      // User creates a brand new material catalog
      const newMat: ConsumableMaterial = {
        id: crypto.randomUUID(),
        code: newCode.trim(),
        name: newName.trim(),
        category: newCategory.trim(),
        unit: newUnit.trim(),
        stock_quantity: Number(newStockQty),
        min_threshold: Number(newMinThreshold),
        unit_price: Number(newUnitPrice),
        location: newLocation.trim(),
        last_restocked: new Date().toISOString().split('T')[0],
        monthly_usage_avg: Number(newMonthlyAvg)
      };
      onSaveMaterial(newMat);
    }

    setIsRestockModalOpen(false);
  };

  const selectedExistingItem = materials.find(m => m.id === selectedExistingId) || materials[0];

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">รายการวัสดุคอมพิวเตอร์ทั้งหมด</span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">{materials.length}</span>
            <span className="text-xs text-slate-500">รายการ</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            มูลค่าคงคลังรวม {(Number(totalInventoryValue) || 0).toLocaleString()} บาท
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">วัสดุที่ใกล้หมด (ต่ำกว่าเกณฑ์)</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono ${lowStockItems.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {lowStockItems.length}
            </span>
            <span className="text-xs text-slate-500">รายการ</span>
          </div>
          <span className="text-[11px] text-rose-500 mt-1 block font-medium">
            {lowStockItems.length > 0 ? 'ควรทำเรื่องจัดซื้อเพิ่มโดยด่วน' : 'สต็อกทุกรายการอยู่ในเกณฑ์ปลอดภัย'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">ประวัติการเบิกใช้วัสดุ</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <History className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-purple-700">{requisitions.length}</span>
            <span className="text-xs text-slate-500">ครั้งที่เบิก</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            บันทึกครบถ้วน (ใคร / ที่ไหน / อย่างไร)
          </span>
        </div>

        <div className="bg-gradient-to-br from-sky-600 to-sky-700 p-4 rounded-xl text-white shadow-xs">
          <div className="flex items-center justify-between text-sky-100">
            <span className="text-xs font-medium">ประมาณการงบประมาณสั่งซื้อเดือนหน้า</span>
            <DollarSign className="w-4 h-4 text-sky-200" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono">{(Number(nextMonthBudget) || 0).toLocaleString()}</span>
            <span className="text-xs text-sky-100">บาท</span>
          </div>
          <span className="text-[11px] text-sky-100/80 mt-1 block">
            คำนวณจากอัตราใช้เฉลี่ย + จุดเติมสต็อก
          </span>
        </div>
      </div>

      {/* Primary Sub-Tabs: Stock Catalog vs. Requisition Audit Log */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 pt-2 rounded-t-xl text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-1.5 px-4 py-2.5 font-medium border-b-2 transition-colors ${
              activeTab === 'inventory'
                ? 'border-sky-600 text-sky-700 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4 text-sky-600" />
            <span>คลังวัสดุคอมพิวเตอร์คงเหลือ ({materials.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('requisitions')}
            className={`flex items-center gap-1.5 px-4 py-2.5 font-medium border-b-2 transition-colors ${
              activeTab === 'requisitions'
                ? 'border-sky-600 text-sky-700 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4 text-purple-600" />
            <span>ทะเบียนประวัติการเบิกจ่าย (ใคร / ที่ไหน / อย่างไร) ({requisitions.length})</span>
          </button>
        </div>

        {/* Top Add / Restock Action Button */}
        <button
          onClick={handleOpenRestockModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold shadow-2xs transition-colors mb-2"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่ม / รับเข้าสต็อกวัสดุ</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: INVENTORY CATALOG                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  filterType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                วัสดุทั้งหมด ({materials.length})
              </button>
              <button
                onClick={() => setFilterType('low_stock')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  filterType === 'low_stock' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>ใกล้หมดสต็อก</span>
                {lowStockItems.length > 0 && (
                  <span className="bg-rose-100 text-rose-700 font-mono text-[10px] px-1.5 py-0.2 rounded-full">
                    {lowStockItems.length}
                  </span>
                )}
              </button>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ค้นหารหัส หรือชื่อวัสดุ..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="px-4 py-3">รหัส / รายการวัสดุสิ้นเปลือง</th>
                    <th className="px-3 py-3">หมวดหมู่</th>
                    <th className="px-3 py-3 text-right">ราคา/หน่วย</th>
                    <th className="px-3 py-3 text-center">คงเหลือในคลัง</th>
                    <th className="px-3 py-3 text-center">เกณฑ์เตือน</th>
                    <th className="px-3 py-3 text-center">ใช้เฉลี่ย/ด.</th>
                    <th className="px-3 py-3 text-center">สถานะ</th>
                    <th className="px-4 py-3 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedMaterials.map(m => {
                    const isLow = m.stock_quantity <= m.min_threshold;
                    return (
                      <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{m.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                            <span className="font-bold text-slate-600">{m.code}</span>
                            <span>·</span>
                            <span>จัดเก็บ: {m.location}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-slate-600">{m.category}</td>
                        <td className="px-3 py-3 text-right font-mono text-slate-800">{(Number(m?.unit_price) || 0).toLocaleString()} ฿</td>
                        <td className="px-3 py-3 text-center font-mono font-bold text-slate-900 text-sm">
                          {m.stock_quantity} <span className="text-[11px] font-normal text-slate-500">{m.unit}</span>
                        </td>
                        <td className="px-3 py-3 text-center font-mono text-slate-500">
                          {m.min_threshold} {m.unit}
                        </td>
                        <td className="px-3 py-3 text-center font-mono text-slate-600">
                          ~{m.monthly_usage_avg} {m.unit}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {isLow ? (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              ใกล้หมดสต็อก
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              พร้อมใช้งาน
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Requisition Button (เบิกวัสดุ: ระบุใคร ที่ไหน อย่างไร) */}
                            <button
                              onClick={() => handleOpenRequisitionModal(m)}
                              disabled={m.stock_quantity <= 0}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg transition-colors disabled:opacity-40"
                              title="เบิกใช้วัสดุนี้ (บันทึกใคร ที่ไหน อย่างไร)"
                            >
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                              <span>เบิกใช้</span>
                            </button>

                            <button
                              onClick={() => {
                                setRestockMode('existing');
                                setSelectedExistingId(m.id);
                                setAddedQuantity(5);
                                setIsRestockModalOpen(true);
                              }}
                              className="px-2 py-1 text-xs font-medium bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg transition-colors"
                              title="รับเข้าสต็อกเพิ่ม"
                            >
                              +รับเข้า
                            </button>

                            <button
                              onClick={() => {
                                if (window.confirm(`ยืนยันลบรายการวัสดุ ${m.name} หรือไม่?`)) {
                                  onDeleteMaterial(m.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                              title="ลบ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MATERIAL REQUISITION LOG (เบิกไปให้ใคร, ที่ไหน, อย่างไร)           */}
      {/* ========================================================================= */}
      {activeTab === 'requisitions' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between text-xs">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                ทะเบียนควบคุมการเบิกใช้วัสดุคอมพิวเตอร์สิ้นเปลือง
              </h3>
              <p className="text-slate-500 text-[11px] mt-0.5">
                บันทึกชัดเจนตามระเบียบพัสดุฯ ว่าเบิกไปให้ใคร, นำไปใช้ที่ไหน, และนำไปใช้อย่างไร
              </p>
            </div>
            <span className="font-mono text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
              รวม {requisitions.length} รายการเบิกจ่าย
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="px-4 py-3">วันเดือนปีที่เบิก</th>
                    <th className="px-3 py-3">รหัส / รายการวัสดุ</th>
                    <th className="px-3 py-3 text-center">จำนวนที่เบิก</th>
                    <th className="px-3 py-3">เบิกไปให้ใคร (ผู้ขอเบิก)</th>
                    <th className="px-3 py-3">นำไปใช้ที่ไหน (สถานที่/ห้อง)</th>
                    <th className="px-3 py-3">นำไปใช้อย่างไร (วัตถุประสงค์)</th>
                    <th className="px-4 py-3">เจ้าหน้าที่ผู้จ่าย</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requisitions.length > 0 ? (
                    requisitions.map(req => (
                      <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-slate-700 whitespace-nowrap">
                          {req.requisition_date}
                        </td>
                        <td className="px-3 py-3">
                          <span className="font-mono font-bold text-slate-900 block">{req.material_code}</span>
                          <span className="text-slate-700 text-[11px]">{req.material_name}</span>
                        </td>
                        <td className="px-3 py-3 text-center font-mono font-bold text-purple-700 text-sm">
                          {req.quantity} <span className="text-[11px] font-normal text-slate-500">{req.unit}</span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="font-semibold text-slate-800 block flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {req.recipient_name}
                          </span>
                          <span className="text-slate-400 text-[11px] block">{req.department}</span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-slate-800 font-medium flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                            {req.location}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-slate-600 max-w-xs">
                          {req.purpose}
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-[11px] font-mono">
                          {req.officer_name}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        ยังไม่มีประวัติการเบิกใช้วัสดุ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: REQUISITION MODAL (เบิกไปให้ใคร, ที่ไหน, อย่างไร)                 */}
      {/* ========================================================================= */}
      {isRequisitionModalOpen && selectedMaterialForReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-purple-50/60">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">
                    บันทึกการเบิกใช้วัสดุคอมพิวเตอร์
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {selectedMaterialForReq.code} - {selectedMaterialForReq.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRequisitionModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitRequisition} className="p-6 space-y-3.5 text-xs">
              {/* Item Summary Pill */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block">คงเหลือพร้อมจ่ายในคลัง:</span>
                  <strong className="text-sm font-mono text-slate-900">
                    {selectedMaterialForReq.stock_quantity} {selectedMaterialForReq.unit}
                  </strong>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">ราคาต่อหน่วย:</span>
                  <span className="font-mono text-slate-700">{selectedMaterialForReq.unit_price} ฿</span>
                </div>
              </div>

              {/* ใคร: ผู้ขอเบิก */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">
                    เบิกไปให้ใคร (ชื่อผู้ขอเบิก) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={reqRecipient}
                    onChange={e => setReqRecipient(e.target.value)}
                    placeholder="เช่น นายสมเกียรติ มั่นคง"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-700 block mb-1">
                    หน่วยงานผู้เบิก <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={reqDept}
                    onChange={e => setReqDept(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    {settings.departments.map(d => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ที่ไหน: สถานที่ติดตั้ง/ใช้งาน */}
              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  นำไปใช้ที่ไหน (สถานที่ / อาคาร / ห้อง) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={reqLocation}
                  onChange={e => setReqLocation(e.target.value)}
                  placeholder="เช่น อาคาร 1 ชั้น 2 ห้องการเงิน 204"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* อย่างไร: วัตถุประสงค์การใช้ */}
              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  นำไปใช้อย่างไร (วัตถุประสงค์การใช้งาน) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={reqPurpose}
                  onChange={e => setReqPurpose(e.target.value)}
                  placeholder="เช่น เปลี่ยนหมึกพิมพ์เครื่องพิมพ์เลเซอร์สำหรับพิมพ์หนังสือราชการด่วน..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* จำนวนที่เบิก & วันที่ */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">
                    จำนวนที่เบิก ({selectedMaterialForReq.unit}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={selectedMaterialForReq.stock_quantity}
                    required
                    value={reqQty}
                    onChange={e => setReqQty(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-right font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-700 block mb-1">
                    วันที่เบิกจ่าย
                  </label>
                  <input
                    type="date"
                    required
                    value={reqDate}
                    onChange={e => setReqDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  เจ้าหน้าที่พัสดุผู้จ่าย
                </label>
                <input
                  type="text"
                  value={reqOfficer}
                  onChange={e => setReqOfficer(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRequisitionModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-xs"
                >
                  ยืนยันการเบิกจ่าย
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD / RESTOCK MATERIAL (เลือกของเดิม รหัสตามมา หรือ สร้างของใหม่)  */}
      {/* ========================================================================= */}
      {isRestockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-sky-50/60">
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">
                  เพิ่ม / รับเข้าสต็อกพัสดุคอมพิวเตอร์
                </h3>
                <p className="text-[11px] text-slate-500">
                  เลือกระหว่างรับเข้าของเดิม (รหัสจะตามมาอัตโนมัติ) หรือ สร้างรายการใหม่
                </p>
              </div>
              <button
                onClick={() => setIsRestockModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                ✕
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setRestockMode('existing')}
                className={`flex-1 py-2 px-3 rounded-xl border text-center font-medium transition-all ${
                  restockMode === 'existing'
                    ? 'bg-white border-sky-500 text-sky-700 shadow-2xs font-semibold'
                    : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                }`}
              >
                📦 1. รับเข้าเพิ่มจากรายการเดิมที่มีอยู่
              </button>

              <button
                type="button"
                onClick={() => setRestockMode('new')}
                className={`flex-1 py-2 px-3 rounded-xl border text-center font-medium transition-all ${
                  restockMode === 'new'
                    ? 'bg-white border-sky-500 text-sky-700 shadow-2xs font-semibold'
                    : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ✨ 2. เพิ่มรายการวัสดุใหม่ที่ไม่เคยมี
              </button>
            </div>

            <form onSubmit={handleSubmitRestock} className="p-6 space-y-4 text-xs">
              {/* CASE 1: RESTOCK EXISTING ITEM (รหัสตามมาอัตโนมัติ) */}
              {restockMode === 'existing' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="font-medium text-slate-700 block mb-1">
                      เลือกรายการวัสดุเดิมที่มีอยู่ในคลัง:
                    </label>
                    <select
                      value={selectedExistingId}
                      onChange={e => setSelectedExistingId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white font-medium text-slate-800"
                    >
                      {materials.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.code} - {m.name} (คงเหลือปัจจุบัน: {m.stock_quantity} {m.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Auto-filled details card based on user's selected item */}
                  {selectedExistingItem && (
                    <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sky-800 text-xs">
                          รหัสวัสดุ: {selectedExistingItem.code}
                        </span>
                        <span className="text-[11px] text-sky-700 font-medium bg-sky-100 px-2 py-0.5 rounded">
                          หมวดหมู่: {selectedExistingItem.category}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600 grid grid-cols-2 gap-2 pt-1 border-t border-sky-200/60">
                        <span>คงเหลือปัจจุบัน: <strong>{selectedExistingItem.stock_quantity} {selectedExistingItem.unit}</strong></span>
                        <span>ราคาต่อหน่วย: <strong>{selectedExistingItem.unit_price} บาท</strong></span>
                        <span>จุดเตือนขั้นต่ำ: {selectedExistingItem.min_threshold} {selectedExistingItem.unit}</span>
                        <span>สถานที่จัดเก็บ: {selectedExistingItem.location}</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="font-medium text-slate-700 block mb-1">
                      จำนวนที่ตรวจรับเข้าสต็อกเพิ่ม (+ {selectedExistingItem?.unit || 'หน่วย'}) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={addedQuantity}
                      onChange={e => setAddedQuantity(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-right font-bold text-base"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      ยอดคงเหลือใหม่หลังรับเข้า: <strong>{(selectedExistingItem?.stock_quantity || 0) + Number(addedQuantity)} {selectedExistingItem?.unit}</strong>
                    </span>
                  </div>
                </div>
              )}

              {/* CASE 2: BRAND NEW ITEM CATALOG */}
              {restockMode === 'new' && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">
                        รหัสวัสดุใหม่ <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newCode}
                        onChange={e => setNewCode(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">หน่วยนับ</label>
                      <input
                        type="text"
                        required
                        value={newUnit}
                        onChange={e => setNewUnit(e.target.value)}
                        placeholder="เช่น ตลับ, กล่อง, ม้วน"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-medium text-slate-700 block mb-1">
                      ชื่อรายการวัสดุคอมพิวเตอร์ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      placeholder="เช่น ตลับหมึกเลเซอร์ Brother TN-2480"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">จำนวนแรกรับ</label>
                      <input
                        type="number"
                        min={0}
                        value={newStockQty}
                        onChange={e => setNewStockQty(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-right"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">เกณฑ์เตือนสั่ง</label>
                      <input
                        type="number"
                        min={1}
                        value={newMinThreshold}
                        onChange={e => setNewMinThreshold(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-right"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">ราคา/หน่วย (฿)</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={newUnitPrice}
                        onChange={e => setNewUnitPrice(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-right"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">หมวดหมู่</label>
                      <input
                        type="text"
                        value={newCategory}
                        onChange={e => setNewCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">สถานที่จัดเก็บ</label>
                      <input
                        type="text"
                        value={newLocation}
                        onChange={e => setNewLocation(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRestockModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg shadow-xs"
                >
                  {restockMode === 'existing' ? 'บันทึกรับเข้าสต็อกเพิ่ม' : 'บันทึกวัสดุใหม่'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
