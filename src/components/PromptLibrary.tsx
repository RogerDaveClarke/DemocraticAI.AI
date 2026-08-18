import { X, Lightbulb } from 'lucide-react';
import { promptLibrary, PromptItem } from '../data/promptLibrary';
import { useMemo, useState } from 'react';

interface PromptLibraryProps {
  onClose: () => void;
  onSelectPrompt: (promptText: string, promptId: string) => void;
}

export default function PromptLibrary({ onClose, onSelectPrompt }: PromptLibraryProps) {
  const categories = Array.from(new Set(promptLibrary.map(p => p.category)));
  const personaTracks = useMemo(() => ([
    {
      id: 'citizen',
      label: 'Citizen',
      description: 'Understand bills and decisions in plain language.',
      promptIds: ['plain-answer', 'topic-trends', 'policy-impact'],
    },
    {
      id: 'journalist',
      label: 'Journalist',
      description: 'Trace framing, stance shifts, and supporting evidence.',
      promptIds: ['bias-framing', 'speaker-comparison', 'stance-opinion'],
    },
    {
      id: 'researcher',
      label: 'Researcher',
      description: 'Map themes and policy implications over time.',
      promptIds: ['topic-trends', 'policy-impact', 'sentiment'],
    },
    {
      id: 'academic',
      label: 'Academic',
      description: 'Apply rigorous discourse and emotion analysis.',
      promptIds: ['bias-framing', 'emotion', 'speaker-comparison'],
    },
    {
      id: 'policy-analyst',
      label: 'Policy Analyst',
      description: 'Compare member framing and infer policy risk.',
      promptIds: ['policy-impact', 'speaker-comparison', 'stance-opinion'],
    },
    {
      id: 'student',
      label: 'Student',
      description: 'Learn debate structure and parliamentary language.',
      promptIds: ['plain-answer', 'sentiment', 'topic-trends'],
    },
  ]), []);
  const [selectedTrack, setSelectedTrack] = useState(personaTracks[0].id);

  const selectedTrackConfig = personaTracks.find((track) => track.id === selectedTrack) || personaTracks[0];
  const trackPrompts = selectedTrackConfig.promptIds
    .map((id) => promptLibrary.find((prompt) => prompt.id === id))
    .filter((prompt): prompt is PromptItem => Boolean(prompt));

  const handlePromptClick = (prompt: PromptItem) => {
    onSelectPrompt(prompt.text, prompt.id);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in" role="dialog" aria-modal="true">
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-5xl max-h-[80vh] flex flex-col animate-scale-in">
          <div className="flex items-start justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-full p-2">
                <Lightbulb className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Research Library</h3>
                <p className="text-sm text-gray-600">Choose a research track and launch a curated investigation</p>
              </div>
            </div>
            <button
              onClick={onClose} aria-label="Close dialog"
              className="text-gray-400 hover:text-gray-600 transition-colors"
            ><X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto p-6">
            <div className="mb-8">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Research Tracks</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                {personaTracks.map((track) => (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => setSelectedTrack(track.id)}
                    className={`px-3 py-2 rounded-lg border text-sm text-left transition-colors ${selectedTrack === track.id ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'}`}
                  >
                    {track.label}
                  </button>
                ))}
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-900 font-medium">{selectedTrackConfig.label}</p>
                <p className="text-xs text-blue-800 mt-1">{selectedTrackConfig.description}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {trackPrompts.map((prompt) => (
                  <button
                    key={`${selectedTrack}-${prompt.id}`}
                    onClick={() => handlePromptClick(prompt)} aria-label="Perform action"
                    className="text-left p-4 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all group"
                  >
                    <div className="text-[10px] uppercase tracking-wide text-blue-600 mb-2">
                      {prompt.analysisFocus}
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1 group-hover:text-blue-700">
                      {prompt.text}
                    </p>
                    <p className="text-xs text-gray-500">{prompt.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {categories.map((category) => (
              <div key={category} className="mb-6 last:mb-0">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  {category}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {promptLibrary
                    .filter((prompt) => prompt.category === category)
                    .map((prompt) => (
                      <button
                        key={prompt.id}
                        onClick={() => handlePromptClick(prompt)} aria-label="Perform action"
                        className="text-left p-4 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all group"
                      >
                        <div className="text-[10px] uppercase tracking-wide text-blue-600 mb-2">
                          {prompt.analysisFocus}
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-1 group-hover:text-blue-700">
                          {prompt.text}
                        </p>
                        <p className="text-xs text-gray-500">{prompt.description}</p>
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
