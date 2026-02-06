import * as THREE from 'three';
import { Config } from './config.js';
import { Effects } from './effects.js';
import { PuckTrail, createCollisionParticles } from './trail-effects.js';

export class Physics {
    constructor() {
        console.log("Fizik modülü yüklendi (Advanced Mode)");
        this.scene = null;
        this.sound = null;
        this.effects = null;
        this.puckTrail = null;

        // Oyun Nesneleri
        this.paddle = null;
        this.puck = null;
        this.aiPaddle = null;
        this.tableGroup = null;
        this.cubeCamera = null;
        this.cubeRenderTarget = null;
        this.reflectionFrameCount = 0;

        // AI Logic
        this.aiTargetX = 0;
        this.aiTargetZ = 0;
        this.aiReactionTimer = 0;
        this.AI_REACTION_DELAY = 0.05;
        this.aiSpeed = 0.8;

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
        this.puckVelocity = new THREE.Vector3(Config.Puck.initialSpeed, 0, -Config.Puck.initialSpeed);

        // AI FSM
        this.AI_STATES = { DEFEND: 'DEFEND', ATTACK: 'ATTACK', WAIT: 'WAIT' };
        this.currentAIState = this.AI_STATES.DEFEND;

        // Ultimate State
        this.fistChargeTime = 0;
        this.isAuraBurstReady = false;

        // Temporal Dilation
        this.timeScale = 1.0;
        this.targetTimeScale = 1.0;

        this.onScoreUpdate = null;
        this.onFeverUpdate = null;
    }

    init(scene, sound) {
        this.scene = scene;
        this.sound = sound;
        this.effects = new Effects(scene);
        this.puckTrail = new PuckTrail(scene);

        this.createTable();
        this.createPuck();
        this.createPaddle();
        this.createAIPaddle();
        this.resetPuck();
    }

    createTable() {
        this.tableGroup = new THREE.Group();

        // Floor
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

        // Grid
        const gridHelper = new THREE.GridHelper(this.TABLE_WIDTH, Config.Table.gridSize, Config.Graphics.gridColor, Config.Graphics.gridColor);
        gridHelper.position.y = -0.09;
        gridHelper.scale.z = this.TABLE_LENGTH / this.TABLE_WIDTH;
        this.tableGroup.add(gridHelper);

        // Walls
        const wallThickness = 0.5;
        const wallHeight = Config.Table.wallHeight;
        const wallMat = new THREE.MeshStandardMaterial({
            color: 0x00FFFF,
            emissive: 0x00FFFF,
            emissiveIntensity: 1
        });

        const sideWallGeo = new THREE.BoxGeometry(wallThickness, wallHeight, this.TABLE_LENGTH + wallThickness * 2);
        const leftWall = new THREE.Mesh(sideWallGeo, wallMat);
        leftWall.position.set(-this.TABLE_WIDTH / 2 - wallThickness / 2, wallHeight / 2, 0);
        const rightWall = new THREE.Mesh(sideWallGeo, wallMat);
        rightWall.position.set(this.TABLE_WIDTH / 2 + wallThickness / 2, wallHeight / 2, 0);

        this.tableGroup.add(leftWall);
        this.tableGroup.add(rightWall);

        // End Walls with Goal Openings
        const goalWidth = 4;
        const endWallSegmentWidth = (this.TABLE_WIDTH - goalWidth) / 2;
        const endWallGeo = new THREE.BoxGeometry(endWallSegmentWidth, wallHeight, wallThickness);

        // Top Walls (AI Side)
        const topWallL = new THREE.Mesh(endWallGeo, wallMat.clone());
        topWallL.material.color.setHex(0xFF00FF);
        topWallL.material.emissive.setHex(0xFF00FF);
        topWallL.position.set(-(goalWidth + endWallSegmentWidth) / 2, wallHeight / 2, -this.TABLE_LENGTH / 2 - wallThickness / 2);
        
        const topWallR = topWallL.clone();
        topWallR.position.x = (goalWidth + endWallSegmentWidth) / 2;

        // Bottom Walls (Player Side)
        const bottomWallL = new THREE.Mesh(endWallGeo, wallMat.clone());
        bottomWallL.position.set(-(goalWidth + endWallSegmentWidth) / 2, wallHeight / 2, this.TABLE_LENGTH / 2 + wallThickness / 2);
        
        const bottomWallR = bottomWallL.clone();
        bottomWallR.position.x = (goalWidth + endWallSegmentWidth) / 2;

        this.tableGroup.add(topWallL, topWallR, bottomWallL, bottomWallR);
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

        const geometry = new THREE.CylinderGeometry(Config.Puck.radius, Config.Puck.radius, Config.Puck.height, 32);
        const material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 1.0,
            roughness: 0.05,
            envMap: this.cubeRenderTarget.texture,
            emissive: Config.Puck.color,
            emissiveIntensity: 1
        });
        this.puck = new THREE.Mesh(geometry, material);
        this.puck.position.y = Config.Puck.height / 2;

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
            metalness: 0.9
        });
        this.paddle = new THREE.Mesh(geometry, material);
        this.paddle.position.set(0, Config.Paddle.height / 2, 8);
        
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
            metalness: 0.9
        });
        this.aiPaddle = new THREE.Mesh(geometry, material);
        this.aiPaddle.position.set(0, Config.Paddle.height / 2, -8);

        const light = new THREE.PointLight(Config.Paddle.colorAI, 3, 8);
        light.position.y = 1;
        this.aiPaddle.add(light);
        this.scene.add(this.aiPaddle);
    }

    update(delta, handData) {
        this.timeScale += (this.targetTimeScale - this.timeScale) * delta * 5;
        const scaledDelta = delta * this.timeScale;

        if (!this.puck || !this.paddle) return;

        // Player Movement
        if (handData && handData.isActive) {
            const maxX = this.TABLE_WIDTH / 2 - Config.Paddle.radius;
            const maxZ = this.TABLE_LENGTH / 2 - Config.Paddle.radius;
            const minZ = 0.5;

            const targetX = (handData.x - 0.5) * this.TABLE_WIDTH;
            const targetZ = minZ + (handData.y * (maxZ - minZ));

            this.paddle.position.x = THREE.MathUtils.lerp(this.paddle.position.x, Math.max(-maxX, Math.min(maxX, targetX)), 0.2);
            this.paddle.position.z = THREE.MathUtils.lerp(this.paddle.position.z, Math.max(minZ, Math.min(maxZ, targetZ)), 0.2);

            this.paddleVelocity.subVectors(this.paddle.position, this.lastPaddlePos).divideScalar(delta || 0.016);
            this.lastPaddlePos.copy(this.paddle.position);

            if (handData.isFist) {
                this.paddle.material.color.setHex(Config.Paddle.brakeColor);
                this.paddle.material.emissive.setHex(Config.Paddle.brakeColor);
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

        // Reflection Update
        this.reflectionFrameCount++;
        if (this.reflectionFrameCount % 2 === 0) {
            this.puck.visible = false;
            this.cubeCamera.position.copy(this.puck.position);
            if (window.game && window.game.renderer) {
                this.cubeCamera.update(window.game.renderer, this.scene);
            }
            this.puck.visible = true;
        }

        this.updateAI(scaledDelta);
        this.updatePhysics(scaledDelta);
        
        if (this.effects) this.effects.update(scaledDelta, this.puck.position);
        if (this.puckTrail) this.puckTrail.update(this.puck.position, this.puckVelocity);
    }

    updateAI(delta) {
        const maxX = this.TABLE_WIDTH / 2 - Config.Paddle.radius;
        const minZ = -this.TABLE_LENGTH / 2 + Config.Paddle.radius;
        const maxZ = -0.5;

        // Reaction delay logic
        this.aiReactionTimer += delta;
        if (this.aiReactionTimer > this.AI_REACTION_DELAY) {
            if (this.puck.position.z < 0) {
                // Predict position
                this.aiTargetX = this.puck.position.x + (this.puckVelocity.x * 0.2);
                this.aiTargetZ = this.puck.position.z + (this.puckVelocity.z * 0.1);
            } else {
                // Return to center
                this.aiTargetX = 0;
                this.aiTargetZ = -this.TABLE_LENGTH / 4;
            }
            this.aiReactionTimer = 0;
        }

        const lerpVal = delta * 5 * this.aiSpeed;
        this.aiPaddle.position.x = THREE.MathUtils.lerp(this.aiPaddle.position.x, Math.max(-maxX, Math.min(maxX, this.aiTargetX)), lerpVal);
        this.aiPaddle.position.z = THREE.MathUtils.lerp(this.aiPaddle.position.z, Math.max(minZ, Math.min(maxZ, this.aiTargetZ)), lerpVal);

        this.aiPaddleVelocity.subVectors(this.aiPaddle.position, this.lastAIPaddlePos).divideScalar(delta || 0.016);
        this.lastAIPaddlePos.copy(this.aiPaddle.position);
    }

    updatePhysics(delta) {
        // Apply velocity
        this.puck.position.x += this.puckVelocity.x * delta;
        this.puck.position.z += this.puckVelocity.z * delta;

        // Friction
        this.puckVelocity.multiplyScalar(Config.Table.friction);

        // Wall Collisions
        const boundX = this.TABLE_WIDTH / 2 - Config.Puck.radius;
        const boundZ = this.TABLE_LENGTH / 2 - Config.Puck.radius;

        if (Math.abs(this.puck.position.x) > boundX) {
            this.puck.position.x = Math.sign(this.puck.position.x) * boundX;
            this.puckVelocity.x *= -1;
            this.onCollision('wall');
        }

        // Goal Check
        if (Math.abs(this.puck.position.z) > boundZ) {
            if (Math.abs(this.puck.position.x) < 2) {
                this.handleGoal(this.puck.position.z > 0 ? 'ai' : 'player');
            } else {
                this.puck.position.z = Math.sign(this.puck.position.z) * boundZ;
                this.puckVelocity.z *= -1;
                this.onCollision('wall');
            }
        }

        // Paddle Collisions
        this.checkPaddleCollision(this.paddle, this.paddleVelocity);
        this.checkPaddleCollision(this.aiPaddle, this.aiPaddleVelocity);

        // Speed Limit
        const speed = this.puckVelocity.length();
        if (speed > Config.Puck.maxSpeed) {
            this.puckVelocity.setLength(Config.Puck.maxSpeed);
        }
    }

    checkPaddleCollision(paddle, paddleVel) {
        const dist = this.puck.position.distanceTo(paddle.position);
        const minDist = Config.Puck.radius + Config.Paddle.radius;

        if (dist < minDist) {
            // Collision normal
            const normal = new THREE.Vector3().subVectors(this.puck.position, paddle.position).normalize();
            
            // Move puck out of paddle
            const overlap = minDist - dist;
            this.puck.position.add(normal.clone().multiplyScalar(overlap));

            // Reflect velocity with paddle momentum
            const relativeVelocity = new THREE.Vector3().subVectors(this.puckVelocity, paddleVel);
            const velocityAlongNormal = relativeVelocity.dot(normal);

            if (velocityAlongNormal < 0) {
                const restitution = 1.2;
                const impulse = normal.multiplyScalar(-(1 + restitution) * velocityAlongNormal);
                this.puckVelocity.add(impulse);
                
                // Add some paddle momentum influence
                this.puckVelocity.add(paddleVel.clone().multiplyScalar(0.5));
                
                this.onCollision('paddle');
                this.rallyCount++;
                if (this.rallyCount >= Config.Gameplay.rallyThreshold && !this.isFeverMode) {
                    this.setFeverMode(true);
                }
            }
        }
    }

    onCollision(type) {
        if (this.sound) {
            if (type === 'wall') this.sound.playEdgeSound(this.puckVelocity.length(), this.puck.position.x);
            else this.sound.playCollisionSound(this.puckVelocity.length(), this.puck.position.x);
        }
        if (this.effects) {
            createCollisionParticles(this.scene, this.puck.position, type === 'wall' ? 0x00ffff : 0xff00ff);
        }
        if (window.game) window.game.triggerCameraShake(this.puckVelocity.length() * 0.01);
    }

    handleGoal(winner) {
        if (winner === 'player') this.scorePlayer++;
        else this.scoreAI++;

        if (this.sound) this.sound.playGoalSound();
        if (this.onScoreUpdate) this.onScoreUpdate(this.scorePlayer, this.scoreAI);
        
        this.setFeverMode(false);
        this.rallyCount = 0;
        this.resetPuck();
    }

    resetPuck() {
        this.puck.position.set(0, Config.Puck.height / 2, 0);
        const dir = Math.random() > 0.5 ? 1 : -1;
        this.puckVelocity.set((Math.random() - 0.5) * 10, 0, dir * Config.Puck.initialSpeed);
    }

    setFeverMode(active) {
        this.isFeverMode = active;
        this.targetTimeScale = active ? 1.2 : 1.0;
        if (this.onFeverUpdate) this.onFeverUpdate(active);
    }

    triggerAuraBurst() {
        if (window.game) window.game.addLog("AURA_BURST_ACTIVATED");
        this.puckVelocity.multiplyScalar(2.0);
        this.onCollision('paddle');
    }
}
