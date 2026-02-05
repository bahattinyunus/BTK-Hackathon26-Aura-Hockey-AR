/**
 * Main Game Loop & Initialization
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import { Vision } from './vision.js';
import { Physics } from './physics.js';
import { Sound } from './sound.js';
import { Config } from './config.js';

class Game {
    constructor() {
        console.log("Aura Hockey AR initializing...");
        this.vision = new Vision();
        this.physics = new Physics();
        this.sound = new Sound();

        // Three.js Core
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.composer = null;
        this.controls = null;
        this.clock = new THREE.Clock();

        this.init();
    }

    async init() {
        this.initThree();

        // Handle Start Button
        const startBtn = document.getElementById('start-btn');
        const startScreen = document.getElementById('start-screen');

        startBtn.addEventListener('click', async () => {
            startScreen.style.opacity = '0';
            setTimeout(() => startScreen.remove(), 500);

            // Initialize Audio Context on user gesture
            this.sound.init();

            // Initialize Vision (requests camera)
            await this.vision.init();

            // Initialize Physics
            this.physics.init(this.scene, this.sound);

            // Start Loop
            this.animate();
        });
    }

    initThree() {
        const container = document.getElementById('canvas-container');

        // Scene
        this.scene = new THREE.Scene();
        // this.scene.background = new THREE.Color(0x050505); // Let CSS handle background for now or set here
        this.scene.fog = new THREE.FogExp2(0x000000, 0.035);

        // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 8, 12);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true }); // Antialias false for post-processing performance
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        container.appendChild(this.renderer.domElement);

        // Lights
        const ambientLight = new THREE.AmbientLight(0x404040, 1.5); // Soft white light
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(0, 10, 10);
        this.scene.add(dirLight);

        // OrbitControls (Development Only - optional to keep or disable later)
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Post-Processing (Bloom)
        const renderScene = new RenderPass(this.scene, this.camera);

        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        bloomPass.threshold = Config.Graphics.bloomThreshold;
        bloomPass.strength = Config.Graphics.bloomStrength;
        bloomPass.radius = Config.Graphics.bloomRadius;

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(renderScene);
        this.composer.addPass(bloomPass);

        // Resize Handler
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        const delta = this.clock.getDelta();

        // Update Logic
        const handData = this.vision.getHandData();
        this.physics.update(delta, handData);

        if (this.controls) this.controls.update();

        // Render
        this.composer.render();
        // UI updates could go here (FPS, Status)
    }
}

// Start the game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
