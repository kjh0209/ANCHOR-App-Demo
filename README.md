# 🛬 Airport Pickup Guidance System - Mobile App

CV 기반 공항 택시 픽업 안내 시스템 - **Android 앱 지원**

## 📱 프로젝트 구조

```
airport-pickup-guidance/
├── apps/
│   ├── mobile/              # 🎯 React Native (Expo) 안드로이드 앱
│   ├── backend/             # NestJS API 서버 (MySQL)
│   ├── frontend/            # Next.js 웹 (관리자/데모용)
│   └── ml-service/          # Python FastAPI (YOLO + OCR)
├── models/                  # YOLO 모델 저장
├── docker-compose.yml       # 백엔드 서비스 (MySQL + API + ML)
└── README.md
```

## 🎯 아키텍처

### 모바일 앱 (사용자용)
- **기술**: React Native + Expo
- **기능**: 카메라 촬영, 이미지 업로드, 감지 결과 표시
- **플랫폼**: Android (iOS도 가능)

### 백엔드 서비스 (클라우드/서버)
- **Backend API**: NestJS + MySQL
- **ML Service**: Python FastAPI + YOLOv8 + Tesseract OCR
- **Database**: MySQL 8.0

---

## 🚀 시작하기

### 1️⃣ 백엔드 서비스 실행 (서버/로컬)

```bash
# 모델 파일 배치 (필수!)
cp /path/to/best.pt ./models/best.pt

# Docker Compose로 백엔드 실행
docker-compose up --build
```

서비스가 시작되면:
- Backend API: http://localhost:3001
- ML Service: http://localhost:8000
- MySQL: localhost:3306

### 2️⃣ 모바일 앱 실행

```bash
cd apps/mobile

# 의존성 설치
npm install

# 개발 서버 시작
npm start

# 또는 Android에서 직접 실행
npm run android
```

---

## 📱 모바일 앱 기능

### 메인 화면
- 📸 **주행 화면 촬영**: 실시간 카메라로 택시 대시보드 화면 촬영
- 🖼️ **갤러리 선택**: 저장된 이미지에서 선택
- ℹ️ **시스템 기능 안내**: YOLO, OCR, 스마트 안내 설명

### 카메라 화면
- 🎥 **실시간 카메라 뷰**: 주행 화면을 촬영
- 🔄 **카메라 전환**: 전면/후면 카메라 변경
- 📍 **촬영 가이드**: 화면 상단에 안내 텍스트

### 결과 화면
- ✅ **감지 결과**: 플랫폼 표지판, 신호등, 횡단보도 등
- 🎯 **픽업 안내**: AI 생성 자연어 안내 문구
- 🔢 **OCR 숫자**: 인식된 플랫폼 번호와 표지판 숫자
- 📊 **통계**: 클래스별 감지 개수

---

## 🔧 모바일 앱 설정

### API URL 설정

`apps/mobile/app.json`에서 API URL 설정:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://YOUR_SERVER_IP:3001"
    }
  }
}
```

**중요**: 
- Android 에뮬레이터: `http://10.0.2.2:3001`
- 실제 기기: `http://YOUR_LOCAL_IP:3001` (예: `http://192.168.0.100:3001`)

### 권한 설정

앱에서 필요한 권한:
- ✅ 카메라 (CAMERA)
- ✅ 외부 저장소 읽기 (READ_EXTERNAL_STORAGE)

`app.json`에 이미 설정되어 있습니다.

---

## 📦 APK 빌드 (안드로이드 배포)

### EAS Build 사용 (권장)

```bash
cd apps/mobile

# EAS CLI 설치
npm install -g eas-cli

# EAS 로그인
eas login

# EAS 프로젝트 설정
eas build:configure

# Android APK 빌드
eas build --platform android --profile preview

# 또는 로컬 빌드
eas build --platform android --profile preview --local
```

### APK 다운로드 및 설치

1. EAS 빌드 완료 후 콘솔에서 APK 다운로드 링크 확인
2. APK 파일을 Android 기기로 전송
3. 기기에서 "알 수 없는 출처" 허용
4. APK 설치

---

## 🗄️ MySQL 데이터베이스

### 설정

Docker Compose에 이미 MySQL이 포함되어 있습니다:

```yaml
mysql:
  image: mysql:8.0
  environment:
    MYSQL_ROOT_PASSWORD: root
    MYSQL_DATABASE: airport_guidance
    MYSQL_USER: airport
    MYSQL_PASSWORD: airport123
  ports:
    - "3306:3306"
```

### 연결

```bash
# MySQL 접속
mysql -h localhost -u airport -p
# Password: airport123

# 데이터베이스 확인
USE airport_guidance;
SHOW TABLES;

# 감지 이력 조회
SELECT * FROM detections ORDER BY createdAt DESC LIMIT 10;
```

---

## 🎨 UI/UX

### 디자인 시스템

- **Primary Color**: Blue (#2563eb)
- **컴포넌트**: React Native Paper
- **네비게이션**: React Navigation
- **아이콘**: Material Community Icons

### 화면 플로우

```
홈 화면
  ├─→ 촬영 → 카메라 화면 → 결과 화면
  └─→ 갤러리 선택 → 결과 화면
```

---

## 🔐 보안

### API 통신

- CORS 활성화 (모든 origin 허용, 개발용)
- 프로덕션: origin 제한 필요

### 권한 관리

- 카메라 권한 런타임 요청
- 거부 시 대체 UI 제공 (갤러리 선택)

---

## 📊 성능

### 최적화

- **이미지 압축**: 0.8 quality로 전송
- **타임아웃**: 30초 설정
- **캐싱**: (향후 구현)

### 예상 성능

- **촬영 → 결과**: ~3-5초
- **네트워크 속도**: Wi-Fi 권장
- **ML 처리**: ~2-3초

---

## 🐛 문제 해결

### 1. 앱이 백엔드에 연결되지 않음

**문제**: `Network Error` 또는 `ECONNREFUSED`

**해결**:
```bash
# 1. 백엔드 서비스 확인
docker-compose ps

# 2. API URL 확인 (app.json)
# Android 에뮬레이터: http://10.0.2.2:3001
# 실제 기기: http://YOUR_IP:3001

# 3. 방화벽 확인
# Windows: 포트 3001 허용
# Mac/Linux: iptables 확인
```

### 2. 카메라가 작동하지 않음

**문제**: 카메라 화면이 검은색

**해결**:
```bash
# 권한 확인
# Android 설정 → 앱 → 공항 픽업 안내 → 권한 → 카메라 허용

# 앱 재시작
```

### 3. ML Service 오류

**문제**: `Model not loaded`

**해결**:
```bash
# models/best.pt 파일 확인
ls -lh models/best.pt

# ML 서비스 로그 확인
docker-compose logs ml-service

# 모델 파일 배치 후 재시작
docker-compose restart ml-service
```

### 4. MySQL 연결 오류

**문제**: `ECONNREFUSED 3306`

**해결**:
```bash
# MySQL 컨테이너 상태 확인
docker-compose logs mysql

# MySQL 헬스 체크
docker exec airport-mysql mysqladmin ping -h localhost -u root -proot

# 재시작
docker-compose restart mysql
```

---

## 🔄 개발 워크플로우

### 1. 로컬 개발

```bash
# Terminal 1: 백엔드 서비스
docker-compose up

# Terminal 2: 모바일 앱
cd apps/mobile
npm start
```

### 2. 코드 수정

- **모바일 앱**: `apps/mobile/src/` 수정 → 핫 리로드
- **백엔드**: `apps/backend/src/` 수정 → 자동 재시작
- **ML Service**: `apps/ml-service/main.py` 수정 → 컨테이너 재시작

### 3. 테스트

```bash
# API 테스트
curl -X POST http://localhost:3001/api/detection/detect \
  -F "image=@test.jpg"

# 앱 테스트
# 에뮬레이터/실제 기기에서 직접 테스트
```

---

## 📦 배포

### 백엔드

```bash
# Docker Compose 프로덕션 모드
docker-compose -f docker-compose.prod.yml up -d

# 또는 클라우드 (AWS, GCP, Azure)
# - ECS/EKS (AWS)
# - Cloud Run (GCP)
# - App Service (Azure)
```

### 모바일 앱

```bash
# Google Play Store 배포
# 1. EAS Build로 AAB 생성
eas build --platform android --profile production

# 2. Google Play Console에 업로드
# 3. 내부 테스트 → 공개 출시
```

---

## 🎯 다음 단계

### 단기 (1-2주)
- [ ] GPS 연동 (실제 거리 계산)
- [ ] 오프라인 모드 (로컬 모델 실행)
- [ ] 푸시 알림 (픽업 완료 알림)

### 중기 (1-2개월)
- [ ] 다국어 지원 (영어, 중국어, 일본어)
- [ ] 히스토리 기능 (과거 감지 결과)
- [ ] AR 오버레이 (실시간 안내)

### 장기 (3-6개월)
- [ ] iOS 앱 출시
- [ ] 자율주행 택시 연동
- [ ] Active Learning (실패 케이스 자동 수집)

---

## 📚 기술 스택

### Mobile
- **Framework**: React Native 0.73
- **Build Tool**: Expo 50
- **Navigation**: React Navigation 6
- **UI**: React Native Paper
- **Language**: TypeScript

### Backend
- **Framework**: NestJS 10
- **Database**: MySQL 8.0
- **ORM**: TypeORM
- **Language**: TypeScript

### ML Service
- **Framework**: FastAPI
- **Model**: YOLOv8 (Ultralytics)
- **OCR**: Tesseract
- **Language**: Python 3.10

---

## 👥 팀

- **김지혁** - KAIST 기술경영학부
- **임시현** - KAIST 전기및전자공학부

---

## 📄 라이선스

MIT License

---

## 📧 문의

- limsihyun@kaist.ac.kr
- kjh0209@kaist.ac.kr

---

## 🎉 완료!

이제 다음을 실행하세요:

1. ✅ `models/best.pt` 파일 배치
2. ✅ `docker-compose up` 실행 (백엔드)
3. ✅ `cd apps/mobile && npm install && npm start` 실행
4. ✅ Android 에뮬레이터/실제 기기에서 테스트
5. ✅ `eas build` 로 APK 빌드 (배포 시)

Happy Coding! 🚀📱
