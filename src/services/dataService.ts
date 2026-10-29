import { supabase, INITIAL_ASSETS, INITIAL_MATERIALS, INITIAL_BORROWS, INITIAL_REPAIRS, DEFAULT_SETTINGS, INITIAL_REQUISITIONS } from '../lib/supabase';
import { Asset, ConsumableMaterial, BorrowLog, RepairLog, AppSettings, MaterialRequisitionLog } from '../types/asset';

const STORAGE_KEYS = {
  ASSETS: 'thaigov_assets_cache',
  MATERIALS: 'thaigov_materials_cache',
  BORROWS: 'thaigov_borrows_cache',
  REPAIRS: 'thaigov_repairs_cache',
  REQUISITIONS: 'thaigov_requisitions_cache',
  SETTINGS: 'thaigov_settings_cache',
};

// Check if localStorage has data or seed default
function getLocal<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(item);
  } catch {
    return defaultValue;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('LocalStorage write failed:', e);
  }
}

export function normalizeAsset(a: any): Asset {
  if (!a) return a;
  return {
    ...a,
    id: a.id || crypto.randomUUID(),
    asset_code: a.asset_code || '',
    name: a.name || '',
    category: a.category || 'ครุภัณฑ์คอมพิวเตอร์ทั่วไป',
    brand_model: a.brand_model || '',
    serial_number: a.serial_number || '',
    department: a.department || '',
    location: a.location || '',
    current_user: a.current_user || '',
    cost: Number(a.cost) || 0,
    salvage_value: a.salvage_value !== undefined ? (Number(a.salvage_value) || 0) : 1,
    lifespan_years: Number(a.lifespan_years) || 5,
    acquisition_date: a.acquisition_date || new Date().toISOString().split('T')[0],
    status: a.status || 'available'
  };
}

export function normalizeMaterial(m: any): ConsumableMaterial {
  if (!m) return m;
  return {
    ...m,
    id: m.id || crypto.randomUUID(),
    code: m.code || '',
    name: m.name || '',
    category: m.category || '',
    unit: m.unit || 'ชิ้น',
    stock_quantity: Number(m.stock_quantity) || 0,
    min_threshold: Number(m.min_threshold) || 0,
    unit_price: Number(m.unit_price) || 0,
    monthly_usage_avg: Number(m.monthly_usage_avg) || 0,
    location: m.location || ''
  };
}

export function normalizeRepair(r: any): RepairLog {
  if (!r) return r;
  return {
    ...r,
    id: r.id || crypto.randomUUID(),
    repair_cost: Number(r.repair_cost) || 0
  };
}

export const dataService = {
  // --- ASSETS ---
  async getAssets(): Promise<{ data: Asset[]; isRemote: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // Table may not be created yet in user's Supabase instance
        const local = getLocal<Asset[]>(STORAGE_KEYS.ASSETS, INITIAL_ASSETS).map(normalizeAsset);
        return { data: local, isRemote: false, error: error.message };
      }

      if (data && data.length > 0) {
        const normalized = data.map(normalizeAsset);
        setLocal(STORAGE_KEYS.ASSETS, normalized);
        return { data: normalized, isRemote: true };
      } else {
        // Supabase table exists but empty, check if we should populate or return local
        const local = getLocal<Asset[]>(STORAGE_KEYS.ASSETS, INITIAL_ASSETS).map(normalizeAsset);
        return { data: local, isRemote: true };
      }
    } catch {
      const local = getLocal<Asset[]>(STORAGE_KEYS.ASSETS, INITIAL_ASSETS).map(normalizeAsset);
      return { data: local, isRemote: false };
    }
  },

  async saveAsset(asset: Asset): Promise<{ success: boolean; data: Asset; isRemote: boolean }> {
    // 1. Update local cache immediately for zero-lag UI
    const current = getLocal<Asset[]>(STORAGE_KEYS.ASSETS, INITIAL_ASSETS);
    const index = current.findIndex(a => a.id === asset.id);
    let updatedList: Asset[];
    if (index >= 0) {
      updatedList = [...current];
      updatedList[index] = { ...asset, updated_at: new Date().toISOString() };
    } else {
      updatedList = [{ ...asset, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, ...current];
    }
    setLocal(STORAGE_KEYS.ASSETS, updatedList);

    // 2. Try Supabase
    try {
      const { data, error } = await supabase
        .from('assets')
        .upsert(asset)
        .select()
        .single();

      if (error) {
        console.warn('Supabase upsert failed (using local fallback):', error.message);
        return { success: true, data: asset, isRemote: false };
      }
      return { success: true, data: data as Asset, isRemote: true };
    } catch {
      return { success: true, data: asset, isRemote: false };
    }
  },

  async deleteAsset(id: string): Promise<{ success: boolean; isRemote: boolean }> {
    const current = getLocal<Asset[]>(STORAGE_KEYS.ASSETS, INITIAL_ASSETS);
    const filtered = current.filter(a => a.id !== id);
    setLocal(STORAGE_KEYS.ASSETS, filtered);

    try {
      const { error } = await supabase.from('assets').delete().eq('id', id);
      if (error) return { success: true, isRemote: false };
      return { success: true, isRemote: true };
    } catch {
      return { success: true, isRemote: false };
    }
  },

  // --- CONSUMABLES / MATERIALS ---
  async getMaterials(): Promise<{ data: ConsumableMaterial[]; isRemote: boolean }> {
    try {
      const { data, error } = await supabase
        .from('consumable_materials')
        .select('*')
        .order('name', { ascending: true });

      if (error || !data || data.length === 0) {
        return { data: getLocal<ConsumableMaterial[]>(STORAGE_KEYS.MATERIALS, INITIAL_MATERIALS).map(normalizeMaterial), isRemote: false };
      }
      const normalized = data.map(normalizeMaterial);
      setLocal(STORAGE_KEYS.MATERIALS, normalized);
      return { data: normalized, isRemote: true };
    } catch {
      return { data: getLocal<ConsumableMaterial[]>(STORAGE_KEYS.MATERIALS, INITIAL_MATERIALS).map(normalizeMaterial), isRemote: false };
    }
  },

  async saveMaterial(mat: ConsumableMaterial): Promise<{ success: boolean; data: ConsumableMaterial; isRemote: boolean }> {
    const current = getLocal<ConsumableMaterial[]>(STORAGE_KEYS.MATERIALS, INITIAL_MATERIALS);
    const index = current.findIndex(m => m.id === mat.id);
    let updatedList: ConsumableMaterial[];
    if (index >= 0) {
      updatedList = [...current];
      updatedList[index] = mat;
    } else {
      updatedList = [mat, ...current];
    }
    setLocal(STORAGE_KEYS.MATERIALS, updatedList);

    try {
      const { data, error } = await supabase.from('consumable_materials').upsert(mat).select().single();
      if (error) return { success: true, data: mat, isRemote: false };
      return { success: true, data: data as ConsumableMaterial, isRemote: true };
    } catch {
      return { success: true, data: mat, isRemote: false };
    }
  },

  async deleteMaterial(id: string): Promise<boolean> {
    const current = getLocal<ConsumableMaterial[]>(STORAGE_KEYS.MATERIALS, INITIAL_MATERIALS);
    setLocal(STORAGE_KEYS.MATERIALS, current.filter(m => m.id !== id));
    try {
      await supabase.from('consumable_materials').delete().eq('id', id);
    } catch (e) {
      console.warn(e);
    }
    return true;
  },

  // --- MATERIAL REQUISITIONS (เบิกใช้วัสดุ: ใคร, ที่ไหน, อย่างไร) ---
  async getRequisitions(): Promise<MaterialRequisitionLog[]> {
    try {
      const { data, error } = await supabase
        .from('material_requisitions')
        .select('*')
        .order('requisition_date', { ascending: false });

      if (error || !data || data.length === 0) {
        return getLocal<MaterialRequisitionLog[]>(STORAGE_KEYS.REQUISITIONS, INITIAL_REQUISITIONS);
      }
      setLocal(STORAGE_KEYS.REQUISITIONS, data);
      return data as MaterialRequisitionLog[];
    } catch {
      return getLocal<MaterialRequisitionLog[]>(STORAGE_KEYS.REQUISITIONS, INITIAL_REQUISITIONS);
    }
  },

  async saveRequisition(req: MaterialRequisitionLog): Promise<MaterialRequisitionLog> {
    const current = getLocal<MaterialRequisitionLog[]>(STORAGE_KEYS.REQUISITIONS, INITIAL_REQUISITIONS);
    const updated = [req, ...current];
    setLocal(STORAGE_KEYS.REQUISITIONS, updated);

    // Reduce material stock automatically
    const materials = getLocal<ConsumableMaterial[]>(STORAGE_KEYS.MATERIALS, INITIAL_MATERIALS);
    const targetMat = materials.find(m => m.id === req.material_id || m.code === req.material_code);
    if (targetMat) {
      targetMat.stock_quantity = Math.max(0, targetMat.stock_quantity - req.quantity);
      await this.saveMaterial(targetMat);
    }

    try {
      await supabase.from('material_requisitions').upsert(req);
    } catch (e) {
      console.warn('Requisition remote write:', e);
    }
    return req;
  },

  // --- BORROW LOGS ---
  async getBorrows(): Promise<BorrowLog[]> {
    try {
      const { data, error } = await supabase.from('borrow_logs').select('*').order('borrow_date', { ascending: false });
      if (error || !data || data.length === 0) {
        return getLocal<BorrowLog[]>(STORAGE_KEYS.BORROWS, INITIAL_BORROWS);
      }
      setLocal(STORAGE_KEYS.BORROWS, data);
      return data as BorrowLog[];
    } catch {
      return getLocal<BorrowLog[]>(STORAGE_KEYS.BORROWS, INITIAL_BORROWS);
    }
  },

  async saveBorrow(log: BorrowLog): Promise<BorrowLog> {
    const current = getLocal<BorrowLog[]>(STORAGE_KEYS.BORROWS, INITIAL_BORROWS);
    const index = current.findIndex(b => b.id === log.id);
    let updated: BorrowLog[];
    if (index >= 0) {
      updated = [...current];
      updated[index] = log;
    } else {
      updated = [log, ...current];
    }
    setLocal(STORAGE_KEYS.BORROWS, updated);

    // Also update asset status
    if (log.status === 'borrowed') {
      const assets = getLocal<Asset[]>(STORAGE_KEYS.ASSETS, INITIAL_ASSETS);
      const target = assets.find(a => a.id === log.asset_id);
      if (target) {
        target.status = 'borrowed';
        target.current_user = log.borrower_name;
        this.saveAsset(target);
      }
    } else if (log.status === 'returned') {
      const assets = getLocal<Asset[]>(STORAGE_KEYS.ASSETS, INITIAL_ASSETS);
      const target = assets.find(a => a.id === log.asset_id);
      if (target && target.status === 'borrowed') {
        target.status = 'available';
        target.current_user = 'พร้อมใช้งานในคลัง';
        this.saveAsset(target);
      }
    }

    try {
      await supabase.from('borrow_logs').upsert(log);
    } catch (e) {
      console.warn(e);
    }
    return log;
  },

  // --- REPAIR LOGS ---
  async getRepairs(): Promise<RepairLog[]> {
    try {
      const { data, error } = await supabase.from('repair_logs').select('*').order('report_date', { ascending: false });
      if (error || !data || data.length === 0) {
        return getLocal<RepairLog[]>(STORAGE_KEYS.REPAIRS, INITIAL_REPAIRS).map(normalizeRepair);
      }
      const normalized = data.map(normalizeRepair);
      setLocal(STORAGE_KEYS.REPAIRS, normalized);
      return normalized;
    } catch {
      return getLocal<RepairLog[]>(STORAGE_KEYS.REPAIRS, INITIAL_REPAIRS).map(normalizeRepair);
    }
  },

  async saveRepair(log: RepairLog): Promise<RepairLog> {
    const current = getLocal<RepairLog[]>(STORAGE_KEYS.REPAIRS, INITIAL_REPAIRS);
    const index = current.findIndex(r => r.id === log.id);
    let updated: RepairLog[];
    if (index >= 0) {
      updated = [...current];
      updated[index] = log;
    } else {
      updated = [log, ...current];
    }
    setLocal(STORAGE_KEYS.REPAIRS, updated);

    // Update asset status if needed
    const assets = getLocal<Asset[]>(STORAGE_KEYS.ASSETS, INITIAL_ASSETS);
    const target = assets.find(a => a.id === log.asset_id);
    if (target) {
      if (log.status === 'completed') {
        target.status = 'available';
      } else if (log.status === 'unrepairable' || log.recommend_disposal) {
        target.status = 'disposed';
      } else {
        target.status = 'repairing';
      }
      this.saveAsset(target);
    }

    try {
      await supabase.from('repair_logs').upsert(log);
    } catch (e) {
      console.warn(e);
    }
    return log;
  },

  // --- SETTINGS ---
  async getSettings(): Promise<AppSettings> {
    try {
      const { data, error } = await supabase.from('app_settings').select('*').eq('id', 'global_config').single();
      if (error || !data) {
        return getLocal<AppSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
      }
      setLocal(STORAGE_KEYS.SETTINGS, data);
      return data as AppSettings;
    } catch {
      return getLocal<AppSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    }
  },

  async saveSettings(settings: AppSettings): Promise<AppSettings> {
    setLocal(STORAGE_KEYS.SETTINGS, settings);
    try {
      await supabase.from('app_settings').upsert({ id: 'global_config', ...settings });
    } catch (e) {
      console.warn(e);
    }
    return settings;
  }
};
