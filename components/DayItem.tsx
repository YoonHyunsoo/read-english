
import React from 'react';
import { Day, Activity, ActivityType } from '../types';
import ActivityButton from './ActivityButton';
import { ChevronDownIcon, ChevronUpIcon, VocabIcon, ListeningIcon, ReadingIcon, GrammarIcon } from './icons';

interface DayItemProps {
  day: Day;
  isExpanded: boolean;
  onToggle: () => void;
  onActivityClick: (activity: Activity) => void;
}

const iconMap: Record<ActivityType, React.ReactNode> = {
  vocab: <VocabIcon />,
  listening: <ListeningIcon />,
  reading: <ReadingIcon />,
  grammar: <GrammarIcon />,
  empty: null,
};

const DayItem: React.FC<DayItemProps> = ({ day, isExpanded, onToggle, onActivityClick }) => {
  const isLocked = day.isLocked;
  
  const containerClasses = `box-border flex flex-col items-start px-[15px] py-[7px] w-full border border-gray-200 rounded-xl transition-all duration-300 ${isLocked ? 'bg-gray-200' : 'bg-white'}`;
  
  const effectiveIsExpanded = isExpanded && !isLocked;

  return (
    <div className={containerClasses}>
      <div className="flex flex-row justify-between items-center py-2 w-full cursor-pointer" onClick={isLocked ? undefined : onToggle}>
        <div className="flex flex-row items-center flex-grow gap-4">
          <span className="font-medium text-sm text-slate-800 w-full">{day.title}</span>
        </div>
        <div className="w-5 h-5 text-slate-800 ml-6">
          {!isLocked && (effectiveIsExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />)}
        </div>
      </div>
      {effectiveIsExpanded && (
        <div className="w-full pt-3 pb-2 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3 w-full">
            {day.activities.filter(activity => activity.type !== 'empty').map(activity => (
              <ActivityButton 
                key={activity.id}
                icon={iconMap[activity.type]} 
                label={`${activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}${activity.level > 0 ? ` - Lvl ${activity.level}` : ''}`}
                onClick={() => onActivityClick(activity)}
                disabled={isLocked}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DayItem;