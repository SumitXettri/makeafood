import React, { useState } from "react";

interface VoiceSettingsProps {
  rate: number;
  setRate: (r: number) => void;
  pitch: number;
  setPitch: (p: number) => void;
  volume: number;
  setVolume: (v: number) => void;
  showVoiceSettings: boolean;
  isSpeaking: boolean;
  handleStop: () => void;
  handleSpeak: () => void;
}

function VoiceSettings({
  rate,
  setRate,
  pitch,
  setPitch,
  volume,
  setVolume,
  showVoiceSettings,
  isSpeaking,
  handleStop,
  handleSpeak,
}: VoiceSettingsProps) {
  // Helper to update speech parameters and restart playback if necessary
  const updateSpeechParam = (setter: (val: number) => void, value: number) => {
    setter(value);
    // Only restart if the user is currently speaking and changing a setting
    if (isSpeaking && (setter === setRate || setter === setPitch)) {
      handleStop();
      setTimeout(handleSpeak, 100);
    }
  };

  return (
    <div
      className={`transition-all duration-500 ease-in-out overflow-hidden ${
        showVoiceSettings
          ? "max-h-96 opacity-100 mt-4 border-t border-orange-100 pt-4"
          : "max-h-0 opacity-0"
      }`}
    >
      <div className="space-y-3">
        {/* Rate Slider */}
        <div className="text-xs font-semibold text-gray-700">
          <label htmlFor="rate">Speech Rate ({rate.toFixed(1)}x)</label>
          <input
            id="rate"
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={rate}
            onChange={(e) =>
              updateSpeechParam(setRate, parseFloat(e.target.value))
            }
            className="w-full h-1 bg-orange-200 rounded-lg appearance-none cursor-pointer range-lg transition-all"
            style={{ accentColor: "#f97316" }}
          />
        </div>

        {/* Pitch Slider */}
        <div className="text-xs font-semibold text-gray-700">
          <label htmlFor="pitch">Pitch ({pitch.toFixed(1)})</label>
          <input
            id="pitch"
            type="range"
            min="0.5"
            max="1.5"
            step="0.1"
            value={pitch}
            onChange={(e) =>
              updateSpeechParam(setPitch, parseFloat(e.target.value))
            }
            className="w-full h-1 bg-orange-200 rounded-lg appearance-none cursor-pointer range-lg transition-all"
            style={{ accentColor: "#f97316" }}
          />
        </div>

        {/* Volume Slider */}
        <div className="text-xs font-semibold text-gray-700">
          <label htmlFor="volume">Volume ({volume.toFixed(1)})</label>
          <input
            id="volume"
            type="range"
            min="0.0"
            max="1.0"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full h-1 bg-orange-200 rounded-lg appearance-none cursor-pointer range-lg transition-all"
            style={{ accentColor: "#f97316" }}
          />
        </div>
      </div>
    </div>
  );
}

export default VoiceSettings;
