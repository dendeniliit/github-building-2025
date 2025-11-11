import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

// Configuration
const USERNAME = 'dendenilit';
const YEAR = 2025;

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0520);
scene.fog = new THREE.Fog(0x0a0520, 60, 150);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(60, 35, 60);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Lighting
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

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.8;
controls.minDistance = 30;
controls.maxDistance = 120;
controls.maxPolarAngle = Math.PI / 2.1;

// Generate realistic contribution data
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

// Color palette - pastel pink/blue
const buildingColors = [
  { base: 0x6a4c93, emissive: 0x9b72cf },
  { base: 0xffb3d9, emissive: 0xff69b4 },
  { base: 0xb3d9ff, emissive: 0x69b4ff },
  { base: 0xff99cc, emissive: 0xff1493 },
  { base: 0x99ccff, emissive: 0x1493ff }
];


// Create city skyline
function createSkyline(data) {
  const weeksPerYear = 53;
  const daysPerWeek = 7;
  const buildingSize = 1.2;
  const spacing = 0.4;

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
    
  const stageHeight = 2; // Buildings sit on top of stage
building.position.set(x, stageHeight + height / 2, z);
building.userData.targetY = stageHeight + height / 2;
building.scale.set(1, 0.01, 1);
building.position.y = stageHeight;
    scene.add(building);

   // Add windows - for all buildings to avoid black gaps
    if (contrib.level >= 1) {
      const windowCount = Math.floor(height / 1.2);
      for (let i = 0; i < windowCount; i++) {
        const windowGeo = new THREE.BoxGeometry(0.25, 0.25, 0.05);
        const windowMat = new THREE.MeshStandardMaterial({
          color: 0xffffcc,
          emissive: 0xffff00,
          emissiveIntensity: 0.8
        });
        
        const stageHeight = 2;
        const window1 = new THREE.Mesh(windowGeo, windowMat);
        window1.position.set(x + 0.25, stageHeight + i * 1.2 + 0.8, z + buildingSize / 2 + 0.03);
        
        // Store target position and animate with building
        window1.userData.targetY = stageHeight + i * 1.2 + 0.8;
        window1.userData.building = building; // Link to parent building
        window1.scale.set(1, 0.01, 1);
        window1.position.y = stageHeight;
        
        scene.add(window1);
        animateBuilding(window1, index * 2); // Same animation timing as building

        const window2 = new THREE.Mesh(windowGeo, windowMat);
        window2.position.set(x - 0.25, stageHeight + i * 1.2 + 0.8, z + buildingSize / 2 + 0.03);
        
        window2.userData.targetY = stageHeight + i * 1.2 + 0.8;
        window2.userData.building = building;
        window2.scale.set(1, 0.01, 1);
        window2.position.y = stageHeight;
        
        scene.add(window2);
        animateBuilding(window2, index * 2);
      }
    }

    // Animate
    animateBuilding(building, index * 2);
  });

  createBase();
  createStage();
  createEnvironment();
}

// Smooth spring animation
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

// Create base platform
// Create base platform (now just the outer platform)
function createBase() {
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

  // Grid
  const gridSize = 80;
  const gridDivisions = 60;
  const gridMaterial = new THREE.LineBasicMaterial({ 
    color: 0xff00ff, 
    transparent: true, 
    opacity: 0.2 
  });

  for (let i = -gridDivisions / 2; i <= gridDivisions / 2; i++) {
    const points1 = [];
    points1.push(new THREE.Vector3(-gridSize / 2, 0, i * (gridSize / gridDivisions)));
    points1.push(new THREE.Vector3(gridSize / 2, 0, i * (gridSize / gridDivisions)));
    const geometry1 = new THREE.BufferGeometry().setFromPoints(points1);
    const line1 = new THREE.Line(geometry1, gridMaterial);
    scene.add(line1);

    const points2 = [];
    points2.push(new THREE.Vector3(i * (gridSize / gridDivisions), 0, -gridSize / 2));
    points2.push(new THREE.Vector3(i * (gridSize / gridDivisions), 0, gridSize / 2));
    const geometry2 = new THREE.BufferGeometry().setFromPoints(points2);
    const line2 = new THREE.Line(geometry2, gridMaterial);
    scene.add(line2);
  }

  // Outer rim glow
  const rimGeometry = new THREE.TorusGeometry(75, 0.8, 16, 100);
  const rimMaterial = new THREE.MeshStandardMaterial({
    color: 0xff00ff,
    emissive: 0xff00ff,
    emissiveIntensity: 1
  });
  const rim = new THREE.Mesh(rimGeometry, rimMaterial);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0;
  scene.add(rim);
}

// Create stage platform with name
// Create stage platform with name
function createStage() {
  const stageGroup = new THREE.Group();
  
  // Main stage platform - elevated
  const platformGeometry = new THREE.CylinderGeometry(45, 47, 2, 64); // Reduced from 47, 49
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
  const rimGeometry = new THREE.TorusGeometry(45, 0.8, 16, 100); // Reduced from 47
  const rimMaterial = new THREE.MeshStandardMaterial({
    color: 0xff00ff,
    emissive: 0xff00ff,
    emissiveIntensity: 1.5
  });
  const rim = new THREE.Mesh(rimGeometry, rimMaterial);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 2;
  stageGroup.add(rim);

  // Stage lights around edge
  const lightCount = 24;
  for (let i = 0; i < lightCount; i++) {
    const angle = (i / lightCount) * Math.PI * 2;
    const x = Math.cos(angle) * 46; // Reduced from 48
    const z = Math.sin(angle) * 46; // Reduced from 48
    
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

// Create 3D text on stage
function create3DText() {
  // Empty function - no text needed
}




// Create ferris wheel with billboard in center
function createBillboard() {
  const ferrisGroup = new THREE.Group();

  // --- STRUCTURE ---
const poleGeometry = new THREE.CylinderGeometry(0.4, 0.4, 20, 16); // Tapered legs
const poleMaterial = new THREE.MeshStandardMaterial({
  color: 0xff00ff, // Magenta to match the wheel
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

  // --- FERRIS WHEEL RIMS ---
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

  const innerRimGeo = new THREE.TorusGeometry(6.5, 0.15, 12, 64);
  const innerRimMat = new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    emissive: 0x00ffff,
    emissiveIntensity: 0.8
  });
  const innerRim = new THREE.Mesh(innerRimGeo, innerRimMat);
  innerRim.position.set(0, 18, 0);
  ferrisGroup.add(innerRim);

  // --- SPOKES ---
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

  // --- CABINS ---
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

  // --- HUB ---
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

  // --- BILLBOARD (ONLINE GITHUB LOGO) ---
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

  // --- POSITION + ANIMATION ---
  ferrisGroup.scale.set(1, 1, 1); // Make it bigger
ferrisGroup.position.set(0, 8, -10); // Raise it higher
scene.add(ferrisGroup);

  ferrisGroup.userData.animate = () => {
    outerRim.rotation.z += 0.002;
    innerRim.rotation.z -= 0.002;
    
    cabins.forEach((cabin, i) => {
    const angle = (i / cabinCount) * Math.PI * 2 + outerRim.rotation.z;
    const x = Math.cos(angle) * 9;
    const y = Math.sin(angle) * 9;
    cabin.position.set(x, 18 + y, 0);
    // Keep cabins upright by counter-rotating
    cabin.rotation.z = -outerRim.rotation.z;
    });
  };
}



// Add environment
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

// Animation loop
let time = 0;
function animate() {
  requestAnimationFrame(animate);
  time += 0.01;
  
  controls.update();
  
  scene.children.forEach(child => {
    if (child instanceof THREE.Points) {
      child.rotation.y = time * 0.1;
    }

    if (child.userData.animate) {
      child.userData.animate();
    }

    // Animate ferris wheel
  if (child.userData.animate) {
    child.userData.animate();
  }
  });
  
  renderer.render(scene, camera);
}

// Handle resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Initialize
const contributionData = generateContributionData();
createSkyline(contributionData);
create3DText();
createBillboard();
animate();