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
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
      );
      faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: 'GPU'
        },
        outputFaceBlendshapes: true,
        runningMode: 'VIDEO',
        numFaces: 1
      });
      self.postMessage({ type: 'INIT_COMPLETE', success: true });
    } catch (err: any) {
      self.postMessage({ type: 'INIT_ERROR', error: err.message || 'Worker initialization failed' });
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

      let extractedShapes: Record<string, number> = {};
      if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
        const categories = results.faceBlendshapes[0].categories;
        for (const cat of categories) {
          extractedShapes[cat.categoryName] = cat.score;
        }
      }

      self.postMessage({
        type: 'FRAME_PROCESSED',
        payload: {
          timestamp,
          blendshapes: extractedShapes,
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

