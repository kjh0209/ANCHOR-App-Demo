# 📱 Airport Pickup Guidance - 프로젝트 요약

## 🎯 핵심 변경 사항

### 이전 버전 (웹)
- ❌ Next.js 웹 애플리케이션
- ❌ PostgreSQL 데이터베이스
- ❌ 브라우저에서만 접근 가능

### 현재 버전 (모바일)
- ✅ React Native 안드로이드 앱
- ✅ MySQL 데이터베이스
- ✅ APK 빌드 및 배포 가능
- ✅ 실제 택시 기사용 앱

---

## 📦 프로젝트 구조

```
airport-pickup-guidance/
│
├── 📱 apps/mobile/              # React Native 앱 (주요 사용자 인터페이스)
│   ├── App.tsx                  # 앱 엔트리 포인트
│   ├── app.json                 # Expo 설정
│   ├── eas.json                 # Android 빌드 설정
│   └── src/
│       ├── screens/             # 화면 컴포넌트
│       │   ├── HomeScreen.tsx   # 메인 화면
│       │   ├── CameraScreen.tsx # 카메라 촬영
│       │   └── ResultScreen.tsx # 감지 결과
│       └── services/
│           └── api.ts           # 백엔드 API 통신
│
├── 🔧 apps/backend/             # NestJS API 서버
│   └── src/
│       ├── main.ts              # 서버 엔트리
│       ├── app.module.ts        # MySQL 설정
│       └── detection/           # 감지 API
│
├── 🤖 apps/ml-service/          # Python ML 서비스
│   └── main.py                  # YOLO + OCR
│
├── 🌐 apps/frontend/            # Next.js 웹 (관리자용)
│   └── (웹 대시보드, 선택사항)
│
├── 📊 models/
│   └── best.pt                  # YOLO 모델 (직접 배치 필요)
│
├── docker-compose.yml           # MySQL + Backend + ML
├── setup.sh                     # 자동 설치 스크립트
├── README.md                    # 전체 문서
└── QUICKSTART.md                # 빠른 시작 가이드
```

---

## 🚀 핵심 기능

### 모바일 앱
1. **카메라 촬영**: 택시 대시보드에서 실시간 주행 화면 촬영
2. **이미지 업로드**: 갤러리에서 이미지 선택
3. **AI 감지**: YOLO로 표지판, 신호등, 차량 등 감지
4. **OCR 인식**: 플랫폼 번호 자동 추출
5. **안내 생성**: 자연어 픽업 위치 안내

### 백엔드 서비스
1. **Detection API**: 이미지 업로드 및 감지 결과 반환
2. **MySQL 저장**: 감지 이력 데이터베이스 저장
3. **ML Integration**: Python ML 서비스 연동

### ML 서비스
1. **YOLOv8**: 6개 클래스 객체 감지
2. **Tesseract OCR**: 표지판 숫자 인식
3. **Instruction Generation**: 우선순위 기반 안내 문구 생성

---

## 🛠️ 기술 스택

### Mobile App
| 항목 | 기술 |
|------|------|
| Framework | React Native 0.73 |
| Build | Expo 50 |
| Navigation | React Navigation 6 |
| UI Library | React Native Paper |
| Language | TypeScript |

### Backend
| 항목 | 기술 |
|------|------|
| Framework | NestJS 10 |
| Database | MySQL 8.0 |
| ORM | TypeORM |
| Language | TypeScript |

### ML Service
| 항목 | 기술 |
|------|------|
| Framework | FastAPI |
| Model | YOLOv8 |
| OCR | Tesseract |
| Language | Python 3.10 |

---

## 📱 Android 배포 프로세스

### 개발 빌드
```bash
cd apps/mobile
npm start
# 'a' 키로 Android 에뮬레이터 실행
```

### APK 빌드 (배포용)
```bash
eas build --platform android --profile preview
# APK 다운로드 후 기기에 설치
```

### Google Play Store 배포
```bash
eas build --platform android --profile production
# AAB 파일 생성 → Play Console 업로드
```

---

## 🗄️ MySQL vs PostgreSQL

### 변경 이유
- ✅ 더 넓은 호스팅 지원 (AWS RDS, GCP Cloud SQL)
- ✅ 더 간단한 설정 (개발자 친화적)
- ✅ 더 빠른 읽기 성능 (감지 이력 조회)

### 주요 차이점
```typescript
// Before (PostgreSQL)
@Column('jsonb')
detections: BoundingBox[];

// After (MySQL)
@Column('json')
detections: BoundingBox[];
```

---

## 🎨 UI/UX 설계

### 컬러 팔레트
- Primary: `#2563eb` (Blue)
- Success: `#22c55e` (Green)
- Warning: `#eab308` (Yellow)
- Error: `#ef4444` (Red)

### 화면 플로우
```
홈 화면
  ├─→ [주행 화면 촬영] → 카메라 화면 → 촬영 → 결과 화면
  └─→ [갤러리 선택] → 이미지 선택 → 결과 화면

결과 화면
  ├─→ [다시 촬영] → 카메라 화면
  └─→ [홈으로] → 홈 화면
```

---

## 🔐 API 엔드포인트

### Detection API
```
POST /api/detection/detect
- multipart/form-data: image file
- Response: { id, detections[], instruction, ... }

GET /api/detection/history?limit=10
- Response: [{ id, detections, createdAt, ... }]

GET /api/detection/:id
- Response: { id, detections, instruction, ... }
```

---

## 📊 데이터베이스 스키마

### detections 테이블
```sql
CREATE TABLE detections (
  id VARCHAR(36) PRIMARY KEY,
  detections JSON NOT NULL,
  instruction TEXT NOT NULL,
  imageWidth INT,
  imageHeight INT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 🔄 개발 워크플로우

### 1. 로컬 개발
```bash
# Terminal 1: 백엔드 서비스
docker-compose up

# Terminal 2: 모바일 앱
cd apps/mobile && npm start
```

### 2. 코드 수정
- Mobile: `src/screens/` 수정 → 핫 리로드
- Backend: `src/detection/` 수정 → 자동 재시작
- ML: `main.py` 수정 → 컨테이너 재시작

### 3. 테스트
```bash
# API 테스트
curl -X POST http://localhost:3001/api/detection/detect \
  -F "image=@test.jpg"

# 앱 테스트: 에뮬레이터/실제 기기
```

---

## 🐛 트러블슈팅

### 문제: 앱이 백엔드에 연결 안 됨
**원인**: 잘못된 API URL
**해결**:
```json
// app.json에서 확인
"apiUrl": "http://10.0.2.2:3001"  // 에뮬레이터
"apiUrl": "http://192.168.x.x:3001"  // 실제 기기
```

### 문제: 모델 로드 실패
**원인**: `models/best.pt` 파일 없음
**해결**:
```bash
cp /path/to/best.pt ./models/best.pt
docker-compose restart ml-service
```

### 문제: MySQL 연결 오류
**원인**: MySQL 컨테이너 미실행
**해결**:
```bash
docker-compose ps
docker-compose logs mysql
docker-compose restart mysql
```

---

## 📈 성능 최적화

### 이미지 압축
```typescript
// CameraScreen.tsx
const photo = await cameraRef.current.takePictureAsync({
  quality: 0.8,  // 80% 품질 (파일 크기 감소)
});
```

### API 타임아웃
```typescript
// api.ts
axios.post(url, formData, {
  timeout: 30000,  // 30초
});
```

---

## 🎯 다음 단계

### Phase 1: MVP (완료)
- ✅ 안드로이드 앱 개발
- ✅ YOLO 객체 감지
- ✅ OCR 숫자 인식
- ✅ MySQL 데이터베이스

### Phase 2: 개선 (1-2주)
- [ ] GPS 연동 (실제 거리 계산)
- [ ] 오프라인 모드 (로컬 ML)
- [ ] 푸시 알림

### Phase 3: 확장 (1-2개월)
- [ ] iOS 앱
- [ ] 다국어 지원
- [ ] AR 오버레이

---

## 📞 지원

### 문의
- Email: kjh0209@kaist.ac.kr
- Email: limsihyun@kaist.ac.kr

### 문서
- README.md - 전체 문서
- QUICKSTART.md - 빠른 시작
- apps/mobile/README.md - 모바일 앱 개발 가이드

---

## ✅ 체크리스트

배포 전 확인 사항:

- [ ] `models/best.pt` 파일 배치
- [ ] `docker-compose up` 정상 실행
- [ ] `apps/mobile/app.json` API URL 확인
- [ ] Android 에뮬레이터에서 테스트
- [ ] 실제 기기에서 테스트
- [ ] APK 빌드 성공
- [ ] 감지 정확도 검증

---

## 🎉 완성!

이제 택시 기사들이 사용할 수 있는 **안드로이드 앱**이 준비되었습니다!

**다음 명령어로 시작**:
```bash
./setup.sh                    # 백엔드 실행
cd apps/mobile && npm start   # 앱 실행
```

Happy Coding! 🚀📱
