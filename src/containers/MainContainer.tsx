'use client';

import React from 'react';
import { ViewerComponent } from '../components';

interface MainContainerProps {
  className?: string;
}

const MainContainer: React.FC<MainContainerProps> = ({ className }) => {
  return (
    <div className={`main-container ${className || ''}`} style={{ width: '100%', height: '100%' }}>
      <ViewerComponent className="viewer-component" />
    </div>
  );
};

export default MainContainer;