# MLB Fan Feed

A personalized MLB news feed that delivers AI-powered updates about your favorite team and player.

## Features

- 🏃‍♂️ Real-time MLB updates
- 🤖 AI-powered news digests using Gemini
- 📊 Team and player statistics
- 🎥 MLB video highlights
- 📱 Mobile-friendly design

## Quick Start

### Prerequisites

- Node.js 16+
- Python 3.9+
- Docker

### Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/GentleOtaku/GoatSquad
cd GoatSquad
```

#### 2. Edit Environment Files
- There are **2 `.env` files** in the project directory.
- Open and configure the environment variables according to your development environment.

#### 3. Install Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### 4. Install Frontend Dependencies
```bash
cd frontend
npm install
```

#### 5. Install `ffmpeg`
`ffmpeg` is required for audio and video processing. Follow the instructions based on your operating system:

#### For macOS (using Homebrew)
```bash
brew install ffmpeg
```

#### For Ubuntu/Debian (using APT)
```bash
sudo apt update
sudo apt install ffmpeg
```

#### For Fedora (using DNF)
```bash
sudo dnf install ffmpeg ffmpeg-devel
```

#### For Windows
1. Download the latest version from [ffmpeg.org/download](https://ffmpeg.org/download.html).
2. Extract the downloaded ZIP file to a folder, e.g., `C:\ffmpeg`.
3. Add `C:\ffmpeg\bin` to your system’s environment variables:
   - Right-click **This PC** → **Properties** → **Advanced system settings** → **Environment Variables**.
   - Under **System Variables**, select `Path`, click **Edit**, then **New**, and add `C:\ffmpeg\bin`.
   - Click **OK** to apply changes.

#### Verify Installation
After installation, verify `ffmpeg` is correctly installed by running:
```bash
ffmpeg -version
```
---

For any issues, please open an issue in the repository.

### Running the Application

1. Start the backend:
   ```bash
   cd backend
   python app.py
   ```

2. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```


### Docker Setup

1. Build the Docker image:
   ```bash
   docker-compose build
   ```

2. Run the Docker containers:
   ```bash
   docker-compose up
   ```
