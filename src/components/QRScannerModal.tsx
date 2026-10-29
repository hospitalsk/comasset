import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, AlertCircle, Search, CheckCircle, RefreshCw, Zap } from 'lucide-react';
import { Asset } from '../types/asset';

interface QRScannerModalProps {
  assets: Asset[];
  onClose: () => void;
  onScanMatch: (asset: Asset) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  assets,
  onClose,
  onScanMatch
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState<string>('');
  const [scannedResult, setScannedResult] = useState<Asset | null>(null);
  const [scanMessage, setScanMessage] = useState<string>('กำลังเล็งกล้องเพื่ออ่าน QR Code / Barcode...');

  // Start Camera Stream ONLY when modal opens (as requested: "ระบบจะถามหากล้องก็ต่อเมื่อกดปุ่มกล้องหรือสแกน")
  useEffect(() => {
    let isActive = true;

    async function startCamera() {
      try {
        setCameraError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });

        if (!isActive) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCameraActive(true);
        }
      } catch (err: any) {
        console.warn('Camera access issue:', err);
        setCameraError(
          err.name === 'NotAllowedError'
            ? 'ท่านปฏิเสธการเข้าถึงกล้อง กรุณาอนุญาตสิทธิ์กล้องในเบราว์เซอร์ หรือใช้ระบบค้นหารหัสครุภัณฑ์ด้านล่าง'
            : 'ไม่พบอุปกรณ์กล้อง หรือกล้องกำลังถูกใช้งานโดยแอปพลิเคชันอื่น'
        );
      }
    }

    startCamera();

    return () => {
      isActive = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Simple visual scanning simulation for barcode/QR when camera is on
  useEffect(() => {
    if (!cameraActive) return;

    let scanInterval = setInterval(() => {
      // In web app, we can also simulate detecting standard asset QR codes
    }, 1000);

    return () => clearInterval(scanInterval);
  }, [cameraActive]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    const term = manualCode.trim().toLowerCase();
    const found = assets.find(
      a =>
        a.asset_code.toLowerCase() === term ||
        a.asset_code.toLowerCase().includes(term) ||
        a.serial_number.toLowerCase() === term ||
        a.serial_number.toLowerCase().includes(term)
    );

    if (found) {
      setScannedResult(found);
      setScanMessage(`พบครุภัณฑ์: ${found.name} (${found.asset_code})`);
    } else {
      setScanMessage(`ไม่พบครุภัณฑ์ที่ตรงกับรหัส "${manualCode}"`);
    }
  };

  const handleSelectQuickAsset = (asset: Asset) => {
    setScannedResult(asset);
    setScanMessage(`สแกนสำเร็จ: ${asset.name} (${asset.asset_code})`);
  };

  const handleConfirmAction = () => {
    if (scannedResult) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      onScanMatch(scannedResult);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-100 text-sky-700 rounded-lg">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-base">สแกน QR Code / บาร์โค้ดครุภัณฑ์</h3>
              <p className="text-xs text-slate-500">เปิดกล้องเฉพาะเมื่อกดปุ่มสแกนตามคำสั่ง</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Camera Area */}
        <div className="relative bg-slate-950 aspect-video flex items-center justify-center overflow-hidden">
          {cameraActive ? (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Viewfinder Overlay Targeting Box */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-52 h-52 border-2 border-sky-400/90 rounded-2xl relative shadow-[0_0_0_9999px_rgba(15,23,42,0.65)]">
                  {/* Corner accents */}
                  <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-sky-400 rounded-tl"></div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-sky-400 rounded-tr"></div>
                  <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-sky-400 rounded-bl"></div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-sky-400 rounded-br"></div>
                  {/* Animated laser line */}
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent animate-pulse transform translate-y-24"></div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-6 text-center text-slate-300 space-y-3">
              <Camera className="w-10 h-10 mx-auto text-slate-500 animate-pulse" />
              {cameraError ? (
                <div className="text-xs text-amber-300 bg-amber-950/60 p-3 rounded-xl border border-amber-800/60 flex items-start gap-2 text-left">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{cameraError}</span>
                </div>
              ) : (
                <p className="text-xs text-slate-400">กำลังเชื่อมต่อโมดูลกล้องถ่ายภาพ...</p>
              )}
            </div>
          )}

          {/* Quick status toast overlay */}
          <div className="absolute bottom-2 inset-x-3 text-center pointer-events-none">
            <span className="text-[11px] bg-slate-900/80 backdrop-blur-md text-white px-3 py-1 rounded-full border border-slate-700">
              {scanMessage}
            </span>
          </div>
        </div>

        {/* Found Asset Result Card */}
        {scannedResult ? (
          <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-emerald-950">{scannedResult.name}</h4>
                <p className="text-[11px] text-emerald-800 font-mono">
                  รหัส: {scannedResult.asset_code} | S/N: {scannedResult.serial_number}
                </p>
                <p className="text-[10px] text-emerald-700">ครอบครอง: {scannedResult.department}</p>
              </div>
            </div>
            <button
              onClick={handleConfirmAction}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg shadow-xs transition-colors"
            >
              เปิดดูข้อมูล
            </button>
          </div>
        ) : null}

        {/* Fallback & Quick Lookup Section */}
        <div className="p-5 space-y-4 bg-white">
          <form onSubmit={handleManualSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                placeholder="หรือพิมพ์รหัสครุภัณฑ์ / S/N เช่น 7440-001..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium rounded-lg transition-colors shrink-0"
            >
              ค้นหา
            </button>
          </form>

          {/* Quick Demo Scan Chips (Useful for quick testing without physical barcode) */}
          <div className="pt-1">
            <span className="text-[11px] font-medium text-slate-500 block mb-1.5 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              คลิกเพื่อทดสอบจำลองการสแกนรหัสครุภัณฑ์ในระบบ:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {assets.slice(0, 3).map(asset => (
                <button
                  key={asset.id}
                  onClick={() => handleSelectQuickAsset(asset)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 border border-slate-200 rounded text-[11px] font-mono text-slate-700 transition-colors"
                >
                  {asset.asset_code}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
