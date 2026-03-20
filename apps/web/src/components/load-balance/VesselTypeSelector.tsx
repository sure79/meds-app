import React from 'react';
import {
  Ship, Fuel, Box, Waves, Truck, Star, Users,
} from 'lucide-react';

export interface VesselTypeOption {
  id: string;
  label: string;
  labelEn: string;
  icon: React.ReactNode;
  description: string;
  presetKey: string;
}

const VESSEL_TYPES: VesselTypeOption[] = [
  {
    id: 'bulk',
    label: '벌크선',
    labelEn: 'Bulk Carrier',
    icon: <Ship className="w-8 h-8" />,
    description: '곡물, 석탄, 철광석 등 산적 화물 운반선',
    presetKey: 'Bulk Carrier',
  },
  {
    id: 'container',
    label: '컨테이너선',
    labelEn: 'Container Ship',
    icon: <Box className="w-8 h-8" />,
    description: '컨테이너 화물 전용 운반선',
    presetKey: 'Container Ship',
  },
  {
    id: 'tanker',
    label: '유조선',
    labelEn: 'Tanker',
    icon: <Fuel className="w-8 h-8" />,
    description: '원유, 석유제품, 화학물질 운반선',
    presetKey: 'Oil Tanker',
  },
  {
    id: 'lng',
    label: 'LNG 운반선',
    labelEn: 'LNG Carrier',
    icon: <Fuel className="w-8 h-8" />,
    description: '액화천연가스(LNG) 전용 운반선',
    presetKey: 'LNG Carrier',
  },
  {
    id: 'fishing',
    label: '어선',
    labelEn: 'Fishing Vessel',
    icon: <Waves className="w-8 h-8" />,
    description: '어업용 선박 (트롤어선, 선망어선 등)',
    presetKey: 'Fishing Vessel',
  },
  {
    id: 'tug',
    label: '예인선',
    labelEn: 'Tug Boat',
    icon: <Truck className="w-8 h-8" />,
    description: '항만 예인, 해상 예인 작업선',
    presetKey: 'Tug Boat',
  },
  {
    id: 'special',
    label: '특수선',
    labelEn: 'Special Purpose',
    icon: <Star className="w-8 h-8" />,
    description: '해양조사선, 해양플랜트 지원선 등',
    presetKey: 'Special Purpose',
  },
  {
    id: 'passenger',
    label: '여객선',
    labelEn: 'Passenger Ship',
    icon: <Users className="w-8 h-8" />,
    description: '여객 운송 전용 선박 (페리, 크루즈)',
    presetKey: 'Passenger Ship',
  },
];

interface VesselTypeSelectorProps {
  selectedType: string | null;
  onSelect: (vesselType: VesselTypeOption) => void;
}

export default function VesselTypeSelector({ selectedType, onSelect }: VesselTypeSelectorProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-300 mb-3">
        선종 선택 (Select Vessel Type)
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {VESSEL_TYPES.map((vt) => {
          const isSelected = selectedType === vt.id;
          return (
            <button
              key={vt.id}
              onClick={() => onSelect(vt)}
              className={`
                flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center
                ${isSelected
                  ? 'border-accent bg-accent/10 text-accent shadow-lg shadow-accent/10'
                  : 'border-navy-600 bg-navy-800 text-gray-400 hover:border-navy-500 hover:bg-navy-700/50 hover:text-gray-300'
                }
              `}
            >
              <div className={`${isSelected ? 'text-accent' : 'text-gray-500'}`}>
                {vt.icon}
              </div>
              <div>
                <div className={`text-sm font-semibold ${isSelected ? 'text-accent' : 'text-gray-300'}`}>
                  {vt.label}
                </div>
                <div className="text-[10px] text-gray-500">{vt.labelEn}</div>
              </div>
              <div className="text-[10px] leading-tight text-gray-500 mt-1">
                {vt.description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { VESSEL_TYPES };
