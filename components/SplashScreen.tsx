import React from 'react';
import { AppLogo } from './icons';

const SplashScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-blue-600 animate-fade-in">
      <AppLogo className="w-28 h-28 text-white mb-4" />
      <h1 className="text-white text-2xl font-bold tracking-wider">
        READ:ENG
      </h1>
      <p className="text-blue-200 text-sm">(READ for English)</p>
    </div>
  );
};

export default SplashScreen;