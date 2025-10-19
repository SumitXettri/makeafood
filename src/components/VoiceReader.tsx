import React, { useState, useEffect, useRef } from "react";
import DOMPurify from "dompurify";

interface VoiceProps {
  text: string;
}

const VoiceReader: React.FC<VoiceProps> = ({ text }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number | null>(
    null
  );
  const [currentWordIndex, setCurrentWordIndex] = useState<number | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // 🧹 Clean HTML into segments
  const parseHtmlToSegments = (html: string) => {
    if (!html) return [];

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Prefer list items
    const listItems = Array.from(doc.querySelectorAll("li")).map(
      (li) => li.textContent?.trim() || ""
    );

    if (listItems.length > 0) {
      return listItems.map((item) => {
        const words = item.split(/\s+/).filter(Boolean);
        return { original: item, words };
      });
    }

    // Otherwise split paragraphs
    const paragraphs = Array.from(doc.querySelectorAll("p")).map(
      (p) => p.textContent?.trim() || ""
    );

    if (paragraphs.length > 0) {
      return paragraphs.map((p) => {
        const words = p.split(/\s+/).filter(Boolean);
        return { original: p, words };
      });
    }

    // Fallback: strip tags & split sentences
    const plainText = doc.body.textContent || html.replace(/<[^>]+>/g, "");
    return plainText
      .split(/\. +/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => ({ original: s, words: s.split(/\s+/) }));
  };

  const segments = parseHtmlToSegments(text);
  const totalWords = segments.reduce((sum, seg) => sum + seg.words.length, 0);

  // ... keep your speechSynthesis logic as is ...

  /** 🔊 Start speaking text */
  const speak = () => {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech not supported. Try Chrome or Edge.");
      return;
    }

    window.speechSynthesis.cancel();
    setCurrentSegmentIndex(null);
    setCurrentWordIndex(null);
    setIsSpeaking(true);
    setIsPaused(false);

    let fullText = "";
    let charOffset = 0;
    const wordMap: {
      segment: number;
      word: number;
      start: number;
      end: number;
    }[] = [];

    // Map words to their character positions
    segments.forEach((segment, sIdx) => {
      segment.words.forEach((word, wIdx) => {
        wordMap.push({
          segment: sIdx,
          word: wIdx,
          start: charOffset,
          end: charOffset + word.length,
        });
        fullText += word + " ";
        charOffset += word.length + 1;
      });
      if (sIdx < segments.length - 1) {
        fullText += ". ";
        charOffset += 2;
      }
    });

    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.lang = "en-US";
    utterance.rate = 1;
    utterance.pitch = 1;

    // Highlight words as they are spoken
    utterance.addEventListener("boundary", (event) => {
      const charIndex = event.charIndex;
      for (let i = 0; i < wordMap.length; i++) {
        const { segment, word, start, end } = wordMap[i];
        if (charIndex >= start && charIndex < end) {
          setCurrentSegmentIndex(segment);
          setCurrentWordIndex(word);
          break;
        }
      }
    });

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentSegmentIndex(null);
      setCurrentWordIndex(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  /** ⏹ Stop speaking */
  const stop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentSegmentIndex(null);
    setCurrentWordIndex(null);
  };

  /** ⏸ Pause / ▶ Resume */
  const togglePause = () => {
    if (!isSpeaking) return;
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <div className="bg-white rounded-xl shadow border border-gray-200">
      {/* Header with stats + buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50 border-b border-gray-200">
        <div className="text-sm text-gray-600">
          📖 {totalWords} words • ⏱ ~{Math.ceil(totalWords / 150)} min
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={speak}
            disabled={isSpeaking}
            className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
          >
            Start
          </button>

          <button
            onClick={togglePause}
            disabled={!isSpeaking}
            className="px-4 py-2 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50"
          >
            {isPaused ? "Resume" : "Pause"}
          </button>

          <button
            onClick={stop}
            disabled={!isSpeaking}
            className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
          >
            Stop
          </button>
        </div>
      </div>

      {/* Text with word highlighting */}
      <div className="p-5 text-gray-800 leading-relaxed text-base sm:text-lg break-words min-h-80 overflow-y-auto">
        <ol className=" space-y-3">
          {segments.map((segment, sIdx) => (
            <li key={sIdx}>
              {segment.words.map((word, wIdx) => (
                <span
                  key={wIdx}
                  className={`mx-0.5 ${
                    currentSegmentIndex === sIdx && currentWordIndex === wIdx
                      ? "bg-yellow-200 px-1 rounded"
                      : ""
                  }`}
                >
                  {word}
                </span>
              ))}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default VoiceReader;
