'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Controller, Resource } from '../app-3d';
import { LoaderComponent } from '.';

interface ViewerComponentProps {
  className?: string;
}

const ViewerComponent: React.FC<ViewerComponentProps> = ({ className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<Controller | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize the controller
    const controller = new Controller({
      container: containerRef.current,
    });
    controllerRef.current = controller;
    controller.initialize();

    // Define resources
    const modelResource: Resource = {
      id: 'backgammon',
      type: 'glb',
      url: '/assets/model/Backgammon.glb'
    };

    const hdrResource: Resource = {
      id: 'environment',
      type: 'hdr',
      url: '/assets/envs/sunny_sky.hdr'
    };

    // Build the scene with the specified resources
    controller.build(modelResource, hdrResource)
      .then(() => {


        
        // Set loading to false when resources are loaded
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Failed to build scene:', error);
        // Also set loading to false on error to avoid showing loader indefinitely
        setIsLoading(false);
      });

    return () => {
      // Clean up resources when component unmounts
      if (controllerRef.current) {
        controllerRef.current.dispose();
        controllerRef.current = null;
      }
    };
  }, []);

  return (
    <>
      {/* Show loader while resources are loading */}
      <LoaderComponent isLoading={isLoading} />

      {/* 3D scene container */}
      <div 
        ref={containerRef} 
        className={className}
        style={{ 
          width: '100%', 
          height: '100%',
        }}
      />
    </>
  );
};

export default ViewerComponent;
