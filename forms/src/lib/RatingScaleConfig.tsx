import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RatingScaleConfigProps {
  scaleMax: number;
  scaleLabels?: { low?: string; high?: string };
  onChange: (updates: { scaleMax?: number; scaleLabels?: { low?: string; high?: string } }) => void;
}

export function RatingScaleConfig({ scaleMax, scaleLabels, onChange }: RatingScaleConfigProps) {
  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center gap-4">
        <Label className="text-sm font-medium text-slate-700">Scale Range</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">1 to</span>
          <Input
            type="number"
            min={3}
            max={10}
            value={scaleMax || 5}
            onChange={(e) => onChange({ scaleMax: parseInt(e.target.value) || 5 })}
            className="w-16 h-8 text-center"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-slate-500">Low label (1)</Label>
          <Input
            value={scaleLabels?.low || ''}
            onChange={(e) => onChange({ scaleLabels: { ...scaleLabels, low: e.target.value } })}
            placeholder="1 (No issue)"
            className="text-sm"
          />
        </div>
        <div>
          <Label className="text-xs text-slate-500">High label (max)</Label>
          <Input
            value={scaleLabels?.high || ''}
            onChange={(e) => onChange({ scaleLabels: { ...scaleLabels, high: e.target.value } })}
            placeholder="5 (Major challenge)"
            className="text-sm"
          />
        </div>
      </div>
    </div>
  );
}

interface RatingScaleDisplayProps {
  scaleMax: number;
  scaleLabels?: { low?: string; high?: string };
  value?: number;
  themeColor: string;
  onSelect: (value: number) => void;
}

export function RatingScaleDisplay({ scaleMax, scaleLabels, value, themeColor, onSelect }: RatingScaleDisplayProps) {
  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex justify-between text-sm text-slate-500 px-2">
        <span>{scaleLabels?.low || '1'}</span>
        <span>{scaleLabels?.high || scaleMax || '5'}</span>
      </div>
      <div className="flex justify-between gap-2">
        {Array.from({ length: scaleMax || 5 }, (_, i) => i + 1).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onSelect(v)}
            className={`flex-1 py-4 rounded-lg border-2 text-lg font-medium transition-all ${
              value === v
                ? 'border-transparent text-white'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
            style={value === v ? { backgroundColor: themeColor } : {}}
          >
            {v}
          </button>
        ))}
      </div>
      <input type="hidden" value={value || ''} />
    </div>
  );
}