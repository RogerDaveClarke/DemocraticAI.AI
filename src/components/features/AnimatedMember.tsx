/**
 * Animated Parliament Member
 * Muppet-style talking animation with personality
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Volume2 } from 'lucide-react';

interface AnimatedMemberProps {
  member: {
    id: string;
    name: string;
    party: string;
    position: string;
    avatar?: string;
    personality: 'serious' | 'animated' | 'calm' | 'passionate';
    color: string;
  };
  isSpeeking: boolean;
  speechText?: string;
  position: { x: number; y: number };
  onMemberClick?: (memberId: string) => void;
}

export default function AnimatedMember({ 
  member, 
  isSpeeking, 
  speechText, 
  position,
  onMemberClick 
}: AnimatedMemberProps) {
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);
  const [currentSpeech, setCurrentSpeech] = useState('');

  useEffect(() => {
    if (isSpeeking && speechText) {
      setShowSpeechBubble(true);
      setCurrentSpeech(speechText);
      
      // Auto-hide speech bubble after speaking
      const timer = setTimeout(() => {
        setShowSpeechBubble(false);
      }, speechText.length * 50 + 2000); // Adjust timing based on text length
      
      return () => clearTimeout(timer);
    }
  }, [isSpeeking, speechText]);

  const getPersonalityAnimation = () => {
    switch (member.personality) {
      case 'animated':
        return {
          scale: isSpeeking ? [1, 1.1, 1, 1.05, 1] : 1,
          rotate: isSpeeking ? [0, 2, -2, 1, 0] : 0,
        };
      case 'passionate':
        return {
          scale: isSpeeking ? [1, 1.2, 1, 1.1, 1] : 1,
          y: isSpeeking ? [0, -5, 0, -3, 0] : 0,
        };
      case 'calm':
        return {
          scale: isSpeeking ? [1, 1.02, 1] : 1,
        };
      default:
        return {
          scale: isSpeeking ? [1, 1.05, 1] : 1,
        };
    }
  };

  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{ left: position.x, top: position.y }}
      whileHover={{ scale: 1.1 }}
      onClick={() => onMemberClick?.(member.id)}
    >
      {/* Speech Bubble */}
      <AnimatePresence>
        {showSpeechBubble && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-10"
          >
            <div className="bg-white border-2 border-gray-300 rounded-lg px-3 py-2 shadow-lg max-w-xs">
              <p className="text-sm text-gray-800 font-medium">{currentSpeech}</p>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animated Character */}
      <motion.div
        className="relative"
        animate={getPersonalityAnimation()}
        transition={{
          duration: isSpeeking ? 0.3 : 0.5,
          repeat: isSpeeking ? Infinity : 0,
          ease: "easeInOut"
        }}
      >
        {/* Character SVG */}
        <svg width="80" height="100" viewBox="0 0 80 100" className="drop-shadow-md">
          {/* Body */}
          <rect x="25" y="60" width="30" height="35" rx="15" fill={member.color} />
          
          {/* Head */}
          <circle cx="40" cy="35" r="20" fill="#fdbcb4" stroke="#e0a899" strokeWidth="2" />
          
          {/* Hair */}
          <ellipse cx="40" cy="25" rx="22" ry="15" fill="#8b4513" />
          
          {/* Eyes */}
          <circle cx="33" cy="30" r="3" fill="#000" />
          <circle cx="47" cy="30" r="3" fill="#000" />
          
          {/* Animated Mouth - Muppet Style */}
          <motion.ellipse
            cx="40"
            cy="42"
            rx={isSpeeking ? 6 : 3}
            ry={isSpeeking ? 4 : 2}
            fill="#8b0000"
            animate={{
              ry: isSpeeking ? [2, 6, 3, 5, 2] : 2,
              rx: isSpeeking ? [3, 8, 5, 7, 3] : 3,
            }}
            transition={{
              duration: 0.2,
              repeat: isSpeeking ? Infinity : 0,
              ease: "easeInOut"
            }}
          />
          
          {/* Nose */}
          <ellipse cx="40" cy="37" rx="2" ry="3" fill="#e0a899" />
          
          {/* Arms - Animated when speaking */}
          <motion.line
            x1="25"
            y1="65"
            x2="15"
            y2={isSpeeking ? 75 : 80}
            stroke={member.color}
            strokeWidth="8"
            strokeLinecap="round"
            animate={{
              y2: isSpeeking ? [80, 70, 75, 72, 80] : 80,
              x2: isSpeeking ? [15, 12, 18, 14, 15] : 15,
            }}
            transition={{
              duration: 0.4,
              repeat: isSpeeking ? Infinity : 0,
              ease: "easeInOut"
            }}
          />
          
          <motion.line
            x1="55"
            y1="65"
            x2="65"
            y2={isSpeeking ? 75 : 80}
            stroke={member.color}
            strokeWidth="8"
            strokeLinecap="round"
            animate={{
              y2: isSpeeking ? [80, 70, 75, 72, 80] : 80,
              x2: isSpeeking ? [65, 68, 62, 66, 65] : 65,
            }}
            transition={{
              duration: 0.4,
              repeat: isSpeeking ? Infinity : 0,
              ease: "easeInOut",
              delay: 0.1
            }}
          />
        </svg>

        {/* Member Info */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 text-center">
          <div className="bg-white rounded px-2 py-1 shadow-sm border">
            <p className="text-xs font-bold text-gray-800">{member.name}</p>
            <p className="text-xs text-gray-600">{member.party}</p>
          </div>
        </div>

        {/* Speaking Indicator */}
        {isSpeeking && (
          <motion.div
            className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            <Volume2 size={12} className="text-white" />
          </motion.div>
        )}

        {/* Interaction Hint */}
        <motion.div
          className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity"
          whileHover={{ opacity: 1 }}
        >
          <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded">
            Click to speak
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}