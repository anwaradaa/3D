import {BasicOrbitViewer} from '../core';
import * as THREE from "three";

export interface ViewerOptions {
  container: HTMLElement;
}

export class Viewer extends BasicOrbitViewer {

  constructor(options: ViewerOptions) {
    super();

    this._threeRenderer.toneMappingExposure = 1.8;

    // Override the default camera position padding to 0.5 on all sides
    this._defaultCameraPositionPadding = {
      top: 0.1,
      bottom: 0.2,
      left: 0.1,
      right: 0.1
    };

    this._defaultCameraPositionAngleOffset = new THREE.Vector2(Math.PI / 6, -Math.PI / 5);

    this.setCanvasContainer(options.container);
    this.initialize();
  }
}
