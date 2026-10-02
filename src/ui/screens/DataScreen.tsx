import { DataSources } from '../components/DataSources.tsx';
import type { CommuneState } from '../hooks/useCommuneData.ts';

interface DataScreenProps {
  state: CommuneState;
  onRetry: () => void;
}

export function DataScreen({ state, onRetry }: DataScreenProps) {
  return (
    <div className="screen screen--panel">
      <DataSources state={state} onRetry={onRetry} level={1} />
    </div>
  );
}
