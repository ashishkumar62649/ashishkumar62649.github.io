import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const initializedCanvases = new WeakSet();
const pendingCanvases = new WeakSet();
const lazyInitObserver = 'IntersectionObserver' in window
  ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const canvas = entry.target;
        lazyInitObserver.unobserve(canvas);
        pendingCanvases.delete(canvas);
        initializedCanvases.add(canvas);
        init(canvas);
      });
    }, {
      root: null,
      rootMargin: '900px 0px',
      threshold: 0
    })
  : null;

function scheduleCanvasInit(canvas) {
  if (initializedCanvases.has(canvas) || pendingCanvases.has(canvas)) return;
  if (!lazyInitObserver || canvas.dataset.birdBand === 'top') {
    initializedCanvases.add(canvas);
    init(canvas);
    return;
  }
  pendingCanvases.add(canvas);
  lazyInitObserver.observe(canvas);
}

function initAllBirdCanvases() {
  const canvases = document.querySelectorAll('.bird-canvas');
  if (canvases.length === 0) {
    console.warn('Bird canvas element not found');
    return;
  }
  canvases.forEach((canvas) => {
    scheduleCanvasInit(canvas);
  });
}

initAllBirdCanvases();
document.addEventListener('split-sky-depth-synced', initAllBirdCanvases);

function init(canvas) {
  const getCanvasSize = () => ({
    width: Math.max(canvas.clientWidth || window.innerWidth, 1),
    height: Math.max(canvas.clientHeight || window.innerHeight, 1)
  });
  const initialSize = getCanvasSize();

  // Create Scene
  const scene = new THREE.Scene();

  // Create Camera
  const camera = new THREE.PerspectiveCamera(
    45,
    initialSize.width / initialSize.height,
    0.1,
    1000
  );
  camera.position.set(0, 0, 25);

  // Create Renderer
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,         // Transparent background to show sky layers
    antialias: !canvas.dataset.birdClone
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, canvas.dataset.birdClone ? 1 : 1.5));
  renderer.setSize(initialSize.width, initialSize.height, false);

  // Add Lights
  // Ambient light matches the soft blue sky color
  const ambientLight = new THREE.AmbientLight(0xd0e6ff, 1.0);
  scene.add(ambientLight);

  // Warm white directional light simulates sunlight
  const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.5);
  sunLight.position.set(10, 20, 10);
  scene.add(sunLight);

  // Helper Object to compute target orientations smoothly
  const dummyObject = new THREE.Object3D();

  // Load Model
  const loader = new GLTFLoader();
  const clock = new THREE.Clock();
  const birds = [];
  const NUM_BIRDS = Math.max(1, Number(canvas.dataset.birdCount || 4));
  const isTopBand = canvas.dataset.birdBand === 'top';
  const clamp01 = (value) => Math.min(Math.max(value, 0), 1);
  let animationFrame = 0;
  let isActive = false;

  // Helper to generate a unique gentle curving flight path in 3D (no U-turns or loops)
  function createRandomCurve() {
    const points = [];
    const direction = Math.random() > 0.5 ? 1 : -1; // 1 = left-to-right, -1 = right-to-left
    
    const startX = direction === 1 ? -45 : 45;
    const endX = direction === 1 ? 45 : -45;
    
    // Generate checkpoints along the X axis
    const numSegments = 4;
    const stepX = (endX - startX) / numSegments;
    
    // Base height and depth
    const baseY = -11 + Math.random() * 22; // Height ranges across the full canvas height (-11 to 11)
    const baseZ = -6 - Math.random() * 8;   // Depth layer ranges from -6 to -14
    
    // 1. Start point
    points.push(new THREE.Vector3(startX, baseY + (Math.random() - 0.5) * 4, baseZ));
    
    // 2. Generate points moving strictly forward along X (no U-turns), with small Y/Z offsets for gentle curves
    for (let i = 1; i < numSegments; i++) {
      const x = startX + i * stepX;
      const y = baseY + (Math.random() - 0.5) * 7; // Gentle vertical wave
      const z = baseZ + (Math.random() - 0.5) * 3; // Gentle depth wave
      points.push(new THREE.Vector3(x, y, z));
    }
    
    // 3. End point
    points.push(new THREE.Vector3(endX, baseY + (Math.random() - 0.5) * 4, baseZ));
    
    // Create a smooth spline curve interpolating these control points
    return new THREE.CatmullRomCurve3(points);
  }

  // Helper to assign a brand new flight path to a bird
  function assignNewPath(bird, isInitial = false, birdIndex = 0) {
    const curve = createRandomCurve();
    const curveLength = curve.getLength();
    
    // Tie speed and scale multiplier to the start depth to maintain parallax depth perception
    const startPoint = curve.points[0];
    const z = startPoint.z;
    
    // Z ranges from -6 to -14. Farther away is smaller & slower.
    const scaleMult = 0.65 + Math.random() * 0.5;
    const physicalSpeed = 1.0 + 2.0 * ((z + 14) / 8); // Speed in units/sec: 1.0 (far) to 3.0 (close)
    
    bird.curve = curve;
    bird.curveLength = curveLength;
    bird.physicalSpeed = physicalSpeed;
    const visibleStarts = [0.36, 0.46, 0.56, 0.66];
    const visibleJitter = (Math.random() - 0.5) * 0.04;
    bird.t = isInitial
      ? (isTopBand ? clamp01(visibleStarts[birdIndex % visibleStarts.length] + visibleJitter) : Math.random())
      : 0;
    bird.baseZ = z;

    // Apply scale multiplier to local model container
    const scale = bird.baseScale * scaleMult;
    bird.modelContainer.scale.set(scale, scale, scale);
    
    // Reset model container rotation
    bird.modelContainer.rotation.set(0, 0, 0);

    if (bird.mixer) {
      // Flapping frequency matches speed (faster birds flap faster)
      bird.mixer.timeScale = 0.3 + 0.35 * ((z + 14) / 8);
    }

    // Instantly snap to initial position and heading to prevent rapid spinning on spawn/reset
    const startPos = bird.curve.getPointAt(bird.t);
    const startTangent = bird.curve.getTangentAt(bird.t).normalize();
    bird.group.position.copy(startPos);
    
    dummyObject.position.copy(startPos);
    dummyObject.lookAt(new THREE.Vector3().addVectors(startPos, startTangent));
    bird.group.quaternion.copy(dummyObject.quaternion);
  }

  loader.load(
    './assets/birds.glb',
    (gltf) => {
      // Calculate normal scale from the master model
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const baseScale = 2.2 / maxDim;

      // Spawn all birds
      for (let i = 0; i < NUM_BIRDS; i++) {
        const birdGroup = new THREE.Group(); // Handles translation and heading direction
        const modelContainer = new THREE.Group(); // Handles scale, centering, and orientation offsets

        // Clone the model safely
        const clonedScene = SkeletonUtils.clone(gltf.scene);
        modelContainer.add(clonedScene);

        // Center geometry
        const center = box.getCenter(new THREE.Vector3());
        clonedScene.position.set(-center.x, -center.y, -center.z);
        clonedScene.rotation.y = Math.PI; // Face forward (+Z direction relative to container)

        birdGroup.add(modelContainer);
        scene.add(birdGroup);

        // Setup individual mixer
        let mixer = null;
        if (gltf.animations && gltf.animations.length > 0) {
          mixer = new THREE.AnimationMixer(clonedScene);
          gltf.animations.forEach((clip) => {
            const action = mixer.clipAction(clip);
            action.play();
          });
          mixer.update(Math.random() * 3.0); // Offset initial wings flap phase
        }

        const bird = {
          group: birdGroup,
          modelContainer: modelContainer,
          baseScale: baseScale,
          mixer: mixer,
          curve: null,
          curveLength: 0,
          physicalSpeed: 0,
          t: 0,
          baseZ: 0
        };

        assignNewPath(bird, true, i);
        birds.push(bird);
      }

      // Render/Animation Loop
      function animate() {
        if (!isActive) {
          animationFrame = 0;
          return;
        }
        animationFrame = requestAnimationFrame(animate);

        const delta = Math.min(clock.getDelta(), 0.033);

        birds.forEach((bird) => {
          if (bird.mixer) bird.mixer.update(delta);

          // Advance progress along spline curve
          bird.t += (bird.physicalSpeed / bird.curveLength) * delta;

          // If path is complete, assign a new path
          if (bird.t >= 1) {
            assignNewPath(bird, false);
            return;
          }

          // Calculate current position
          const currentPos = bird.curve.getPointAt(bird.t);
          
          // Calculate heading/tangent vector (pointing forward along the curve)
          const tangent = bird.curve.getTangentAt(bird.t).normalize();
          
          // Set position of the bird group
          bird.group.position.copy(currentPos);
          
          // Target lookAt vector
          const target = new THREE.Vector3().addVectors(currentPos, tangent);
          
          // Use dummyObject to calculate target orientation
          dummyObject.position.copy(currentPos);
          dummyObject.lookAt(target);
          
          // Spherical Linear Interpolation (slerp) makes pitch & yaw transitions perfectly smooth
          bird.group.quaternion.slerp(dummyObject.quaternion, 0.05);
        });

        renderer.render(scene, camera);
      }

      const startRendering = () => {
        if (isActive) return;
        isActive = true;
        clock.getDelta();
        if (!animationFrame) animate();
      };

      const stopRendering = () => {
        isActive = false;
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
          animationFrame = 0;
        }
      };

      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          if (entries[0]?.isIntersecting) {
            startRendering();
          } else {
            stopRendering();
          }
        }, {
          root: null,
          rootMargin: '320px 0px',
          threshold: 0
        });
        observer.observe(canvas);
      } else {
        startRendering();
      }
    },
    undefined,
    (error) => {
      console.error('Error loading 3D model:', error);
    }
  );

  // Resize handler
  window.addEventListener('resize', onWindowResize);
  document.addEventListener('site-split-change', onWindowResize);
  if ('ResizeObserver' in window) {
    new ResizeObserver(onWindowResize).observe(canvas);
  }

  function onWindowResize() {
    const size = getCanvasSize();
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
    renderer.setSize(size.width, size.height, false);
  }
}
