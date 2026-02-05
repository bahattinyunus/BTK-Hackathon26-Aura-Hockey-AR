import * as THREE from 'three';
import { Config } from './config.js';

export class Effects {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.trailPoints = [];
        this.trailMesh = null;

        this.initTrail();
    }

    initTrail() {
        // Basit bir şerit (Line) veya BufferGeometry ile iz oluşturma
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(Config.Puck.trailLength * 3);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.LineBasicMaterial({
            color: Config.Puck.color,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        });

        this.trailMesh = new THREE.Line(geometry, material);
        this.scene.add(this.trailMesh);
    }

    /**
     * Vuruş Efekti: Patlama (Neon Sparks)
     */
    createExplosion(position, color) {
        const count = Config.Puck.particleCount;
        for (let i = 0; i < count; i++) {
            const particle = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, 0.1, 0.1),
                new THREE.MeshStandardMaterial({
                    color: color,
                    emissive: color,
                    emissiveIntensity: 5,
                    transparent: true
                })
            );

            particle.position.copy(position);

            // Rastgele hız ve yön
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.5,
                (Math.random()) * 0.3, // Yukarı doğru
                (Math.random() - 0.5) * 0.5
            );

            this.particles.push({
                mesh: particle,
                velocity: velocity,
                life: 1.0 // 100% ömür
            });

            this.scene.add(particle);
        }
    }

    update(delta, puckPosition) {
        // 1. Parçacık Güncelleme (Particles)
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.mesh.position.add(p.velocity);
            p.velocity.y -= 0.01; // Yerçekimi
            p.life -= delta * 2; // Ömür azalır

            p.mesh.material.opacity = p.life;
            p.mesh.scale.setScalar(p.life);

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                this.particles.splice(i, 1);
            }
        }

        // 2. İz Güncelleme (Trail)
        if (puckPosition) {
            this.trailPoints.unshift(puckPosition.clone());
            if (this.trailPoints.length > Config.Puck.trailLength) {
                this.trailPoints.pop();
            }

            const positions = this.trailMesh.geometry.attributes.position.array;
            for (let i = 0; i < this.trailPoints.length; i++) {
                positions[i * 3] = this.trailPoints[i].x;
                positions[i * 3 + 1] = this.trailPoints[i].y;
                positions[i * 3 + 2] = this.trailPoints[i].z;
            }
            this.trailMesh.geometry.attributes.position.needsUpdate = true;
        }
    }
}
