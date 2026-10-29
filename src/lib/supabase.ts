import { createClient } from '@supabase/supabase-js';
import { Asset, ConsumableMaterial, BorrowLog, RepairLog, AppSettings, MaterialRequisitionLog } from '../types/asset';

export const SUPABASE_URL = 'https://ofhjsywgkoaetxclhrcn.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9maGpzeXdna29hZXR4Y2xocmNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0OTY0MzAsImV4cCI6MjEwODA3MjQzMH0._JOUEjHnAmgUc7teMMzhkX3IhQ9ky7B4Q7lg_IS7GB4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export const SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- สคริปต์สร้างฐานข้อมูล Supabase สำหรับ "ระบบบริหารจัดการครุภัณฑ์คอมพิวเตอร์และทรัพย์สิน"
-- ตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560
-- รันในเมนู SQL Editor ใน Supabase Dashboard (https://supabase.com/dashboard/project/ofhjsywgkoaetxclhrcn/sql)
-- ==============================================================================

-- 1. ตารางครุภัณฑ์คอมพิวเตอร์และทรัพย์สิน (assets)
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_code VARCHAR(100) NOT NULL UNIQUE,
    gfmis_code VARCHAR(100),
    serial_number VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    brand_model VARCHAR(255) NOT NULL,
    specifications TEXT,
    acquisition_date DATE NOT NULL,
    acquisition_method VARCHAR(100) DEFAULT 'วิธีเฉพาะเจาะจง',
    purchase_order_no VARCHAR(100),
    cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    lifespan_years INTEGER NOT NULL DEFAULT 5,
    depreciation_rate NUMERIC(5, 2) NOT NULL DEFAULT 20.00,
    salvage_value NUMERIC(12, 2) NOT NULL DEFAULT 1.00,
    status VARCHAR(50) NOT NULL DEFAULT 'available',
    department VARCHAR(150) NOT NULL,
    current_user VARCHAR(150),
    location VARCHAR(200) NOT NULL,
    image_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ตารางวัสดุคอมพิวเตอร์สิ้นเปลือง (consumable_materials)
CREATE TABLE IF NOT EXISTS public.consumable_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    min_threshold INTEGER NOT NULL DEFAULT 5,
    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    location VARCHAR(150),
    last_restocked DATE DEFAULT CURRENT_DATE,
    monthly_usage_avg INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ตารางบันทึกการยืม-คืน (borrow_logs)
CREATE TABLE IF NOT EXISTS public.borrow_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
    asset_code VARCHAR(100) NOT NULL,
    asset_name VARCHAR(255) NOT NULL,
    borrower_name VARCHAR(150) NOT NULL,
    borrower_department VARCHAR(150) NOT NULL,
    borrow_date DATE NOT NULL,
    expected_return_date DATE NOT NULL,
    actual_return_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'borrowed',
    purpose TEXT NOT NULL,
    officer_name VARCHAR(150) NOT NULL,
    return_condition TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ตารางบันทึกการส่งซ่อม (repair_logs)
CREATE TABLE IF NOT EXISTS public.repair_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
    asset_code VARCHAR(100) NOT NULL,
    asset_name VARCHAR(255) NOT NULL,
    issue_description TEXT NOT NULL,
    reporter_name VARCHAR(150) NOT NULL,
    reporter_department VARCHAR(150) NOT NULL,
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    repair_vendor VARCHAR(200),
    repair_cost NUMERIC(10, 2) DEFAULT 0.00,
    invoice_no VARCHAR(100),
    completion_date DATE,
    resolution_notes TEXT,
    recommend_disposal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ตารางประวัติการเบิกใช้วัสดุคอมพิวเตอร์ (material_requisitions)
CREATE TABLE IF NOT EXISTS public.material_requisitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID REFERENCES public.consumable_materials(id) ON DELETE CASCADE,
    material_code VARCHAR(50) NOT NULL,
    material_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit VARCHAR(50) NOT NULL,
    recipient_name VARCHAR(150) NOT NULL,
    department VARCHAR(150) NOT NULL,
    location VARCHAR(200) NOT NULL,
    purpose TEXT NOT NULL,
    officer_name VARCHAR(150) NOT NULL,
    requisition_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ตารางการตั้งค่าระบบ (app_settings)
CREATE TABLE IF NOT EXISTS public.app_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'global_config',
    app_title VARCHAR(255) NOT NULL,
    organization_name VARCHAR(255) NOT NULL,
    sub_organization VARCHAR(255),
    garuda_symbol_type VARCHAR(50) DEFAULT 'official_gold',
    garuda_custom_url TEXT,
    logo_url TEXT,
    chief_procurement_officer VARCHAR(150),
    procurement_officer VARCHAR(150),
    approver_officer VARCHAR(150),
    inspection_committee TEXT[],
    google_drive_folder_url TEXT,
    departments TEXT[],
    categories TEXT[],
    fiscal_year INTEGER DEFAULT 2568,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. เปิดใช้งาน Row Level Security (RLS) และอนุญาตให้ Anon Key อ่าน-เขียนได้
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumable_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrow_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-write for assets" ON public.assets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for materials" ON public.consumable_materials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for borrow_logs" ON public.borrow_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for repair_logs" ON public.repair_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for requisitions" ON public.material_requisitions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for app_settings" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);

-- 8. เปิดใช้งาน Realtime Publication สำหรับทุกตาราง
ALTER PUBLICATION supabase_realtime ADD TABLE public.assets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.consumable_materials;
ALTER PUBLICATION supabase_realtime ADD TABLE public.borrow_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.repair_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.material_requisitions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;
`;

// Initial mock data conforming strictly to Thai government computer procurement standards
export const DEFAULT_SETTINGS: AppSettings = {
  app_title: 'ระบบบริหารจัดการครุภัณฑ์คอมพิวเตอร์และทรัพย์สิน',
  organization_name: 'ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร',
  sub_organization: 'กลุ่มงานพัฒนาระบบและโครงสร้างพื้นฐานดิจิทัล',
  garuda_symbol_type: 'official_gold',
  garuda_custom_url: '',
  logo_url: '',
  chief_procurement_officer: 'นายสมชาย วัฒนากิจ (หัวหน้าเจ้าหน้าที่พัสดุ)',
  procurement_officer: 'นางสาวกนกพร เลิศรัตนชัย (เจ้าหน้าที่พัสดุ)',
  approver_officer: 'ดร.ธนกฤต ประเสริฐสุข (ผู้อำนวยการศูนย์ฯ)',
  inspection_committee: [
    'นายสุรเดช สุขสวัสดิ์ (ประธานกรรมการตรวจนับ)',
    'นางสาวพิมพ์ชนก รัตนพร (กรรมการ)',
    'นายอภิสิทธิ์ มงคลชัย (กรรมการและเลขานุการ)'
  ],
  google_drive_folder_url: 'https://drive.google.com/drive/folders/1RlYuiMK968PVSDKwhkPItNgUgQSginGU?usp=sharing',
  departments: [
    'กลุ่มงานเทคโนโลยีสารสนเทศและการสื่อสาร',
    'กลุ่มงานบริหารงานทั่วไปและสารบรรณ',
    'กองคลังและพัสดุ',
    'กลุ่มงานวิชาการและวางแผนงาน',
    'กลุ่มงานกฎหมายและระเบียบการ',
    'ศูนย์บริการประชาชนและรับเรื่องร้องเรียน'
  ],
  categories: [
    'คอมพิวเตอร์ตั้งโต๊ะ (Desktop PC)',
    'คอมพิวเตอร์โน้ตบุ๊ก (Notebook)',
    'เครื่องแม่ข่าย (Server)',
    'จอแสดงผล (Monitor)',
    'เครื่องพิมพ์และสแกนเนอร์ (Printer/Scanner)',
    'อุปกรณ์เครือข่าย (Network Switch/Router)',
    'เครื่องสำรองไฟฟ้า (UPS)',
    'อุปกรณ์จัดเก็บข้อมูล (NAS/SAN Storage)',
    'อุปกรณ์ต่อพ่วงอื่นๆ (Peripherals)'
  ],
  fiscal_year: 2568
};

export const INITIAL_ASSETS: Asset[] = [
  {
    id: 'a1b2c3d4-0001-4000-8000-000000000001',
    asset_code: '7440-001-0001/2566',
    gfmis_code: '11060100004521',
    serial_number: 'SN-DELL-894721',
    name: 'เครื่องคอมพิวเตอร์ประมวลผลทั่วไป (Desktop PC)',
    category: 'คอมพิวเตอร์ตั้งโต๊ะ (Desktop PC)',
    brand_model: 'Dell OptiPlex 7090 Tower',
    specifications: 'Intel Core i7-11700, RAM 16GB DDR4, SSD M.2 512GB, จอ 23.8 นิ้ว Full HD',
    acquisition_date: '2023-03-15',
    acquisition_method: 'ประกวดราคาอิเล็กทรอนิกส์ (e-bidding)',
    purchase_order_no: 'PO-ICT-2566/042',
    cost: 32500,
    lifespan_years: 5,
    depreciation_rate: 20,
    salvage_value: 1,
    status: 'in_use',
    department: 'กองคลังและพัสดุ',
    current_user: 'นางสุภาภรณ์ ชัยชนะ',
    location: 'อาคารเฉลิมพระเกียรติ ชั้น 2 ห้อง 204',
    image_url: 'https://drive.google.com/drive/folders/1RlYuiMK968PVSDKwhkPItNgUgQSginGU?usp=sharing',
    notes: 'ใช้งานระบบ GFMIS และระบบบัญชีหน่วยงาน'
  },
  {
    id: 'a1b2c3d4-0002-4000-8000-000000000002',
    asset_code: '7440-002-0005/2565',
    gfmis_code: '11060100003890',
    serial_number: 'SN-HP-NB-448102',
    name: 'เครื่องคอมพิวเตอร์พกพา (Notebook)',
    category: 'คอมพิวเตอร์โน้ตบุ๊ก (Notebook)',
    brand_model: 'HP ProBook 450 G8',
    specifications: 'Intel Core i5-1135G7, RAM 16GB, SSD 512GB NVMe, จอ 15.6 นิ้ว FHD',
    acquisition_date: '2022-08-10',
    acquisition_method: 'วิธีเฉพาะเจาะจง',
    purchase_order_no: 'PO-ICT-2565/089',
    cost: 28900,
    lifespan_years: 5,
    depreciation_rate: 20,
    salvage_value: 1,
    status: 'borrowed',
    department: 'กลุ่มงานวิชาการและวางแผนงาน',
    current_user: 'นายกิตติศักดิ์ พูลสวัสดิ์',
    location: 'อาคาร 1 ชั้น 3 ห้องประชุม 301 (ยืมจัดสัมมนา)',
    image_url: 'https://drive.google.com/drive/folders/1RlYuiMK968PVSDKwhkPItNgUgQSginGU?usp=sharing',
    notes: 'ยืมไปปฏิบัติราชการประชุมเชิงปฏิบัติการ'
  },
  {
    id: 'a1b2c3d4-0003-4000-8000-000000000003',
    asset_code: '7440-003-0001/2567',
    gfmis_code: '11060100005112',
    serial_number: 'SN-HPE-SRV-90124',
    name: 'เครื่องคอมพิวเตอร์แม่ข่าย (Server Dual CPU)',
    category: 'เครื่องแม่ข่าย (Server)',
    brand_model: 'HPE ProLiant DL380 Gen10',
    specifications: '2x Intel Xeon Silver 4314, RAM 64GB ECC, 4x 1.2TB SAS 10K RAID5, 800W Redundant PSU',
    acquisition_date: '2024-01-20',
    acquisition_method: 'ประกวดราคาอิเล็กทรอนิกส์ (e-bidding)',
    purchase_order_no: 'PO-SRV-2567/005',
    cost: 185000,
    lifespan_years: 5,
    depreciation_rate: 20,
    salvage_value: 1,
    status: 'in_use',
    department: 'กลุ่มงานเทคโนโลยีสารสนเทศและการสื่อสาร',
    current_user: 'นายธนกฤต วิศวกรไอที',
    location: 'ห้องดาต้าเซ็นเตอร์ (Server Room) ชั้นใต้ดิน แร็ค R02-U18',
    image_url: 'https://drive.google.com/drive/folders/1RlYuiMK968PVSDKwhkPItNgUgQSginGU?usp=sharing',
    notes: 'เครื่องเซิร์ฟเวอร์ฐานข้อมูลและระบบสารบรรณอิเล็กทรอนิกส์'
  },
  {
    id: 'a1b2c3d4-0004-4000-8000-000000000004',
    asset_code: '7440-004-0012/2564',
    gfmis_code: '11060100002951',
    serial_number: 'SN-CANON-MFP-3391',
    name: 'เครื่องพิมพ์เลเซอร์มัลติฟังก์ชัน (Multifunction Printer)',
    category: 'เครื่องพิมพ์และสแกนเนอร์ (Printer/Scanner)',
    brand_model: 'Canon imageRUNNER ADVANCE DX C3826i',
    specifications: 'พิมพ์สี/ขาวดำ 26 ppm, สแกน 2 หน้าอัตโนมัติ, Network LAN/Wi-Fi',
    acquisition_date: '2021-05-18',
    acquisition_method: 'วิธีคัดเลือก',
    purchase_order_no: 'PO-ADM-2564/034',
    cost: 65000,
    lifespan_years: 5,
    depreciation_rate: 20,
    salvage_value: 1,
    status: 'repairing',
    department: 'กลุ่มงานบริหารงานทั่วไปและสารบรรณ',
    current_user: 'นางพิมพิมล สุขเกษม',
    location: 'อาคาร 1 ชั้น 1 แผนกสารบรรณกลาง',
    image_url: 'https://drive.google.com/drive/folders/1RlYuiMK968PVSDKwhkPItNgUgQSginGU?usp=sharing',
    notes: 'ฟีดกระดาษติดขัดและชุดความร้อนมีเสียงดัง ส่งเคลมศูนย์บริการ'
  },
  {
    id: 'a1b2c3d4-0005-4000-8000-000000000005',
    asset_code: '7440-005-0002/2562',
    gfmis_code: '11060100001004',
    serial_number: 'SN-CISCO-SW-55198',
    name: 'อุปกรณ์สวิตช์เครือข่าย 24 พอร์ต (Gigabit Switch L3)',
    category: 'อุปกรณ์เครือข่าย (Network Switch/Router)',
    brand_model: 'Cisco Catalyst 2960-X 24TS-L',
    specifications: '24x 10/100/1000 Ethernet Ports, 4x 1G SFP Uplinks, LAN Base',
    acquisition_date: '2019-02-14',
    acquisition_method: 'ประกวดราคาอิเล็กทรอนิกส์ (e-bidding)',
    purchase_order_no: 'PO-NET-2562/011',
    cost: 54000,
    lifespan_years: 5,
    depreciation_rate: 20,
    salvage_value: 1,
    status: 'in_use',
    department: 'กลุ่มงานเทคโนโลยีสารสนเทศและการสื่อสาร',
    current_user: 'นายสมบัติ ดูแลเครือข่าย',
    location: 'ตู้ Rack ชั้น 3 อาคาร 2',
    image_url: 'https://drive.google.com/drive/folders/1RlYuiMK968PVSDKwhkPItNgUgQSginGU?usp=sharing',
    notes: 'อายุการใช้งานเกิน 5 ปีแล้ว มูลค่าสุทธิคงเหลือ 1 บาท เสนอจัดซื้อทดแทนในปีงบประมาณถัดไป'
  },
  {
    id: 'a1b2c3d4-0006-4000-8000-000000000006',
    asset_code: '7440-006-0008/2567',
    gfmis_code: '11060100005880',
    serial_number: 'SN-APC-UPS-7723',
    name: 'เครื่องสำรองไฟฟ้า ขนาด 1500VA (Smart UPS)',
    category: 'เครื่องสำรองไฟฟ้า (UPS)',
    brand_model: 'APC Smart-UPS 1500VA LCD 230V',
    specifications: '1000 Watts / 1500 VA, LCD Status Display, Pure Sine Wave, 8 Outlets',
    acquisition_date: '2024-04-12',
    acquisition_method: 'วิธีเฉพาะเจาะจง',
    purchase_order_no: 'PO-UPS-2567/018',
    cost: 21500,
    lifespan_years: 5,
    depreciation_rate: 20,
    salvage_value: 1,
    status: 'available',
    department: 'ศูนย์บริการประชาชนและรับเรื่องร้องเรียน',
    current_user: 'พร้อมจ่ายใช้งานสำรอง',
    location: 'คลังพัสดุไอที ชั้น 1 ห้อง 102 ตู้ S-03',
    image_url: 'https://drive.google.com/drive/folders/1RlYuiMK968PVSDKwhkPItNgUgQSginGU?usp=sharing',
    notes: 'ของใหม่ตรวจรับพร้อมใช้งาน'
  }
];

export const INITIAL_MATERIALS: ConsumableMaterial[] = [
  {
    id: 'm-001',
    code: 'MAT-IT-001',
    name: 'ตลับหมึกพิมพ์เลเซอร์ HP LaserJet Black 85A (CE285A)',
    category: 'หมึกพิมพ์ (Toner/Ink)',
    unit: 'ตลับ',
    stock_quantity: 3,
    min_threshold: 5,
    unit_price: 2450,
    location: 'ตู้พัสดุ C1 ชั้น 1',
    last_restocked: '2024-09-10',
    monthly_usage_avg: 4
  },
  {
    id: 'm-002',
    code: 'MAT-IT-002',
    name: 'สายสัญญาณเครือข่าย UTP Cat6 Patch Cord (ความยาว 3 เมตร)',
    category: 'อุปกรณ์เน็ตเวิร์ก (Network Cables)',
    unit: 'เส้น',
    stock_quantity: 18,
    min_threshold: 10,
    unit_price: 140,
    location: 'ชั้นวาง B2',
    last_restocked: '2024-10-01',
    monthly_usage_avg: 5
  },
  {
    id: 'm-003',
    code: 'MAT-IT-003',
    name: 'เมาส์ออปติคัลไร้สาย USB 2.4GHz (Logitech B170)',
    category: 'อุปกรณ์ต่อพ่วง (Peripherals)',
    unit: 'อัน',
    stock_quantity: 4,
    min_threshold: 8,
    unit_price: 290,
    location: 'ตู้พัสดุ A3 ชั้น 1',
    last_restocked: '2024-08-15',
    monthly_usage_avg: 6
  },
  {
    id: 'm-004',
    code: 'MAT-IT-004',
    name: 'หน่วยความจำสำรอง Flash Drive USB 3.2 ความจุ 64GB',
    category: 'สื่อบันทึกข้อมูล (Storage Media)',
    unit: 'อัน',
    stock_quantity: 2,
    min_threshold: 6,
    unit_price: 220,
    location: 'ลิ้นชักนิรภัยห้องไอที',
    last_restocked: '2024-07-22',
    monthly_usage_avg: 3
  },
  {
    id: 'm-005',
    code: 'MAT-IT-005',
    name: 'ปลั๊กพ่วงนิรภัย มอก. 4 ช่อง 4 สวิตช์ สายยาว 5 เมตร',
    category: 'อุปกรณ์ไฟฟ้าและสำรองไฟ',
    unit: 'ตัว',
    stock_quantity: 9,
    min_threshold: 5,
    unit_price: 490,
    location: 'ตู้พัสดุ D1 ชั้น 1',
    last_restocked: '2024-09-25',
    monthly_usage_avg: 2
  }
];

export const INITIAL_BORROWS: BorrowLog[] = [
  {
    id: 'b-001',
    asset_id: 'a1b2c3d4-0002-4000-8000-000000000002',
    asset_code: '7440-002-0005/2565',
    asset_name: 'เครื่องคอมพิวเตอร์พกพา (Notebook) HP ProBook 450 G8',
    borrower_name: 'นายกิตติศักดิ์ พูลสวัสดิ์',
    borrower_department: 'กลุ่มงานวิชาการและวางแผนงาน',
    borrow_date: '2024-10-20',
    expected_return_date: '2024-10-30',
    status: 'borrowed',
    purpose: 'ใช้งานนำเสนอผลงานวิชาการและการประชุมเชิงปฏิบัติการระดับจังหวัด',
    officer_name: 'นางสาวกนกพร เลิศรัตนชัย (เจ้าหน้าที่พัสดุ)'
  }
];

export const INITIAL_REPAIRS: RepairLog[] = [
  {
    id: 'r-001',
    asset_id: 'a1b2c3d4-0004-4000-8000-000000000004',
    asset_code: '7440-004-0012/2564',
    asset_name: 'เครื่องพิมพ์เลเซอร์มัลติฟังก์ชัน Canon DX C3826i',
    issue_description: 'ฟีดกระดาษติดขัดตลอดเวลา รหัสข้อผิดพลาด E012-0001 และชุดดรัมมีคราบหมึกเลอะหน้ากระดาษ',
    reporter_name: 'นางพิมพิมล สุขเกษม',
    reporter_department: 'กลุ่มงานบริหารงานทั่วไปและสารบรรณ',
    report_date: '2024-10-22',
    status: 'in_progress',
    repair_vendor: 'บริษัท แคนนอน มาร์เก็ตติ้ง (ไทยแลนด์) จำกัด',
    repair_cost: 4800,
    invoice_no: 'INV-CN-202410-091',
    recommend_disposal: false
  }
];

export const INITIAL_REQUISITIONS: MaterialRequisitionLog[] = [
  {
    id: 'req-001',
    material_id: 'm-001',
    material_code: 'MAT-IT-001',
    material_name: 'ตลับหมึกพิมพ์เลเซอร์ HP LaserJet Black 85A (CE285A)',
    quantity: 1,
    unit: 'ตลับ',
    recipient_name: 'นางสุภาภรณ์ ชัยชนะ',
    department: 'กองคลังและพัสดุ',
    location: 'อาคารเฉลิมพระเกียรติ ชั้น 2 ห้อง 204',
    purpose: 'เปลี่ยนตลับหมึกพิมพ์ที่หมด สำหรับพิมพ์รายงานงบดุลและเอกสารเบิกจ่าย',
    officer_name: 'นางสาวกนกพร เลิศรัตนชัย (เจ้าหน้าที่พัสดุ)',
    requisition_date: '2024-10-24'
  },
  {
    id: 'req-002',
    material_id: 'm-002',
    material_code: 'MAT-IT-002',
    material_name: 'สายสัญญาณเครือข่าย UTP Cat6 Patch Cord (ความยาว 3 เมตร)',
    quantity: 2,
    unit: 'เส้น',
    recipient_name: 'นายกิตติศักดิ์ พูลสวัสดิ์',
    department: 'กลุ่มงานวิชาการและวางแผนงาน',
    location: 'อาคาร 1 ชั้น 3 ห้อง 301',
    purpose: 'ต่อสายสัญญาณคอมพิวเตอร์และเชื่อมต่อระบบเครือข่าย LAN จุดทำงานใหม่',
    officer_name: 'นางสาวกนกพร เลิศรัตนชัย (เจ้าหน้าที่พัสดุ)',
    requisition_date: '2024-10-25'
  }
];
