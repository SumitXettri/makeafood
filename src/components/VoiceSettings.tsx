import React from "react";

interface VoiceSettingsProps {
  rate: number;
  setRate: (rate: number) => void;
  pitch: number;
  setPitch: (pitch: number) => void;
  volume: number;
  setVolume: (volume: number) => void;
  showVoiceSettings: boolean;
}

function VoiceSettings({
  rate,
  setRate,
  pitch,
  setPitch,
  volume,
  setVolume,
  showVoiceSettings,
}: VoiceSettingsProps) {
  if (!showVoiceSettings) return null;

  return (
    <div className="p-4 bg-orange-50 border-t border-orange-200 space-y-3">
      <div>
        <label className="text-sm font-bold text-gray-700">
          Speed: {rate.toFixed(1)}x
        </label>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={rate}
          onChange={(e) => setRate(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>
      <div>
        <label className="text-sm font-bold text-gray-700">
          Pitch: {pitch.toFixed(1)}
        </label>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={pitch}
          onChange={(e) => setPitch(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>
      <div>
        <label className="text-sm font-bold text-gray-700">
          Volume: {volume.toFixed(1)}
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>
    </div>
  );
}

export default VoiceSettings;
