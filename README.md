# Agent Voice Response - Vosk ASR Integration

[![Discord](https://img.shields.io/discord/1347239846632226998?label=Discord&logo=discord)](https://discord.gg/DFTU69Hg74)
[![GitHub Repo stars](https://img.shields.io/github/stars/agentvoiceresponse/avr-llm-openai?style=social)](https://github.com/agentvoiceresponse/avr-llm-openai)
[![Docker Pulls](https://img.shields.io/docker/pulls/agentvoiceresponse/avr-llm-openai?label=Docker%20Pulls&logo=docker)](https://hub.docker.com/r/agentvoiceresponse/avr-llm-openai)
[![Ko-fi](https://img.shields.io/badge/Support%20us%20on-Ko--fi-ff5e5b.svg)](https://ko-fi.com/agentvoiceresponse)

This repository provides a real-time speech-to-text transcription service using **Vosk ASR (Automatic Speech Recognition)** integrated with the **Agent Voice Response** system. The code sets up an Express.js server that accepts audio streams from Agent Voice Response Core, transcribes the audio using the Vosk offline speech recognition engine, and streams the transcription back to the Agent Voice Response Core in real-time.

## What is Vosk?

**Vosk** is an open-source speech recognition toolkit that provides offline speech-to-text capabilities. Unlike cloud-based solutions, Vosk runs entirely on your local machine, offering several advantages:

- **Privacy**: No audio data is sent to external servers
- **Low Latency**: No network delays for processing
- **Cost-Effective**: No API usage fees
- **Multilingual**: Supports 20+ languages
- **Lightweight**: Small model sizes (50MB-1.8GB depending on accuracy needs)
- **Cross-Platform**: Works on Linux, Windows, macOS, Android, iOS

Vosk uses Kaldi-based neural networks and is particularly well-suited for real-time applications where privacy and offline operation are important.

## Prerequisites

Before setting up the project, ensure you have the following:

1. **Node.js** and **npm** installed.
2. A **Vosk model** downloaded for your target language.
3. Sufficient disk space for the model files (typically 50MB-1.8GB).

## Setup

### 1. Clone the Repository

```bash
git clone https://github.com/agentvoiceresponse/avr-asr-vosk.git
cd avr-asr-vosk
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Download Vosk Model

Download a Vosk model for your language from [https://alphacephei.com/vosk/models](https://alphacephei.com/vosk/models):

```bash
# Example for English (small model ~50MB)
wget https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip
unzip vosk-model-small-en-us-0.15.zip
mv vosk-model-small-en-us-0.15 model

# Or for better accuracy (large model ~1.8GB)
wget https://alphacephei.com/vosk/models/vosk-model-en-us-0.22.zip
unzip vosk-model-en-us-0.22.zip
mv vosk-model-en-us-0.22 model
```

### 4. Configuration

Ensure that you have the following environment variables set in your `.env` file:

```
MODEL_PATH=model
PORT=6010
```

You can adjust the port number and model path as needed.

## How It Works

This application sets up an Express.js server that accepts audio streams from clients and uses Vosk ASR to transcribe the audio in real-time offline. The transcribed text is then streamed back to the Agent Voice Response Core. Below is an overview of the core components:

### 1. **Express.js Server**

The server listens for audio streams on a specific route (`/speech-to-text-stream`) and passes the incoming audio to the Vosk recognizer for real-time transcription.

### 2. **Audio Upsampling**

Since Vosk expects 16kHz audio but the incoming stream is at 8kHz, the application includes an advanced upsampling function that uses linear interpolation to convert the audio to the correct sample rate.

### 3. **Vosk Speech Recognition**

The Vosk recognizer processes the audio data received from the client and converts it into text using offline neural network models. The results are streamed back to the client in real-time.

### 4. **Route /speech-to-text-stream**

This route accepts audio streams from the client and processes them for transcription. The transcription is sent back to the client as soon as it's available.

## Example Code Overview

Here's a high-level breakdown of the key parts of the code:

- **Server Setup**: Configures the Express.js server and loads the Vosk model.
- **Audio Stream Handling**: A function, `handleAudioStream`, processes the incoming audio from clients. It:
  - Initializes a `Vosk Model` and `Recognizer` with 16kHz sample rate.
  - Upsamples incoming 8kHz audio to 16kHz using linear interpolation.
  - Sets up event listeners to handle `data`, `end`, and `error` events.
  - Processes audio chunks through the Vosk recognizer.
  - Sends partial and final transcriptions back to the client through the HTTP response stream.
  
- **Express.js Route**: The route `/speech-to-text-stream` calls the `handleAudioStream` function when a client connects.

## Running the Application

To start the application:

```bash
npm run start
```

or

```bash
npm run start:dev
```

The server will start and listen on the port specified in the `.env` file or default to `PORT=6010`.

### Sample Request

You can send audio streams to the `/speech-to-text-stream` endpoint using a client that streams audio data (e.g., a browser, mobile app, or another Node.js service). The audio should be:

- **Format**: 16-bit PCM
- **Sample Rate**: 8kHz (will be upsampled to 16kHz automatically)
- **Channels**: Mono
- **Encoding**: Little-endian

## Model Selection

Choose the appropriate Vosk model based on your needs:

- **Small models** (~50MB): Fast, lower accuracy, good for real-time applications
- **Large models** (~1.8GB): Slower, higher accuracy, better for quality transcription
- **Specific language models**: Available for 20+ languages

## Advantages of Vosk vs Cloud Solutions

- **Privacy**: Audio never leaves your server
- **Latency**: No network round-trips
- **Cost**: No per-minute charges
- **Reliability**: Works without internet connection
- **Scalability**: No API rate limits

## Support & Community

*   **GitHub:** [https://github.com/agentvoiceresponse](https://github.com/agentvoiceresponse) - Report issues, contribute code.
*   **Discord:** [https://discord.gg/DFTU69Hg74](https://discord.gg/DFTU69Hg74) - Join the community discussion.
*   **Docker Hub:** [https://hub.docker.com/u/agentvoiceresponse](https://hub.docker.com/u/agentvoiceresponse) - Find Docker images.
*   **Wiki:** [https://wiki.agentvoiceresponse.com/en/home](https://wiki.agentvoiceresponse.com/en/home) - Project documentation and guides.

## Support AVR

AVR is free and open-source. If you find it valuable, consider supporting its development:

<a href="https://ko-fi.com/agentvoiceresponse" target="_blank"><img src="https://ko-fi.com/img/githubbutton_sm.svg" alt="Support us on Ko-fi"></a>

## License

MIT License - see the [LICENSE](LICENSE.md) file for details.