import React from 'react';

interface PageIdentifierProps {
  path: string;
}

const PageIdentifier: React.FC<PageIdentifierProps> = ({ path }) => {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed top-2 left-2 bg-gray-800 bg-opacity-70 text-white text-xs font-mono p-1 rounded-md z-[9999]">
      {path}
    </div>
  );
};

export default PageIdentifier;
