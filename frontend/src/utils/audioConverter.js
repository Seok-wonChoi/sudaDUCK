/**
 * WebM Blob을 WAV Blob으로 변환
 * @param {Blob} webmBlob - 원본 WebM Blob
 * @returns {Promise<Blob>} WAV Blob
 */
export async function convertWebMToWav(webmBlob) {
  return new Promise((resolve, reject) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)(
      {
        sampleRate: 16000, // Azure Speech API 권장: 16kHz
      },
    );

    const fileReader = new FileReader();

    fileReader.onload = async function () {
      try {
        // 1. WebM 디코딩
        const audioBuffer = await audioContext.decodeAudioData(this.result);

        // 2. 모노 채널로 변환
        const monoBuffer =
          audioBuffer.numberOfChannels > 1
            ? getMonoBuffer(audioBuffer)
            : audioBuffer;

        // 3. WAV 인코딩
        const wavBlob = bufferToWave(monoBuffer, audioContext.sampleRate);

        resolve(wavBlob);
      } catch (error) {
        console.error("Audio conversion failed:", error);
        reject(error);
      }
    };

    fileReader.onerror = () => reject(fileReader.error);
    fileReader.readAsArrayBuffer(webmBlob);
  });
}

/**
 * AudioBuffer를 모노로 변환
 */
function getMonoBuffer(audioBuffer) {
  const channelData = [];
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    channelData.push(audioBuffer.getChannelData(channel));
  }

  const monoData = new Float32Array(audioBuffer.length);
  for (let i = 0; i < audioBuffer.length; i++) {
    let sum = 0;
    for (let channel = 0; channel < channelData.length; channel++) {
      sum += channelData[channel][i];
    }
    monoData[i] = sum / channelData.length;
  }

  const monoBuffer = new AudioContext().createBuffer(
    1,
    audioBuffer.length,
    audioBuffer.sampleRate,
  );
  monoBuffer.copyToChannel(monoData, 0);

  return monoBuffer;
}

/**
 * AudioBuffer를 WAV Blob으로 변환
 */
function bufferToWave(audioBuffer, sampleRate) {
  const numChannels = 1; // 모노
  const format = 1; // PCM
  const bitDepth = 16; // 16-bit

  const channelData = audioBuffer.getChannelData(0);
  const samples = new Int16Array(channelData.length);

  // Float32 → Int16 변환
  for (let i = 0; i < channelData.length; i++) {
    const s = Math.max(-1, Math.min(1, channelData[i]));
    samples[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // WAV 헤더 작성
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, (sampleRate * numChannels * bitDepth) / 8, true);
  view.setUint16(32, (numChannels * bitDepth) / 8, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, "data");
  view.setUint32(40, samples.length * 2, true);

  // 오디오 데이터 작성
  const offset = 44;
  for (let i = 0; i < samples.length; i++) {
    view.setInt16(offset + i * 2, samples[i], true);
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
