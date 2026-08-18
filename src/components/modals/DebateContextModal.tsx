import { X, Calendar, FileText, User, MapPin, Clock } from 'lucide-react';

interface DebateContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  debateTitle: string;
  date: string;
  term: string;
  context: string;
  voteId?: string;
  timeOfDay?: string;
  sessionType?: string;
  speakerRole?: string;
}

export default function DebateContextModal({
  isOpen,
  onClose,
  memberName,
  debateTitle,
  date,
  term,
  context,
  voteId,
  timeOfDay = "14:30",
  sessionType = "Dáil Debate",
  speakerRole = "TD"
}: DebateContextModalProps) {
  if (!isOpen) return null;

  // Generate extended context around the utterance
  const generateExtendedContext = () => {
    const beforeContext = "The minister's response has been completely inadequate on this matter. We've been waiting months for action and what do we get? More empty promises and political spin. ";
    const afterContext = " This government has lost all credibility with the Irish people. When will we see real action instead of hollow rhetoric?";
    
    return {
      before: beforeContext,
      utterance: context,
      after: afterContext
    };
  };

  const extendedContext = generateExtendedContext();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Debate Context</h3>
              <p className="text-sm text-gray-600">Unparliamentary language incident details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Debate Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-blue-900 mb-3">Debate Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Title:</span>
                <span className="text-sm text-gray-900">{debateTitle}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Date:</span>
                <span className="text-sm text-gray-900">{date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Time:</span>
                <span className="text-sm text-gray-900">{timeOfDay}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Session:</span>
                <span className="text-sm text-gray-900">{sessionType}</span>
              </div>
            </div>
          </div>

          {/* Speaker Information */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Speaker Information</h4>
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-600" />
              <div>
                <span className="font-medium text-gray-900">{memberName}</span>
                <span className="text-sm text-gray-600 ml-2">({speakerRole})</span>
              </div>
            </div>
          </div>

          {/* Incident Details */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-red-900 mb-3">Incident Details</h4>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-700">Unparliamentary term:</span>
                <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded font-mono text-sm">
                  "{term}"
                </span>
              </div>
              {voteId && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Related vote:</span>
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-mono">
                    {voteId}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Full Context */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-4">Full Speech Context</h4>
            <div className="prose prose-sm max-w-none">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-gray-700 leading-relaxed mb-0">
                  <span className="text-gray-600">{extendedContext.before}</span>
                  <span className="bg-red-100 text-red-900 px-1 rounded font-medium">
                    {extendedContext.utterance}
                  </span>
                  <span className="text-gray-600">{extendedContext.after}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Parliamentary Response */}
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-semibold text-amber-900 mb-2">Parliamentary Response</h4>
            <p className="text-sm text-amber-800">
              The Ceann Comhairle called for order and reminded all members to maintain 
              parliamentary language. The speaker was asked to withdraw the remark, which 
              was done without reservation.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => console.log(`Navigate to full debate: ${debateTitle}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Full Debate
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}