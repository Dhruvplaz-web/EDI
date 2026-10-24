/**
 * Praxis AI - MediaPipe 468-Landmark WebWorker Thread
 * Prevents main thread lag and Chrome V8 heap memory accumulation
 * by invoking .close() on ImageBitmap frames immediately after feature extraction.
 */

import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

let faceLandmarker: FaceLandmarker | null = null;

self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data;

  if (type === 'INIT') {
    try {
      const vision = await FilesetResolver.forVisionTasks('/models/wasm');
      faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: '/models/face_landmarker.task',
          delegate: 'GPU'
        },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
        runningMode: 'VIDEO',
        numFaces: 1
      });
      self.postMessage({ type: 'INIT_COMPLETE', success: true });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Worker initialization failed';
      self.postMessage({ type: 'INIT_ERROR', error: errorMsg });
    }
  } else if (type === 'PROCESS_FRAME') {
    const { imageBitmap, timestamp } = payload;
    if (!imageBitmap) return;
    if (!faceLandmarker) {
      imageBitmap.close();
      return;
    }

    try {
      const results = faceLandmarker.detectForVideo(imageBitmap, timestamp);

      const extractedShapes: Record<string, number> = {};
      if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
        const categories = results.faceBlendshapes[0].categories;
        for (const cat of categories) {
          extractedShapes[cat.categoryName] = cat.score;
        }
      }

      // Compute 3D Head Pose Euler Angles to reject foreshortening AU15 false positives
      let pitchDeg = 0;
      let yawDeg = 0;
      let rollDeg = 0;
      let isPoseCentered = true;

      if (results.facialTransformationMatrixes && results.facialTransformationMatrixes.length > 0) {
        const m = results.facialTransformationMatrixes[0].data;
        if (m && m.length >= 16) {
          pitchDeg = Math.asin(Math.max(-1, Math.min(1, -m[9]))) * (180 / Math.PI);
          yawDeg = Math.atan2(m[8], m[10]) * (180 / Math.PI);
          rollDeg = Math.atan2(m[1], m[5]) * (180 / Math.PI);
          isPoseCentered = Math.abs(pitchDeg) < 22 && Math.abs(yawDeg) < 22;
        }
      }

      self.postMessage({
        type: 'FRAME_PROCESSED',
        payload: {
          timestamp,
          blendshapes: extractedShapes,
          headPose: {
            pitchDeg: Math.round(pitchDeg),
            yawDeg: Math.round(yawDeg),
            rollDeg: Math.round(rollDeg),
            isPoseCentered
          },
          landmarksCount: results.faceLandmarks ? results.faceLandmarks.length : 0
        }
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Frame processing error';
      self.postMessage({ type: 'FRAME_ERROR', error: errorMsg });
    } finally {
      // CRITICAL MEMORY SAFEGUARD: Guarantee ImageBitmap close even on error
      if (imageBitmap && typeof imageBitmap.close === 'function') {
        imageBitmap.close();
      }
    }
  }
};

