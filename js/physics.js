import * as THREE from 'three';
import { Config } from './config.js';
import { Effects } from './effects.js';

export class Physics {
    constructor() {
        console.log("Fizik modülü yüklendi (Zero-Build Mode)");
        this.scene = null;
        this.sound = null;
        this.effects = null;

        // Oyun Nesneleri
        this.paddle = null;
        this.puck = null;
        this.aiPaddle = null;
        this.tableGroup = null;
        this.cubeCamera = null;
        this.cubeRenderTarget = null;
        this.reflectionFrameCount = 0;

        // Humanizing AI
        this.aiTargetX = 0;
        this.aiTargetZ = 0;
        this.aiReactionTimer = 0;
        this.AI_REACTION_DELAY = 0.05; // 50ms delay for organic feel

        // Sabitler
        this.TABLE_WIDTH = Config.Table.width;
        this.TABLE_LENGTH = Config.Table.length;

        // Scoring & State
        this.scorePlayer = 0;
        this.scoreAI = 0;
        this.rallyCount = 0;
        this.isFeverMode = false;

        // Momentum Tracking
        this.lastPaddlePos = new THREE.Vector3();
        this.paddleVelocity = new THREE.Vector3();
        this.lastAIPaddlePos = new THREE.Vector3();
        this.aiPaddleVelocity = new THREE.Vector3();

        // AI FSM
        this.AI_STATES = { DEFEND: 'DEFEND', ATTACK: 'ATTACK', WAIT: 'WAIT' };
        this.currentAIState = this.AI_STATES.DEFEND;

        // Ultimate State
        this.fistChargeTime = 0;
        this.isAuraBurstReady = false;

        // Apex: AI Dimensional Ghosting
        this.aiGhosts = [];
        this.ghostSpawnTimer = 0;
        this.GHOST_INTERVAL = 0.1; // Ghost every 100ms

        // Singularity: Temporal Dilation (Bullet Time)
        this.timeScale = 1.0;
        this.targetTimeScale = 1.0;
        this.dilationTimer = 0;

        this.onScoreUpdate = null;
        this.onFeverUpdate = null;
    }

    init(scene, sound) {
        console.log("Fizik Dünyası (Neon) Başlatılıyor");
        this.scene = scene;
        this.sound = sound;
        this.effects = new Effects(scene);

        this.createTable();
        this.createPuck();
        this.createPaddle();
        this.createAIPaddle();
    }

    createTable() {
        // Masa bir "Grup" olarak oluşturulur
        this.tableGroup = new THREE.Group();

        // 1. Zemin (Izgara Dokulu)
        const planeGeo = new THREE.PlaneGeometry(this.TABLE_WIDTH, this.TABLE_LENGTH);
        const planeMat = new THREE.MeshStandardMaterial({
            color: Config.Graphics.floorColor,
            roughness: 0.1,
            metalness: 0.8
        });
        const floor = new THREE.Mesh(planeGeo, planeMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.1;
        this.tableGroup.add(floor);

        // Grid Helper (Siberpunk hissi için)
        const gridHelper = new THREE.GridHelper(this.TABLE_WIDTH, Config.Table.gridSize, Config.Graphics.gridColor, Config.Graphics.gridColor);
        gridHelper.position.y = -0.09;
        gridHelper.scale.z = this.TABLE_LENGTH / this.TABLE_WIDTH;
        this.tableGroup.add(gridHelper);

        // 2. Neon Duvarlar
        const wallThickness = 0.5;
        const wallHeight = Config.Table.wallHeight;
        const wallMat = new THREE.MeshStandardMaterial({
            color: 0x00FFFF,
            emissive: 0x00FFFF,
            emissiveIntensity: 1
        });

        // Yan Duvarlar
        const sideWallGeo = new THREE.BoxGeometry(wallThickness, wallHeight, this.TABLE_LENGTH + wallThickness * 2);

        const leftWall = new THREE.Mesh(sideWallGeo, wallMat);
        leftWall.position.set(-this.TABLE_WIDTH / 2 - wallThickness / 2, wallHeight / 2, 0);

        const rightWall = new THREE.Mesh(sideWallGeo, wallMat);
        rightWall.position.set(this.TABLE_WIDTH / 2 + wallThickness / 2, wallHeight / 2, 0);

        this.tableGroup.add(leftWall);
        this.tableGroup.add(rightWall);

        // Üst/Alt Duvarlar (Kale boşluğu hariç)
        // Basitleştirme: Şimdilik tam duvar yapıp sadece görsel ayıralım, çarpışma kalede yok sayılacak
        // Top Wall
        const endWallGeo = new THREE.BoxGeometry(this.TABLE_WIDTH + wallThickness * 2, wallHeight, wallThickness);

        const topWall = new THREE.Mesh(endWallGeo, wallMat.clone());
        topWall.material.color.setHex(0xFF00FF); // Rakip tarafı farklı renk
        topWall.material.emissive.setHex(0xFF00FF);
        topWall.position.set(0, wallHeight / 2, -this.TABLE_LENGTH / 2 - wallThickness / 2);

        const bottomWall = new THREE.Mesh(endWallGeo, wallMat.clone());
        bottomWall.position.set(0, wallHeight / 2, this.TABLE_LENGTH / 2 + wallThickness / 2);

        this.tableGroup.add(topWall);
        this.tableGroup.add(bottomWall);

        this.scene.add(this.tableGroup);
    }

    createPuck() {
        this.cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
            format: THREE.RGBAFormat,
            generateMipmaps: true,
            minFilter: THREE.LinearMipmapLinearFilter
        });
        this.cubeCamera = new THREE.CubeCamera(0.1, 100, this.cubeRenderTarget);
        this.scene.add(this.cubeCamera);

        // Neon Mirror Puck
        const geometry = new THREE.CylinderGeometry(Config.Puck.radius, Config.Puck.radius, Config.Puck.height, 32);
        const material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 1.0,
            roughness: 0.05,
            envMap: this.cubeRenderTarget.texture,
            envMapIntensity: 1.0,
            emissive: Config.Puck.color,
            emissiveIntensity: 1
        });
        this.puck = new THREE.Mesh(geometry, material);
        this.puck.position.y = Config.Puck.height / 2;

        // Puck Light
        const light = new THREE.PointLight(Config.Puck.color, 2, 10);
        light.position.y = 1;
        this.puck.add(light);

        this.scene.add(this.puck);
    }

    createPaddle() {
        const geometry = new THREE.CylinderGeometry(Config.Paddle.radius, Config.Paddle.radius, Config.Paddle.height, 32);
        const material = new THREE.MeshStandardMaterial({
            color: Config.Paddle.colorPlayer,
            emissive: Config.Paddle.colorPlayer,
            emissiveIntensity: 2,
            roughness: 0.05,
            metalness: 0.9,
            envMap: this.scene.environment
        });
        this.paddle = new THREE.Mesh(geometry, material);
        this.paddle.position.set(0, Config.Paddle.height / 2, 8);

        // Işık
        const light = new THREE.PointLight(Config.Paddle.colorPlayer, 3, 8);
        light.position.y = 1;
        this.paddle.add(light);

        this.scene.add(this.paddle);
    }

    createAIPaddle() {
        const geometry = new THREE.CylinderGeometry(Config.Paddle.radius, Config.Paddle.radius, Config.Paddle.height, 32);
        const material = new THREE.MeshStandardMaterial({
            color: Config.Paddle.colorAI,
            emissive: Config.Paddle.colorAI,
            emissiveIntensity: 2,
            roughness: 0.05,
            metalness: 0.9,
            envMap: this.scene.environment
        });
        this.aiPaddle = new THREE.Mesh(geometry, material);
        this.aiPaddle.position.set(0, Config.Paddle.height / 2, -8);

        // AI Işık
        const light = new THREE.PointLight(Config.Paddle.colorAI, 3, 8);
        light.position.y = 1;
        this.aiPaddle.add(light);
        this.scene.add(this.aiPaddle);
    }

    update(delta, handData) {
        // Singularity: Temporal Dilation Logic
        this.timeScale += (this.targetTimeScale - this.timeScale) * delta * 5;
        const scaledDelta = delta * this.timeScale;

        if (!this.puck || !this.paddle) return;

        // 1. Oyuncu Hareketi ve Fren Kontrolü
        if (handData && handData.isActive) {
            // Mapping Logic
            // HandData 0-1 range. 
            // X: 0->-Width/2, 1->Width/2
            // Y: 0->Length/2 (Bottom), 1->0 (Center) -> Z

            // Masanın sadece alt yarısında (0 ile Length/2) hareket edebilir
            const maxX = this.TABLE_WIDTH / 2 - Config.Paddle.radius;
            const maxZ = this.TABLE_LENGTH / 2 - Config.Paddle.radius;
            const minZ = 0.5; // File yanı

            const targetX = (handData.x - 0.5) * this.TABLE_WIDTH;
            // Y ekseni ters olabilir, vision.js'e göre. Vision Y 0 üstte, 1 altta ise:
            // Bizim sahnede +Z aşağıda (kullanıcıya yakın), -Z yukarıda.
            // Yani Y arttıkça Z artmalı.
            const targetZ = minZ + (handData.y * (maxZ - minZ));

            this.paddle.position.x = Math.max(-maxX, Math.min(maxX, targetX));
            this.paddle.position.z = Math.max(minZ, Math.min(maxZ, targetZ));

            // Calculate Paddle Velocity for Momentum
            this.paddleVelocity.subVectors(this.paddle.position, this.lastPaddlePos).divideScalar(delta || 0.016);
            this.lastPaddlePos.copy(this.paddle.position);

            // Ultimate Charging (Aura Burst)
            if (handData.isFist) {
                this.paddle.material.color.setHex(Config.Paddle.brakeColor);
                this.paddle.material.emissive.setHex(Config.Paddle.brakeColor);
                this.paddleVelocity.multiplyScalar(0.1);

                this.fistChargeTime += delta;
                if (this.fistChargeTime >= 1.5 && !this.isAuraBurstReady) {
                    this.isAuraBurstReady = true;
                    this.triggerAuraBurst();
                }
            } else {
                this.paddle.material.color.setHex(Config.Paddle.colorPlayer);
                this.paddle.material.emissive.setHex(Config.Paddle.colorPlayer);
                this.fistChargeTime = 0;
                this.isAuraBurstReady = false;
            }
        }

        // --- Real-time Reflection Update (Throttled for Performance) ---
        this.reflectionFrameCount++;
        if (this.cubeCamera && this.puck && this.reflectionFrameCount % 2 === 0) {
            this.puck.visible = false;
            this.cubeCamera.position.copy(this.puck.position);
            if (window.game && window.game.renderer) {
                this.cubeCamera.update(window.game.renderer, this.scene);
            }
            this.puck.visible = true;
        }

        // 2. AI Hareketi
        this.updateAI(scaledDelta);

        // Apex: AI Ghosting Update
        this.updateAIGhosts(scaledDelta);

        // 3. Fizik Adımı
        this.stepPhysics(scaledDelta);

        // 4. Efektler
        this.effects.update(scaledDelta, this.puck.position);
    }

    updateAI(delta) {
        if (!this.aiPaddle || !this.puck) return;

        // --- AI FSM LOGIC with Reaction Latency ---
        this.aiReactionTimer += delta;
        if (this.aiReactionTimer >= this.AI_REACTION_DELAY) {
            this.aiReactionTimer = 0;
            this.processAIBehavior();
        }

        const speedMult = this.isFeverMode ? Config.Gameplay.feverSpeedMult : 1;
        const speed = Config.Paddle.lerpSpeed * speedMult * delta;

        // Move towards target (Lerp)
        this.aiPaddle.position.x += (this.aiTargetX - this.aiPaddle.position.x) * speed;
        this.aiPaddle.position.z += (this.aiTargetZ - this.aiPaddle.position.z) * speed;

        // AI Momentum Tracking (Essential for Collisions)
        this.aiPaddleVelocity.subVectors(this.aiPaddle.position, this.lastAIPaddlePos).divideScalar(delta || 0.016);
        this.lastAIPaddlePos.copy(this.aiPaddle.position);
    }

    processAIBehavior() {
        if (!this.puck) return;
        const puckPos = this.puck.position;
        const isIncoming = this.puckVelocity && this.puckVelocity.z < -0.1;
        const isMyField = puckPos.z < 0;

        if (!isMyField) {
            this.currentAIState = this.AI_STATES.WAIT;
        } else {
            if (isIncoming) this.currentAIState = this.AI_STATES.ATTACK;
            else this.currentAIState = this.AI_STATES.DEFEND;
        }

        let tx = puckPos.x;
        let tz = -this.TABLE_LENGTH / 2 + 1.5;

        // Strategic Error Margin (Simulated fatigue/stress)
        const errorMargin = Math.max(0, (this.rallyCount - 5) * 0.1);
        const error = (Math.random() - 0.5) * errorMargin;

        switch (this.currentAIState) {
            case this.AI_STATES.ATTACK:
                const timeToIntercept = (this.aiPaddle.position.z - puckPos.z) / (this.puckVelocity.z || -0.001);
                let predX = puckPos.x + (this.puckVelocity.x * timeToIntercept);
                const wallLimit = this.TABLE_WIDTH / 2 - Config.Puck.radius;

                const targetGoalX = (Math.random() - 0.5) * 4;
                const interceptAngle = Math.atan2(predX - targetGoalX, this.TABLE_LENGTH / 2);

                if (Config.Paddle.predictLevel >= 2) {
                    let offset = predX + wallLimit;
                    let range = wallLimit * 2;
                    let relative = offset % (2 * range);
                    if (relative < 0) relative += 2 * range;
                    predX = relative < range ? relative - wallLimit : 2 * range - relative - wallLimit;
                }

                tx = predX + Math.sin(interceptAngle) * 0.5 + error;
                tz = puckPos.z - 0.7;
                break;

            case this.AI_STATES.DEFEND:
                tx = puckPos.x * 0.8 + error;
                tz = -this.TABLE_LENGTH / 2 + 1.2;
                break;

            case this.AI_STATES.WAIT:
                tx = 0;
                tz = -this.TABLE_LENGTH / 2 + 3;
                break;
        }

        // Limit AI range
        this.aiTargetX = Math.max(-this.TABLE_WIDTH / 2 + 1, Math.min(this.TABLE_WIDTH / 2 - 1, tx));
        this.aiTargetZ = Math.max(-this.TABLE_LENGTH / 2 + 0.5, Math.min(-0.5, tz));
    }

    stepPhysics(delta) {
        if (!this.puck) return;

        if (!this.puckVelocity) {
            this.puckVelocity = new THREE.Vector3(0, 0, 0);
            this.servePuck();
        }

        // --- 1. Hareket ---
        const speedMult = this.isFeverMode ? Config.Gameplay.feverSpeedMult : 1;
        const velocityStep = this.puckVelocity.clone().multiplyScalar(delta * speedMult);
        this.puck.position.add(velocityStep);

        // --- 2. Duvar Çarpışması (X) ---
        const limitX = this.TABLE_WIDTH / 2 - Config.Puck.radius;
        if (Math.abs(this.puck.position.x) > limitX) {
            this.puckVelocity.x *= -1;
            this.puck.position.x = Math.sign(this.puck.position.x) * limitX;
            this.sound.playEdgeSound(this.puckVelocity.length());
            this.effects.createExplosion(this.puck.position, 0x00FFFF);
        }

        // --- 3. Gol Kontrolü (Z) ---
        const limitZ = this.TABLE_LENGTH / 2;
        if (Math.abs(this.puck.position.z) > limitZ) {
            const playerScored = this.puck.position.z < -limitZ;
            if (playerScored) this.scorePlayer++; else this.scoreAI++;

            // AI Victory Check
            if (this.scoreAI >= 7 && !window.game?.isGameOver) {
                window.game?.triggerGameOver('ai');
            }

            if (window.game) {
                window.game.triggerChromaticPulse(0.08);
                window.game.addLog(playerScored ? "GOAL_DETECTED: PLAYER_SYNC" : "GOAL_DETECTED: AI_BREACH");
            }

            this.rallyCount = 0;
            this.setFeverMode(false);

            if (this.onScoreUpdate) this.onScoreUpdate(this.scorePlayer, this.scoreAI);
            this.sound.playGoalSound();
            this.servePuck(playerScored ? 1 : -1);
        }

        // --- 4. Raket Çarpışması ---
        this.checkPaddleCollision(this.paddle);
        this.checkPaddleCollision(this.aiPaddle);

        // --- 5. Sürtünme ---
        this.puckVelocity.multiplyScalar(Config.Table.friction);
    }

    servePuck(direction = 1) {
        this.puck.position.set(0, Config.Puck.height / 2, 0);
        this.puckVelocity = new THREE.Vector3(
            (Math.random() - 0.5) * Config.Puck.initialSpeed,
            0,
            direction * Config.Puck.initialSpeed
        );
    }

    checkPaddleCollision(paddle) {
        if (!paddle) return;

        const dist = this.puck.position.distanceTo(paddle.position);
        const minDist = Config.Puck.radius + Config.Paddle.radius;

        if (dist < minDist) {
            // --- Elite: Impulse-Based Physics ---
            const normal = this.puck.position.clone().sub(paddle.position).normalize();
            const paddleVel = paddle === this.paddle ? this.paddleVelocity : this.aiPaddleVelocity;
            const relativeVelocity = this.puckVelocity.clone().sub(paddleVel);
            const velocityAlongNormal = relativeVelocity.dot(normal);

            // Don't resolve if velocities are separating
            if (velocityAlongNormal > 0) return;

            // Restitution (elasticity) + Speed boost
            const restitution = 1.1;
            let j = -(1 + restitution) * velocityAlongNormal;
            j /= (1 / 1.0) + (1 / 5.0); // Puck mass=1.0, Paddle mass=5.0

            const impulse = normal.clone().multiplyScalar(j);
            this.puckVelocity.add(impulse); // Puck mass is 1

            // Friction/Spin effect (tangential)
            const tangent = relativeVelocity.clone().sub(normal.clone().multiplyScalar(velocityAlongNormal)).normalize();
            this.puckVelocity.add(tangent.multiplyScalar(-j * 0.15));

            // Hız Sınırlandırma
            let currentSpeed = this.puckVelocity.length();
            if (currentSpeed < 10) this.puckVelocity.normalize().multiplyScalar(10);
            if (currentSpeed > Config.Puck.maxSpeed) this.puckVelocity.normalize().multiplyScalar(Config.Puck.maxSpeed);

            this.puck.position.add(normal.multiplyScalar(minDist - dist));

            // Rally & Fever Logic
            this.rallyCount++;
            if (this.rallyCount >= Config.Gameplay.rallyThreshold && !this.isFeverMode) {
                this.setFeverMode(true);
            }

            this.sound.playCollisionSound(this.puckVelocity.length());
            this.effects.createExplosion(this.puck.position, paddle === this.paddle ? Config.Paddle.colorPlayer : Config.Paddle.colorAI);

            // Zenith: High Speed Chromatic Impact
            if (window.game && relativeVelocity.length() > 30) {
                window.game.triggerChromaticPulse(0.02);

                // Singularity: Trigger Bullet Time on heavy impact
                if (relativeVelocity.length() > 45) {
                    this.triggerTemporalDilation(0.1, 1000);
                }
            }

            // Camera Shake Trigger
            if (window.game && window.game.shake) window.game.shake(relativeVelocity.length() / 40);
        }
    }

    setFeverMode(active) {
        this.isFeverMode = active;
        if (this.onFeverUpdate) this.onFeverUpdate(active);

        // Görsel Geri Bildirim
        const puckMat = this.puck.material;
        const puckLight = this.puck.children.find(c => c instanceof THREE.PointLight);

        if (active) {
            puckMat.emissiveIntensity = 8;
            if (puckLight) puckLight.intensity = 15;
            console.log("🔥 FEVER MODE ACTIVE!");
        } else {
            puckMat.emissiveIntensity = 2;
            if (puckLight) puckLight.intensity = 2;
        }
    }

    triggerAuraBurst() {
        console.log("💥 AURA BURST ACTIVATED!");
        this.sound.playTone('sawtooth', 100, 0.4, 0.5);
        this.effects.createExplosion(this.puck.position, 0xffffff);

        // Push puck towards AI goal with massive force
        const normal = new THREE.Vector3(0, 0, -1);
        this.puckVelocity.add(normal.multiplyScalar(50));

        // Visual Shockwave
        if (window.game && window.game.shake) window.game.shake(0.5);

        // Flash puck
        this.puck.material.emissiveIntensity = 20;
        setTimeout(() => {
            this.puck.material.emissiveIntensity = Config.Puck.lightIntensity;
        }, 300);
    }

    updateAIGhosts(delta) {
        if (!this.aiPaddle || !this.scene) return;

        // Spawn new ghost
        this.ghostSpawnTimer += delta;
        if (this.ghostSpawnTimer >= this.GHOST_INTERVAL && this.aiPaddleVelocity.length() > 5) {
            this.ghostSpawnTimer = 0;
            this.createAIGhost();
        }

        // Update existing ghosts
        for (let i = this.aiGhosts.length - 1; i >= 0; i--) {
            const ghost = this.aiGhosts[i];
            ghost.material.opacity -= delta * 1.5;
            ghost.scale.multiplyScalar(0.98);

            if (ghost.material.opacity <= 0) {
                this.scene.remove(ghost);
                this.aiGhosts.splice(i, 1);
            }
        }
    }

    createAIGhost() {
        const ghostGeo = this.aiPaddle.geometry.clone();
        const ghostMat = this.aiPaddle.material.clone();
        ghostMat.transparent = true;
        ghostMat.opacity = 0.4;
        ghostMat.emissiveIntensity = 2;

        const ghost = new THREE.Mesh(ghostGeo, ghostMat);
        ghost.position.copy(this.aiPaddle.position);
        ghost.rotation.copy(this.aiPaddle.rotation);

        this.aiGhosts.push(ghost);
        this.scene.add(ghost);
    }

    triggerTemporalDilation(scale = 0.1, duration = 1000) {
        this.targetTimeScale = scale;
        this.addTemporalGlitch();

        if (this.dilationTimer) clearTimeout(this.dilationTimer);
        this.dilationTimer = setTimeout(() => {
            this.targetTimeScale = 1.0;
        }, duration);
    }

    addTemporalGlitch() {
        if (!this.puck) return;
        this.puck.material.emissiveIntensity = 50;
        if (window.game) window.game.addLog("TEMPORAL_DILATION_ACTIVE");
    }
}
