import React from 'react';
import { X, User, Calendar, FileText, BarChart } from 'lucide-react';

interface WordCloudData {
  word: string;
  frequency: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}

interface WordCloudModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  debateTopic: string;
  date: string;
  emotionType: string;
  intensity: number;
}

const WordCloudModal: React.FC<WordCloudModalProps> = ({
  isOpen,
  onClose,
  memberName,
  debateTopic,
  date,
  emotionType,
  intensity
}) => {
  if (!isOpen) return null;

  // Generate mock word cloud data based on debate topic and emotion type
  const generateWordCloudData = (): WordCloudData[] => {
    const baseWords: { [key: string]: WordCloudData[] } = {
      'Housing Crisis': [
        { word: 'families', frequency: 45, sentiment: 'positive' },
        { word: 'homeless', frequency: 38, sentiment: 'negative' },
        { word: 'crisis', frequency: 52, sentiment: 'negative' },
        { word: 'affordable', frequency: 41, sentiment: 'positive' },
        { word: 'emergency', frequency: 29, sentiment: 'negative' },
        { word: 'shelter', frequency: 33, sentiment: 'neutral' },
        { word: 'building', frequency: 47, sentiment: 'positive' },
        { word: 'disgrace', frequency: 31, sentiment: 'negative' },
        { word: 'children', frequency: 39, sentiment: 'positive' },
        { word: 'solutions', frequency: 44, sentiment: 'positive' },
        { word: 'desperate', frequency: 27, sentiment: 'negative' },
        { word: 'investment', frequency: 36, sentiment: 'positive' },
        { word: 'unacceptable', frequency: 25, sentiment: 'negative' },
        { word: 'homes', frequency: 43, sentiment: 'positive' },
        { word: 'community', frequency: 35, sentiment: 'positive' }
      ],
      'Healthcare': [
        { word: 'patients', frequency: 48, sentiment: 'positive' },
        { word: 'nurses', frequency: 44, sentiment: 'positive' },
        { word: 'crisis', frequency: 39, sentiment: 'negative' },
        { word: 'funding', frequency: 42, sentiment: 'neutral' },
        { word: 'care', frequency: 51, sentiment: 'positive' },
        { word: 'waiting', frequency: 35, sentiment: 'negative' },
        { word: 'staff', frequency: 40, sentiment: 'neutral' },
        { word: 'essential', frequency: 33, sentiment: 'positive' },
        { word: 'shortage', frequency: 28, sentiment: 'negative' },
        { word: 'support', frequency: 45, sentiment: 'positive' },
        { word: 'overwhelmed', frequency: 26, sentiment: 'negative' },
        { word: 'dedication', frequency: 31, sentiment: 'positive' },
        { word: 'resources', frequency: 37, sentiment: 'neutral' },
        { word: 'quality', frequency: 34, sentiment: 'positive' },
        { word: 'access', frequency: 38, sentiment: 'neutral' }
      ],
      'Education': [
        { word: 'children', frequency: 55, sentiment: 'positive' },
        { word: 'teachers', frequency: 47, sentiment: 'positive' },
        { word: 'future', frequency: 49, sentiment: 'positive' },
        { word: 'funding', frequency: 43, sentiment: 'neutral' },
        { word: 'schools', frequency: 52, sentiment: 'positive' },
        { word: 'cuts', frequency: 32, sentiment: 'negative' },
        { word: 'investment', frequency: 41, sentiment: 'positive' },
        { word: 'opportunity', frequency: 38, sentiment: 'positive' },
        { word: 'quality', frequency: 44, sentiment: 'positive' },
        { word: 'resources', frequency: 35, sentiment: 'neutral' },
        { word: 'passion', frequency: 36, sentiment: 'positive' },
        { word: 'vital', frequency: 29, sentiment: 'positive' },
        { word: 'learning', frequency: 40, sentiment: 'positive' },
        { word: 'excellence', frequency: 27, sentiment: 'positive' },
        { word: 'priority', frequency: 33, sentiment: 'positive' }
      ],
      'Climate': [
        { word: 'environment', frequency: 46, sentiment: 'positive' },
        { word: 'urgent', frequency: 41, sentiment: 'negative' },
        { word: 'action', frequency: 53, sentiment: 'positive' },
        { word: 'crisis', frequency: 38, sentiment: 'negative' },
        { word: 'sustainable', frequency: 44, sentiment: 'positive' },
        { word: 'future', frequency: 47, sentiment: 'positive' },
        { word: 'emissions', frequency: 35, sentiment: 'negative' },
        { word: 'green', frequency: 42, sentiment: 'positive' },
        { word: 'renewable', frequency: 39, sentiment: 'positive' },
        { word: 'responsibility', frequency: 33, sentiment: 'positive' },
        { word: 'delay', frequency: 28, sentiment: 'negative' },
        { word: 'innovation', frequency: 37, sentiment: 'positive' },
        { word: 'transition', frequency: 31, sentiment: 'neutral' },
        { word: 'planet', frequency: 29, sentiment: 'positive' },
        { word: 'commitment', frequency: 34, sentiment: 'positive' }
      ]
    };

    // Find matching topic or use default
    const topicKey = Object.keys(baseWords).find(key => 
      debateTopic.includes(key) || debateTopic.toLowerCase().includes(key.toLowerCase())
    ) || 'Housing Crisis';

    return baseWords[topicKey];
  };

  const wordCloudData = generateWordCloudData();

  // Calculate font size based on frequency
  const getFontSize = (frequency: number) => {
    const maxFreq = Math.max(...wordCloudData.map(w => w.frequency));
    const minFreq = Math.min(...wordCloudData.map(w => w.frequency));
    const ratio = (frequency - minFreq) / (maxFreq - minFreq);
    return 12 + (ratio * 28); // Font size between 12px and 40px
  };

  // Get color based on sentiment and emotion type
  const getWordColor = (sentiment: string) => {
    const colors = {
      positive: emotionType.toLowerCase().includes('anger') ? 'text-green-600' : 
                emotionType.toLowerCase().includes('passion') ? 'text-purple-600' :
                emotionType.toLowerCase().includes('empathy') ? 'text-blue-600' : 
                'text-emerald-600',
      negative: emotionType.toLowerCase().includes('anger') ? 'text-red-600' : 
                emotionType.toLowerCase().includes('frustration') ? 'text-orange-600' :
                'text-red-500',
      neutral: 'text-gray-600'
    };
    return colors[sentiment as keyof typeof colors] || 'text-gray-600';
  };

  // Get emotion-specific background color
  const getBackgroundColor = () => {
    if (emotionType.toLowerCase().includes('anger')) return 'bg-red-50 border-red-200';
    if (emotionType.toLowerCase().includes('passion')) return 'bg-purple-50 border-purple-200';
    if (emotionType.toLowerCase().includes('empathy')) return 'bg-blue-50 border-blue-200';
    if (emotionType.toLowerCase().includes('frustration')) return 'bg-orange-50 border-orange-200';
    return 'bg-gray-50 border-gray-200';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className={`${getBackgroundColor()} border-b p-6`}>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <User className="w-6 h-6 text-gray-700" />
                <h2 className="text-2xl font-bold text-gray-900">{memberName}</h2>
                <span className="px-3 py-1 bg-white bg-opacity-60 text-sm font-medium rounded-full">
                  {emotionType}
                </span>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>{debateTopic}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart className="w-4 h-4" />
                  <span>Intensity: {intensity}/10</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-60 rounded-full transition-colors"
              aria-label="Close word cloud"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Word Cloud Content */}
        <div className="p-8">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Speech Pattern Analysis</h3>
            <p className="text-gray-600">
              Key words and phrases used by {memberName} during the {debateTopic.toLowerCase()} debate, 
              analyzed for emotional context and frequency. Word size reflects usage frequency.
            </p>
          </div>

          {/* Word Cloud Visualization */}
          <div className="bg-gray-50 rounded-lg p-8 min-h-[300px] flex flex-wrap items-center justify-center gap-3">
            {wordCloudData.map((word, index) => (
              <span
                key={index}
                className={`${getWordColor(word.sentiment)} font-medium cursor-pointer hover:opacity-75 transition-opacity select-none`}
                style={{ 
                  fontSize: `${getFontSize(word.frequency)}px`,
                  lineHeight: '1.2'
                }}
                title={`"${word.word}" - Used ${word.frequency} times (${word.sentiment} sentiment)`}
              >
                {word.word}
              </span>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 flex justify-center">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Positive Sentiment</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Negative Sentiment</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-500 rounded"></div>
                <span>Neutral Sentiment</span>
              </div>
            </div>
          </div>

          {/* Analysis Summary */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Analysis Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-800">Most Used:</span>
                <span className="ml-2 text-blue-700">
                  "{wordCloudData.reduce((prev, current) => prev.frequency > current.frequency ? prev : current).word}"
                </span>
              </div>
              <div>
                <span className="font-medium text-blue-800">Sentiment:</span>
                <span className="ml-2 text-blue-700">
                  {Math.round((wordCloudData.filter(w => w.sentiment === 'positive').length / wordCloudData.length) * 100)}% positive
                </span>
              </div>
              <div>
                <span className="font-medium text-blue-800">Total Words:</span>
                <span className="ml-2 text-blue-700">{wordCloudData.length} analyzed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordCloudModal;