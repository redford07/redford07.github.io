import * as THREE from './vendor/three.module.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { DRACOLoader } from './vendor/DRACOLoader.js';
import { OrbitControls } from './vendor/OrbitControls.js';
import { CSS3DObject, CSS3DRenderer } from './vendor/CSS3DRenderer.js';

const root = document.getElementById('room');
const asset = path => new URL(path, import.meta.url).href;
const scene = new THREE.Scene();
const cssScene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 10, 100000);
camera.position.set(-14000, 9000, 16000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setClearColor(0, 0);
const cssRenderer = new CSS3DRenderer();
cssRenderer.domElement.className = 'css-scene';
root.append(cssRenderer.domElement, renderer.domElement);
const controls = new OrbitControls(camera, cssRenderer.domElement);
controls.enabled = false;
controls.enableDamping = true;
controls.minDistance = 2200;
controls.maxDistance = 35000;
controls.maxPolarAngle = Math.PI * .49;
controls.target.set(0, 500, 0);

const screen = document.createElement('div');
screen.className = 'screen-container';
const iframe = document.createElement('iframe');
iframe.src = 'retro_desktop.html?embedded=1';
iframe.title = 'WooChan OS — 포트폴리오';
const cover = document.createElement('button');
cover.className = 'screen-cover';
cover.textContent = '컴퓨터 사용';
cover.setAttribute('aria-label', '컴퓨터 화면 확대');
screen.append(iframe, cover);
const cssScreen = new CSS3DObject(screen);
cssScreen.position.set(0, 950, 255);
cssScreen.rotation.x = THREE.MathUtils.degToRad(-3);
cssScene.add(cssScreen);
// Zero RGB as well as alpha: the canvas uses premultiplied alpha when composited.
const hole = new THREE.Mesh(new THREE.PlaneGeometry(1280, 1024), new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide, transparent: true, opacity: 0, blending: THREE.NoBlending }));
hole.position.copy(cssScreen.position);
hole.rotation.copy(cssScreen.rotation);
scene.add(hole);

let state = 'loading';
let transition = null;
let ready = false;
let target = new THREE.Vector3(0, 500, 0);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
function setView(view) {
  if (!ready) return;
  state = view;
  controls.enabled = view === 'orbit';
  cover.hidden = view === 'monitor';
  document.getElementById('orbit-view').setAttribute('aria-pressed', String(view === 'orbit'));
  document.getElementById('room-hint').textContent = view === 'monitor' ? 'Esc로 책상으로 돌아가기 · 2D 보기로 화면 크게 보기' : view === 'orbit' ? '드래그로 회전 · 스크롤로 확대' : '컴퓨터 화면을 클릭해 시작하세요.';
  const aspect = innerHeight / innerWidth;
  const position = view === 'monitor' ? new THREE.Vector3(0, 950, 1800 + aspect * 900) : view === 'orbit' ? new THREE.Vector3(-14000, 9000, 16000) : new THREE.Vector3(0, 1800, 4600 + aspect * 1500);
  const focus = view === 'monitor' ? new THREE.Vector3(0, 950, 0) : new THREE.Vector3(0, 500, 0);
  transition = { start: performance.now(), from: camera.position.clone(), to: position, fromFocus: target.clone(), toFocus: focus, duration: reducedMotion ? 1 : 1400 };
  controls.target.copy(focus);
}
cover.onclick = () => setView('monitor');
document.getElementById('desk-view').onclick = () => setView('desk');
document.getElementById('computer-view').onclick = () => setView('monitor');
document.getElementById('orbit-view').onclick = () => setView(state === 'orbit' ? 'desk' : 'orbit');
document.getElementById('desktop-view').onclick = () => location.href = 'retro_desktop.html';
document.getElementById('help-toggle').onclick = event => {
  const help = document.getElementById('help');
  help.hidden = !help.hidden;
  event.currentTarget.setAttribute('aria-expanded', String(!help.hidden));
};
function escape() { document.getElementById('help').hidden = true; document.getElementById('help-toggle').setAttribute('aria-expanded', 'false'); setView('desk'); }
addEventListener('keydown', event => { if (event.key === 'Escape') escape(); });
addEventListener('message', event => { if (event.origin === location.origin && event.source === iframe.contentWindow && event.data === 'portfolio:escape') escape(); });
document.getElementById('enter-room').onclick = () => {
  document.getElementById('boot').hidden = true;
  document.querySelector('.room-toolbar').hidden = false;
  document.getElementById('room-hint').hidden = false;
  setView('desk');
};
function resize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  cssRenderer.setSize(innerWidth, innerHeight);
  if (state === 'monitor') setView('monitor');
}
addEventListener('resize', resize);
resize();
renderer.setAnimationLoop(time => {
  if (document.hidden) return;
  if (transition) {
    const t = Math.min((time - transition.start) / transition.duration, 1);
    const ease = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    camera.position.lerpVectors(transition.from, transition.to, ease);
    target.lerpVectors(transition.fromFocus, transition.toFocus, ease);
    camera.lookAt(target);
    if (t === 1) transition = null;
  } else if (controls.enabled) { controls.update(); target.copy(controls.target); }
  else camera.lookAt(target);
  renderer.render(scene, camera);
  cssRenderer.render(cssScene, camera);
});
renderer.domElement.addEventListener('webglcontextlost', event => {
  event.preventDefault();
  location.href = 'retro_desktop.html';
});

const draco = new DRACOLoader();
draco.setDecoderPath(asset('draco/gltf/'));
const loader = new GLTFLoader();
loader.setDRACOLoader(draco);
const textureLoader = new THREE.TextureLoader();
let completed = 0;
function progress() {
  completed++;
  document.getElementById('load-progress').value = completed;
  document.getElementById('load-status').textContent = `Loading resources ........ ${completed}/6 OK`;
}
try {
  await Promise.all([
    ['Computer/computer_setup.glb', 'Computer/baked_computer.jpg'],
    ['Decor/decor.glb', 'Decor/baked_decor_modified.jpg'],
    ['World/environment.glb', 'World/baked_environment.jpg']
  ].map(async ([modelPath, texturePath]) => {
    const [model, texture] = await Promise.all([
      loader.loadAsync(asset('models/' + modelPath)).then(value => { progress(); return value; }),
      textureLoader.loadAsync(asset('models/' + texturePath)).then(value => { progress(); return value; })
    ]);
    texture.flipY = false;
    texture.encoding = THREE.sRGBEncoding;
    const material = new THREE.MeshBasicMaterial({ map: texture });
    model.scene.traverse(child => { if (child.isMesh) { child.scale.setScalar(900); child.material = material; } });
    scene.add(model.scene);
  }));
  ready = true;
  draco.dispose();
  document.getElementById('load-status').textContent = 'All resources loaded. Your workspace is ready.';
  const button = document.getElementById('enter-room');
  button.disabled = false;
  button.textContent = 'START';
} catch (error) {
  console.error('Workspace loading failed:', error);
  document.getElementById('load-status').textContent = '3D 로딩에 실패했습니다. 아래 2D 버전으로 계속할 수 있습니다.';
}
