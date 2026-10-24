/**
 * Praxis AI - High-Priority Real-Time AudioWorklet Processor
 * Runs on audio rendering thread (off main thread) to collect PCM frames for pitch/jitter analysis.
 */
class AcousticWorkletProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 2048;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const channelData = input[0];
    if (!channelData) return true;

    for (let i = 0; i < channelData.length; i++) {
      this.buffer[this.bufferIndex++] = channelData[i];
      if (this.bufferIndex >= this.bufferSize) {
        this.port.postMessage(this.buffer.slice());
        this.bufferIndex = 0;
      }
    }
    return true;
  }
}

registerProcessor('acoustic-worklet-processor', AcousticWorkletProcessor);
