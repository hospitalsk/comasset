import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Asset, ConsumableMaterial } from '../types/asset';
import {
  RotateCw,
  Maximize2,
  Minimize2,
  Eye,
  ShieldCheck,
  Wrench,
  Package,
  Cpu,
  Server,
  Laptop,
  Monitor,
  Printer,
  Wifi,
  BatteryCharging,
  X,
  QrCode,
  ArrowLeftRight,
  Info,
  ExternalLink,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

interface ThreeAssetVisualizerProps {
  assets: Asset[];
  materials: ConsumableMaterial[];
  onSelectAsset?: (asset: Asset) => void;
  onOpenQR?: (asset: Asset) => void;
  onOpenBorrow?: (asset: Asset) => void;
  onOpenRepair?: (asset: Asset) => void;
}

type EquipmentZone = 'servers' | 'pc' | 'notebook' | 'network' | 'printer' | 'ups' | 'materials';

interface SelectedZoneInfo {
  zone: EquipmentZone;
  title: string;
  categoryName: string;
  description: string;
  matchingAssets: Asset[];
  matchingMaterials: ConsumableMaterial[];
}

export const ThreeAssetVisualizer: React.FC<ThreeAssetVisualizerProps> = ({
  assets,
  materials,
  onSelectAsset,
  onOpenQR,
  onOpenBorrow,
  onOpenRepair
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<SelectedZoneInfo | null>(null);
  const [hoveredZoneName, setHoveredZoneName] = useState<string | null>(null);

  // Group assets by equipment zones for quick lookup
  const serverAssets = assets.filter(a => a.category.includes('แม่ข่าย') || a.category.includes('Server'));
  const pcAssets = assets.filter(a => a.category.includes('ตั้งโต๊ะ') || a.category.includes('Desktop'));
  const notebookAssets = assets.filter(a => a.category.includes('โน้ตบุ๊ก') || a.category.includes('Notebook'));
  const networkAssets = assets.filter(a => a.category.includes('เครือข่าย') || a.category.includes('Network') || a.category.includes('Switch'));
  const printerAssets = assets.filter(a => a.category.includes('พิมพ์') || a.category.includes('Printer') || a.category.includes('สแกน'));
  const upsAssets = assets.filter(a => a.category.includes('สำรองไฟ') || a.category.includes('UPS'));
  const lowStockMaterials = materials.filter(m => m.stock_quantity <= m.min_threshold);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 400;

    // 1. Scene with BRIGHT / LIGHT THEME (ตามคำสั่ง: ใช้ 3D โทนสว่าง)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#f8fafc'); // Crisp slate-50 light canvas
    scene.fog = new THREE.FogExp2('#f8fafc', 0.02);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(13, 11, 15);
    camera.lookAt(0, 1.2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 2. Light Bright Studio Floor & Grid
    const floorGeo = new THREE.PlaneGeometry(28, 28);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.25,
      metalness: 0.05
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Blueprint grid (light sky blue & slate-200)
    const gridHelper = new THREE.GridHelper(26, 26, 0x0284c7, 0xe2e8f0);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // 3. Studio Lighting (Crisp & Bright)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const mainSun = new THREE.DirectionalLight(0xffffff, 1.6);
    mainSun.position.set(12, 20, 10);
    mainSun.castShadow = true;
    mainSun.shadow.mapSize.width = 1024;
    mainSun.shadow.mapSize.height = 1024;
    mainSun.shadow.camera.near = 0.5;
    mainSun.shadow.camera.far = 40;
    mainSun.shadow.bias = -0.0005;
    scene.add(mainSun);

    const fillLight = new THREE.DirectionalLight(0xbae6fd, 0.8);
    fillLight.position.set(-10, 14, -10);
    scene.add(fillLight);

    // Clickable Mesh Registry for Raycasting
    const interactiveMeshes: THREE.Object3D[] = [];

    // Helper to register interactive items
    const registerInteractive = (obj: THREE.Object3D, zone: EquipmentZone, label: string) => {
      obj.userData = { zone, label };
      interactiveMeshes.push(obj);
      obj.traverse(child => {
        if ((child as THREE.Mesh).isMesh) {
          child.userData = { zone, label };
          interactiveMeshes.push(child);
        }
      });
    };

    // --- MATERIALS (LIGHT THEME PALETTE) ---
    const rackWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.6, roughness: 0.2 });
    const rackGlassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45, roughness: 0.1 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.9, roughness: 0.1 });
    const deskTopMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const pcCaseWhiteMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.5, roughness: 0.3 });
    const monitorMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x0284c7, emissiveIntensity: 0.35 });
    const ledGreen = new THREE.MeshBasicMaterial({ color: 0x16a34a });
    const ledBlue = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
    const ledAmber = new THREE.MeshBasicMaterial({ color: 0xd97706 });
    const shelfMetalMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.3 });

    // -------------------------------------------------------------
    // ZONE 1: SERVER RACKS (Data Center / เครื่องแม่ข่าย)
    // -------------------------------------------------------------
    const serverGroup = new THREE.Group();
    serverGroup.position.set(-5.5, 0, -2);
    const rackGeo = new THREE.BoxGeometry(1.4, 4.4, 1.4);

    for (let r = 0; r < 3; r++) {
      const rack = new THREE.Mesh(rackGeo, rackWhiteMat);
      rack.position.set(0, 2.2, r * 2.2);
      rack.castShadow = true;
      rack.receiveShadow = true;
      serverGroup.add(rack);

      // Glass front door
      const glassDoor = new THREE.Mesh(new THREE.BoxGeometry(0.06, 4.2, 1.3), rackGlassMat);
      glassDoor.position.set(0.72, 2.2, r * 2.2);
      serverGroup.add(glassDoor);

      // Server Blade LEDs
      for (let l = 0; l < 6; l++) {
        const led = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), l % 2 === 0 ? ledGreen : ledBlue);
        led.position.set(0.74, 0.8 + l * 0.6, r * 2.2 + (l % 2 === 0 ? 0.3 : -0.3));
        serverGroup.add(led);
      }
    }
    scene.add(serverGroup);
    registerInteractive(serverGroup, 'servers', 'เครื่องแม่ข่ายเซิร์ฟเวอร์ (Server Racks)');

    // -------------------------------------------------------------
    // ZONE 2: WORKSTATION DESKTOP PCs (โต๊ะคอมพิวเตอร์ตั้งโต๊ะ)
    // -------------------------------------------------------------
    const pcGroup = new THREE.Group();
    pcGroup.position.set(1.5, 0, -2.5);

    // Desk
    const desk = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.14, 1.8), deskTopMat);
    desk.position.set(0, 1.4, 0);
    desk.castShadow = true;
    desk.receiveShadow = true;
    pcGroup.add(desk);

    // Desk Legs
    const legCoords = [[-1.6, -0.7], [1.6, -0.7], [-1.6, 0.7], [1.6, 0.7]];
    legCoords.forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.4), chromeMat);
      leg.position.set(lx, 0.7, lz);
      leg.castShadow = true;
      pcGroup.add(leg);
    });

    // 2x Monitors
    for (let m = 0; m < 2; m++) {
      const mon = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.06), monitorMat);
      mon.position.set(-0.8 + m * 1.6, 2.05, -0.3);
      mon.castShadow = true;
      pcGroup.add(mon);

      // Mon Stand
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.3), chromeMat);
      stand.position.set(-0.8 + m * 1.6, 1.55, -0.3);
      pcGroup.add(stand);

      // Tower Case
      const tower = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.0, 0.8), pcCaseWhiteMat);
      tower.position.set(-0.1 + m * 1.6, 1.9, 0.2);
      tower.castShadow = true;
      pcGroup.add(tower);
    }
    scene.add(pcGroup);
    registerInteractive(pcGroup, 'pc', 'คอมพิวเตอร์ตั้งโต๊ะ (Desktop Workstations)');

    // -------------------------------------------------------------
    // ZONE 3: NOTEBOOK / LAPTOP DOCKING STATION
    // -------------------------------------------------------------
    const notebookGroup = new THREE.Group();
    notebookGroup.position.set(1.5, 0, 2.5);

    const desk2 = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.14, 1.6), deskTopMat);
    desk2.position.set(0, 1.4, 0);
    desk2.castShadow = true;
    desk2.receiveShadow = true;
    notebookGroup.add(desk2);

    legCoords.forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.4), chromeMat);
      leg.position.set(lx * 0.9, 0.7, lz * 0.9);
      leg.castShadow = true;
      notebookGroup.add(leg);
    });

    // Open Notebook Laptops
    for (let n = 0; n < 2; n++) {
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.5), chromeMat);
      base.position.set(-0.7 + n * 1.4, 1.49, 0);
      notebookGroup.add(base);

      const screen = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.03), monitorMat);
      screen.position.set(-0.7 + n * 1.4, 1.72, -0.2);
      screen.rotation.x = -0.25;
      notebookGroup.add(screen);
    }
    scene.add(notebookGroup);
    registerInteractive(notebookGroup, 'notebook', 'คอมพิวเตอร์พกพา (Notebook/Laptop Hub)');

    // -------------------------------------------------------------
    // ZONE 4: MULTIFUNCTION PRINTER STATION (เครื่องพิมพ์ & สแกนเนอร์)
    // -------------------------------------------------------------
    const printerGroup = new THREE.Group();
    printerGroup.position.set(-1.8, 0, 4.5);

    const printBase = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.5, 1.2), pcCaseWhiteMat);
    printBase.position.set(0, 0.75, 0);
    printBase.castShadow = true;
    printerGroup.add(printBase);

    // Scanner lid & feeder
    const scannerLid = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 1.1), rackWhiteMat);
    scannerLid.position.set(0, 1.6, 0);
    printerGroup.add(scannerLid);

    // Touch Panel
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.02), monitorMat);
    panel.position.set(0.4, 1.8, 0.5);
    panel.rotation.x = -0.5;
    printerGroup.add(panel);

    scene.add(printerGroup);
    registerInteractive(printerGroup, 'printer', 'เครื่องพิมพ์ & สแกนเนอร์ (Multifunction Printer)');

    // -------------------------------------------------------------
    // ZONE 5: NETWORK SWITCH & ROUTER RACK (อุปกรณ์เครือข่าย)
    // -------------------------------------------------------------
    const networkGroup = new THREE.Group();
    networkGroup.position.set(-1.8, 0, -5.2);

    const netRack = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.2, 1.0), rackWhiteMat);
    netRack.position.set(0, 1.6, 0);
    netRack.castShadow = true;
    networkGroup.add(netRack);

    // Switch Blade Slots with Glowing Port LEDs
    for (let sw = 0; sw < 5; sw++) {
      const swMesh = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.15, 0.8), chromeMat);
      swMesh.position.set(0, 1.0 + sw * 0.45, 0.1);
      networkGroup.add(swMesh);

      // Port LEDs
      for (let p = 0; p < 8; p++) {
        const portLed = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), ledGreen);
        portLed.position.set(-0.4 + p * 0.11, 1.0 + sw * 0.45, 0.52);
        networkGroup.add(portLed);
      }
    }
    scene.add(networkGroup);
    registerInteractive(networkGroup, 'network', 'อุปกรณ์เครือข่าย (Network Switch/Router)');

    // -------------------------------------------------------------
    // ZONE 6: UPS & POWER BACKUP (เครื่องสำรองไฟ)
    // -------------------------------------------------------------
    const upsGroup = new THREE.Group();
    upsGroup.position.set(-5.5, 0, 4.5);

    const upsMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 1.4), pcCaseWhiteMat);
    upsMesh.position.set(0, 0.8, 0);
    upsMesh.castShadow = true;
    upsGroup.add(upsMesh);

    // LCD screen
    const upsLcd = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.02), monitorMat);
    upsLcd.position.set(0.61, 1.1, 0);
    upsLcd.rotation.y = Math.PI / 2;
    upsGroup.add(upsLcd);

    scene.add(upsGroup);
    registerInteractive(upsGroup, 'ups', 'เครื่องสำรองไฟฟ้า (Smart UPS Backup)');

    // -------------------------------------------------------------
    // ZONE 7: CONSUMABLES & MATERIAL STORAGE SHELVES (ชั้นวางวัสดุ)
    // -------------------------------------------------------------
    const shelfGroup = new THREE.Group();
    shelfGroup.position.set(6.2, 0, 0);

    const shelfPostGeo = new THREE.CylinderGeometry(0.06, 0.06, 3.8);
    const shelfCoords = [[-0.8, -1.8], [0.8, -1.8], [-0.8, 1.8], [0.8, 1.8]];
    shelfCoords.forEach(([sx, sz]) => {
      const post = new THREE.Mesh(shelfPostGeo, shelfMetalMat);
      post.position.set(sx, 1.9, sz);
      shelfGroup.add(post);
    });

    // 4 Shelves Levels
    for (let l = 0; l < 4; l++) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 3.8), shelfMetalMat);
      plank.position.set(0, 0.6 + l * 0.9, 0);
      shelfGroup.add(plank);

      // Material Boxes on each shelf
      for (let b = 0; b < 4; b++) {
        const isToner = l === 1;
        const boxColor = isToner ? 0x0284c7 : (b % 2 === 0 ? 0x10b981 : 0xf59e0b);
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(0.65, 0.4, 0.65),
          new THREE.MeshStandardMaterial({ color: boxColor, roughness: 0.4 })
        );
        box.position.set(0, 0.85 + l * 0.9, -1.2 + b * 0.8);
        box.castShadow = true;
        shelfGroup.add(box);
      }
    }

    // 3D Warning Beacon on top of shelf rack when materials are low
    let warningBeaconMesh: THREE.Mesh | null = null;
    let warningRingMesh: THREE.Mesh | null = null;
    if (lowStockMaterials.length > 0) {
      const beaconGeo = new THREE.SphereGeometry(0.24, 16, 16);
      const beaconMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0xef4444,
        emissiveIntensity: 0.9,
        roughness: 0.2
      });
      warningBeaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
      warningBeaconMesh.position.set(0, 3.9, 0);
      shelfGroup.add(warningBeaconMesh);

      const ringGeo = new THREE.TorusGeometry(0.42, 0.04, 8, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
      warningRingMesh = new THREE.Mesh(ringGeo, ringMat);
      warningRingMesh.rotation.x = Math.PI / 2;
      warningRingMesh.position.set(0, 3.9, 0);
      shelfGroup.add(warningRingMesh);
    }

    scene.add(shelfGroup);
    registerInteractive(
      shelfGroup,
      'materials',
      lowStockMaterials.length > 0
        ? `คลังวัสดุคอมพิวเตอร์ (⚠️ ใกล้หมดสต็อก ${lowStockMaterials.length} รายการ - คลิกดู)`
        : 'คลังวัสดุคอมพิวเตอร์สิ้นเปลือง (Material Storage Racks)'
    );

    // -------------------------------------------------------------
    // LIGHT PARTICLES (MOVING ASSET / SUPPLY FLOW)
    // -------------------------------------------------------------
    const particleCount = 20;
    const particleGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const particleMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
    const particles: THREE.Mesh[] = [];

    for (let p = 0; p < particleCount; p++) {
      const sp = new THREE.Mesh(particleGeo, particleMat);
      sp.position.set((Math.random() - 0.5) * 14, 0.2 + Math.random() * 2.2, (Math.random() - 0.5) * 12);
      scene.add(sp);
      particles.push(sp);
    }

    // -------------------------------------------------------------
    // RAYCASTING & INTERACTIVE CLICK HANDLER
    // -------------------------------------------------------------
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isMouseDown = false;
    let mouseDownPos = { x: 0, y: 0 };

    const getMatchingZoneInfo = (zone: EquipmentZone): SelectedZoneInfo => {
      switch (zone) {
        case 'servers':
          return {
            zone: 'servers',
            title: 'ตู้แม่ข่ายเซิร์ฟเวอร์ & Racks',
            categoryName: 'เครื่องแม่ข่าย (Server)',
            description: 'ระบบประมวลผลกลางและฐานข้อมูลหน่วยงานในห้อง Data Center',
            matchingAssets: serverAssets,
            matchingMaterials: []
          };
        case 'pc':
          return {
            zone: 'pc',
            title: 'คอมพิวเตอร์ตั้งโต๊ะ (Desktop Workstations)',
            categoryName: 'คอมพิวเตอร์ตั้งโต๊ะ (Desktop PC)',
            description: 'เครื่องคอมพิวเตอร์ประมวลผลทั่วไปประจำโต๊ะทำงานเจ้าหน้าที่',
            matchingAssets: pcAssets,
            matchingMaterials: []
          };
        case 'notebook':
          return {
            zone: 'notebook',
            title: 'คอมพิวเตอร์พกพา (Notebook Hub)',
            categoryName: 'คอมพิวเตอร์โน้ตบุ๊ก (Notebook)',
            description: 'เครื่องแล็ปท็อปสำหรับการประชุม นำเสนอผลงาน และการปฏิบัติงานนอกสถานที่',
            matchingAssets: notebookAssets,
            matchingMaterials: []
          };
        case 'printer':
          return {
            zone: 'printer',
            title: 'เครื่องพิมพ์ & สแกนเนอร์มัลติฟังก์ชัน',
            categoryName: 'เครื่องพิมพ์และสแกนเนอร์ (Printer/Scanner)',
            description: 'อุปกรณ์พิมพ์เอกสารราชการและสแกนหนังสือสารบรรณอิเล็กทรอนิกส์',
            matchingAssets: printerAssets,
            matchingMaterials: []
          };
        case 'network':
          return {
            zone: 'network',
            title: 'ตู้ระบบเครือข่าย & สวิตช์ (Network Racks)',
            categoryName: 'อุปกรณ์เครือข่าย (Network Switch/Router)',
            description: 'อุปกรณ์เชื่อมต่ออินเทอร์เน็ต เครือข่าย LAN และระบบไฟร์วอลล์ความปลอดภัย',
            matchingAssets: networkAssets,
            matchingMaterials: []
          };
        case 'ups':
          return {
            zone: 'ups',
            title: 'เครื่องสำรองไฟฟ้า (Smart UPS)',
            categoryName: 'เครื่องสำรองไฟฟ้า (UPS)',
            description: 'ระบบจ่ายไฟสำรองป้องกันไฟตก ไฟดับ ป้องกันอุปกรณ์คอมพิวเตอร์เสียหาย',
            matchingAssets: upsAssets,
            matchingMaterials: []
          };
        case 'materials':
        default:
          return {
            zone: 'materials',
            title: 'ชั้นจัดเก็บวัสดุคอมพิวเตอร์สิ้นเปลือง',
            categoryName: 'วัสดุคอมพิวเตอร์ (Consumables)',
            description: 'สต็อกตลับหมึกพิมพ์เลเซอร์, สายสัญญาณ LAN Cat6, เมาส์, Flash Drive และอะไหล่',
            matchingAssets: [],
            matchingMaterials: [...materials].sort((a, b) => {
              const aLow = a.stock_quantity <= a.min_threshold ? 1 : 0;
              const bLow = b.stock_quantity <= b.min_threshold ? 1 : 0;
              return bLow - aLow;
            })
          };
      }
    };

    // Camera Orbiting State
    let animationFrameId: number;
    let spherical = { radius: 21, theta: Math.PI / 4, phi: Math.PI / 3 };

    const updateCamera = () => {
      camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      camera.position.y = spherical.radius * Math.cos(spherical.phi);
      camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
      camera.lookAt(0, 1.4, 0);
    };
    updateCamera();

    const domEl = renderer.domElement;

    const onPointerDown = (e: MouseEvent) => {
      isMouseDown = true;
      mouseDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: MouseEvent) => {
      const rect = domEl.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Hover check
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes, false);
      if (intersects.length > 0 && intersects[0].object.userData?.label) {
        domEl.style.cursor = 'pointer';
        setHoveredZoneName(intersects[0].object.userData.label);
      } else {
        domEl.style.cursor = isMouseDown ? 'grabbing' : 'grab';
        setHoveredZoneName(null);
      }

      if (isMouseDown) {
        const deltaX = e.clientX - mouseDownPos.x;
        const deltaY = e.clientY - mouseDownPos.y;
        spherical.theta -= deltaX * 0.007;
        spherical.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, spherical.phi - deltaY * 0.007));
        updateCamera();
        mouseDownPos = { x: e.clientX, y: e.clientY };
      }
    };

    const onPointerUp = (e: MouseEvent) => {
      const dragDist = Math.hypot(e.clientX - mouseDownPos.x, e.clientY - mouseDownPos.y);
      isMouseDown = false;

      // If it was a clean click without significant drag (distance < 5px)
      if (dragDist < 6) {
        const rect = domEl.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(interactiveMeshes, false);

        if (intersects.length > 0) {
          const hit = intersects[0].object;
          const zoneKey = hit.userData?.zone as EquipmentZone;
          if (zoneKey) {
            const info = getMatchingZoneInfo(zoneKey);
            setSelectedZone(info);
          }
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      spherical.radius = Math.max(8, Math.min(32, spherical.radius + e.deltaY * 0.02));
      updateCamera();
    };

    domEl.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    domEl.addEventListener('wheel', onWheel, { passive: false });

    // Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Subtle slow auto-rotation when user is not dragging
      if (!isMouseDown && !selectedZone) {
        spherical.theta += 0.001;
        updateCamera();
      }

      // Pulse 3D warning beacon if materials are low
      if (warningBeaconMesh && warningRingMesh) {
        const pulse = (Math.sin(elapsedTime * 4.5) + 1) / 2;
        (warningBeaconMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.4 + pulse * 1.6;
        warningRingMesh.rotation.z += 0.04;
        const s = 0.9 + pulse * 0.35;
        warningRingMesh.scale.set(s, s, s);
      }

      // Animate light particles
      particles.forEach((p, idx) => {
        p.position.x += Math.sin(elapsedTime * 1.5 + idx) * 0.025;
        p.position.z += Math.cos(elapsedTime * 1.2 + idx) * 0.025;
        if (p.position.x > 8) p.position.x = -7;
        if (p.position.x < -8) p.position.x = 7;
        if (p.position.z > 8) p.position.z = -7;
        if (p.position.z < -8) p.position.z = 7;
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 400;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      domEl.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      domEl.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [assets, materials, selectedZone]);

  const handleSelectPredefinedZone = (zone: EquipmentZone) => {
    switch (zone) {
      case 'servers':
        setSelectedZone({
          zone: 'servers',
          title: 'ตู้แม่ข่ายเซิร์ฟเวอร์ & Racks',
          categoryName: 'เครื่องแม่ข่าย (Server)',
          description: 'ระบบประมวลผลกลางและฐานข้อมูลหน่วยงานในห้อง Data Center',
          matchingAssets: serverAssets,
          matchingMaterials: []
        });
        break;
      case 'pc':
        setSelectedZone({
          zone: 'pc',
          title: 'คอมพิวเตอร์ตั้งโต๊ะ (Desktop Workstations)',
          categoryName: 'คอมพิวเตอร์ตั้งโต๊ะ (Desktop PC)',
          description: 'เครื่องคอมพิวเตอร์ประมวลผลทั่วไปประจำโต๊ะทำงานเจ้าหน้าที่',
          matchingAssets: pcAssets,
          matchingMaterials: []
        });
        break;
      case 'notebook':
        setSelectedZone({
          zone: 'notebook',
          title: 'คอมพิวเตอร์พกพา (Notebook Hub)',
          categoryName: 'คอมพิวเตอร์โน้ตบุ๊ก (Notebook)',
          description: 'เครื่องแล็ปท็อปสำหรับการประชุมและปฏิบัติงานนอกสถานที่',
          matchingAssets: notebookAssets,
          matchingMaterials: []
        });
        break;
      case 'printer':
        setSelectedZone({
          zone: 'printer',
          title: 'เครื่องพิมพ์ & สแกนเนอร์มัลติฟังก์ชัน',
          categoryName: 'เครื่องพิมพ์และสแกนเนอร์ (Printer/Scanner)',
          description: 'อุปกรณ์พิมพ์เอกสารราชการและสแกนหนังสือสารบรรณอิเล็กทรอนิกส์',
          matchingAssets: printerAssets,
          matchingMaterials: []
        });
        break;
      case 'network':
        setSelectedZone({
          zone: 'network',
          title: 'ตู้ระบบเครือข่าย & สวิตช์ (Network Racks)',
          categoryName: 'อุปกรณ์เครือข่าย (Network Switch/Router)',
          description: 'อุปกรณ์เชื่อมต่อเครือข่าย LAN และอินเทอร์เน็ตความเร็วสูง',
          matchingAssets: networkAssets,
          matchingMaterials: []
        });
        break;
      case 'ups':
        setSelectedZone({
          zone: 'ups',
          title: 'เครื่องสำรองไฟฟ้า (Smart UPS)',
          categoryName: 'เครื่องสำรองไฟฟ้า (UPS)',
          description: 'ระบบจ่ายไฟสำรองป้องกันไฟดับ ป้องกันอุปกรณ์คอมพิวเตอร์เสียหาย',
          matchingAssets: upsAssets,
          matchingMaterials: []
        });
        break;
      case 'materials':
        setSelectedZone({
          zone: 'materials',
          title: 'ชั้นจัดเก็บวัสดุคอมพิวเตอร์สิ้นเปลือง',
          categoryName: 'วัสดุคอมพิวเตอร์ (Consumables)',
          description: 'สต็อกตลับหมึกพิมพ์เลเซอร์, สายสัญญาณ LAN Cat6, เมาส์, Flash Drive และอะไหล่',
          matchingAssets: [],
          matchingMaterials: [...materials].sort((a, b) => {
            const aLow = a.stock_quantity <= a.min_threshold ? 1 : 0;
            const bLow = b.stock_quantity <= b.min_threshold ? 1 : 0;
            return bLow - aLow;
          })
        });
        break;
    }
  };

  return (
    <div
      className={`relative bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden transition-all duration-300 shadow-2xs ${
        isFullscreen ? 'fixed inset-4 z-50 shadow-2xl' : 'w-full h-96 lg:h-[450px]'
      }`}
    >
      {/* 3D WebGL Canvas */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Header Overlay with Light Theme & Clickable Guides */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-200/90 text-xs text-slate-800 shadow-xs">
          <Sparkles className="w-4 h-4 text-sky-600 animate-pulse" />
          <span className="font-semibold text-slate-900">3D คลังครุภัณฑ์ & วัสดุคอมพิวเตอร์ (โทนสว่าง)</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 hidden md:inline">
            💡 <strong>คลิกที่อุปกรณ์ใดๆ ในภาพ 3D</strong> เพื่อเปิดดูรายการครุภัณฑ์และวัสดุจริง
          </span>
        </div>

        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 rounded-xl border border-slate-200 shadow-2xs transition-colors"
            title={isFullscreen ? 'ย่อหน้าจอ' : 'ขยายเต็มหน้าจอ'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 3D Low-Stock Alert Badge Overlay (คำสั่ง: วัสดุที่ใกล้หมด แจ้งเตือนใน dashboard 3d ด้วย) */}
      {lowStockMaterials.length > 0 && (
        <div className="absolute top-13 left-3 z-10 pointer-events-auto">
          <button
            onClick={() => handleSelectPredefinedZone('materials')}
            className="flex items-center gap-2 px-3 py-1.5 bg-rose-600/95 hover:bg-rose-700 text-white rounded-xl shadow-lg border border-rose-400 backdrop-blur-md text-xs font-semibold animate-pulse transition-all group"
            title="คลิกเพื่อตรวจสอบรายการวัสดุที่ใกล้หมดสต็อกใน 3D"
          >
            <AlertTriangle className="w-4 h-4 text-amber-200 shrink-0" />
            <span>⚠️ แจ้งเตือน 3D: วัสดุใกล้หมดสต็อก {lowStockMaterials.length} รายการ</span>
            <span className="text-[10px] bg-rose-800/80 px-2 py-0.5 rounded-md font-normal group-hover:bg-rose-900">
              คลิกดูในคลัง 3D
            </span>
          </button>
        </div>
      )}

      {/* Hover Tooltip when cursor points to 3D equipment */}
      {hoveredZoneName && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="bg-slate-900/90 text-white text-xs px-3.5 py-1.5 rounded-full shadow-md backdrop-blur-md border border-slate-700 flex items-center gap-1.5 animate-bounce">
            <Info className="w-3.5 h-3.5 text-sky-400" />
            <span>คลิกเพื่อดู: <strong>{hoveredZoneName}</strong></span>
          </div>
        </div>
      )}

      {/* Quick Clickable Stations Bar at Bottom-Left */}
      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center gap-1.5 pointer-events-none">
        <div className="pointer-events-auto flex flex-wrap items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200/90 shadow-xs">
          <button
            onClick={() => handleSelectPredefinedZone('servers')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
              selectedZone?.zone === 'servers'
                ? 'bg-sky-600 text-white shadow-2xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-sky-500" />
            <span>เซิร์ฟเวอร์ ({serverAssets.length})</span>
          </button>

          <button
            onClick={() => handleSelectPredefinedZone('pc')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
              selectedZone?.zone === 'pc'
                ? 'bg-sky-600 text-white shadow-2xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Monitor className="w-3.5 h-3.5 text-blue-500" />
            <span>PC ตั้งโต๊ะ ({pcAssets.length})</span>
          </button>

          <button
            onClick={() => handleSelectPredefinedZone('notebook')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
              selectedZone?.zone === 'notebook'
                ? 'bg-sky-600 text-white shadow-2xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Laptop className="w-3.5 h-3.5 text-purple-500" />
            <span>โน้ตบุ๊ก ({notebookAssets.length})</span>
          </button>

          <button
            onClick={() => handleSelectPredefinedZone('network')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
              selectedZone?.zone === 'network'
                ? 'bg-sky-600 text-white shadow-2xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Wifi className="w-3.5 h-3.5 text-emerald-500" />
            <span>เน็ตเวิร์ก ({networkAssets.length})</span>
          </button>

          <button
            onClick={() => handleSelectPredefinedZone('printer')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
              selectedZone?.zone === 'printer'
                ? 'bg-sky-600 text-white shadow-2xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Printer className="w-3.5 h-3.5 text-amber-500" />
            <span>เครื่องพิมพ์ ({printerAssets.length})</span>
          </button>

          <button
            onClick={() => handleSelectPredefinedZone('ups')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
              selectedZone?.zone === 'ups'
                ? 'bg-sky-600 text-white shadow-2xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <BatteryCharging className="w-3.5 h-3.5 text-orange-500" />
            <span>UPS ({upsAssets.length})</span>
          </button>

          <button
            onClick={() => handleSelectPredefinedZone('materials')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
              selectedZone?.zone === 'materials'
                ? 'bg-sky-600 text-white shadow-2xs'
                : lowStockMaterials.length > 0
                ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 font-semibold border border-rose-200'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Package className={`w-3.5 h-3.5 ${lowStockMaterials.length > 0 ? 'text-rose-600' : 'text-teal-500'}`} />
            <span>คลังวัสดุ ({materials.length})</span>
            {lowStockMaterials.length > 0 && (
              <span className="px-1.5 py-0.2 text-[9px] bg-rose-600 text-white rounded-full font-bold">
                {lowStockMaterials.length} ใกล้หมด
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3D INSPECTOR DRAWER (Appears when clicking 3D equipment)                 */}
      {/* ========================================================================= */}
      {selectedZone && (
        <div className="absolute inset-y-0 right-0 w-full sm:w-96 bg-white/95 backdrop-blur-md border-l border-slate-200 shadow-2xl p-4 flex flex-col z-20 animate-in slide-in-from-right duration-200">
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                ข้อมูลอุปกรณ์ 3D ที่เลือก
              </span>
              <h3 className="font-bold text-slate-900 text-sm mt-1">{selectedZone.title}</h3>
            </div>
            <button
              onClick={() => setSelectedZone(null)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-slate-500 mt-2 mb-3 leading-relaxed">
            {selectedZone.description}
          </p>

          {/* Body: Matching Assets List OR Materials List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {/* Case 1: Assets in this zone */}
            {selectedZone.matchingAssets.length > 0 ? (
              selectedZone.matchingAssets.map(asset => (
                <div
                  key={asset.id}
                  className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs hover:border-sky-300 transition-all space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-slate-900 block text-[11px]">
                        {asset.asset_code}
                      </span>
                      <strong className="text-slate-800 text-xs block line-clamp-1">{asset.name}</strong>
                      <span className="text-[11px] text-slate-500 font-mono">{asset.brand_model}</span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-medium shrink-0 ${
                        asset.status === 'available'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : asset.status === 'in_use'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : asset.status === 'borrowed'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {asset.status === 'available' ? 'พร้อมใช้' : asset.status === 'in_use' ? 'ใช้งาน' : asset.status === 'borrowed' ? 'ยืม' : 'ซ่อม'}
                    </span>
                  </div>

                  <div className="border-t border-slate-100 pt-1.5 text-[11px] text-slate-600 flex items-center justify-between">
                    <span>ผู้ครอบครอง: {asset.current_user}</span>
                    <span className="font-mono font-semibold text-sky-700">{(Number(asset?.cost) || 0).toLocaleString()} ฿</span>
                  </div>

                  {/* Actions for this asset */}
                  <div className="flex items-center justify-end gap-1 pt-1 border-t border-slate-100">
                    {onSelectAsset && (
                      <button
                        onClick={() => onSelectAsset(asset)}
                        className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>เปิดดู</span>
                      </button>
                    )}
                    {onOpenQR && (
                      <button
                        onClick={() => onOpenQR(asset)}
                        className="px-2.5 py-1 text-[11px] bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-md font-medium transition-colors flex items-center gap-1"
                        title="สร้าง QR Code"
                      >
                        <QrCode className="w-3 h-3" />
                        <span>QR</span>
                      </button>
                    )}
                    {onOpenBorrow && asset.status !== 'borrowed' && (
                      <button
                        onClick={() => onOpenBorrow(asset)}
                        className="px-2 py-1 text-[11px] bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-md font-medium transition-colors"
                      >
                        ยืม
                      </button>
                    )}
                    {onOpenRepair && (
                      <button
                        onClick={() => onOpenRepair(asset)}
                        className="px-2 py-1 text-[11px] bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-md font-medium transition-colors"
                      >
                        ซ่อม
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : selectedZone.matchingMaterials.length > 0 ? (
              /* Case 2: Materials on shelves */
              <>
                {lowStockMaterials.length > 0 && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2 shadow-2xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-semibold">
                        แจ้งเตือนสต็อกขั้นต่ำ ({lowStockMaterials.length} รายการ)
                      </strong>
                      <span className="text-[11px] text-rose-700 leading-tight block mt-0.5">
                        มีวัสดุคงเหลือต่ำกว่าเกณฑ์ความปลอดภัย ควรเร่งจัดทำแผนจัดซื้อพัสดุเพิ่ม
                      </span>
                    </div>
                  </div>
                )}
                {selectedZone.matchingMaterials.map(mat => {
                const isLow = mat.stock_quantity <= mat.min_threshold;
                return (
                  <div
                    key={mat.id}
                    className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs hover:border-emerald-300 transition-all space-y-1.5 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <strong className="text-slate-800 text-xs block">{mat.name}</strong>
                        <span className="text-[10px] text-slate-400 font-mono">{mat.code} · {mat.location}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          isLow
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {isLow ? 'ใกล้หมด' : 'พร้อมจ่าย'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                      <span className="text-slate-600">คงเหลือในคลัง:</span>
                      <strong className="font-mono text-slate-900 text-sm">
                        {mat.stock_quantity} {mat.unit}
                      </strong>
                    </div>

                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
                      <span>เกณฑ์เตือน: {mat.min_threshold} {mat.unit}</span>
                      <span className="font-mono">{(Number(mat?.unit_price) || 0).toLocaleString()} ฿/{mat.unit}</span>
                    </div>
                  </div>
                );
              })}
              </>
            ) : (
              <div className="p-8 text-center text-slate-400">
                <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-medium text-slate-600 text-xs">ไม่มีรายการครุภัณฑ์ในหมวดหมู่นี้ในระบบ</p>
                <p className="text-[10px] text-slate-400 mt-1">สามารถกด "ลงทะเบียนครุภัณฑ์" เพื่อเพิ่มข้อมูลได้</p>
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-500">
              รวม: {selectedZone.matchingAssets.length || selectedZone.matchingMaterials.length} รายการ
            </span>
            <button
              onClick={() => setSelectedZone(null)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors text-xs"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
