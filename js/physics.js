import * as THREE from 'three';
import { Config } from './config.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

export class Physics {
    constructor() {
        console.log("Fizik modülü yüklendi");
        this.scene = null;

        // Oyun Nesneleri
        this.paddle = null;
        this.puck = null;
        this.aiPaddle = null;
        this.table = null;

        // Modeller
        this.models = {
            table: null,
            puck: null,
            paddle: null
        };

        // Sabitler
        this.TABLE_WIDTH = Config.Table.width;
        this.TABLE_Length = Config.Table.length;
    }

    async init(scene, sound) {
        console.log("Fizik Dünyası Başlatılıyor");
        this.scene = scene;
        this.sound = sound;

        await this.loadModels();

        this.createTable();
        this.createPuck();
        this.createPaddle();
        this.createAIPaddle();
    }

    async loadModels() {
        const mtlLoader = new MTLLoader();
        const objLoader = new OBJLoader();

        const loadModel = (name) => {
            return new Promise((resolve) => {
                mtlLoader.load(`assets/models/${name}.mtl`, (materials) => {
                    materials.preload();
                    objLoader.setMaterials(materials);
                    objLoader.load(`assets/models/${name}.obj`, (object) => {
                        resolve(object);
                    });
                });
            });
        };

        this.models.table = await loadModel('table');
        this.models.puck = await loadModel('puck');
        this.models.paddle = await loadModel('paddle');

        console.log("Modeller yüklendi!");
    }

    createTable() {
        if (this.models.table) {
            this.table = this.models.table.clone();
            // Scale logic: Table model might need scaling. Assume 1 unit = 1 meter approx.
            // Adjust scale to match TABLE_WIDTH/Length
            this.table.scale.set(100, 100, 100); // Deneme yanılma ile ayarlanmalı, şimdilik varsayılan
            this.table.rotation.x = -Math.PI / 2; // Gerekirse
            this.table.position.y = -2;
            this.scene.add(this.table);
        } else {
            // Fallback
            const geometry = new THREE.PlaneGeometry(this.TABLE_WIDTH, this.TABLE_Length);
            const material = new THREE.MeshStandardMaterial({ color: 0x000000 });
            this.table = new THREE.Mesh(geometry, material);
            this.table.rotation.x = -Math.PI / 2;
            this.scene.add(this.table);
        }

        // Neon Sınırlar (Visual)
        const borderGeo = new THREE.BoxGeometry(this.TABLE_WIDTH + 1, Config.Table.wallHeight, this.TABLE_Length + 1);
        const edges = new THREE.EdgesGeometry(borderGeo);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 2 }));
        this.scene.add(line);
    }

    createPuck() {
        if (this.models.puck) {
            this.puck = this.models.puck.clone();
            this.puck.scale.set(30, 30, 30);
            this.puck.position.y = Config.Puck.height / 2;
            this.scene.add(this.puck);
        } else {
            const geometry = new THREE.CylinderGeometry(Config.Puck.radius, Config.Puck.radius, Config.Puck.height, 32);
            const material = new THREE.MeshStandardMaterial({ color: Config.Puck.color });
            this.puck = new THREE.Mesh(geometry, material);
            this.puck.position.y = Config.Puck.height / 2;
            this.scene.add(this.puck);
        }
    }

    createPaddle() {
        if (this.models.paddle) {
            this.paddle = this.models.paddle.clone();
            this.paddle.scale.set(30, 30, 30);
            this.paddle.position.set(0, Config.Paddle.height / 2, 6);
            this.scene.add(this.paddle);
        } else {
            const geometry = new THREE.CylinderGeometry(Config.Paddle.radius, Config.Paddle.radius, Config.Paddle.height, 32);
            const material = new THREE.MeshStandardMaterial({ color: Config.Paddle.colorPlayer });
            this.paddle = new THREE.Mesh(geometry, material);
            this.paddle.position.set(0, Config.Paddle.height / 2, 6);
            this.scene.add(this.paddle);
        }

        // Işık
        const light = new THREE.PointLight(Config.Paddle.colorPlayer, 1, 5);
        light.position.set(0, 1, 0);
        this.paddle.add(light);
    }

    createAIPaddle() {
        if (this.models.paddle) {
            this.aiPaddle = this.models.paddle.clone();
            this.aiPaddle.scale.set(30, 30, 30);
            this.aiPaddle.position.set(0, Config.Paddle.height / 2, -6);
            // AI Rengi için materyali klonlamamız gerekebilir ama OBJ içinde zor.
            // Şimdilik ışık ile rengi verelim.
            this.scene.add(this.aiPaddle);
        } else {
            const geometry = new THREE.CylinderGeometry(Config.Paddle.radius, Config.Paddle.radius, Config.Paddle.height, 32);
            const material = new THREE.MeshStandardMaterial({ color: Config.Paddle.colorAI });
            this.aiPaddle = new THREE.Mesh(geometry, material);
            this.aiPaddle.position.set(0, Config.Paddle.height / 2, -6);
            this.scene.add(this.aiPaddle);
        }
        // AI Işık
        const light = new THREE.PointLight(Config.Paddle.colorAI, 1, 5);
        light.position.set(0, 1, 0);
        this.aiPaddle.add(light);
    }

    update(delta, handData) {
        if (!this.puck || !this.paddle) return;

        // 1. Oyuncu Hareketi
        if (handData && handData.isActive) {
            const targetX = (handData.x - 0.5) * this.TABLE_WIDTH;
            const targetZ = handData.y * (this.TABLE_Length / 2 - 1);

            const paddleLimitX = this.TABLE_WIDTH / 2 - Config.Paddle.radius;
            const paddleLimitZ_Bottom = this.TABLE_Length / 2 - Config.Paddle.radius;
            const paddleLimitZ_Top = 0.5;

            this.paddle.position.x = Math.max(-paddleLimitX, Math.min(paddleLimitX, targetX));
            this.paddle.position.z = Math.max(paddleLimitZ_Top, Math.min(paddleLimitZ_Bottom, targetZ));

            // Yumruk Hareketi (Fren/Renk)
            // Model rengini değiştirmek zor olduğu için ışık rengini değiştirelim mi?
            // Şimdilik pas geçiyoruz.
        }

        // 2. AI Hareketi (Gelişmiş Mantık)
        this.updateAI(delta);

        // 3. Fizik Adımı
        this.stepPhysics(delta);
    }

    updateAI(delta) {
        if (!this.aiPaddle || !this.puck) return;

        // --- Gelişmiş "Heuristic" AI (Legacy Koddan Uyarlandı) ---

        const tableDepth = this.TABLE_Length; // 18
        const tableWidth = this.TABLE_WIDTH;  // 10
        const puckPos = this.puck.position;
        const aiPos = this.aiPaddle.position;

        // 1. Karar Verme: Savunma mı Saldırı mı?
        // Eğer pak karşı sahadaysa (z > 0) veya pak zaten rakip sahaya doğru hızlı gidiyorsa -> Savunma
        let targetPos = new THREE.Vector3();

        // Basit hız tahmini (gerçek hız physics step'te hesaplanıyor, burada anlık konuma bakıyoruz)
        // AI -Z tarafında. Player +Z tarafında.
        // Pak Z > 0 ise oyuncu tarafında.

        const isPuckInPlayerZone = puckPos.z > 0;
        const isApproachingAI = this.puckVelocity && this.puckVelocity.z < -0.1;

        if (isPuckInPlayerZone && !isApproachingAI) {
            // Savunma Pozisyonu: Kendi kalesinin ortasında bekle
            targetPos.set(0, Config.Puck.height / 2, -tableDepth * 0.4); // -7.2
        } else {
            // Saldırı / Karşılama: Paka doğru git
            // Basit yörünge tahmini: Pakın X'ini takip et
            let predictedX = puckPos.x;

            // Eğer pak duvara çarpacaksa basit bir yansıma tahmini yapabiliriz
            // Şimdilik sadece X takibi yeterli (Config.AI.lerpSpeed ile zorluk ayarlanıyor)
            targetPos.set(predictedX, Config.Puck.height / 2, puckPos.z - 1.5); // Pakın biraz arkasına gitmek yerine önüne çıkmalı

            // Z Kısıtlaması: Sadece kendi sahasında (-9 ile 0 arası)
            // Agresiflik seviyesine göre ne kadar ileri çıkacağı:
            targetPos.z = Math.min(-2, targetPos.z); // En fazla orta sahaya yakın (-2) çık
        }

        // 2. Hareket Sınırlandırma
        // X ekseninde masa dışına çıkma
        const paddleRadius = Config.Paddle.radius;
        const limitX = tableWidth / 2 - paddleRadius;
        targetPos.x = Math.max(-limitX, Math.min(limitX, targetPos.x));

        // Z ekseninde kendi sahasında kal
        const limitZ_Back = -tableDepth / 2 + paddleRadius; // -8.4
        const limitZ_Front = -0.5; // File 
        targetPos.z = Math.max(limitZ_Back, Math.min(limitZ_Front, targetPos.z));

        // 3. Uygulama (Lerp)
        const lerpSpeed = Config.AI.lerpSpeed * delta;
        this.aiPaddle.position.x += (targetPos.x - this.aiPaddle.position.x) * lerpSpeed;
        this.aiPaddle.position.z += (targetPos.z - this.aiPaddle.position.z) * lerpSpeed;
    }

    stepPhysics(delta) {
        if (!this.puck) return;

        // Başlangıç hızı
        if (!this.puckVelocity) {
            this.puckVelocity = new THREE.Vector3(0, 0, 0);
            this.servePuck();
        }

        // Hız Uygula
        this.puck.position.add(this.puckVelocity.clone().multiplyScalar(delta));

        // Duvar Çarpışmaları (X)
        const wallLimit = this.TABLE_WIDTH / 2 - Config.Puck.radius;
        if (this.puck.position.x > wallLimit || this.puck.position.x < -wallLimit) {
            this.puckVelocity.x *= -1;
            this.puck.position.x = Math.sign(this.puck.position.x) * wallLimit;
            if (this.sound) this.sound.playEdgeSound(this.puckVelocity.length()); // KENAR SESİ
        }

        // Gol (Z)
        if (this.puck.position.z > 9) {
            console.log("AI Skore Etti!");
            if (this.sound) this.sound.playGoalSound(); // GOL SESİ
            this.servePuck(-1);
        } else if (this.puck.position.z < -9) {
            console.log("Oyuncu Skore Etti!");
            if (this.sound) this.sound.playGoalSound(); // GOL SESİ
            this.servePuck(1);
        }

        // Raket Çarpışmaları (Basitleştirilmiş)
        this.checkPaddleCollision(this.paddle);
        this.checkPaddleCollision(this.aiPaddle);

        // Sürtünme
        this.puckVelocity.multiplyScalar(Config.Table.friction);

        // Yükseklik Sabitle
        this.puck.position.y = Config.Puck.height / 2;
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
        const minDist = Config.Puck.radius + Config.Paddle.radius; // Yaklaşık

        if (dist < minDist) {
            const normal = this.puck.position.clone().sub(paddle.position).normalize();
            const speed = this.puckVelocity.length();
            const newSpeed = Math.max(speed * 1.05, 5);

            this.puckVelocity.reflect(normal).normalize().multiplyScalar(newSpeed);

            const overlap = minDist - dist;
            this.puck.position.add(normal.multiplyScalar(overlap));

            if (this.sound) this.sound.playCollisionSound(newSpeed);
        }
    }
}
