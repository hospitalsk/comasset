import React from 'react';

interface GarudaEmblemProps {
  className?: string;
  size?: number;
  customUrl?: string;
  type?: 'official_gold' | 'official_red' | 'custom';
}

export const GarudaEmblem: React.FC<GarudaEmblemProps> = ({
  className = '',
  size = 48,
  customUrl,
  type = 'official_gold'
}) => {
  if (type === 'custom' && customUrl) {
    return (
      <img
        src={customUrl}
        alt="ตราสัญลักษณ์ครุฑ"
        className={`object-contain ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  // Official Royal Thai Garuda (ตราครุฑ) detailed SVG vector representation
  const isGold = type === 'official_gold';
  const primaryColor = isGold ? '#D97706' : '#DC2626';
  const secondaryColor = isGold ? '#F59E0B' : '#EF4444';
  const crownColor = isGold ? '#FBBF24' : '#F87171';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block ${className}`}
      aria-label="ตราครุฑพ่าห์"
    >
      {/* Crown (ชฎา) */}
      <path
        d="M50 4L53 18L58 14L55 24L60 22L54 30L50 28L46 30L40 22L45 24L42 14L47 18L50 4Z"
        fill={crownColor}
        stroke={primaryColor}
        strokeWidth="1.2"
      />
      {/* Face & Beak (ใบหน้าและจงอยปาก) */}
      <circle cx="50" cy="33" r="6" fill={secondaryColor} stroke={primaryColor} strokeWidth="1" />
      <path d="M48 35L50 40L52 35Z" fill="#B45309" />
      {/* Eyes */}
      <circle cx="48" cy="32" r="1" fill="#1E293B" />
      <circle cx="52" cy="32" r="1" fill="#1E293B" />
      {/* Wings Outspread Left (ปีกซ้ายแผ่กว้าง) */}
      <path
        d="M44 38C35 32 20 28 8 36C12 44 22 48 32 49C22 52 14 58 10 66C20 68 30 64 40 58C32 64 25 72 22 80C32 78 40 70 45 62Z"
        fill={secondaryColor}
        stroke={primaryColor}
        strokeWidth="1.2"
      />
      {/* Wings Outspread Right (ปีกขวาแผ่กว้าง) */}
      <path
        d="M56 38C65 32 80 28 92 36C88 44 78 48 68 49C78 52 86 58 90 66C80 68 70 64 60 58C68 64 75 72 78 80C68 78 60 70 55 62Z"
        fill={secondaryColor}
        stroke={primaryColor}
        strokeWidth="1.2"
      />
      {/* Torso & Armor (ลำตัวและกรองศอ) */}
      <path
        d="M44 40L50 42L56 40L58 56L50 64L42 56L44 40Z"
        fill={crownColor}
        stroke={primaryColor}
        strokeWidth="1.2"
      />
      {/* Arms & Hands (กรและหัตถ์สองข้าง) */}
      <path d="M42 42C36 40 30 42 26 46L29 48C33 45 38 44 43 45Z" fill={primaryColor} />
      <path d="M58 42C64 40 70 42 74 46L71 48C67 45 62 44 57 45Z" fill={primaryColor} />
      {/* Tail Feathers (หางครุฑกระจาย) */}
      <path
        d="M50 63L47 78L50 88L53 78L50 63Z"
        fill={crownColor}
        stroke={primaryColor}
        strokeWidth="1"
      />
      <path d="M47 65L41 76L44 84L48 74Z" fill={secondaryColor} />
      <path d="M53 65L59 76L56 84L52 74Z" fill={secondaryColor} />
      {/* Legs & Talons (ขาและกรงเล็บเหยียบคอน) */}
      <path
        d="M43 62L38 75L33 80L36 82L41 77L45 66Z"
        fill={primaryColor}
      />
      <path
        d="M57 62L62 75L67 80L64 82L59 77L55 66Z"
        fill={primaryColor}
      />
      {/* Lotus pedestal or base flourish */}
      <path
        d="M30 84C42 88 58 88 70 84C62 87 38 87 30 84Z"
        fill={primaryColor}
      />
    </svg>
  );
};
