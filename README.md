# MLB Fan Feed 

**Your Personalized MLB News Feed Powered by AI**

Stay ahead of the game with real-time updates, AI-driven news digests, and immersive MLB content tailored to your favorite teams and players.

---

## 🚀 **Features**

- 🏃‍♂️ **Real-Time MLB Updates:** Get the latest scores, game stats, and breaking news as it happens.
- 🤖 **AI-Powered News Digests:** Leveraging the **Gemini API** for smart, personalized news summaries.
- 📊 **Advanced Team & Player Statistics:** Dive deep into analytics powered by **PostgreSQL**.
- 🎥 **MLB Video Highlights:** Relive key moments with dynamic video content, processed via **ffmpeg**.
- 📱 **Mobile-Friendly Design:** Built with **React** for seamless experiences across all devices.

---

## 🛠️ **Tech Stack**

![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![Gemini API](https://img.shields.io/badge/Gemini_API-FF6F00?style=for-the-badge&logo=google&logoColor=white)
![Vertex AI](https://img.shields.io/badge/Vertex_AI-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white)
![Google Cloud](https://img.shields.io/badge/Google_Cloud-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Cloud Run](https://img.shields.io/badge/Cloud_Run-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![MLB API](https://img.shields.io/badge/MLB_API-FF0000?style=for-the-badge&logo=mlb&logoColor=white)

---

## ⚡ **Quick Start**

### **Prerequisites**

- Node.js 16+
- Python 3.9+
- Docker

### **Setup Instructions**

#### 1️⃣ Clone the Repository

```bash
git clone https://github.com/GentleOtaku/GoatSquad
cd GoatSquad
```

#### 2️⃣ Configure Environment Variables

- Locate **2 `.env` files** in the project directory.
- Customize the environment variables to suit your development setup.

#### 3️⃣ Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

#### 4️⃣ Install Frontend Dependencies

```bash
cd frontend
npm install
```

#### 5️⃣ Install `ffmpeg`

`ffmpeg` is essential for processing audio and video content.

##### **For macOS (using Homebrew):**
```bash
brew install ffmpeg
```

##### **For Ubuntu/Debian (using APT):**
```bash
sudo apt update
sudo apt install ffmpeg
```

##### **For Fedora (using DNF):**
```bash
sudo dnf install ffmpeg ffmpeg-devel
```

##### **For Windows:**
1. Download from [ffmpeg.org/download](https://ffmpeg.org/download.html).
2. Extract the ZIP file to `C:\ffmpeg`.
3. Add `C:\ffmpeg\bin` to the system's environment variables:
   - Right-click **This PC** → **Properties** → **Advanced system settings** → **Environment Variables**.
   - Under **System Variables**, select `Path` → **Edit** → **New** → Add `C:\ffmpeg\bin`.
   - Click **OK** to apply changes.

#### ✅ Verify `ffmpeg` Installation

```bash
ffmpeg -version
```

---

## 🚀 **Running the Application**

### 1️⃣ Start the Backend
```bash
cd backend
python app.py
```

### 2️⃣ Start the Frontend
```bash
cd frontend
npm run dev
```

---

## 🐳 **Docker Setup**

### 1️⃣ Build the Docker Image
```bash
docker-compose build
```

### 2️⃣ Run Docker Containers
```bash
docker-compose up
```

---

## 📬 **Need Help?**

For any issues, please open an [issue](https://github.com/GentleOtaku/GoatSquad/issues) in the repository.

---

### ⚾ **MLB Fan Feed — Where Baseball Meets AI!**

