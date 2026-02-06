/**
 * Main Game Loop & Initialization - Optimized & Refactored
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
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

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.composer = null;
        this.controls = null;
        this.clock = new THREE.Clock();

        this.fpsElem = document.getElementById('fps-counter');
        this.framecount = 0;
        this.lastUpdateTime = 0;
        this.isCinematicActive = false;

        this.init();
    }

    async init() {
        this.initThree();
        
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
                        this.narrative.showChapter(0);
                        this.applyChapterSettings();
                    }, 500);
                }, 1200);
            });
        }

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

        this.addLog("AURA_OS_KERNEL_LOADED [v4.1]");
        this.animate();
    }

    initThree() {
        const container = document.getElementById('canvas-container');

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a15);
        this.scene.fog = new THREE.FogExp2(0x000000, 0.035);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 18, 12);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        container.appendChild(this.renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);

        const hemisphereLight = new THREE.HemisphereLight(0x220033, 0x000000, 0.5);
        this.scene.add(hemisphereLight);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.maxPolarAngle = Math.PI / 2.2;

        const renderScene = new RenderPass(this.scene, this.camera);
        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        bloomPass.threshold = Config.Graphics.bloomThreshold;
        bloomPass.strength = Config.Graphics.bloomStrength;
        bloomPass.radius = Config.Graphics.bloomRadius;

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(renderScene);
        this.composer.addPass(bloomPass);

        const filmPass = new FilmPass(0.35, 0.025, 648, false);
        this.composer.addPass(filmPass);

        this.rgbPass = new ShaderPass(RGBShiftShader);
        this.rgbPass.uniforms['amount'].value = 0.0015;
        this.composer.addPass(this.rgbPass);

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

        const handData = this.vision.getHandData();
        this.physics.update(delta, handData);

        if (this.controls) this.controls.update();
        this.composer.render();
        this.updateFPS();
    }

    updateFPS() {
        this.framecount++;
        const now = performance.now();
        if (now - this.lastUpdateTime > 1000) {
            if (this.fpsElem) this.fpsElem.textContent = this.framecount;
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
            this.checkChapterProgress(player);
        }
    }

    checkChapterProgress(playerScore) {
        const chapter = this.narrative.getChapterSettings();
        const goal = parseInt(chapter.goal);

        if (playerScore >= goal) {
            const nextIdx = this.narrative.currentChapterIndex + 1;
            if (nextIdx < 3) {
                this.narrative.showChapter(nextIdx);
                this.applyChapterSettings();
                this.physics.scorePlayer = 0;
                this.physics.scoreAI = 0;
                this.updateScoreUI(0, 0);
            } else {
                this.addLog("MISSION_COMPLETE: NEO-ANKARA_SAVED");
            }
        }
    }

    applyChapterSettings() {
        const chapter = this.narrative.getChapterSettings();
        this.physics.aiSpeed = chapter.aiSpeedMult;
        this.addLog(`CHAPTER_LOADED: ${chapter.title}`);
    }

    triggerCameraShake(intensity) {
        const shake = intensity || Config.Graphics.shakeIntensity;
        this.camera.position.x += (Math.random() - 0.5) * shake;
        this.camera.position.y += (Math.random() - 0.5) * shake;
    }

    handleFeverMode(active) {
        if (active) {
            this.rgbPass.uniforms['amount'].value = 0.01;
            this.addLog("FEVER_MODE_ACTIVE");
        } else {
            this.rgbPass.uniforms['amount'].value = 0.0015;
        }
    }

    addLog(text) {
        const logContainer = document.getElementById('status-log');
        if (!logContainer) return;
        const entry = document.createElement('div');
        entry.className = "opacity-0 translate-x-4 transition-all duration-300";
        entry.innerText = `> ${text}`;
        logContainer.appendChild(entry);
        setTimeout(() => entry.classList.remove('opacity-0', 'translate-x-4'), 10);
        if (logContainer.children.length > 8) logContainer.removeChild(logContainer.firstChild);
    }
}

new Game();
