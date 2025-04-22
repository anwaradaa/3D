import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

export type ResourceType = 'glb' | 'gltf' | 'hdr';

export interface Resource {
  id: string;
  type: ResourceType;
  url: string;
}

export class ResourceManager {
  private resources: Map<string, Resource> = new Map();
  private gltfLoader: GLTFLoader = new GLTFLoader();
  private rgbeLoader: RGBELoader = new RGBELoader();

  constructor() {
    // Initialize loaders if needed
  }

  /**
   * Add a resource to be loaded
   * @param resource The resource to add
   * @returns The added resource
   */
  public addResource(resource: Resource): Resource {
    if (this.resources.has(resource.id)) {
      console.warn(`Resource with id ${resource.id} already exists. It will be replaced.`);
    }
    this.resources.set(resource.id, resource);
    return resource;
  }

  /**
   * Load a resource (GLB/GLTF/HDR)
   * @param resourceId The ID of the resource to load
   * @returns A promise that resolves when the resource is loaded
   */
  public loadResource(resourceId: string): Promise<THREE.Group | THREE.Texture> {
    const resource = this.resources.get(resourceId);
    if (!resource) {
      return Promise.reject(new Error(`Resource with id ${resourceId} not found`));
    }

    if (resource.type === 'hdr') {
      return this.loadHDRResource(resource);
    } else {
      return this.loadGLTFResource(resource);
    }
  }

  /**
   * Load a GLB/GLTF resource
   * @param resource The resource to load
   * @returns A promise that resolves with the loaded model
   */
  private loadGLTFResource(resource: Resource): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        resource.url,
        (gltf) => {
          const model = gltf.scene;
          resolve(model);
        },
        undefined,
        (error) => {
          console.error(`Error loading resource ${resource.id}:`, error);
          reject(error);
        }
      );
    });
  }

  /**
   * Load an HDR resource
   * @param resource The resource to load
   * @returns A promise that resolves with the loaded texture
   */
  private loadHDRResource(resource: Resource): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      this.rgbeLoader.load(
        resource.url,
        (texture) => {
          texture.mapping = THREE.EquirectangularReflectionMapping;
          resolve(texture);
        },
        undefined,
        (error) => {
          console.error(`Error loading HDR resource ${resource.id}:`, error);
          reject(error);
        }
      );
    });
  }

  /**
   * Get a resource by its id
   * @param id Identifier of the resource
   * @returns The resource or undefined if not found
   */
  public getResource(id: string): Resource | undefined {
    return this.resources.get(id);
  }

  /**
   * Get all resources
   * @returns Map of all resources
   */
  public getResources(): Map<string, Resource> {
    return this.resources;
  }

  /**
   * Clear all resources
   */
  public clear(): void {
    this.resources.clear();
  }
}
