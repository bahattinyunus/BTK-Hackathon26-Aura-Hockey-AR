/**
 * Main Game Loop & Initialization
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GlitchPass } from 'three/addons/postprocessing/GlitchPass.js';
import { FilmPass } from 'three/addons/postprocessing/FilmPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/addons/shaders/RGBShiftShader.js';

import { Vision } from './vision.js';
import { Physics } from './physics.js';
import { Sound } from './sound.js';
import { Config } from './config.js';
import { Narrative } from './narrative.js';

class Game {
    constructor() {
        console.log("Aura Hockey AR initializing...");
        this.vision = new Vision();
        this.physics = new Physics();
        this.sound = new Sound();
        this.narrative = new Narrative();

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

        // Apex States
        this.telemetrySprite = null;
        this.telemetryCanvas = null;
        this.telemetryCtx = null;
        this.telemetryTexture = null;

        this.init();
    }

    async init() {
        // 1. BIOS Sequence starts IMMEDIATELY (Non-blocking)
        this.runStartupSequence();

        // 2. Three.js Setup
        this.initThree();

        // 3. UI Handle (Delayed interactivity)
        const startBtn = document.getElementById('start-btn');
        const startScreen = document.getElementById('start-screen');

        if (startBtn) {
            startBtn.addEventListener('click', async () => {
                startBtn.innerHTML = "NEURAL SYNCING...";
                startBtn.disabled = true;
                if (this.sound) this.sound.init();

                setTimeout(() => {
                    startScreen.style.opacity = '0';
                    setTimeout(() => {
                        startScreen.remove();
                        // Start Narrative AFTER full UI removal
                        this.narrative.showChapter(0);
                        this.applyChapterSettings();
                    }, 500);
                }, 1200);
            });
        }

        // 4. Heavy Initializations (Async)
        try {
            await this.vision.init(this.scene);
        } catch (e) {
            console.error("Vision Init Error:", e);
        }

        window.game = this;
        this.narrative.init();

        this.physics.init(this.scene, this.sound);
        this.physics.onScoreUpdate = this.updateScoreUI.bind(this);
        this.physics.onFeverUpdate = this.handleFeverMode.bind(this);

        // 5. Apex Telemetry
        this.initTelemetry();

        // Global Reflections
        this.setupGlobalEnvMap();

        this.addLog("AURA_OS_KERNEL_LOADED [v4.0]");
        this.addLog("NEURAL_SYNC_INITIALIZED");

        // 5. Start Loop
        this.animate();
    }

    initThree() {
        const container = document.getElementById('canvas-container');

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a15); // Dark navy background
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

        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.6, 0.3, 0.9);
        bloomPass.threshold = Config.Graphics.bloomThreshold;
        bloomPass.strength = Config.Graphics.bloomStrength;
        bloomPass.radius = Config.Graphics.bloomRadius;

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(renderScene);
        this.composer.addPass(bloomPass);

        this.createGodRays();

        this.glitchPass = new GlitchPass();
        this.glitchPass.enabled = false;
        this.glitchPass.goWild = true;
        this.composer.addPass(this.glitchPass);

        const filmPass = new FilmPass(0.35, 0.025, 648, false);
        this.composer.addPass(filmPass);

        this.rgbPass = new ShaderPass(RGBShiftShader);
        this.rgbPass.uniforms['amount'].value = 0.0015;
        this.composer.addPass(this.rgbPass);

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

        // Apex Telemetry update
        this.updateTelemetry();

        if (!this.isCinematicActive) {
            this.updateActionCam(delta);
        } else {
            // Cinematic Camera Sweep
            this.camera.position.x = Math.sin(Date.now() * 0.001) * 15;
            this.camera.position.z = Math.cos(Date.now() * 0.001) * 15;
            this.camera.lookAt(0, 0, 0);
        }

        // Dynamic Corruption (High Intensity)
        if (this.physics.rallyCount > 8) {
            const jitter = (this.physics.rallyCount - 8) * 0.01;
            this.camera.position.x += (Math.random() - 0.5) * jitter;
            this.camera.position.y += (Math.random() - 0.5) * jitter;
        }

        // Zenith: Speed-Based Lens Jitter
        if (this.physics.puckVelocity && this.physics.puckVelocity.length() > 45) {
            this.camera.position.x += (Math.random() - 0.5) * 0.04;
            this.camera.position.y += (Math.random() - 0.5) * 0.04;
        }

        // Zenith: Lore Data Stream
        if (!this.loreTimer) this.loreTimer = 0;
        this.loreTimer += delta;
        if (this.loreTimer > 4.0) {
            this.loreTimer = 0;
            this.triggerLoreEvent();
        }

        // Zenith: Dynamic RGB Shift Pulse Decay
        if (this.rgbPass && this.rgbPass.uniforms['amount'].value > 0.0015) {
            this.rgbPass.uniforms['amount'].value *= 0.94;
        }

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
            this.triggerGlitch();
            this.checkChapterProgress(player);
        }
    }

    checkChapterProgress(playerScore) {
        const chapter = this.narrative.getChapterSettings();
        const goal = parseInt(chapter.goal); // "3 puan topla" -> 3

        if (playerScore >= goal) {
            const nextIdx = this.narrative.currentChapterIndex + 1;
            if (nextIdx < 3) {
                this.narrative.showChapter(nextIdx);
                this.applyChapterSettings();
                // Reset score for next chapter challenge
                this.physics.scorePlayer = 0;
                this.physics.scoreAI = 0;
                this.updateScoreUI(0, 0);
            } else {
                // Final Chapter Complete -> OMEGA FINISH
                this.triggerGameOver('player');
            }
        }
    }

    applyChapterSettings() {
        const chapter = this.narrative.getChapterSettings();
        // Theme Update
        if (this.physics.tableGroup) {
            this.physics.tableGroup.children.forEach(child => {
                if (child.material && child.material.emissive) {
                    child.material.color.setHex(chapter.themeColor);
                    child.material.emissive.setHex(chapter.themeColor);
                }
            });
        }
        console.log(`🚀 Chapter Applied: ${chapter.title}`);
    }

    triggerGlitch() {
        this.glitchPass.enabled = true;
        setTimeout(() => {
            this.glitchPass.enabled = false;
        }, 500);
    }

    handleFeverMode(active) {
        const body = document.body;
        const scoreDisplay = document.getElementById('score-display');

        if (active) {
            body.classList.add('fever-active');
            if (scoreDisplay) scoreDisplay.classList.add('animate-pulse', 'border-red-500');
            this.composer.passes[1].strength = Config.Gameplay.feverBloomMult; // Bloom increase
            this.rgbPass.uniforms['amount'].value = 0.005; // Intense RGB Shift
        } else {
            body.classList.remove('fever-active');
            if (scoreDisplay) scoreDisplay.classList.remove('animate-pulse', 'border-red-500');
            this.composer.passes[1].strength = Config.Graphics.bloomStrength;
            this.rgbPass.uniforms['amount'].value = 0.0015;
        }
    }

    updateActionCam(delta) {
        if (!this.physics.puck || !this.camera) return;

        const puckVel = this.physics.puckVelocity.length();
        const targetFOV = 60 + (puckVel * 0.2);
        const targetZ = 12 + (this.physics.puck.position.z * 0.1);

        // Alpha Lerp for smoothness
        this.camera.fov += (targetFOV - this.camera.fov) * 0.1;
        this.camera.position.z += (targetZ - this.camera.position.z) * 0.1;
        this.camera.updateProjectionMatrix();

        // Subtle tilt based on puck position
        this.camera.rotation.y = -this.physics.puck.position.x * 0.01;
    }

    runStartupSequence() {
        const bios = document.getElementById('bios-boot');
        const menu = document.getElementById('main-menu');
        if (!bios || !menu) return;

        bios.style.opacity = '1';
        const lines = bios.querySelectorAll('p');
        lines.forEach((line, i) => {
            setTimeout(() => {
                line.classList.add('bios-line');
                if (window.game && window.game.sound) {
                    window.game.sound.playTone('sine', 1000 + (Math.random() * 500), 0.01, 0.01);
                }
            }, i * 150);
        });

        setTimeout(() => {
            bios.style.opacity = '0';
            menu.classList.add('visible');
        }, lines.length * 150 + 500);
    }

    setupGlobalEnvMap() {
        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        pmremGenerator.compileEquirectangularShader();

        // Create a procedural neon-skybox
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createLinearGradient(0, 0, 0, 256);
        grad.addColorStop(0, '#000033');
        grad.addColorStop(0.5, '#000000');
        grad.addColorStop(1, '#330033');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 256);

        const texture = new THREE.CanvasTexture(canvas);
        texture.mapping = THREE.EquirectangularReflectionMapping;
        this.scene.environment = pmremGenerator.fromEquirectangular(texture).texture;
    }

    triggerGameOver(winner) {
        this.isGameOver = true;
        this.isCinematicActive = true;
        this.triggerChromaticPulse(0.1);
        this.addLog(`MATCH_COMPLETE: WINNER_${winner.toUpperCase()}`);

        const title = winner === 'player' ? 'VICTORY' : 'DEFEATED';
        const msg = winner === 'player' ? 'NEO-ANKARA HAS A NEW KING' : 'DATA CORRUPTED. TRY AGAIN.';

        this.narrative.dialogueText.innerHTML = `<h1 class='text-6xl font-black italic'>${title}</h1><p class='text-sm mt-4 opacity-70'>${msg}</p>`;
        this.narrative.overlay.classList.add('visible');

        // Slow Motion
        this.physics.isFeverMode = true; // High bloom during endgame
    }

    createGodRays() {
        const rayCount = 3;
        const rayGeo = new THREE.CylinderGeometry(0.5, 3, 20, 32, 1, true);
        const rayMat = new THREE.MeshBasicMaterial({
            color: 0x4488ff,
            transparent: true,
            opacity: 0.1,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            depthWrite: false
        });

        for (let i = 0; i < rayCount; i++) {
            const ray = new THREE.Mesh(rayGeo, rayMat);
            ray.position.set((i - 1) * 6, 10, -5);
            ray.rotation.z = (Math.random() - 0.5) * 0.5;
            this.scene.add(ray);
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

    addLog(message) {
        const logContainer = document.getElementById('status-log');
        if (!logContainer) return;

        const log = document.createElement('div');
        log.className = 'opacity-0 transform translate-x-4 transition-all duration-300 mb-1';
        log.innerHTML = `[${new Date().toLocaleTimeString('en-US', { hour12: false, minute: '2-digit', second: '2-digit' })}] > ${message}`;

        logContainer.appendChild(log);
        if (logContainer.childNodes.length > 5) logContainer.removeChild(logContainer.firstChild);

        requestAnimationFrame(() => log.classList.remove('opacity-0', 'translate-x-4'));

        setTimeout(() => {
            log.classList.add('opacity-0', '-translate-y-2');
            setTimeout(() => log.remove(), 300);
        }, 5000);
    }

    triggerLoreEvent() {
        const events = [
            "NEURAL_SYNC_STABLE",
            "ORBITAL_RESONANCE: 99.4%",
            "AURA_LINK_ENCRYPTED",
            "GRAVITY_ANCHORS: ACTIVE",
            "BEYOND_HORIZON_SYNC",
            "CYAN_FLOW_OPTIMIZED",
            "SYSTEM_TEMP: NOMINAL",
            "NEO_ANKARA_GRID: UP"
        ];
        const randomMsg = events[Math.floor(Math.random() * events.length)];
        this.addLog(randomMsg);
    }

    triggerChromaticPulse(intensity = 0.05) {
        if (this.rgbPass) {
            this.rgbPass.uniforms['amount'].value = intensity;
        }
    }

    initTelemetry() {
        this.telemetryCanvas = document.createElement('canvas');
        this.telemetryCanvas.width = 256;
        this.telemetryCanvas.height = 128;
        this.telemetryCtx = this.telemetryCanvas.getContext('2d');

        this.telemetryTexture = new THREE.CanvasTexture(this.telemetryCanvas);
        const material = new THREE.SpriteMaterial({
            map: this.telemetryTexture,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthTest: false
        });

        this.telemetrySprite = new THREE.Sprite(material);
        this.telemetrySprite.scale.set(4, 2, 1);
        this.scene.add(this.telemetrySprite);
    }

    updateTelemetry() {
        if (!this.physics.puck || !this.telemetryCtx) return;

        const ctx = this.telemetryCtx;
        const puck = this.physics.puck;
        const vel = this.physics.puckVelocity ? this.physics.puckVelocity.length() : 0;

        ctx.clearRect(0, 0, 256, 128);

        // Background
        ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
        ctx.fillRect(0, 0, 256, 128);
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, 256, 128);

        // Text
        ctx.font = 'bold 20px monospace';
        ctx.fillStyle = '#00ffff';
        ctx.fillText(`VELOCITY: ${vel.toFixed(1)} m/s`, 20, 40);
        ctx.font = '16px monospace';
        ctx.fillText(`RALLY: ${this.physics.rallyCount}`, 20, 70);
        ctx.fillText(`VECTOR: [${this.physics.puckVelocity?.x.toFixed(1)}, ${this.physics.puckVelocity?.z.toFixed(1)}]`, 20, 100);

        // Pulse effect
        const pulse = Math.sin(Date.now() * 0.01) * 0.2 + 0.8;
        this.telemetrySprite.material.opacity = pulse;

        this.telemetryTexture.needsUpdate = true;
        this.telemetrySprite.position.set(puck.position.x, puck.position.y + 1.5, puck.position.z);
    }
}

// Start the game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
