import { X } from 'lucide-react';

interface FlagSelectorPopupProps {
  onSelectIreland: () => void;
  onSkip: () => void;
}

export default function FlagSelectorPopup({ onSelectIreland, onSkip }: FlagSelectorPopupProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8 relative">
        <button
          onClick={onSkip} aria-label="Perform action"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-3xl font-bold text-gray-900 mb-4">Select Your Parliament</h2>
        <p className="text-gray-600 mb-8">
          Choose which parliament you'd like to track. More parliaments coming soon!
        </p>

        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={onSelectIreland} aria-label="Perform action"
            className="flex items-center gap-4 p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all group"
          >
            <div className="text-6xl">🇮🇪</div>
            <div className="text-left flex-1">
              <h3 className="text-xl font-semibold text-gray-900 group-hover:text-green-700">
                Democratic AI (Ireland)
              </h3>
              <p className="text-sm text-gray-600">Irish Parliament - Dáil and Seanad</p>
            </div>
          </button>

          <div className="p-6 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
            <p className="text-center text-gray-500 text-sm">
              More parliaments coming soon...
            </p>
          </div>
        </div>

        <button
          onClick={onSkip} aria-label="Perform action"
          className="mt-6 w-full py-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
