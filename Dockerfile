FROM node:22-bookworm

# 1. Install system tools: FFmpeg, Chromium, Python 3, and headless browser libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    chromium \
    python3 \
    python3-pip \
    python3-venv \
    fonts-liberation \
    fonts-noto-color-emoji \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libxshmfence1 \
    ca-certificates \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Environment variables for Chromium, Remotion, and Faceless Shorts
ENV CHROME_BIN=/usr/bin/chromium \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    FACELESS_HOME=/root/.faceless-shorts \
    NODE_ENV=development

WORKDIR /app

# 2. Setup Python environment and AI audio libraries (Kokoro, Whisper, Edge-TTS, NumPy, SciPy)
RUN python3 -m venv /root/.faceless-shorts/venv
ENV PATH="/root/.faceless-shorts/venv/bin:$PATH"

RUN pip install --no-cache-dir \
    numpy \
    scipy \
    kokoro-onnx \
    faster-whisper \
    edge-tts \
    opencv-python-headless

# 3. Pre-download Whisper model into the container
RUN python3 -c "from faster_whisper import WhisperModel; WhisperModel('small.en', device='cpu', compute_type='int8')"

# 4. Copy dependency manifests first for optimal Docker layer caching
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
COPY remotion/package*.json ./remotion/
COPY requirements.txt ./

# Install npm dependencies
RUN npm --prefix backend install && \
    npm --prefix frontend install && \
    npm --prefix remotion install

# 5. Copy the rest of the application
COPY . .

# 6. Pre-download Kokoro voice model
RUN if [ -f ".agents/skills/faceless-shorts/scripts/voice.py" ]; then \
      python3 .agents/skills/faceless-shorts/scripts/voice.py --download; \
    fi

EXPOSE 3000 5000 5050 5173

CMD ["npm", "run", "dev"]
