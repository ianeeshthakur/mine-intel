import React, { useState } from 'react';
import TargetSelectionPanel from './TargetSelectionPanel';
import FieldNavigationMap from './FieldNavigationMap';
import type { LatLng } from '../../hooks/useFieldNavigation';

interface Target {
  id: number;
  targetId: string;
  latitude: number;
  longitude: number;
  prospectivityScore: number;
  priority: string;
  mlScored?: boolean;
}

interface Props {
  targets: Target[];
  userLocation: LatLng;
  isGpsReal: boolean;
  onClose: () => void;
}

type Phase = 'selecting' | 'navigating';

export default function NavigateToTarget({ targets, userLocation, isGpsReal, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>('selecting');
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null);

  const handleSelectTarget = (target: Target) => {
    setSelectedTarget(target);
    setPhase('navigating');
  };

  const handleBack = () => {
    if (phase === 'navigating') {
      setPhase('selecting');
      setSelectedTarget(null);
    } else {
      onClose();
    }
  };

  return (
    // Full-screen overlay — sits above everything including sidebar
    <div
      className="fixed inset-0 z-[1000] flex"
      style={{ animation: 'navOverlayIn 0.25s ease-out' }}
    >
      {phase === 'selecting' && (
        <div className="w-full max-w-md mx-auto h-full overflow-hidden shadow-2xl">
          <TargetSelectionPanel
            targets={targets}
            userLocation={userLocation}
            isGpsReal={isGpsReal}
            onSelectTarget={handleSelectTarget}
            onClose={onClose}
          />
        </div>
      )}

      {phase === 'navigating' && selectedTarget && (
        <div className="w-full h-full">
          <FieldNavigationMap
            target={selectedTarget}
            onBack={handleBack}
          />
        </div>
      )}

      <style>{`
        @keyframes navOverlayIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
