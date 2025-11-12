//Building Visualization
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const USERNAME = 'dendeniliit';

const buildingColors = [
  { base: 0x6a4c93, emissive: 0x9b72cf },
  { base: 0xffb3d9, emissive: 0xff69b4 },
  { base: 0xb3d9ff, emissive: 0x69b4ff },
  { base: 0xff99cc, emissive: 0xff1493 },
  { base: 0x99ccff, emissive: 0x1493ff }
];

// ============================================================================
// SCENE SETUP
// ============================================================================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0520);
scene.fog = new THREE.Fog(0x0a0520, 60, 150);

const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(60, 35, 60);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// ============================================================================
// LIGHTING
// ============================================================================

const ambientLight = new THREE.AmbientLight(0xff00ff, 0.5);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xff69ff, 2);
mainLight.position.set(30, 50, 30);
mainLight.castShadow = true;
scene.add(mainLight);

const rimLight = new THREE.DirectionalLight(0x00ffff, 1.5);
rimLight.position.set(-30, 30, -30);
scene.add(rimLight);

const backLight = new THREE.PointLight(0xff00ff, 2, 150);
backLight.position.set(0, 40, -50);
scene.add(backLight);

// ============================================================================
// CONTROLS
// ============================================================================

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.8;
controls.minDistance = 30;
controls.maxDistance = 120;
controls.maxPolarAngle = Math.PI / 2.1;

// ============================================================================
// DATA GENERATION
// ============================================================================

function generateContributionData() {
  const data = [];

  for (let i = 0; i < 365; i++) {
    const dayOfWeek = i % 7;
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    let count;
    if (isWeekend) {
      count = Math.random() > 0.5 ? Math.floor(Math.random() * 12) : 0;
    } else {
      const random = Math.random();
      if (random > 0.7) count = Math.floor(Math.random() * 30);
      else if (random > 0.3) count = Math.floor(Math.random() * 15);
      else count = Math.floor(Math.random() * 5);
    }
    
    const level = count === 0 ? 0 : Math.min(4, Math.floor(count / 7) + 1);
    data.push({ count, level });
  }

  return data;
}

// ============================================================================
// BUILDING ANIMATION
// ============================================================================

function animateBuilding(building, delay) {
  const targetY = building.userData.targetY;
  let progress = 0;

  const animate = () => {
    if (progress < delay) {
      progress += 16;
      requestAnimationFrame(animate);
      return;
    }

    if (building.scale.y < 1) {
      building.scale.y += 0.08;
      building.position.y = targetY * building.scale.y;
      requestAnimationFrame(animate);
    } else {
      building.scale.y = 1;
      building.position.y = targetY;
    }
  };
  
  animate();
}

// ============================================================================
// SKYLINE CREATION
// ============================================================================

function createSkyline(data) {
  const weeksPerYear = 53;
  const daysPerWeek = 7;
  const buildingSize = 1.2;
  const spacing = 0.4;
  const stageHeight = 2;

  data.forEach((contrib, index) => {
    const week = Math.floor(index / daysPerWeek);
    const day = index % daysPerWeek;

    if (week >= weeksPerYear) return;

    const height = Math.max(1.5, contrib.count * 0.6 + 2);
    const colors = buildingColors[contrib.level];

    // Main building
    const geometry = new THREE.BoxGeometry(buildingSize, height, buildingSize);
    const material = new THREE.MeshStandardMaterial({
      color: colors.base,
      emissive: colors.emissive,
      emissiveIntensity: 0.4,
      metalness: 0.3,
      roughness: 0.6
    });

    const building = new THREE.Mesh(geometry, material);
    building.castShadow = true;
    building.receiveShadow = true;

    const x = (week - weeksPerYear / 2) * (buildingSize + spacing) + 1;
    const z = (day - daysPerWeek / 2) * (buildingSize + spacing);
    
    building.position.set(x, stageHeight + height / 2, z);
    building.userData.targetY = stageHeight + height / 2;
    building.scale.set(1, 0.01, 1);
    building.position.y = stageHeight;
    scene.add(building);

    // Add windows
    if (contrib.level >= 1) {
      const windowCount = Math.floor(height / 1.2);
      for (let i = 0; i < windowCount; i++) {
        const windowGeo = new THREE.BoxGeometry(0.25, 0.25, 0.05);
        const windowMat = new THREE.MeshStandardMaterial({
          color: 0xffffcc,
          emissive: 0xffff00,
          emissiveIntensity: 0.8
        });
        
        const window1 = new THREE.Mesh(windowGeo, windowMat);
        window1.position.set(
          x + 0.25,
          stageHeight + i * 1.2 + 0.8,
          z + buildingSize / 2 + 0.03
        );
        window1.userData.targetY = stageHeight + i * 1.2 + 0.8;
        window1.userData.building = building;
        window1.scale.set(1, 0.01, 1);
        window1.position.y = stageHeight;
        scene.add(window1);
        animateBuilding(window1, index * 2);

        const window2 = new THREE.Mesh(windowGeo, windowMat);
        window2.position.set(
          x - 0.25,
          stageHeight + i * 1.2 + 0.8,
          z + buildingSize / 2 + 0.03
        );
        window2.userData.targetY = stageHeight + i * 1.2 + 0.8;
        window2.userData.building = building;
        window2.scale.set(1, 0.01, 1);
        window2.position.y = stageHeight;
        scene.add(window2);
        animateBuilding(window2, index * 2);
      }
    }

    animateBuilding(building, index * 2);
  });

  createBase();
  createStage();
  createEnvironment();
}

// ============================================================================
// BASE PLATFORM
// ============================================================================

function createBase() {
  // Main base cylinder
  const baseGeometry = new THREE.CylinderGeometry(75, 80, 2, 64);
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0x0d0520,
    emissive: 0x1a0d2e,
    emissiveIntensity: 0.2,
    metalness: 0.8,
    roughness: 0.2
  });
  
  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.y = -1;
  base.receiveShadow = true;
  scene.add(base);

  // Outer base rim
  const outerBaseRimGeometry = new THREE.TorusGeometry(75, 0.8, 16, 100);
  const outerBaseRimMaterial = new THREE.MeshStandardMaterial({
    color: 0xff00ff,
    emissive: 0xff00ff,
    emissiveIntensity: 1
  });
  const outerBaseRim = new THREE.Mesh(outerBaseRimGeometry, outerBaseRimMaterial);
  outerBaseRim.rotation.x = Math.PI / 2;
  outerBaseRim.position.y = 0;
  scene.add(outerBaseRim);
  scene.userData.outerBaseRim = outerBaseRim;

  // Electric arcs for outer base
  const outerArcCount = 8;
  const outerArcs = [];
  
  for (let i = 0; i < outerArcCount; i++) {
    const arcGeometry = new THREE.TorusGeometry(75, 0.4, 8, 32, Math.PI / 6);
    const arcMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.8
    });
    const arc = new THREE.Mesh(arcGeometry, arcMaterial);
    arc.rotation.x = Math.PI / 2;
    arc.rotation.z = (i / outerArcCount) * Math.PI * 2;
    arc.position.y = 0;
    scene.add(arc);
    outerArcs.push(arc);
  }
  
  scene.userData.outerBaseArcs = outerArcs;

  // Outer base grid
  createCircularGrid(75, 50, 0, 0.2, 'outerElectricLines');

  // Stage grid
  createCircularGrid(45, 40, 2.1, 0.3, 'electricLines');

  // Circuit board nodes
  createCircuitNodes();

  // Stage edge rim
  const rimGeometry = new THREE.TorusGeometry(45, 0.8, 16, 100);
  const rimMaterial = new THREE.MeshStandardMaterial({
    color: 0xff00ff,
    emissive: 0xff00ff,
    emissiveIntensity: 1
  });
  const rim = new THREE.Mesh(rimGeometry, rimMaterial);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 2.1;
  scene.add(rim);
  scene.userData.outerRim = rim;

  // Electric arcs for stage edge
  const arcCount = 8;
  const arcs = [];
  
  for (let i = 0; i < arcCount; i++) {
    const arcGeometry = new THREE.TorusGeometry(45, 0.4, 8, 32, Math.PI / 6);
    const arcMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.8
    });
    const arc = new THREE.Mesh(arcGeometry, arcMaterial);
    arc.rotation.x = Math.PI / 2;
    arc.rotation.z = (i / arcCount) * Math.PI * 2;
    arc.position.y = 2.1;
    scene.add(arc);
    arcs.push(arc);
  }
  
  scene.userData.electricArcs = arcs;
}

function createCircularGrid(radius, divisions, yPos, opacity, storageKey) {
  const electricLines = [];
  
  for (let i = -divisions; i <= divisions; i++) {
    const step = (radius * 2) / divisions;
    const pos = i * step;
    
    // Horizontal lines
    const maxWidth = Math.sqrt(radius * radius - pos * pos);
    if (!isNaN(maxWidth)) {
      const points1 = [
        new THREE.Vector3(-maxWidth, yPos, pos),
        new THREE.Vector3(maxWidth, yPos, pos)
      ];
      const geometry1 = new THREE.BufferGeometry().setFromPoints(points1);
      const material1 = new THREE.LineBasicMaterial({ 
        color: 0xff00ff, 
        transparent: true, 
        opacity
      });
      
      const line1 = new THREE.Line(geometry1, material1);
      scene.add(line1);
      electricLines.push({ 
        line: line1, 
        baseOpacity: opacity, 
        pulseOffset: Math.random() * Math.PI * 2 
      });
    }

    // Vertical lines
    const maxHeight = Math.sqrt(radius * radius - pos * pos);
    if (!isNaN(maxHeight)) {
      const points2 = [
        new THREE.Vector3(pos, yPos, -maxHeight),
        new THREE.Vector3(pos, yPos, maxHeight)
      ];
      const geometry2 = new THREE.BufferGeometry().setFromPoints(points2);
      const material2 = new THREE.LineBasicMaterial({ 
        color: 0x00ffff, 
        transparent: true, 
        opacity
      });
      
      const line2 = new THREE.Line(geometry2, material2);
      scene.add(line2);
      electricLines.push({ 
        line: line2, 
        baseOpacity: opacity, 
        pulseOffset: Math.random() * Math.PI * 2 
      });
    }
  }
  
  scene.userData[storageKey] = electricLines;
}

function createCircuitNodes() {
  const nodeGeometry = new THREE.SphereGeometry(0.3, 8, 8);
  const nodes = [];
  
  for (let i = 0; i < 50; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 43;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    
    const nodeMaterial = new THREE.MeshStandardMaterial({
      color: Math.random() > 0.5 ? 0xff00ff : 0x00ffff,
      emissive: Math.random() > 0.5 ? 0xff00ff : 0x00ffff,
      emissiveIntensity: 1
    });
    
    const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
    node.position.set(x, 2.2, z);
    scene.add(node);
    nodes.push({ mesh: node, pulseOffset: Math.random() * Math.PI * 2 });
  }
  
  scene.userData.electricNodes = nodes;
}

// ============================================================================
// STAGE PLATFORM
// ============================================================================

function createStage() {
  const stageGroup = new THREE.Group();
  
  // Main platform
  const platformGeometry = new THREE.CylinderGeometry(45, 47, 2, 64);
  const platformMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d1544,
    emissive: 0x5a2d88,
    emissiveIntensity: 0.3,
    metalness: 0.8,
    roughness: 0.2
  });
  const platform = new THREE.Mesh(platformGeometry, platformMaterial);
  platform.position.y = 1;
  platform.castShadow = true;
  platform.receiveShadow = true;
  stageGroup.add(platform);

  // Glowing rim
  const rimGeometry = new THREE.TorusGeometry(45, 0.8, 16, 100);
  const rimMaterial = new THREE.MeshStandardMaterial({
    color: 0xff00ff,
    emissive: 0xff00ff,
    emissiveIntensity: 1.5
  });
  const rim = new THREE.Mesh(rimGeometry, rimMaterial);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 2;
  stageGroup.add(rim);

  // Stage lights
  const lightCount = 24;
  for (let i = 0; i < lightCount; i++) {
    const angle = (i / lightCount) * Math.PI * 2;
    const x = Math.cos(angle) * 46;
    const z = Math.sin(angle) * 46;
    
    const lightGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    const lightMaterial = new THREE.MeshStandardMaterial({
      color: i % 2 === 0 ? 0xff00ff : 0xff6600,
      emissive: i % 2 === 0 ? 0xff00ff : 0x00ffff,
      emissiveIntensity: 0.6
    });
    const light = new THREE.Mesh(lightGeometry, lightMaterial);
    light.position.set(x, 2, z);
    stageGroup.add(light);
  }

  scene.add(stageGroup);
}

// ============================================================================
// USERNAME LABEL
// ============================================================================

function createUsernameLabel() {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 2024;
  canvas.height = 300;

  // Shadow
  context.shadowColor = '#8d2157ff';
  context.shadowBlur = 20;
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 7;

  // Stroke
  context.lineWidth = 10;
  context.strokeStyle = '#ffffff';
  context.font = 'bold 400px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.strokeText(USERNAME, canvas.width / 2, canvas.height / 2);

  // Gradient fill
  const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0, '#ff99cc');
  gradient.addColorStop(0.5, '#ff66cc');
  gradient.addColorStop(1, '#cc33aa');
  context.fillStyle = gradient;
  context.fillText(USERNAME, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({ 
    map: texture, 
    transparent: true,
    side: THREE.DoubleSide
  });
  const geometry = new THREE.PlaneGeometry(20, 5);
  const label = new THREE.Mesh(geometry, material);

  label.position.set(0, 4.5, 25);
  label.rotation.x = -0.3;
  scene.add(label);
}

// ============================================================================
// FERRIS WHEEL / BILLBOARD
// ============================================================================

function createBillboard() {
  const ferrisGroup = new THREE.Group();

  // Support poles
  const poleGeometry = new THREE.CylinderGeometry(0.4, 0.4, 20, 16);
  const poleMaterial = new THREE.MeshStandardMaterial({
    color: 0xff00ff,
    metalness: 0.5,
    roughness: 0.2,
    emissive: 0xff00ff,
    emissiveIntensity: 0.3
  });

  const leftPole = new THREE.Mesh(poleGeometry, poleMaterial);
  leftPole.position.set(-9, 10, 0);
  const rightPole = leftPole.clone();
  rightPole.position.x = 9;
  ferrisGroup.add(leftPole, rightPole);

  // Outer rim
  const outerRimGeo = new THREE.TorusGeometry(9, 0.4, 24, 100);
  const outerRimMat = new THREE.MeshStandardMaterial({
    color: 0xff00ff,
    emissive: 0xff00ff,
    emissiveIntensity: 1.2,
    metalness: 1.0,
    roughness: 0.2
  });
  const outerRim = new THREE.Mesh(outerRimGeo, outerRimMat);
  outerRim.position.set(0, 18, 0);
  ferrisGroup.add(outerRim);

  // Inner rim
  const innerRimGeo = new THREE.TorusGeometry(6.5, 0.15, 12, 64);
  const innerRimMat = new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    emissive: 0x00ffff,
    emissiveIntensity: 0.8
  });
  const innerRim = new THREE.Mesh(innerRimGeo, innerRimMat);
  innerRim.position.set(0, 18, 0);
  ferrisGroup.add(innerRim);

  // Spokes
  const spokeGeometry = new THREE.CylinderGeometry(0.1, 0.1, 9, 8);
  const spokeMaterial = new THREE.MeshStandardMaterial({
    color: 0xb68cff,
    metalness: 0.9,
    roughness: 0.3
  });
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const spoke = new THREE.Mesh(spokeGeometry, spokeMaterial);
    spoke.position.set(0, 18, 0);
    spoke.rotation.z = angle;
    ferrisGroup.add(spoke);
  }

  // Cabins
  const cabins = [];
  const cabinCount = 12;
  for (let i = 0; i < cabinCount; i++) {
    const angle = (i / cabinCount) * Math.PI * 2;
    const x = Math.cos(angle) * 9;
    const y = Math.sin(angle) * 9;
    const cabinGeo = new THREE.SphereGeometry(0.7, 16, 16);
    const cabinMat = new THREE.MeshStandardMaterial({
      color: i % 2 === 0 ? 0xff69b4 : 0x69b4ff,
      emissive: i % 2 === 0 ? 0xff1493 : 0x1493ff,
      emissiveIntensity: 1.5,
      metalness: 0.8,
      roughness: 0.2
    });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(x, 18 + y, 0);
    ferrisGroup.add(cabin);
    cabins.push(cabin);
  }

  // Hub
  const hubGeo = new THREE.CylinderGeometry(1.8, 1.8, 1, 32);
  const hubMat = new THREE.MeshStandardMaterial({
    color: 0x2d1b3d,
    emissive: 0xff00ff,
    emissiveIntensity: 0.7,
    metalness: 0.9,
    roughness: 0.2
  });
  const hub = new THREE.Mesh(hubGeo, hubMat);
  hub.rotation.x = Math.PI / 2;
  hub.position.set(0, 18, 0);
  ferrisGroup.add(hub);

  // GitHub billboard
  const textureLoader = new THREE.TextureLoader();
  const githubLogo = textureLoader.load(
    "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/github.svg"
  );
  const billboardGeo = new THREE.CircleGeometry(6.8, 64);
  const billboardMat = new THREE.MeshStandardMaterial({
    map: githubLogo,
    emissive: 0xffffff,
    emissiveIntensity: 0.4,
    metalness: 0.4,
    roughness: 0.6,
    side: THREE.DoubleSide,
    transparent: true
  });
  const billboard = new THREE.Mesh(billboardGeo, billboardMat);
  billboard.position.set(0, 18, 0.1);
  ferrisGroup.add(billboard);

  // Position and setup animation
  ferrisGroup.position.set(0, 8, -10);
  scene.add(ferrisGroup);

  ferrisGroup.userData.animate = () => {
    outerRim.rotation.z += 0.002;
    innerRim.rotation.z -= 0.002;
    
    cabins.forEach((cabin, i) => {
      const angle = (i / cabinCount) * Math.PI * 2 + outerRim.rotation.z;
      const x = Math.cos(angle) * 9;
      const y = Math.sin(angle) * 9;
      cabin.position.set(x, 18 + y, 0);
      cabin.rotation.z = -outerRim.rotation.z;
    });
  };
}

// ============================================================================
// ENVIRONMENT
// ============================================================================

function createEnvironment() {
  const particleGeometry = new THREE.BufferGeometry();
  const particleCount = 500;
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 200;
    positions[i * 3 + 1] = Math.random() * 100;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
  }

  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const particleMaterial = new THREE.PointsMaterial({
    color: 0xff69ff,
    size: 0.5,
    transparent: true,
    opacity: 0.6
  });

  const particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);
}

// ============================================================================
// ANIMATION LOOP
// ============================================================================

let time = 0;

function animate() {
  requestAnimationFrame(animate);
  time += 0.01;
  
  controls.update();
  
  // Animate outer base grid
  if (scene.userData.outerElectricLines) {
    scene.userData.outerElectricLines.forEach((item) => {
      const pulse = Math.sin(time * 3 + item.pulseOffset) * 0.5 + 0.5;
      item.line.material.opacity = item.baseOpacity + pulse * 0.4;
      if (Math.random() > 0.98) {
        item.line.material.opacity = 0.8;
      }
    });
  }

  // Animate outer base rim
  if (scene.userData.outerBaseRim) {
    const rimPulse = Math.sin(time * 2) * 0.5 + 0.5;
    scene.userData.outerBaseRim.material.emissiveIntensity = 0.8 + rimPulse * 0.7;
  }

  // Animate outer base arcs
  if (scene.userData.outerBaseArcs) {
    scene.userData.outerBaseArcs.forEach((arc, i) => {
      arc.rotation.z += 0.01;
      const arcPulse = Math.sin(time * 5 + i) * 0.5 + 0.5;
      arc.material.opacity = 0.3 + arcPulse * 0.5;
    });
  }
  
  // Animate stage grid
  if (scene.userData.electricLines) {
    scene.userData.electricLines.forEach((item) => {
      const pulse = Math.sin(time * 3 + item.pulseOffset) * 0.5 + 0.5;
      item.line.material.opacity = item.baseOpacity + pulse * 0.4;
      if (Math.random() > 0.98) {
        item.line.material.opacity = 0.8;
      }
    });
  }

  // Animate circuit nodes
  if (scene.userData.electricNodes) {
    scene.userData.electricNodes.forEach(node => {
      const pulse = Math.sin(time * 4 + node.pulseOffset) * 0.5 + 0.5;
      node.mesh.material.emissiveIntensity = 0.5 + pulse * 1.5;
      node.mesh.scale.setScalar(0.8 + pulse * 0.4);
    });
  }
  
  // Animate stage rim
  if (scene.userData.outerRim) {
    const rimPulse = Math.sin(time * 2) * 0.5 + 0.5;
    scene.userData.outerRim.material.emissiveIntensity = 0.8 + rimPulse * 0.7;
  }
  
  // Animate stage arcs
  if (scene.userData.electricArcs) {
    scene.userData.electricArcs.forEach((arc, i) => {
      arc.rotation.z += 0.01;
      const arcPulse = Math.sin(time * 5 + i) * 0.5 + 0.5;
      arc.material.opacity = 0.3 + arcPulse * 0.5;
    });
  }
  
  // Animate particles and custom animations
  scene.children.forEach(child => {
    if (child instanceof THREE.Points) {
      child.rotation.y = time * 0.1;
    }
    if (child.userData.animate) {
      child.userData.animate();
    }
  });
  
  renderer.render(scene, camera);
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ============================================================================
// INITIALIZATION
// ============================================================================

const contributionData = generateContributionData();
createSkyline(contributionData);
createBillboard();
createUsernameLabel();
animate();
