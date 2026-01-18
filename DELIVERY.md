# ✅ 프로젝트 완료 - 안드로이드 앱 지원

## 🎯 요청사항
1. ✅ 웹사이트 → 안드로이드 앱으로 전환
2. ✅ PostgreSQL → MySQL로 변경
3. ✅ APK 빌드 및 배포 가능하도록 설정

---

## 📱 최종 프로젝트 구조

```
airport-pickup-guidance/
├── apps/
│   ├── mobile/          ⭐ React Native 안드로이드 앱 (메인)
│   ├── backend/         ⭐ NestJS + MySQL
│   ├── ml-service/      ⭐ Python + YOLO + OCR
│   └── frontend/        🌐 Next.js 웹 (관리자용, 선택사항)
│
├── models/
│   └── best.pt          ❗ 직접 배치 필요
│
├── docker-compose.yml   (MySQL 포함)
├── setup.sh             (자동 설정 스크립트)
├── README.md            (전체 문서)
├── QUICKSTART.md        (빠른 시작)
└── PROJECT_SUMMARY.md   (프로젝트 요약)
```

---

## 🚀 시작하는 법

### 1단계: 백엔드 실행 (5분)
```bash
# 모델 파일 배치
cp /path/to/best.pt ./models/best.pt

# 백엔드 서비스 실행 (MySQL + API + ML)
./setup.sh
```

### 2단계: 모바일 앱 실행 (3분)
```bash
cd apps/mobile
npm install
npm start
```

### 3단계: 안드로이드에서 테스트
- 에뮬레이터: 터미널에서 `a` 키 입력
- 실제 기기: Expo Go 앱으로 QR 스캔

---

## 📦 APK 빌드 (배포용)

```bash
cd apps/mobile

# EAS CLI 설치 (1회만)
npm install -g eas-cli

# Expo 로그인
eas login

# APK 빌드
eas build --platform android --profile preview

# 빌드 완료 후 APK 다운로드 → 설치
```

---

## 🗄️ MySQL 설정

Docker Compose에 이미 포함되어 있습니다:

```yaml
mysql:
  image: mysql:8.0
  environment:
    MYSQL_DATABASE: airport_guidance
    MYSQL_USER: airport
    MYSQL_PASSWORD: airport123
  ports:
    - "3306:3306"
```

### 접속
```bash
mysql -h localhost -u airport -p
# Password: airport123
```

---

## 📱 모바일 앱 화면

### 1. 홈 화면
- 📸 주행 화면 촬영
- 🖼️ 갤러리에서 선택
- ℹ️ 시스템 기능 안내

### 2. 카메라 화면
- 🎥 실시간 카메라 뷰
- 🔄 카메라 전환 (전면/후면)
- 📍 촬영 가이드

### 3. 결과 화면
- ✅ 감지된 객체 (플랫폼 표지판, 신호등 등)
- 🎯 픽업 안내 문구
- 🔢 OCR 인식된 숫자
- 📊 클래스별 통계

---

## 🔧 API URL 설정

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

### 실제 기기
```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://192.168.0.100:3001"  // 본인의 IP
    }
  }
}
```

### IP 확인 방법
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
# 또는
ip addr show
```

---

## 🎨 주요 기능

### YOLO 객체 감지
- 플랫폼 표지판 (platform_sign)
- 교통 표지판 (traffic_sign)
- 신호등 (traffic_light)
- 횡단보도 (crosswalk)
- 차량 (vehicle)
- 보행자 (pedestrian)

### OCR 숫자 인식
- 표지판에서 플랫폼 번호 추출
- 다중 전처리 (CLAHE, Adaptive Threshold)
- 2.6배 확장 + Tesseract PSM 7
- 1-3자리 숫자 검증

### 스마트 안내 생성
- 우선순위: platform_sign > traffic_sign > generic
- 안전 경고: crosswalk, traffic_light, pedestrian
- 자연어 한국어 안내

---

## 📊 기술 스택

| 구분 | 기술 |
|------|------|
| **Mobile** | React Native 0.73 + Expo 50 |
| **Backend** | NestJS 10 + TypeORM |
| **Database** | MySQL 8.0 |
| **ML** | Python 3.10 + FastAPI |
| **Detection** | YOLOv8 (Ultralytics) |
| **OCR** | Tesseract 4.1 |
| **DevOps** | Docker Compose |

---

## 🐛 문제 해결

### 앱이 백엔드에 연결 안 됨
```bash
# 1. 백엔드 상태 확인
docker-compose ps

# 2. app.json에서 API URL 확인
# Android 에뮬레이터: 10.0.2.2:3001
# 실제 기기: 본인의 로컬 IP:3001

# 3. 방화벽 확인 (포트 3001 허용)
```

### 모델 로드 실패
```bash
# 모델 파일 확인
ls -lh models/best.pt

# ML 서비스 재시작
docker-compose restart ml-service
docker-compose logs ml-service
```

### MySQL 연결 오류
```bash
# MySQL 상태 확인
docker-compose logs mysql

# 재시작
docker-compose restart mysql
```

---

## 📁 중요 파일

### 문서
- `README.md` - 전체 프로젝트 문서
- `QUICKSTART.md` - 빠른 시작 가이드
- `PROJECT_SUMMARY.md` - 프로젝트 요약

### 모바일 앱
- `apps/mobile/App.tsx` - 앱 엔트리 포인트
- `apps/mobile/app.json` - Expo 설정 (API URL 여기서 변경)
- `apps/mobile/eas.json` - Android 빌드 설정
- `apps/mobile/src/screens/` - 화면 컴포넌트들

### 백엔드
- `apps/backend/src/app.module.ts` - MySQL 연결 설정
- `apps/backend/src/detection/` - Detection API

### 설정
- `docker-compose.yml` - MySQL + Backend + ML 설정
- `setup.sh` - 자동 설치 스크립트

---

## ✅ 완료 체크리스트

배포 전 확인:

- [ ] `models/best.pt` 파일 배치
- [ ] `docker-compose up` 정상 실행
- [ ] `apps/mobile/app.json`에서 API URL 확인
- [ ] Android 에뮬레이터에서 앱 테스트
- [ ] 실제 기기에서 앱 테스트
- [ ] APK 빌드 성공
- [ ] 감지 정확도 검증

---

## 🎉 다음 단계

### 개발
```bash
# 백엔드 개발
docker-compose up

# 모바일 앱 개발
cd apps/mobile && npm start
```

### 배포
```bash
# APK 빌드
cd apps/mobile
eas build --platform android --profile preview

# Play Store 배포
eas build --platform android --profile production
```

---

## 📞 지원

- Email: kjh0209@kaist.ac.kr
- Email: limsihyun@kaist.ac.kr

---

**모든 파일이 준비되었습니다! 바로 시작하세요 🚀📱**

```bash
./setup.sh                  # 백엔드 실행
cd apps/mobile && npm start # 앱 실행
```
