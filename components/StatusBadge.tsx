import React from 'react';
import { AssetStatus } from '../types';

interface StatusBadgeProps {
  status: AssetStatus | string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let colorClass = 'bg-gray-100 text-gray-800 border-gray-200';

  switch (status) {
    case AssetStatus.AVAILABLE:
      colorClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
      break;
    case AssetStatus.ASSIGNED:
      colorClass = 'bg-blue-100 text-blue-800 border-blue-200';
      break;
    case AssetStatus.IN_REPAIR:
      colorClass = 'bg-amber-100 text-amber-800 border-amber-200';
      break;
    case AssetStatus.LOST:
    case AssetStatus.DAMAGED:
      colorClass = 'bg-red-100 text-red-800 border-red-200';
      break;
    case AssetStatus.RETIRED:
      colorClass = 'bg-slate-100 text-slate-600 border-slate-200';
      break;
    case 'Pending':
      colorClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
      break;
    case 'Approved':
      colorClass = 'bg-green-100 text-green-800 border-green-200';
      break;
    case 'Rejected':
      colorClass = 'bg-red-50 text-red-600 border-red-100';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
