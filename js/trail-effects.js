/**
 * Trail Effects for Puck
 * Speed-based color changing trail
 */

import * as THREE from 'three';

export class PuckTrail {
    constructor(scene) {
        this.scene = scene;
        this.points = [];
        this.maxPoints = 30;

        // Create line geometry
        this.geometry = new THREE.BufferGeometry();
        this.material = new THREE.LineBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.7,
            linewidth: 3,
            blending: THREE.AdditiveBlending
        });

        this.line = new THREE.Line(this.geometry, this.material);
        this.scene.add(this.line);
    }

    update(position, velocity) {
        // Calculate speed
        const speed = velocity.length();

        // Speed-based color: Cyan (slow) → Pink (medium) → Red (fast)
        let color;
        if (speed < 10) {
            // Slow: Cyan to Pink
            color = new THREE.Color().lerpColors(
                new THREE.Color(0x00ffff), // Cyan
                new THREE.Color(0xff00ff), // Magenta
                speed / 10
            );
        } else {
            // Fast: Pink to Red
            color = new THREE.Color().lerpColors(
                new THREE.Color(0xff00ff), // Magenta
                new THREE.Color(0xff0044), // Red
                Math.min((speed - 10) / 20, 1)
            );
        }

        this.material.color = color;

        // Add new point
        this.points.push(position.clone());

        // Remove old points
        if (this.points.length > this.maxPoints) {
            this.points.shift();
        }

        // Update geometry
        if (this.points.length > 1) {
            const positions = new Float32Array(this.points.length * 3);
            this.points.forEach((p, i) => {
                positions[i * 3] = p.x;
                positions[i * 3 + 1] = p.y;
                positions[i * 3 + 2] = p.z;
            });

            this.geometry.setAttribute('position',
                new THREE.BufferAttribute(positions, 3));
            this.geometry.attributes.position.needsUpdate = true;
        }
    }

    clear() {
        this.points = [];
        if (this.geometry.attributes.position) {
            this.geometry.attributes.position.needsUpdate = true;
        }
    }
}

export function createCollisionParticles(scene, position, color = 0x00ffff) {
    const particleCount = 20;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    // Initialize particles at collision point
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = position.x;
        positions[i * 3 + 1] = position.y;
        positions[i * 3 + 2] = position.z;

        // Random outward velocity
        const angle = (Math.PI * 2 * i) / particleCount;
        const speed = 0.5 + Math.random() * 1.5;
        velocities.push(new THREE.Vector3(
            Math.cos(angle) * speed,
            (Math.random() - 0.5) * 0.5,
            Math.sin(angle) * speed
        ));
    }

    geometry.setAttribute('position',
        new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: color,
        size: 0.15,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Animate particles
    let life = 1.0;
    const animate = () => {
        life -= 0.04;

        if (life <= 0) {
            scene.remove(particles);
            geometry.dispose();
            material.dispose();
            return;
        }

        // Update positions
        const pos = particles.geometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            pos[i * 3] += velocities[i].x * 0.1;
            pos[i * 3 + 1] += velocities[i].y * 0.1;
            pos[i * 3 + 2] += velocities[i].z * 0.1;

            // Gravity
            velocities[i].y -= 0.02;
        }
        particles.geometry.attributes.position.needsUpdate = true;

        // Fade out
        material.opacity = life;
        material.size = 0.15 * life;

        requestAnimationFrame(animate);
    };
    animate();
}

export function createGoalEffect(scene, position, color = 0xff00ff) {
    const particleCount = 100;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = position.x;
        positions[i * 3 + 1] = position.y;
        positions[i * 3 + 2] = position.z;

        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const speed = 2.0 + Math.random() * 4.0;
        
        velocities.push(new THREE.Vector3(
            Math.sin(phi) * Math.cos(theta) * speed,
            Math.sin(phi) * Math.sin(theta) * speed,
            Math.cos(phi) * speed
        ));
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: color,
        size: 0.3,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    let life = 1.0;
    const animate = () => {
        life -= 0.02;

        if (life <= 0) {
            scene.remove(particles);
            geometry.dispose();
            material.dispose();
            return;
        }

        const pos = particles.geometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            pos[i * 3] += velocities[i].x * 0.1;
            pos[i * 3 + 1] += velocities[i].y * 0.1;
            pos[i * 3 + 2] += velocities[i].z * 0.1;
            velocities[i].multiplyScalar(0.96); // Air resistance
        }
        particles.geometry.attributes.position.needsUpdate = true;
        material.opacity = life;
        material.size = 0.3 * (1 + (1 - life) * 2); // Particles grow as they fade

        requestAnimationFrame(animate);
    };
    animate();
}
