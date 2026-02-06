import * as THREE from 'three';
import { Config } from './config.js';

/**
 * Vision Module
 * Handles MediaPipe Hands initialization and data processing
 */
export class Vision {
    constructor() {
        this.hands = null;
        this.camera = null;
        this.scene = null;
        this.latestLandmarks = null;
        this.videoElement = document.getElementById('webcam');

        // Data for external consumption
        this.handData = {
            x: 0.5, // Normalized 0-1
            y: 0.5, // Normalized 0-1
            isActive: false,
            isFist: false
        };

        // Smoothing
        this.targetX = 0.5;
        this.targetY = 0.5;
        this.lerpFactor = Config.Controls.smoothing;

        // 3D Skeleton
        this.skeletonEnabled = Config.Controls.showHandSkeleton;
        this.landmarkMeshes = [];

        console.log("Vision module loaded (Premium Edition)");
    }

    async init(scene = null) {
        console.log("Initializing Vision...");
        this.scene = scene;

        if (this.skeletonEnabled && this.scene) {
            this.initSkeleton();
        }

        if (!window.Hands) {
            console.error("MediaPipe Hands not loaded yet!");
            return;
        }

        this.hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });

        this.hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.7
        });

        this.hands.onResults(this.onResults.bind(this));

        if (this.videoElement) {
            const camera = new Camera(this.videoElement, {
                onFrame: async () => {
                    await this.hands.send({ image: this.videoElement });
                },
                width: 1280,
                height: 720
            });
            camera.start();

            // Connect webcam stream to preview element
            const previewElement = document.getElementById('webcam-preview');
            if (previewElement && this.videoElement.srcObject) {
                previewElement.srcObject = this.videoElement.srcObject;
            } else if (previewElement) {
                // Wait for stream to be ready
                this.videoElement.addEventListener('loadedmetadata', () => {
                    previewElement.srcObject = this.videoElement.srcObject;
                });
            }
        }
    }

    onResults(results) {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            this.latestLandmarks = landmarks;

            // Draw hand skeleton on canvas overlay
            this.drawHandSkeleton(landmarks);

            // Update 3D Skeleton
            if (this.skeletonEnabled) this.updateSkeleton(landmarks);

            // Index Finger Tip (Landmark 8) for tracking
            const indexTip = landmarks[8];
            this.targetX = 1.0 - indexTip.x;
            this.targetY = indexTip.y;

            this.handData.isFist = this.detectFist(landmarks);
            this.handData.isActive = true;

            const dot = document.getElementById('connection-dot');
            if (dot) dot.className = "w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]";
            const statusText = document.getElementById('status-text');
            if (statusText) statusText.innerText = "Sistem Aktif";
        } else {
            this.handData.isActive = false;

            // Clear hand skeleton canvas
            this.clearHandCanvas();

            const dot = document.getElementById('connection-dot');
            if (dot) dot.className = "w-3 h-3 rounded-full bg-red-500";
            const statusText = document.getElementById('status-text');
            if (statusText) statusText.innerText = "Bağlantı Bekleniyor";

            // Hide skeleton if hand lost
            if (this.skeletonEnabled) {
                this.landmarkMeshes.forEach(m => m.visible = false);
            }
        }
    }

    detectFist(landmarks) {
        const wrist = landmarks[0];
        const tips = [8, 12, 16, 20];
        let foldedCount = 0;

        tips.forEach(idx => {
            const tip = landmarks[idx];
            const pip = landmarks[idx - 2];
            const distTip = Math.sqrt((tip.x - wrist.x) ** 2 + (tip.y - wrist.y) ** 2);
            const distPip = Math.sqrt((pip.x - wrist.x) ** 2 + (pip.y - wrist.y) ** 2);
            if (distTip < distPip) foldedCount++;
        });

        return foldedCount >= Config.Controls.fistThreshold;
    }

    getHandData() {
        this.handData.x += (this.targetX - this.handData.x) * this.lerpFactor;
        this.handData.y += (this.targetY - this.handData.y) * this.lerpFactor;
        return this.handData;
    }

    initSkeleton() {
        const geo = new THREE.SphereGeometry(0.08, 8, 8);
        const mat = new THREE.MeshBasicMaterial({ color: 0x00FF88, transparent: true, opacity: 0.6 });

        for (let i = 0; i < 21; i++) {
            const mesh = new THREE.Mesh(geo, mat);
            mesh.visible = false;
            this.landmarkMeshes.push(mesh);
            this.scene.add(mesh);
        }
    }

    updateSkeleton(landmarks) {
        const tableWidth = Config.Table.width;
        const tableLength = Config.Table.length;

        landmarks.forEach((lm, i) => {
            if (this.landmarkMeshes[i]) {
                const x = (0.5 - lm.x) * tableWidth; // Mirrored
                const z = (lm.y * (tableLength / 2)) + 2; // Offset to player side
                const y = (0.5 - lm.z) * 3; // Height adjustment

                this.landmarkMeshes[i].position.set(x, y, z);
                this.landmarkMeshes[i].visible = true;
            }
        });
    }

    drawHandSkeleton(landmarks) {
        const canvas = document.getElementById('hand-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear previous frame
        ctx.clearRect(0, 0, width, height);

        // MediaPipe Hand Connections
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],           // Thumb
            [0, 5], [5, 6], [6, 7], [7, 8],           // Index
            [0, 9], [9, 10], [10, 11], [11, 12],      // Middle
            [0, 13], [13, 14], [14, 15], [15, 16],    // Ring
            [0, 17], [17, 18], [18, 19], [19, 20],    // Pinky
            [5, 9], [9, 13], [13, 17]                 // Palm
        ];

        // Draw connections (green lines)
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        connections.forEach(([start, end]) => {
            const startPoint = landmarks[start];
            const endPoint = landmarks[end];

            ctx.beginPath();
            ctx.moveTo(startPoint.x * width, startPoint.y * height);
            ctx.lineTo(endPoint.x * width, endPoint.y * height);
            ctx.stroke();
        });

        // Draw landmarks (green dots)
        ctx.fillStyle = '#00ff88';
        landmarks.forEach((landmark, index) => {
            const x = landmark.x * width;
            const y = landmark.y * height;

            ctx.beginPath();
            ctx.arc(x, y, index === 8 ? 6 : 4, 0, 2 * Math.PI); // Index tip larger
            ctx.fill();

            // Glow effect for index finger tip
            if (index === 8) {
                ctx.strokeStyle = 'rgba(0, 255, 136, 0.5)';
                ctx.lineWidth = 3;
                ctx.stroke();
            }
        });
    }

    clearHandCanvas() {
        const canvas = document.getElementById('hand-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}
