export type AssetStatus = 'available' | 'in_use' | 'repairing' | 'disposed' | 'borrowed';

export interface Asset {
  id: string;
  asset_code: string; // รหัสครุภัณฑ์ เช่น 7440-001-0001/2566
  gfmis_code?: string; // รหัสสินทรัพย์ GFMIS (ถ้ามี)
  serial_number: string; // S/N
  name: string; // ชื่อรายการ เช่น เครื่องคอมพิวเตอร์ประมวลผลทั่วไป
  category: string; // หมวดหมู่ เช่น คอมพิวเตอร์ตั้งโต๊ะ, แล็ปท็อป, เซิร์ฟเวอร์
  brand_model: string; // ยี่ห้อ / รุ่น เช่น Dell OptiPlex 7090
  specifications: string; // สเปกเครื่อง
  acquisition_date: string; // วันที่ได้มา YYYY-MM-DD
  acquisition_method: string; // วิธีการได้มา เช่น เฉพาะเจาะจง, e-bidding, คัดเลือก
  purchase_order_no: string; // เลขที่สัญญา / ใบสั่งซื้อ
  cost: number; // ราคาทุน (บาท)
  lifespan_years: number; // อายุการใช้งานตามระเบียบ (ปกติ 5 ปี)
  depreciation_rate: number; // อัตราค่าเสื่อมราคา (% ต่อปี เช่น 20)
  salvage_value: number; // ค่าซาก (ตามระเบียบมักคิด 1 บาท)
  status: AssetStatus;
  department: string; // หน่วยงานที่ครอบครอง
  current_user: string; // ผู้ใช้งาน / ผู้ครอบครอง
  location: string; // สถานที่ติดตั้ง เช่น อาคาร 1 ห้อง 304
  image_url: string; // ลิงก์รูปภาพครุภัณฑ์
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ConsumableMaterial {
  id: string;
  code: string; // รหัสวัสดุ
  name: string; // ชื่อวัสดุ เช่น หมึกพิมพ์ HP LaserJet, สาย LAN Cat6, เมาส์
  category: string; // หมวดหมู่วัสดุ
  unit: string; // หน่วยนับ เช่น ตลับ, กล่อง, เส้น, อัน
  stock_quantity: number; // จำนวนคงเหลือในสต็อก
  min_threshold: number; // จุดเตือนสั่งซื้อเพิ่ม (เกณฑ์ขั้นต่ำ)
  unit_price: number; // ราคาต่อหน่วย
  location: string; // สถานที่จัดเก็บ
  last_restocked: string; // วันที่รับเข้าล่าสุด
  monthly_usage_avg: number; // อัตราการใช้เฉลี่ยต่อเดือน
}

export interface MaterialRequisitionLog {
  id: string;
  material_id: string;
  material_code: string;
  material_name: string;
  quantity: number;
  unit: string;
  recipient_name: string; // เบิกไปให้ใคร (ชื่อผู้ขอเบิก/ผู้รับของ)
  department: string; // สังกัด/กลุ่มงาน
  location: string; // ที่ไหน (สถานที่/ห้อง/อาคารที่นำไปใช้)
  purpose: string; // อย่างไร (นำไปทำอะไร/วัตถุประสงค์การใช้)
  officer_name: string; // เจ้าหน้าที่พัสดุผู้จ่าย
  requisition_date: string; // วันที่เบิก
  created_at?: string;
}

export interface BorrowLog {
  id: string;
  asset_id: string;
  asset_code: string;
  asset_name: string;
  borrower_name: string;
  borrower_department: string;
  borrow_date: string;
  expected_return_date: string;
  actual_return_date?: string | null;
  status: 'borrowed' | 'returned' | 'overdue';
  purpose: string;
  officer_name: string;
  return_condition?: string;
  created_at?: string;
}

export interface RepairLog {
  id: string;
  asset_id: string;
  asset_code: string;
  asset_name: string;
  issue_description: string;
  reporter_name: string;
  reporter_department: string;
  report_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'unrepairable';
  repair_vendor: string;
  repair_cost: number;
  invoice_no?: string;
  completion_date?: string | null;
  resolution_notes?: string;
  recommend_disposal: boolean; // เสนอจำหน่ายหากซ่อมไม่คุ้ม
  created_at?: string;
}

export interface AppSettings {
  app_title: string;
  organization_name: string;
  sub_organization: string;
  garuda_symbol_type: 'official_gold' | 'official_red' | 'custom';
  garuda_custom_url?: string;
  logo_url?: string;
  chief_procurement_officer: string; // หัวหน้าเจ้าหน้าที่พัสดุ
  procurement_officer: string; // เจ้าหน้าที่พัสดุ
  approver_officer: string; // ผู้อำนวยการ / ผู้สั่งการ
  inspection_committee: string[]; // รายชื่อกรรมการตรวจนับพัสดุประจำปี
  google_drive_folder_url: string;
  departments: string[];
  categories: string[];
  fiscal_year: number; // เช่น 2568
}

export interface DepreciationCalculation {
  cost: number;
  salvageValue: number;
  depreciableAmount: number;
  lifespanYears: number;
  annualDepreciation: number;
  ageYears: number;
  accumulatedDepreciation: number;
  netBookValue: number;
  isFullyDepreciated: boolean;
  needsReplacement: boolean;
  recommendation: string;
}
