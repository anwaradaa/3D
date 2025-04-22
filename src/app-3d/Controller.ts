import * as THREE from 'three';
import { Viewer, ViewerOptions } from './view';
import { ResourceManager, Resource } from './core';

export interface ControllerOptions extends ViewerOptions {
  // Additional options can be added here
}

export class Controller {
  private viewer: Viewer;
  private isInitialized: boolean = false;
  private animationFrameId: number | null = null;
  private clock: THREE.Clock = new THREE.Clock();
  private resourceManager: ResourceManager = new ResourceManager();

  constructor(options: ControllerOptions) {
    this.viewer = new Viewer(options);
  }

  /**
   * Initialize the controller and start the render loop
   */
  public initialize(): void {
    if (this.isInitialized) {
      console.warn('Controller is already initialized');
      return;
    }

    this.startRenderLoop();
    this.isInitialized = true;
  }

  /**
   * Start the render loop
   */
  private startRenderLoop(): void {
    if (this.animationFrameId !== null) return;

    this.clock.start();
    const animate = () => {
      const delta = this.clock.getDelta();
      this.viewer.handleLoopTick(delta);
      this.animationFrameId = requestAnimationFrame(animate);
    };
    animate();
  }

  /**
   * Stop the render loop
   */
  private stopRenderLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Clean up resources and stop the render loop
   */
  public dispose(): void {
    if (!this.isInitialized) {
      console.warn('Controller is not initialized');
      return;
    }

    this.stopRenderLoop();
    this.resourceManager.clear();
    this.viewer.dispose();
    this.isInitialized = false;
  }

  /**
   * Add a resource to be loaded
   * @param resource The resource to add
   * @returns The added resource
   */
  public addResource(resource: Resource): Resource {
    return this.resourceManager.addResource(resource);
  }

  /**
   * Load a resource (GLB/GLTF/HDR)
   * @param resourceId The ID of the resource to load
   * @returns A promise that resolves when the resource is loaded
   */
  public loadResource(resourceId: string): Promise<THREE.Group | THREE.Texture> {
    return this.resourceManager.loadResource(resourceId);
  }

  /**
   * Add a model to the scene
   * @param model The model to add to the scene
   */
  public addModelToScene(model: THREE.Group): void {
    if (this.viewer && this.viewer.scene) {
      this.viewer.scene.add(model);
    }
  }

  /**
   * Update the camera view after loading a model
   * This is called after a GLB/GLTF resource is loaded
   */
  public updateCameraView(): void {
    if (this.viewer && this.viewer.scene) {
      // Update the bounding box and fit camera
      this.viewer.fitAABB = new THREE.Box3().setFromObject(this.viewer.scene);
      this.viewer.setDefaultCameraPosition(false);
    }
  }

  /**
   * Set the environment map for the scene
   * @param texture The texture to use as environment map
   */
  public setEnvironmentMap(texture: THREE.Texture): void {
    this.viewer.scene.environment = texture;
  }

  /**
   * Get a resource by its id
   * @param id Identifier of the resource
   * @returns The resource or undefined if not found
   */
  public getResource(id: string): Resource | undefined {
    return this.resourceManager.getResource(id);
  }

  /**
   * Get all resources
   * @returns Map of all resources
   */
  public getResources(): Map<string, Resource> {
    return this.resourceManager.getResources();
  }

  /**
   * Get the viewer instance
   * @returns The viewer
   */
  public getViewer(): Viewer {
    return this.viewer;
  }

  /**
   * Check if the controller is initialized
   * @returns Whether the controller is initialized
   */
  public isActive(): boolean {
    return this.isInitialized;
  }

  /**
   * Build the scene with the specified object and environment resources
   * @param objectResource The object resource (GLB/GLTF)
   * @param environmentResource The environment resource (HDR)
   * @returns A promise that resolves when both resources are loaded
   */
  public build(objectResource: Resource, environmentResource: Resource): Promise<void> {
    // Add resources to the resource manager
    this.addResource(objectResource);
    this.addResource(environmentResource);

    // Create promises for loading both resources
    const objectPromise = this.loadResource(objectResource.id)
      .then((model) => {
        // Add the model to the scene
        this.addModelToScene(model as THREE.Group);
        // Update camera view after loading the model
        this.updateCameraView();
      })
      .catch(error => {
        console.error(`Failed to load ${objectResource.id} model:`, error);
      });

    const environmentPromise = this.loadResource(environmentResource.id)
      .then((texture) => {
        // Explicitly set the environment map after loading
        this.setEnvironmentMap(texture as THREE.Texture);
      })
      .catch(error => {
        console.error(`Failed to load ${environmentResource.id} environment map:`, error);
      });

    // Return a promise that resolves when both resources are loaded
    return Promise.all([objectPromise, environmentPromise])
      .then(() => {
        // Both resources loaded successfully
      });
  }
}
