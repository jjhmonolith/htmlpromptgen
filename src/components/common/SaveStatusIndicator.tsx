import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SaveStatusIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaveTime?: Date | null;
  className?: string;
}

export const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({
  status,
  lastSaveTime,
  className = ''
}) => {
  const getStatusInfo = () => {
    switch (status) {
      case 'saving':
        return {
          icon: '⏳',
          text: '저장 중...',
          color: 'text-blue-500'
        };
      case 'saved':
        return {
          icon: '✅',
          text: lastSaveTime ? `저장됨 ${lastSaveTime.toLocaleTimeString()}` : '저장됨',
          color: 'text-green-500'
        };
      case 'error':
        return {
          icon: '❌',
          text: '저장 실패',
          color: 'text-red-500'
        };
      default:
        return {
          icon: '💾',
          text: '자동 저장 활성',
          color: 'text-gray-500'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.2 }}
        className={`flex items-center gap-1 text-xs ${statusInfo.color} ${className}`}
      >
        <span className="text-sm">{statusInfo.icon}</span>
        <span>{statusInfo.text}</span>
      </motion.div>
    </AnimatePresence>
  );
};