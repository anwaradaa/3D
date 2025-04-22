import * as THREE from 'three';
import CameraControls from 'camera-controls';
import { WebGLRendererParameters } from 'three/src/renderers/WebGLRenderer.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

CameraControls.install({ THREE });

export type PositionPadding = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

export class BasicOrbitViewer {
  public fitAABB = new THREE.Box3();

  protected _threeRenderer: THREE.WebGLRenderer;

  protected _needRender = true;

  protected _threeRendererParameters: WebGLRendererParameters = {
    antialias: true,
    preserveDrawingBuffer: true,
  };

  protected _effectComposer: EffectComposer;

  protected _renderScenePass!: RenderPass;

  protected _outputPass!: OutputPass;

  protected _useEffects = false;

  protected _defaultSamples = 8;

  protected _clearColor = new THREE.Color('#f2f2f2');

  protected _scene: THREE.Scene;

  protected _cameraPerspective: THREE.PerspectiveCamera;

  protected _cameraOrthographic: THREE.OrthographicCamera;

  protected _orthographicCameraSize = 1000;

  protected _useOrthographicCamera = false;

  protected _cameraControls: CameraControls;

  protected _systemObject: THREE.Object3D = new THREE.Object3D();

  protected _contentObject: THREE.Object3D = new THREE.Object3D();

  protected _defaultCameraPositionPadding: PositionPadding = {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  };

  protected _defaultCameraPositionAngleOffset = new THREE.Vector2(0, 0);

  protected _defaultCameraFitAxis = new THREE.Vector3(0, 0, 1);

  protected _defaultCameraFitRadius = this._useOrthographicCamera ? 100 : 5;

  protected _viewportOffset: PositionPadding = {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  };

  public get orthographicCameraSize() {
    return this._orthographicCameraSize;
  }

  public set orthographicCameraSize(value: number) {
    this._orthographicCameraSize = value;
    this.updateCameraProjection();
  }

  public get useOrthographicCamera() {
    return this._useOrthographicCamera;
  }

  public set useOrthographicCamera(value: boolean) {
    this._useOrthographicCamera = value;
    this._renderScenePass.camera = this.camera;
    this._cameraControls.camera = this.camera;
    this.updateCameraProjection();
  }

  public get needRender() {
    return this._needRender;
  }

  public set needRender(value: boolean) {
    this._needRender = value;
  }

  public get scene() {
    return this._scene;
  }

  public get camera() {
    return this._useOrthographicCamera ? this._cameraOrthographic : this._cameraPerspective;
  }

  public get cameraControls() {
    return this._cameraControls;
  }

  public set defaultSamples(value: number) {
    this._defaultSamples = value;
  }

  public get defaultCameraPositionPadding() {
    return this._defaultCameraPositionPadding;
  }

  public set defaultCameraPositionPadding(value: PositionPadding) {
    this._defaultCameraPositionPadding = value;
  }

  public get viewportOffset() {
    return this._viewportOffset;
  }

  public set viewportOffset(value: PositionPadding) {
    this._viewportOffset = value;
  }

  public set defaultCameraPositionAngleOffset(value: THREE.Vector2) {
    this._defaultCameraPositionAngleOffset = value;
  }

  public set defaultCameraFitAxis(value: THREE.Vector3) {
    this._defaultCameraFitAxis = value;
  }

  public set defaultCameraFitRadius(value: number) {
    this._defaultCameraFitRadius = value;
  }

  public get defaultCameraFitRadius() {
    return this._defaultCameraFitRadius;
  }

  public get threeRenderer(): THREE.WebGLRenderer {
    return this._threeRenderer;
  }

  public get contentObject(): THREE.Object3D {
    return this._contentObject;
  }

  public set useEffects(value: boolean) {
    this._useEffects = value;
  }

  public get effectComposer() {
    return this._effectComposer;
  }

  public get renderPass() {
    return this._renderScenePass;
  }

  public get outputPass() {
    return this._outputPass;
  }

  public get canvas() {
    return this._threeRenderer.domElement;
  }

  constructor() {
    this._threeRenderer = this.makeRenderer();
    this._effectComposer = this.makeEffectComposer();
    this._scene = new THREE.Scene();

    this._cameraPerspective = new THREE.PerspectiveCamera(50);
    this._cameraPerspective.position.set(1, 1, 1);

    this._cameraOrthographic = new THREE.OrthographicCamera(
        -this._orthographicCameraSize / 2,
        this._orthographicCameraSize / 2,
        this._orthographicCameraSize / 2,
        -this._orthographicCameraSize / 2,
        0.1,
        this._orthographicCameraSize * 2,
    );
    this._cameraOrthographic.position.set(0, 0, 100);

    this._cameraControls = new CameraControls(this.camera, this._threeRenderer.domElement);
    this.setUpCameraControls();

    this._scene.add(this._systemObject);
    this._scene.add(this._contentObject);
    this._systemObject.add(this._cameraPerspective);
    this._systemObject.add(this._cameraOrthographic);
    this._systemObject.add(this.camera);
    this.setUpEffects();
  }

  protected setUpCameraControls() {
    this._cameraControls.draggingSmoothTime = 0.05;
    this._cameraControls.smoothTime = 0.5;
    this._cameraControls.azimuthRotateSpeed = 0.4;
    this._cameraControls.polarRotateSpeed = 0.4;
  }

  public initialize(): void {
    this.setupScene();
  }

  public setCanvasContainer(container: HTMLElement | null): void {
    this._threeRenderer.domElement.remove();

    if (container === null) return;

    container.appendChild(this._threeRenderer.domElement);
    this.syncRendererSize();
  }

  public dispose(): void {
    this._threeRenderer.domElement.remove();
    this._threeRenderer.dispose();
    this._threeRenderer.forceContextLoss();
  }

  public async setDefaultCameraPosition(transition = true): Promise<void> {
    return this.fitAABBIntoCamera(
        this.fitAABB,
        this._defaultCameraFitAxis.clone().multiplyScalar(this._defaultCameraFitRadius),
        transition,
    );
  }

  public async fitAABBIntoCamera(
      aabb: THREE.Box3,
      axis: THREE.Vector3,
      transition = true,
  ): Promise<void> {
    if (aabb.isEmpty()) return;

    const center = aabb.getCenter(new THREE.Vector3());

    return Promise.all([
      this._cameraControls.setLookAt(
          axis.x === 0 ? center.x : axis.x,
          axis.y === 0 ? center.y : axis.y,
          axis.z === 0 ? center.z : axis.z,
          center.x,
          center.y,
          center.z,
          transition,
      ),
      this._cameraControls.fitToBox(aabb, transition, {
        paddingLeft: this._defaultCameraPositionPadding.left,
        paddingBottom: this._defaultCameraPositionPadding.bottom,
        paddingRight: this._defaultCameraPositionPadding.right,
        paddingTop: this._defaultCameraPositionPadding.top,
      }),
      this._cameraControls.rotate(
          this._defaultCameraPositionAngleOffset.x,
          this._defaultCameraPositionAngleOffset.y,
          transition,
      ),
    ]).then(() => {});
  }

  public handleLoopTick(dt: number): void {
    this.syncRendererSize();
    if (this._cameraControls.enabled) this._cameraControls.update(dt);
    this.render(dt);
  }

  protected render(dt: number) {
    if (!this._needRender) return;
    if (this._useEffects) {
      this.renderEffects(dt);
    } else {
      this.renderRenderer();
    }
  }

  protected renderEffects(dt: number) {
    this._effectComposer.render(dt);
  }

  protected renderRenderer() {
    this._threeRenderer.render(this._scene, this.camera);
  }

  public setViewportOffset(offset: PositionPadding): void {
    this._viewportOffset = Object.assign({}, offset);
    this.updateCameraProjection();
  }

  public updateCameraProjection(): void {
    const left = this._viewportOffset.left;
    const right = this._viewportOffset.right;
    const top = this._viewportOffset.top;
    const bottom = this._viewportOffset.bottom;

    const rendererSize = this._threeRenderer.getSize(new THREE.Vector2());

    const localWidthForFit = rendererSize.width - left - right;
    const localHeightForFit = rendererSize.height - top - bottom;

    const widthFitRatio = rendererSize.width / localWidthForFit;
    const heightFitRatio = rendererSize.height / localHeightForFit;

    const resizedWidth = rendererSize.width * widthFitRatio;
    const resizedHeight = rendererSize.height * heightFitRatio;

    this.camera.setViewOffset(
        rendererSize.width,
        rendererSize.height,
        -left * widthFitRatio,
        -top * heightFitRatio,
        resizedWidth,
        resizedHeight,
    );

    const aspect = localWidthForFit / localHeightForFit;
    this._cameraPerspective.aspect = aspect;

    this._cameraOrthographic.left = -this._orthographicCameraSize * aspect / 2;
    this._cameraOrthographic.right = this._orthographicCameraSize * aspect / 2;
    this._cameraOrthographic.top = this._orthographicCameraSize / 2;
    this._cameraOrthographic.bottom = -this._orthographicCameraSize / 2;

    this.camera.updateProjectionMatrix();
  }

  protected setupScene(): void {

  }

  protected syncRendererSize(): void {
    const { parentElement } = this._threeRenderer.domElement;

    if (!parentElement) return;

    const parentSize = new THREE.Vector2(parentElement.offsetWidth, parentElement.offsetHeight);
    const rendererSize = this._threeRenderer.getSize(new THREE.Vector2());

    if (parentSize.equals(new THREE.Vector2(rendererSize.width, rendererSize.height))) return;
    const width = parentElement.offsetWidth;
    const height = parentElement.offsetHeight;
    this._threeRenderer.setSize(width, height);
    this._effectComposer.setSize(width, height);
    this.updateCameraProjection();

    void this.setDefaultCameraPosition(false);
  }

  protected makeRendererParameters(): WebGLRendererParameters {
    return this._threeRendererParameters;
  }

  protected makeRenderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer(this.makeRendererParameters());
    renderer.debug.checkShaderErrors = false;
    renderer.setClearColor(this._clearColor);
    renderer.domElement.oncontextmenu = () => false;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    return renderer;
  }

  protected makeEffectComposer(): EffectComposer {
    const composer = new EffectComposer(this._threeRenderer);
    composer.renderTarget2.samples = this._defaultSamples;
    return composer;
  }

  protected setUpEffects() {
    this._renderScenePass = new RenderPass(this._scene, this.camera);
    this._outputPass = new OutputPass();
    this._effectComposer.addPass(this._renderScenePass);
    this._effectComposer.addPass(this._outputPass);
  }
}
