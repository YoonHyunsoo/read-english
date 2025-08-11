import React from 'react';

interface LoadingOverlayProps {
  message?: string;
  progress?: number; // 0 - 100
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message = '불러오는 중...', progress = 0 }) => {
  const pct = Math.max(0, Math.min(100, Math.round(progress)));
  return (
    <div className="fixed inset-0 z-[1000] bg-black/50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
        <p className="text-center text-sm text-gray-600 font-medium">{message}</p>
        <div className="mt-4 w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
          <div
            className="h-full bg-blue-600 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-center text-xs text-gray-500">{pct}%</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;


