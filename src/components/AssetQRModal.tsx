import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Asset, AppSettings } from '../types/asset';
import { GarudaEmblem } from './GarudaEmblem';
import { X, Printer, Download, QrCode as QrIcon, Check, Copy } from 'lucide-react';

interface AssetQRModalProps {
  asset: Asset;
  settings: AppSettings;
  onClose: () => void;
  onOpenBorrow?: (asset: Asset) => void;
  onOpenRepair?: (asset: Asset) => void;
}

export const AssetQRModal: React.FC<AssetQRModalProps> = ({
  asset,
  settings,
  onClose,
  onOpenBorrow,
  onOpenRepair
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Content encoded in QR: standard format with asset code, S/N and direct link
  const qrPayload = JSON.stringify({
    asset_code: asset.asset_code,
    sn: asset.serial_number,
    name: asset.name,
    org: settings.organization_name
  });

  useEffect(() => {
    QRCode.toDataURL(
      qrPayload,
      {
        width: 320,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [qrPayload]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(asset.asset_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `QR_${asset.asset_code.replace(/\//g, '-')}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-100 text-sky-700 rounded-lg">
              <QrIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-base">QR Code & ป้ายทะเบียนครุภัณฑ์</h3>
              <p className="text-xs text-slate-500 font-mono">{asset.asset_code}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Official Gov Tag Preview (Printable Unit) */}
          <div
            id="printable-asset-sticker"
            className="p-4 bg-white border-2 border-slate-800 rounded-xl shadow-xs space-y-3 print:border-black print:m-0"
          >
            {/* Tag Header with Garuda */}
            <div className="flex items-center justify-between border-b border-slate-300 pb-2">
              <div className="flex items-center gap-2">
                <GarudaEmblem
                  size={36}
                  type={settings.garuda_symbol_type}
                  customUrl={settings.garuda_custom_url}
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 tracking-tight leading-tight">
                    {settings.organization_name}
                  </h4>
                  <p className="text-[10px] text-slate-600">
                    {settings.sub_organization || 'ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-slate-700 uppercase bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                ครุภัณฑ์ภาครัฐ
              </span>
            </div>

            {/* Tag Details & QR Side-by-side */}
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-1.5 text-xs text-slate-700">
                <div>
                  <span className="text-[10px] text-slate-500 block">รหัสครุภัณฑ์:</span>
                  <strong className="font-mono text-sm text-slate-900 tracking-wider">
                    {asset.asset_code}
                  </strong>
                </div>

                {asset.gfmis_code && (
                  <div>
                    <span className="text-[10px] text-slate-500 block">รหัสสินทรัพย์ GFMIS:</span>
                    <span className="font-mono font-medium text-slate-800">{asset.gfmis_code}</span>
                  </div>
                )}

                <div>
                  <span className="text-[10px] text-slate-500 block">Serial Number:</span>
                  <span className="font-mono text-slate-800">{asset.serial_number}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 block">รายการ:</span>
                  <p className="font-medium text-slate-800 line-clamp-1">{asset.name}</p>
                </div>

                <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-600">
                  <span>วันที่ได้มา: {asset.acquisition_date}</span>
                </div>
              </div>

              {/* QR Code Container */}
              <div className="shrink-0 flex flex-col items-center">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR Code for ${asset.asset_code}`}
                    className="w-28 h-28 border border-slate-200 rounded-lg p-1 bg-white"
                  />
                ) : (
                  <div className="w-28 h-28 bg-slate-100 animate-pulse rounded-lg flex items-center justify-center text-xs text-slate-400">
                    กำลังสร้าง QR...
                  </div>
                )}
                <span className="text-[9px] text-slate-500 mt-1 font-mono">สแกนตรวจสอบ</span>
              </div>
            </div>

            <div className="border-t border-dashed border-slate-300 pt-2 flex items-center justify-between text-[10px] text-slate-500">
              <span>หน่วยงาน: {asset.department}</span>
              <span>สถานที่: {asset.location}</span>
            </div>
          </div>

          {/* Quick Action Buttons for Scan Scenario */}
          <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-3 flex items-center justify-between">
            <span className="text-xs text-sky-800 font-medium">การจัดการครุภัณฑ์ชิ้นนี้:</span>
            <div className="flex items-center gap-2">
              {onOpenBorrow && asset.status !== 'borrowed' && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenBorrow(asset);
                  }}
                  className="px-3 py-1 text-xs bg-white text-sky-700 hover:bg-sky-100 font-medium rounded-lg border border-sky-200 transition-colors shadow-2xs"
                >
                  บันทึกยืม
                </button>
              )}
              {onOpenRepair && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenRepair(asset);
                  }}
                  className="px-3 py-1 text-xs bg-white text-amber-700 hover:bg-amber-100 font-medium rounded-lg border border-amber-200 transition-colors shadow-2xs"
                >
                  แจ้งซ่อม
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/60">
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'คัดลอกรหัสแล้ว' : 'คัดลอกรหัส'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลด QR</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์ป้ายสติกเกอร์</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
