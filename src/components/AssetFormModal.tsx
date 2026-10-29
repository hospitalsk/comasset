import React, { useState } from 'react';
import { Asset, AppSettings, AssetStatus } from '../types/asset';
import { calculateDepreciation } from '../utils/depreciation';
import { X, Save, Calculator, ExternalLink, Image as ImageIcon, Sparkles } from 'lucide-react';

interface AssetFormModalProps {
  initialAsset?: Asset | null;
  settings: AppSettings;
  onSave: (asset: Asset) => void;
  onClose: () => void;
}

export const AssetFormModal: React.FC<AssetFormModalProps> = ({
  initialAsset,
  settings,
  onSave,
  onClose
}) => {
  const isEditing = Boolean(initialAsset);

  // Form State
  const [assetCode, setAssetCode] = useState(initialAsset?.asset_code || `7440-001-${Math.floor(1000 + Math.random() * 9000)}/2568`);
  const [gfmisCode, setGfmisCode] = useState(initialAsset?.gfmis_code || '');
  const [serialNumber, setSerialNumber] = useState(initialAsset?.serial_number || '');
  const [name, setName] = useState(initialAsset?.name || '');
  const [category, setCategory] = useState(initialAsset?.category || settings.categories[0] || 'คอมพิวเตอร์ตั้งโต๊ะ (Desktop PC)');
  const [brandModel, setBrandModel] = useState(initialAsset?.brand_model || '');
  const [specifications, setSpecifications] = useState(initialAsset?.specifications || '');
  const [acquisitionDate, setAcquisitionDate] = useState(initialAsset?.acquisition_date || new Date().toISOString().split('T')[0]);
  const [acquisitionMethod, setAcquisitionMethod] = useState(initialAsset?.acquisition_method || 'วิธีเฉพาะเจาะจง');
  const [purchaseOrderNo, setPurchaseOrderNo] = useState(initialAsset?.purchase_order_no || '');
  const [cost, setCost] = useState<number>(initialAsset?.cost || 30000);
  const [lifespanYears, setLifespanYears] = useState<number>(initialAsset?.lifespan_years || 5);
  const [depreciationRate, setDepreciationRate] = useState<number>(initialAsset?.depreciation_rate || 20);
  const [salvageValue, setSalvageValue] = useState<number>(initialAsset?.salvage_value ?? 1);
  const [status, setStatus] = useState<AssetStatus>(initialAsset?.status || 'available');
  const [department, setDepartment] = useState(initialAsset?.department || settings.departments[0] || 'กลุ่มงานเทคโนโลยีสารสนเทศและการสื่อสาร');
  const [currentUser, setCurrentUser] = useState(initialAsset?.current_user || '');
  const [location, setLocation] = useState(initialAsset?.location || '');
  const [imageUrl, setImageUrl] = useState(initialAsset?.image_url || settings.google_drive_folder_url);
  const [notes, setNotes] = useState(initialAsset?.notes || '');

  // Live depreciation preview
  const depPreview = calculateDepreciation({
    cost,
    salvage_value: salvageValue,
    lifespan_years: lifespanYears,
    acquisition_date: acquisitionDate
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const assetData: Asset = {
      id: initialAsset?.id || crypto.randomUUID(),
      asset_code: assetCode.trim(),
      gfmis_code: gfmisCode.trim() || undefined,
      serial_number: serialNumber.trim(),
      name: name.trim(),
      category,
      brand_model: brandModel.trim(),
      specifications: specifications.trim(),
      acquisition_date: acquisitionDate,
      acquisition_method: acquisitionMethod,
      purchase_order_no: purchaseOrderNo.trim(),
      cost: Number(cost),
      lifespan_years: Number(lifespanYears),
      depreciation_rate: Number(depreciationRate),
      salvage_value: Number(salvageValue),
      status,
      department,
      current_user: currentUser.trim() || (status === 'available' ? 'พร้อมจ่ายในคลัง' : 'ไม่ระบุผู้ครอบครอง'),
      location: location.trim() || 'ศูนย์เทคโนโลยีสารสนเทศ',
      image_url: imageUrl.trim() || settings.google_drive_folder_url,
      notes: notes.trim()
    };

    onSave(assetData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8 overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <h3 className="font-semibold text-slate-800 text-lg">
              {isEditing ? 'แก้ไขข้อมูลครุภัณฑ์คอมพิวเตอร์' : 'ลงทะเบียนครุภัณฑ์คอมพิวเตอร์ใหม่'}
            </h3>
            <p className="text-xs text-slate-500">
              ตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Official Identifiers */}
          <div>
            <h4 className="text-xs font-semibold text-sky-800 uppercase tracking-wider mb-3">
              1. ข้อมูลทะเบียนและรหัสสากลราชการ
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  รหัสครุภัณฑ์ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={assetCode}
                  onChange={e => setAssetCode(e.target.value)}
                  placeholder="เช่น 7440-001-0001/2568"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  รหัสสินทรัพย์ GFMIS
                </label>
                <input
                  type="text"
                  value={gfmisCode}
                  onChange={e => setGfmisCode(e.target.value)}
                  placeholder="เช่น 11060100004521"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Serial Number (S/N) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={serialNumber}
                  onChange={e => setSerialNumber(e.target.value)}
                  placeholder="เช่น SN-DELL-894721"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Hardware Details */}
          <div>
            <h4 className="text-xs font-semibold text-sky-800 uppercase tracking-wider mb-3">
              2. รายละเอียดทางเทคนิค & สเปกคอมพิวเตอร์
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  ชื่อรายการครุภัณฑ์ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="เช่น เครื่องคอมพิวเตอร์ประมวลผลทั่วไป"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  หมวดหมู่ครุภัณฑ์ <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  {settings.categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  ยี่ห้อ / รุ่น (Brand / Model) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={brandModel}
                  onChange={e => setBrandModel(e.target.value)}
                  placeholder="เช่น Dell OptiPlex 7090 / HP ProBook 450 G8"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  สถานะครุภัณฑ์
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as AssetStatus)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  <option value="available">พร้อมใช้งาน (Available in Stock)</option>
                  <option value="in_use">กำลังใช้งาน (In Use)</option>
                  <option value="borrowed">อยู่ระหว่างยืม (Borrowed)</option>
                  <option value="repairing">ส่งซ่อมบำรุง (Under Repair)</option>
                  <option value="disposed">จำหน่าย / ปลดระวาง (Disposed)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  คุณลักษณะเฉพาะ / สเปกเครื่อง (Specifications)
                </label>
                <textarea
                  rows={2}
                  value={specifications}
                  onChange={e => setSpecifications(e.target.value)}
                  placeholder="เช่น CPU Intel Core i7-11700, RAM 16GB DDR4, SSD 512GB NVMe, จอภาพ 23.8 นิ้ว Full HD..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Acquisition & Procurement Regulations */}
          <div>
            <h4 className="text-xs font-semibold text-sky-800 uppercase tracking-wider mb-3">
              3. ข้อมูลการจัดซื้อจัดจ้าง & สัญญา
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  วันที่ได้มา / ตรวจรับ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={acquisitionDate}
                  onChange={e => setAcquisitionDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  วิธีการจัดหา
                </label>
                <select
                  value={acquisitionMethod}
                  onChange={e => setAcquisitionMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  <option value="วิธีเฉพาะเจาะจง">วิธีเฉพาะเจาะจง</option>
                  <option value="ประกวดราคาอิเล็กทรอนิกส์ (e-bidding)">ประกวดราคาอิเล็กทรอนิกส์ (e-bidding)</option>
                  <option value="วิธีคัดเลือก">วิธีคัดเลือก</option>
                  <option value="สอบราคา">สอบราคา</option>
                  <option value="ได้รับบริจาค / รับโอน">ได้รับบริจาค / รับโอน</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  เลขที่สัญญา / ใบสั่งซื้อ (PO)
                </label>
                <input
                  type="text"
                  value={purchaseOrderNo}
                  onChange={e => setPurchaseOrderNo(e.target.value)}
                  placeholder="เช่น PO-ICT-2568/012"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Depreciation & Accounting */}
          <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-sky-900 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-sky-600" />
                4. การคำนวณค่าเสื่อมราคาตามระเบียบกระทรวงการคลัง (วิธีเส้นตรง)
              </h4>
              <span className="text-[11px] text-sky-700 bg-sky-100/70 px-2 py-0.5 rounded">
                อัตโนมัติ Real-Time
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  ราคาทุนรวม (บาท) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step={0.01}
                  value={cost}
                  onChange={e => setCost(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-right"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  อายุการใช้งาน (ปี)
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={lifespanYears}
                  onChange={e => {
                    const y = parseInt(e.target.value) || 5;
                    setLifespanYears(y);
                    setDepreciationRate(Number((100 / y).toFixed(2)));
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-right"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  อัตราค่าเสื่อม (% ต่อปี)
                </label>
                <input
                  type="number"
                  readOnly
                  value={depreciationRate}
                  className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-lg font-mono text-right text-slate-600"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  ราคาซาก (บาท)
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={salvageValue}
                  onChange={e => setSalvageValue(parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-right"
                />
              </div>
            </div>

            {/* Calculated Preview Strip */}
            <div className="mt-3 pt-3 border-t border-sky-100/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-[11px] text-slate-500 block">ค่าเสื่อม/ปี:</span>
                <strong className="text-slate-800 font-mono">{(Number(depPreview?.annualDepreciation) || 0).toLocaleString()} ฿</strong>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">ค่าเสื่อมราคาสะสม:</span>
                <strong className="text-rose-600 font-mono">{(Number(depPreview?.accumulatedDepreciation) || 0).toLocaleString()} ฿</strong>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">มูลค่าสุทธิทางบัญชี:</span>
                <strong className="text-sky-700 font-mono text-sm">{(Number(depPreview?.netBookValue) || 0).toLocaleString()} ฿</strong>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">สถานะอายุการใช้งาน:</span>
                <span className={`text-[11px] font-medium ${depPreview.isFullyDepreciated ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {depPreview.isFullyDepreciated ? 'ครบอายุแล้ว' : `ใช้งานมา ${depPreview.ageYears} ปี`}
                </span>
              </div>
            </div>
          </div>

          {/* Section 5: Custodian & Location */}
          <div>
            <h4 className="text-xs font-semibold text-sky-800 uppercase tracking-wider mb-3">
              5. หน่วยงานผู้ครอบครอง & สถานที่ติดตั้ง
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  หน่วยงาน / กอง / ฝ่าย <span className="text-rose-500">*</span>
                </label>
                <select
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  {settings.departments.map(dept => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  ผู้รับผิดชอบ / ผู้ครอบครอง
                </label>
                <input
                  type="text"
                  value={currentUser}
                  onChange={e => setCurrentUser(e.target.value)}
                  placeholder="เช่น นายสมเกียรติ มั่นคง"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  สถานที่ติดตั้ง / อาคาร / ห้อง <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="เช่น อาคาร 1 ชั้น 3 ห้อง 304"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Section 6: Image & Google Drive Integration */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-sky-800 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-sky-600" />
                6. รูปภาพครุภัณฑ์ & Google Drive
              </h4>
              <a
                href={settings.google_drive_folder_url}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-sky-600 hover:text-sky-800 flex items-center gap-1 hover:underline"
              >
                <span>เปิดโฟลเดอร์ Google Drive</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="ระบุลิงก์รูปภาพครุภัณฑ์ หรือลิงก์ไฟล์รูปภาพใน Google Drive"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <p className="text-[11px] text-slate-500">
                สามารถถ่ายภาพครุภัณฑ์แล้วนำไปอัปโหลดเก็บไว้ที่ Google Drive ของหน่วยงาน แล้ววางลิงก์ที่นี่
              </p>
            </div>
          </div>

          {/* Section 7: Notes */}
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">
              หมายเหตุเพิ่มเติม
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="เช่น มีการรับประกัน 3 ปี On-site Service, ครุภัณฑ์ใช้งานเฉพาะกิจ..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'บันทึกการแก้ไข' : 'บันทึกครุภัณฑ์ใหม่'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
