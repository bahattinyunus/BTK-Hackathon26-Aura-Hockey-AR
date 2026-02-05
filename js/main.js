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

        // UI Refs
        this.fpsElem = null;
        this.scoreElem = null;
        this.framecount = 0;
        this.lastUpdateTime = 0;

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
            await this.vision.init(this.scene);

            // Global access for triggers
            window.game = this;

            // Initialize Physics
            this.physics.init(this.scene, this.sound);
            this.physics.onScoreUpdate = this.updateScoreUI.bind(this);
            this.physics.onFeverUpdate = this.handleFeverMode.bind(this);

            // UI Elements
            this.fpsElem = document.getElementById('fps-counter');
            this.scoreElem = document.getElementById('score-display'); // We'll add this to index.html if missing

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

        // Lights (Neon Atmosfer)
        const ambientLight = new THREE.AmbientLight(0x000000); // Ortam ışığını kapat (sadece neonlar), ya da çok kısık
        this.scene.add(ambientLight);

        // Sahneye genel bir morumsu loşluk
        const hemisphereLight = new THREE.HemisphereLight(0x220033, 0x000000, 0.5);
        this.scene.add(hemisphereLight);

        // OrbitControls (Development Only)
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2.2; // Kameranın masanın altına girmesini engelle

        // Post-Processing (Bloom - Glow Effect)
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

        // UI updates
        this.updateFPS();
    }

    updateFPS() {
        this.framecount++;
        const now = performance.now();
        if (now - this.lastUpdateTime > 1000) {
            if (this.fpsElem) {
                this.fpsElem.textContent = this.framecount;
            }
            this.framecount = 0;
            this.lastUpdateTime = now;
        }
    }

    updateScoreUI(player, ai) {
        const scoreDisplay = document.getElementById('score-display');
        if (scoreDisplay) {
            scoreDisplay.innerHTML = `
                <span class="text-cyan-400">${player}</span> 
                <span class="text-white mx-2">:</span> 
                <span class="text-red-500">${ai}</span>
            `;
        }
    }

    handleFeverMode(active) {
        const body = document.body;
        const scoreDisplay = document.getElementById('score-display');

        if (active) {
            body.classList.add('fever-active');
            if (scoreDisplay) scoreDisplay.classList.add('animate-pulse', 'border-red-500');
            this.composer.passes[1].strength = Config.Gameplay.feverBloomMult; // Bloom increase
        } else {
            body.classList.remove('fever-active');
            if (scoreDisplay) scoreDisplay.classList.remove('animate-pulse', 'border-red-500');
            this.composer.passes[1].strength = Config.Graphics.bloomStrength;
        }
    }

    shake(intensity = 0.1) {
        const duration = 200;
        const start = performance.now();
        const originalPos = this.camera.position.clone();

        const doShake = (now) => {
            const elapsed = now - start;
            if (elapsed < duration) {
                this.camera.position.x = originalPos.x + (Math.random() - 0.5) * intensity;
                this.camera.position.y = originalPos.y + (Math.random() - 0.5) * intensity;
                requestAnimationFrame(doShake);
            } else {
                this.camera.position.copy(originalPos);
            }
        };
        requestAnimationFrame(doShake);
    }
}

// Start the game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
