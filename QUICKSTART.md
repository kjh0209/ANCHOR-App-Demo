# 🚀 빠른 시작 가이드

## 1️⃣ 사전 준비

### 필수 설치 프로그램

```bash
# Node.js (v18 이상)
node --version

# Docker & Docker Compose
docker --version
docker-compose --version

# Android Studio (선택사항, 에뮬레이터용)
```

### YOLO 모델 파일

```bash
# 학습된 YOLO 모델을 models/ 디렉토리에 배치
cp /path/to/your/best.pt ./models/best.pt
```

---

## 2️⃣ 백엔드 실행 (5분)

```bash
# 자동 설정 스크립트 실행
./setup.sh

# 또는 수동으로
docker-compose up --build
```

**확인**:
- http://localhost:3001/api/detection/history - 백엔드 API
- http://localhost:8000/health - ML 서비스

---

## 3️⃣ 모바일 앱 실행 (3분)

```bash
# 모바일 앱 디렉토리로 이동
cd apps/mobile

# 의존성 설치
npm install

# 개발 서버 시작
npm start
```

**Expo 개발 도구가 실행되면**:

### Android 에뮬레이터
```
터미널에서 'a' 키 입력
```

### 실제 Android 기기
```
1. Expo Go 앱 설치 (Play Store)
2. QR 코드 스캔
3. 앱 실행
```

---

## 4️⃣ APK 빌드 (배포용)

```bash
cd apps/mobile

# EAS CLI 설치 (1회만)
npm install -g eas-cli

# Expo 계정 로그인
eas login

# Android APK 빌드
eas build --platform android --profile preview

# 빌드 완료 후 APK 다운로드
# 콘솔에 표시된 URL에서 다운로드
```

---

## 🎯 API URL 설정

### Android 에뮬레이터
```json
// apps/mobile/app.json
{
  "expo": {
    "extra": {
      "apiUrl": "http://10.0.2.2:3001"
    }
  }
}
```

### 실제 기기 (로컬 네트워크)
```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://192.168.0.100:3001"  // 본인의 IP
    }
  }
}
```

### 프로덕션 (클라우드 서버)
```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://your-api.com"
    }
  }
}
```

---

## 🔥 문제 해결

### 백엔드가 실행되지 않음
```bash
# 포트 확인
lsof -i :3001
lsof -i :3306
lsof -i :8000

# Docker 로그 확인
docker-compose logs backend
docker-compose logs ml-service
docker-compose logs mysql
```

### 모바일 앱이 백엔드에 연결되지 않음
```bash
# 1. 백엔드 서비스 상태 확인
docker-compose ps

# 2. 네트워크 테스트
curl http://localhost:3001/api/detection/history

# 3. app.json에서 API URL 확인
# Android 에뮬레이터: 10.0.2.2
# 실제 기기: 본인의 로컬 IP
```

### 모델이 로드되지 않음
```bash
# 모델 파일 확인
ls -lh models/best.pt

# ML 서비스 재시작
docker-compose restart ml-service
docker-compose logs ml-service
```

---

## ✅ 완료!

이제 다음을 할 수 있습니다:
- ✅ 앱에서 주행 화면 촬영
- ✅ AI가 플랫폼 표지판 감지
- ✅ 자동 픽업 위치 안내 생성
- ✅ APK 빌드 및 배포

더 자세한 정보는 `README.md` 참고!
