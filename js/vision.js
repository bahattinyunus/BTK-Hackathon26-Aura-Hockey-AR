import { Config } from './config.js';

/**
 * Vision Module
 * Handles MediaPipe Hands initialization and data processing
 */
export class Vision {
    constructor() {
        this.hands = null;
        this.camera = null;
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
        this.lerpFactor = Config.Controls.smoothing; // from config

        console.log("Vision module loaded");
    }

    async init() {
        console.log("Initializing Vision...");

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
            // Use MediaPipe Camera Utils
            const camera = new Camera(this.videoElement, {
                onFrame: async () => {
                    await this.hands.send({ image: this.videoElement });
                },
                width: 1280,
                height: 720
            });
            camera.start();
        }
    }

    onResults(results) {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            this.latestLandmarks = landmarks;

            // Index Finger Tip (Landmark 8) for tracking
            const indexTip = landmarks[8];

            // Mirror X because webcam is mirrored
            this.targetX = 1.0 - indexTip.x;
            this.targetY = indexTip.y;

            // Detect Fist Gesture
            this.handData.isFist = this.detectFist(landmarks);
            this.handData.isActive = true;

            // Debug Status
            document.getElementById('connection-dot').className = "w-2 h-2 rounded-full bg-green-500 animate-pulse";
            document.getElementById('status-text').innerText = "Takip Aktif";
        } else {
            this.handData.isActive = false;
            document.getElementById('connection-dot').className = "w-2 h-2 rounded-full bg-red-500";
            document.getElementById('status-text').innerText = "Takip Kaybedildi";
        }
    }

    detectFist(landmarks) {
        // Simple heuristic: distance between finger tips and palm
        // Thumb is 4, Index 8, Middle 12, Ring 16, Pinky 20
        // Wrist is 0

        const wrist = landmarks[0];
        const tips = [8, 12, 16, 20];
        let foldedCount = 0;

        tips.forEach(idx => {
            const tip = landmarks[idx];
            const pip = landmarks[idx - 2]; // Proximal Interphalangeal Joint

            // If tip is closer to wrist than PIP, it's folded (roughly)
            const distTip = Math.sqrt((tip.x - wrist.x) ** 2 + (tip.y - wrist.y) ** 2);
            const distPip = Math.sqrt((pip.x - wrist.x) ** 2 + (pip.y - wrist.y) ** 2);

            if (distTip < distPip) foldedCount++;
        });

        return foldedCount >= Config.Controls.fistThreshold; // Fist if folded count meets threshold
    }

    getHandData() {
        // Apply Lerp for smoothness
        this.handData.x += (this.targetX - this.handData.x) * this.lerpFactor;
        this.handData.y += (this.targetY - this.handData.y) * this.lerpFactor;

        return this.handData;
    }
}
