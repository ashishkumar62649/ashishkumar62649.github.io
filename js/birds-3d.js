document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("birds-canvas");
  if (!canvas) return;

  const container = canvas.parentElement;

  // WebGL Renderer Setup with alpha transparency for sky overlay
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Scene & Perspective Camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 1000);
  camera.position.set(0, 0, 100);

  // Atmospheric lighting to match the top-left sun position
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xfffaed, 0.95);
  sunLight.position.set(-70, 50, 40); // Aligns with top-left sun
  scene.add(sunLight);

  // Procedural Materials
  const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x081635 });
  const wingMaterial = new THREE.MeshLambertMaterial({ color: 0x0b1e42, side: THREE.DoubleSide });

  // Helper to create a single procedurally animated origami bird mesh
  function createBirdMesh() {
    const birdGroup = new THREE.Group();

    // Sleek low-poly body (Head pointing +X, tail -X)
    const bodyGeometry = new THREE.ConeGeometry(0.8, 5.5, 4);
    bodyGeometry.rotateZ(-Math.PI / 2); // Point forward along X axis
    bodyGeometry.scale(1, 0.65, 1);     // Flatten body shape slightly
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    birdGroup.add(bodyMesh);

    // Left Wing (Hinged at left body edge, z = -0.4)
    const leftWingHinge = new THREE.Group();
    leftWingHinge.position.set(0, 0, -0.4);

    const leftWingGeometry = new THREE.BufferGeometry();
    const leftWingVertices = new Float32Array([
      0, 0, 0,           // Joint front
      -1.4, 0, -4.8,     // Wing tip slanted backward
      1.6, 0, 0          // Joint back
    ]);
    leftWingGeometry.setAttribute('position', new THREE.BufferAttribute(leftWingVertices, 3));
    leftWingGeometry.computeVertexNormals();
    const leftWingMesh = new THREE.Mesh(leftWingGeometry, wingMaterial);
    leftWingHinge.add(leftWingMesh);
    birdGroup.add(leftWingHinge);

    // Right Wing (Hinged at right body edge, z = 0.4)
    const rightWingHinge = new THREE.Group();
    rightWingHinge.position.set(0, 0, 0.4);

    const rightWingGeometry = new THREE.BufferGeometry();
    const rightWingVertices = new Float32Array([
      0, 0, 0,           // Joint front
      1.6, 0, 0,         // Joint back
      -1.4, 0, 4.8       // Wing tip slanted backward
    ]);
    rightWingGeometry.setAttribute('position', new THREE.BufferAttribute(rightWingVertices, 3));
    rightWingGeometry.computeVertexNormals();
    const rightWingMesh = new THREE.Mesh(rightWingGeometry, wingMaterial);
    rightWingHinge.add(rightWingMesh);
    birdGroup.add(rightWingHinge);

    return {
      mesh: birdGroup,
      leftWing: leftWingHinge,
      rightWing: rightWingHinge
    };
  }

  // Create the flock
  const birds = [];
  const flockSize = 6;

  // Bound limits in 3D scene matching frustum size
  const boundsX = 85;
  const boundsY = 42;

  for (let i = 0; i < flockSize; i++) {
    const bird = createBirdMesh();
    
    // Distribute birds across the X-axis immediately so they are visible on page load
    const progress = i / flockSize;
    bird.mesh.position.set(
      -boundsX + progress * 2 * boundsX,
      -boundsY + 0.35 * boundsY + Math.random() * 0.5 * boundsY,
      -35 + Math.random() * 70 // Parallax depth layout (z-index layering)
    );

    // 4 fly left-to-right (facing +X), 2 fly right-to-left (facing -X)
    const direction = i % 3 !== 0 ? 1 : -1;
    const baseSpeed = 0.12 + Math.random() * 0.08;
    bird.velocity = new THREE.Vector3(
      direction * baseSpeed,
      (Math.random() - 0.5) * 0.02,
      (Math.random() - 0.5) * 0.015
    );

    if (direction === -1) {
      bird.mesh.rotation.y = Math.PI;
    }

    bird.wingPhase = Math.random() * Math.PI * 2;
    bird.wingSpeed = 8 + Math.random() * 4;

    scene.add(bird.mesh);
    birds.push(bird);
  }

  // Handle canvas sizing and resizing
  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  // Animation Loop
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const time = clock.getElapsedTime();

    birds.forEach(bird => {
      // 1. Procedural wing flap (sinusoidal)
      bird.wingPhase += delta * bird.wingSpeed;
      const angle = Math.sin(bird.wingPhase) * 0.72;
      bird.leftWing.rotation.x = angle;
      bird.rightWing.rotation.x = -angle;

      // 2. Translate forward based on clock
      bird.mesh.position.addScaledVector(bird.velocity, 60 * delta);

      // 3. Subtle organic wave bobbing in flight
      bird.mesh.position.y += Math.sin(time * 1.5 + bird.wingPhase) * 0.012;

      // 4. Update rotation/roll dynamically
      const pitch = bird.velocity.y * 2.5;
      const roll = angle * 0.04;
      if (bird.velocity.x > 0) {
        bird.mesh.rotation.set(pitch, Math.sin(time * 0.15) * 0.04, roll);
      } else {
        bird.mesh.rotation.set(-pitch, Math.PI - Math.sin(time * 0.15) * 0.04, -roll);
      }

      // 5. Wrap screen bounds
      const padding = 15;
      if (bird.velocity.x > 0 && bird.mesh.position.x > boundsX + padding) {
        bird.mesh.position.x = -boundsX - padding;
        bird.mesh.position.y = -boundsY + 0.3 * boundsY + Math.random() * 0.5 * boundsY;
      } else if (bird.velocity.x < 0 && bird.mesh.position.x < -boundsX - padding) {
        bird.mesh.position.x = boundsX + padding;
        bird.mesh.position.y = -boundsY + 0.3 * boundsY + Math.random() * 0.5 * boundsY;
      }
    });

    renderer.render(scene, camera);
  }

  animate();
});
