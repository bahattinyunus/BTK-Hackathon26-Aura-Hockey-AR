import * as THREE from 'three';
import { Config } from './config.js';

export class Effects {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.rainParticles = [];
        this.trailPoints = [];
        this.trailMesh = null;
        this.gridMaterial = null;

        this.initTrail();
        this.createGridShader(Config.Table.width, Config.Table.length);
        this.createRain();
    }

    createRain() {
        const rainCount = 200;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(rainCount * 3);
        const velocities = [];

        for (let i = 0; i < rainCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 15;
            positions[i * 3 + 1] = Math.random() * 20;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 25;
            velocities.push(Math.random() * 0.2 + 0.1);
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({
            color: 0x00ffff,
            size: 0.05,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        });

        this.rainSystem = new THREE.Points(geometry, material);
        this.scene.add(this.rainSystem);
        this.rainVelocities = velocities;
    }

    initTrail() {
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

            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.5,
                (Math.random()) * 0.3,
                (Math.random() - 0.5) * 0.5
            );

            this.particles.push({
                mesh: particle,
                velocity: velocity,
                life: 1.0
            });

            this.scene.add(particle);
        }
    }

    update(delta, puckPosition) {
        // 1. Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.mesh.position.add(p.velocity);
            p.velocity.y -= 0.01;
            p.life -= delta * 2;

            p.mesh.material.opacity = p.life;
            p.mesh.scale.setScalar(p.life);

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                this.particles.splice(i, 1);
            }
        }

        // 2. Trail
        if (puckPosition) {
            this.trailPoints.unshift(puckPosition.clone());
            if (this.trailPoints.length > Config.Puck.trailLength) {
                this.trailPoints.pop();
            }

            const positions = this.trailMesh.geometry.attributes.position.array;
            for (let i = 0; i < this.trailPoints.length; i++) {
                const wave = Math.sin(Date.now() * 0.01 + i * 0.5) * 0.1;
                positions[i * 3] = this.trailPoints[i].x + wave;
                positions[i * 3 + 1] = this.trailPoints[i].y + wave;
                positions[i * 3 + 2] = this.trailPoints[i].z;
            }
            this.trailMesh.geometry.attributes.position.needsUpdate = true;
        }

        // 3. Cyber-Rain
        if (this.rainSystem) {
            const positions = this.rainSystem.geometry.attributes.position.array;
            for (let i = 0; i < positions.length / 3; i++) {
                positions[i * 3 + 1] -= this.rainVelocities[i];
                if (positions[i * 3 + 1] < 0) {
                    positions[i * 3 + 1] = 20;
                }
            }
            this.rainSystem.geometry.attributes.position.needsUpdate = true;

            if (window.game && window.game.sound) {
                const vol = window.game.sound.getAverageVolume();
                this.rainSystem.material.opacity = 0.2 + vol * 2.0;
            }
        }

        // 4. Grid Shader (Audio & Ripples)
        if (this.gridMaterial) {
            this.gridMaterial.uniforms.time.value += delta;
            if (puckPosition) {
                this.gridMaterial.uniforms.uPuckPos.value.copy(puckPosition);
            }

            if (window.game && window.game.sound) {
                const vol = window.game.sound.getAverageVolume();
                this.gridMaterial.uniforms.uAudio.value = vol;
            }
        }
    }

    createGridShader(width, length) {
        const geometry = new THREE.PlaneGeometry(width, length, 64, 64);
        this.gridMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                uAudio: { value: 0 },
                uPuckPos: { value: new THREE.Vector3(0, 0, 0) },
                color: { value: new THREE.Color(0x0088ff) }
            },
            vertexShader: `
                uniform float time;
                uniform vec3 uPuckPos;
                uniform float uAudio;
                varying vec2 vUv;
                varying float vDist;
                
                void main() {
                    vUv = uv;
                    vec3 pos = position;
                    float dist = distance(pos.xz, uPuckPos.xz);
                    vDist = dist;
                    
                    // Vertex Ripples
                    float ripple = sin(dist * 3.0 - time * 5.0) * 0.2 * exp(-dist * 0.5);
                    pos.z += ripple * (1.0 + uAudio * 2.0);
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float uAudio;
                uniform vec3 color;
                varying vec2 vUv;
                varying float vDist;

                void main() {
                    vec2 uv = vUv * 40.0;
                    float grid = abs(sin(uv.x)) + abs(sin(uv.y));
                    grid = smoothstep(1.9, 2.0, grid);
                    
                    // Glow around puck
                    float glow = exp(-vDist * 0.8) * 0.5;
                    
                    float scanline = sin(vUv.y * 100.0 + time * 5.0) * 0.1 + 0.9;
                    float pulse = 0.5 + uAudio * 2.0;
                    
                    vec3 finalColor = color * (grid + glow) * scanline * pulse;
                    gl_FragColor = vec4(finalColor, (grid + glow) * (0.3 + uAudio));
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const floor = new THREE.Mesh(geometry, this.gridMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.05;
        this.scene.add(floor);
    }
}
