import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Military } from '../types';
import { isBirthdayToday, parseBirth } from '../utils/format';
import { DateTile, RankBadge, TodayBadge } from './ui';

interface BirthdayListItemProps {
  soldier: Military;
  compact?: boolean;
  active?: boolean;
  onClick?: () => void;
  onHover?: (s: Military | null) => void;
}

const BirthdayListItem: React.FC<BirthdayListItemProps> = ({ soldier, compact = false, active = false, onClick, onHover }) => {
  const { month, day } = parseBirth(soldier);
  const today = isBirthdayToday(soldier);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => onHover && onHover(soldier)}
      onMouseLeave={() => onHover && onHover(null)}
      className={`group flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-all
        ${active
          ? 'border-cbmmg-red/40 bg-red-50/60 ring-2 ring-cbmmg-red/10'
          : 'border-stone-200/80 bg-white hover:border-cbmmg-red/30 hover:shadow-md hover:shadow-stone-200/70'}`}
    >
      <DateTile day={day} month={month} highlight={today} small={compact} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-stone-900 transition-colors group-hover:text-cbmmg-red">
            {soldier.name}
          </p>
          {today && <TodayBadge />}
        </div>
        <div className="mt-1 flex min-w-0 items-center gap-2 text-xs text-stone-500">
          <RankBadge rank={soldier.rank} />
          <span className="truncate">{soldier.unit}</span>
        </div>
      </div>
      <ChevronRight
        size={16}
        className="shrink-0 text-stone-300 transition-all group-hover:translate-x-0.5 group-hover:text-cbmmg-red"
      />
    </button>
  );
};

export default BirthdayListItem;
