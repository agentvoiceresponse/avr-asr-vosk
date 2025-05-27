/**
 * index.js
 * This file is the main entry point for the application using Vosk ASR.
 */
require("dotenv").config();

const express = require("express");
const vosk = require("vosk");
const fs = require("fs");

const app = express();

const modelPath = process.env.MODEL_PATH || "model";
if (!fs.existsSync(modelPath)) {
  console.log(
    "Please download the model from https://alphacephei.com/vosk/models and unpack as " +
      modelPath +
      " in the current folder."
  );
  process.exit();
}

/**
 * Advanced upsampling from 8kHz to 16kHz using linear interpolation
 * @param {Buffer} audioBuffer - Input audio buffer at 8kHz
 * @returns {Buffer} - Upsampled audio buffer at 16kHz
 */
const upsampleAudio = (audioBuffer) => {
  // Validate input
  if (!audioBuffer || audioBuffer.length === 0) {
    console.warn("Empty or null audio buffer received");
    return Buffer.alloc(0);
  }
  
  // Ensure buffer length is even (16-bit samples)
  if (audioBuffer.length % 2 !== 0) {
    console.warn("Audio buffer length is odd, truncating last byte");
    audioBuffer = audioBuffer.slice(0, audioBuffer.length - 1);
  }
  
  const inputSamples = audioBuffer.length / 2; // 16-bit samples
  
  if (inputSamples === 0) {
    return Buffer.alloc(0);
  }
  
  const outputSamples = inputSamples * 2; // Double the number of samples
  const outputBuffer = Buffer.alloc(outputSamples * 2);
  
  for (let i = 0; i < outputSamples; i++) {
    if (i % 2 === 0) {
      // Keep original samples at even positions
      const originalIndex = i / 2;
      if (originalIndex < inputSamples) {
        const sample = audioBuffer.readInt16LE(originalIndex * 2);
        outputBuffer.writeInt16LE(sample, i * 2);
      }
    } else {
      // Interpolate samples at odd positions
      const prevIndex = Math.floor(i / 2);
      const nextIndex = Math.ceil(i / 2);
      
      if (prevIndex < inputSamples && nextIndex < inputSamples) {
        const prevSample = audioBuffer.readInt16LE(prevIndex * 2);
        const nextSample = audioBuffer.readInt16LE(nextIndex * 2);
        
        // Linear interpolation
        const interpolatedSample = Math.round((prevSample + nextSample) / 2);
        outputBuffer.writeInt16LE(interpolatedSample, i * 2);
      } else if (prevIndex < inputSamples) {
        // Use previous sample if next is out of bounds
        const sample = audioBuffer.readInt16LE(prevIndex * 2);
        outputBuffer.writeInt16LE(sample, i * 2);
      }
    }
  }
  
  return outputBuffer;
};

/**
 * Handles an audio stream from the client and uses Vosk ASR
 * to recognize the speech and stream the transcript back to the client.
 *
 * @param {Object} req - The Express request object
 * @param {Object} res - The Express response object
 */
const handleAudioStream = async (req, res) => {
  try {
    const model = new vosk.Model(modelPath);
    const sampleRate = 16000; // Vosk expects 16kHz
    const rec = new vosk.Recognizer({ model: model, sampleRate: sampleRate });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    req.on("data", async (chunk) => {      
      try {
        // Upsample from 8kHz to 16kHz
        const upsampledChunk = upsampleAudio(chunk);
        
        // Validate upsampled chunk
        if (upsampledChunk.length === 0) {
          console.warn("Warning: Upsampled chunk is empty");
          return;
        }
        
        // Use synchronous acceptWaveform (the correct API)
        if (rec.acceptWaveform(upsampledChunk)) {
          const result = rec.result();
          console.log("Partial result:", result);
          if (result.text) {
            // Send partial results to client
            res.write(result.text);
          }
        }
      } catch (error) {
        console.error("Error processing audio chunk:", error);
        console.error("Chunk details - Original:", chunk.length, "Upsampled:", upsampledChunk?.length || 0);
      }
    });

    req.on("end", () => {
      console.log("Audio stream ended");
      try {
        rec.free();
        model.free();
        res.end();
      } catch (error) {
        console.error("Error getting final result:", error);
        res.end();
      }
    });
    req.on("error", (err) => {
      console.error("Error receiving audio stream:", err);
      req.destroy();
      res.status(500).json({ message: "Error receiving audio stream" });
    });
  } catch (err) {
    console.error("Error handling audio stream:", err);
    res.status(500).json({ message: err.message });
  }
};

app.post("/speech-to-text-stream", handleAudioStream);

const port = process.env.PORT || 6010;
app.listen(port, () => {
  console.log(`Vosk ASR endpoint listening on port ${port}`);
});
