import * as THREE from 'three';
import { Config } from './config.js';

export class Physics {
    constructor() {
        console.log("Fizik modülü yüklendi (Zero-Build Mode)");
        this.scene = null;
        this.sound = null;

        // Oyun Nesneleri
        this.paddle = null;
        this.puck = null;
        this.aiPaddle = null;
        this.tableGroup = null;

        // Sabitler
        this.TABLE_WIDTH = Config.Table.width;
        this.TABLE_LENGTH = Config.Table.length;

        // Scoring
        this.scorePlayer = 0;
        this.scoreAI = 0;
        this.onScoreUpdate = null; // Callback for UI
    }

    init(scene, sound) {
        console.log("Fizik Dünyası (Neon) Başlatılıyor");
        this.scene = scene;
        this.sound = sound;

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
        // Neon Silindir
        const geometry = new THREE.CylinderGeometry(Config.Puck.radius, Config.Puck.radius, Config.Puck.height, 32);
        const material = new THREE.MeshStandardMaterial({
            color: Config.Puck.color,
            emissive: Config.Puck.color,
            emissiveIntensity: Config.Puck.lightIntensity,
            roughness: 0.2,
            metalness: 0.5
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
            roughness: 0.1
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
            emissiveIntensity: 2
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

            // Fren / Yumruk Rengi
            if (handData.isFist) {
                this.paddle.material.color.setHex(Config.Paddle.brakeColor);
                this.paddle.material.emissive.setHex(Config.Paddle.brakeColor);
            } else {
                this.paddle.material.color.setHex(Config.Paddle.colorPlayer);
                this.paddle.material.emissive.setHex(Config.Paddle.colorPlayer);
            }
        }

        // 2. AI Hareketi
        this.updateAI(delta);

        // 3. Fizik Adımı
        this.stepPhysics(delta);
    }

    updateAI(delta) {
        if (!this.aiPaddle || !this.puck) return;

        const puckPos = this.puck.position;

        // AI Hedef Belirleme
        // Eğer pak karşı sahadaysa (-Z) ve bize geliyorsa takip et
        // Pakın hızı ve yönü
        const isIncoming = this.puckVelocity && this.puckVelocity.z < -0.1;

        let targetX = puckPos.x;
        // God Mode Tahmini: Duvar sektirmelerini hesapla
        if (isIncoming && Config.Paddle.lerpSpeed > 1.5) {
            // Basit kestirim
            const timeToIntercept = Math.abs((this.aiPaddle.position.z - puckPos.z) / this.puckVelocity.z);
            const predictedX = puckPos.x + (this.puckVelocity.x * timeToIntercept);

            // Duvar yansıma simülasyonu
            const wallX = this.TABLE_WIDTH / 2;
            if (predictedX > wallX) targetX = wallX - (predictedX - wallX);
            else if (predictedX < -wallX) targetX = -wallX - (predictedX + wallX);
            else targetX = predictedX;
        }

        // Z Pozisyonu (Defansif vs Ofansif)
        let targetZ = -this.TABLE_LENGTH / 2 + 2; // Varsayılan defans
        if (puckPos.z < -2) targetZ = puckPos.z - 2; // Saldırı (Paka git)

        // Sınırlandırma
        targetX = Math.max(-this.TABLE_WIDTH / 2 + 1, Math.min(this.TABLE_WIDTH / 2 - 1, targetX));
        targetZ = Math.max(-this.TABLE_LENGTH / 2 + 1, Math.min(-1, targetZ));

        // Lerp Hareketi
        const speed = Config.Paddle.lerpSpeed * delta;
        this.aiPaddle.position.x += (targetX - this.aiPaddle.position.x) * speed;
        this.aiPaddle.position.z += (targetZ - this.aiPaddle.position.z) * speed;
    }

    stepPhysics(delta) {
        if (!this.puck) return;

        if (!this.puckVelocity) {
            this.puckVelocity = new THREE.Vector3(0, 0, 0);
            this.servePuck();
        }

        // --- 1. Hareket ---
        const velocityStep = this.puckVelocity.clone().multiplyScalar(delta);
        this.puck.position.add(velocityStep);

        // --- 2. Duvar Çarpışması (X) ---
        const limitX = this.TABLE_WIDTH / 2 - Config.Puck.radius;
        if (this.puck.position.x > limitX || this.puck.position.x < -limitX) {
            this.puckVelocity.x *= -1;
            this.puck.position.x = Math.sign(this.puck.position.x) * limitX;
            this.sound.playEdgeSound(this.puckVelocity.length());
        }

        // --- 3. Gol Kontrolü (Z) ---
        const limitZ = this.TABLE_LENGTH / 2;
        if (this.puck.position.z > limitZ) {
            this.scoreAI++;
            if (this.onScoreUpdate) this.onScoreUpdate(this.scorePlayer, this.scoreAI);
            this.sound.playGoalSound();
            this.servePuck(-1); // AI Başlar
        } else if (this.puck.position.z < -limitZ) {
            this.scorePlayer++;
            if (this.onScoreUpdate) this.onScoreUpdate(this.scorePlayer, this.scoreAI);
            this.sound.playGoalSound();
            this.servePuck(1); // Oyuncu Başlar
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
            // Basit elastik çarpışma
            const normal = this.puck.position.clone().sub(paddle.position).normalize();

            // Hız vektörünü yansıt
            const speed = this.puckVelocity.length();
            let newSpeed = speed * 1.1; // Her vuruşta hızlan
            newSpeed = Math.min(newSpeed, Config.Puck.maxSpeed);
            newSpeed = Math.max(newSpeed, 10); // Minimum hız

            this.puckVelocity.reflect(normal.negate()).normalize().multiplyScalar(newSpeed);

            // Çakışmayı gider (Overlap fix)
            const overlap = minDist - dist;
            this.puck.position.add(normal.multiplyScalar(overlap));

            // Ses
            this.sound.playCollisionSound(newSpeed);

            // Görsel Efekt (Puck Rengi Parlasın)
            this.puck.material.emissiveIntensity = 5;
            setTimeout(() => { if (this.puck) this.puck.material.emissiveIntensity = Config.Puck.lightIntensity; }, 100);
        }
    }
}
