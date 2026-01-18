# 📍 GPS 기능 통합 완료 - 업데이트 가이드

## 🎯 추가된 기능

### 1. 기사/승객 모드 분리
- **기사 모드**: 현재 위치 자동 감지 + 카메라 촬영 → 승객용 안내 생성
- **승객 모드**: 목적지 입력 + 주변 환경 분석 → 기사 찾기 안내

### 2. GPS 위치 입력 방법
- ✅ 자동 감지 (expo-location으로 현재 위치)
- ✅ 텍스트 입력 (주소 또는 "위도, 경도")
- ✅ 지도 선택 (react-native-maps로 지도에서 탭)

### 3. GPS 기반 안내
- ✅ 거리 계산 (Haversine 공식)
- ✅ 방향 계산 (방위각 → 한국어 방향)
- ✅ 자연어 안내 생성

---

## 📥 업데이트된 파일 목록

### 새로 추가된 파일 (3개)
| 파일명 | 저장 위치 | 설명 |
|--------|----------|------|
| `mobile-ModeSelectionScreen.tsx` | `apps/mobile/src/screens/ModeSelectionScreen.tsx` | 기사/승객 모드 선택 |
| `mobile-ManualLocationScreen.tsx` | `apps/mobile/src/screens/ManualLocationScreen.tsx` | GPS 수동 입력/지도 선택 |
| `mobile-App-v2.tsx` | `apps/mobile/App.tsx` | 새 화면 추가된 네비게이션 |

### 업데이트된 파일 (v2 버전, 10개)
| 파일명 | 저장 위치 | 변경 내용 |
|--------|----------|----------|
| `mobile-package.json` | `apps/mobile/package.json` | expo-location, react-native-maps 추가 |
| `mobile-app.json` | `apps/mobile/app.json` | 위치 권한 및 Google Maps API 키 추가 |
| `mobile-HomeScreen-v2.tsx` | `apps/mobile/src/screens/HomeScreen.tsx` | GPS 상태, 모드 변경 기능 |
| `mobile-api-v2.ts` | `apps/mobile/src/services/api.ts` | GPS 파라미터, 거리/방향 계산 |
| `mobile-ResultScreen-v2.tsx` | `apps/mobile/src/screens/ResultScreen.tsx` | GPS 정보 표시 |
| `backend-detection.dto.ts` | `apps/backend/src/detection/detection.dto.ts` | GPS 필드 추가 |
| `backend-detection.entity.ts` | `apps/backend/src/detection/detection.entity.ts` | GPS 컬럼 추가 |
| `backend-detection.controller.ts` | `apps/backend/src/detection/detection.controller.ts` | GPS 파라미터 수신 |
| `backend-detection.service.ts` | `apps/backend/src/detection/detection.service.ts` | GPS 데이터 ML 전달 및 저장 |
| `ml-service-main-v2.py` | `apps/ml-service/main.py` | GPS 계산 및 instruction 개선 |

---

## 🚀 설치 방법

### STEP 1: 기존 파일 백업 (선택사항)

```bash
cd airport-pickup-guidance/apps/mobile
cp App.tsx App.tsx.backup
cp src/screens/HomeScreen.tsx src/screens/HomeScreen.tsx.backup
cp src/services/api.ts src/services/api.ts.backup
```

### STEP 2: 새 파일 배치

```bash
# 새로 추가된 화면
mv mobile-ModeSelectionScreen.tsx apps/mobile/src/screens/ModeSelectionScreen.tsx
mv mobile-ManualLocationScreen.tsx apps/mobile/src/screens/ManualLocationScreen.tsx

# 업데이트된 파일 (v2 → 원본으로)
mv mobile-App-v2.tsx apps/mobile/App.tsx
mv mobile-HomeScreen-v2.tsx apps/mobile/src/screens/HomeScreen.tsx
mv mobile-api-v2.ts apps/mobile/src/services/api.ts
mv mobile-ResultScreen-v2.tsx apps/mobile/src/screens/ResultScreen.tsx

# Backend 파일들은 이미 업데이트됨
# ML service도 v2로 교체
mv ml-service-main-v2.py apps/ml-service/main.py
```

### STEP 3: Google Maps API 키 설정

1. Google Cloud Console에서 API 키 발급
   - https://console.cloud.google.com
   - "Maps SDK for Android" 활성화
   - API 키 생성

2. `apps/mobile/app.json` 수정
```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_ACTUAL_API_KEY_HERE"
        }
      }
    }
  }
}
```

### STEP 4: 의존성 재설치

```bash
cd apps/mobile
rm -rf node_modules package-lock.json
npm install
```

### STEP 5: 백엔드 재시작

```bash
# 루트 디렉토리에서
docker-compose down
docker-compose up --build -d
```

---

## 🎮 사용 방법

### 시나리오 1: 택시 기사 (Driver Mode)

1. **앱 실행**
   ```
   npm start
   ```

2. **모드 선택**
   - "택시 기사로 시작" 선택

3. **GPS 활성화**
   - "현재 위치" 버튼 클릭
   - 위치 권한 허용
   - GPS 좌표 자동 설정

4. **주행 화면 촬영**
   - "주행 화면 촬영" 클릭
   - 카메라로 주변 촬영
   - GPS가 자동으로 함께 전송됨

5. **결과 확인**
   - 승객용 안내 문구 확인
   - "기사님이 현재 플랫폼 X 표지판 근처에 있습니다"
   - 승객 위치와의 거리/방향 표시

### 시나리오 2: 승객 (Passenger Mode)

1. **모드 선택**
   - "승객으로 시작" 선택

2. **목적지 설정**
   
   **방법 A: 현재 위치**
   - "현재 위치" 버튼 클릭

   **방법 B: 텍스트 입력**
   - "수동 입력" 클릭
   - "텍스트 입력" 선택
   - 주소 또는 좌표 입력
     - 예: "인천공항 제1여객터미널"
     - 예: "37.4563, 126.7052"

   **방법 C: 지도 선택**
   - "수동 입력" 클릭
   - "지도 선택" 탭
   - 지도에서 목적지 탭
   - "위치 확정"

3. **주변 환경 촬영**
   - "주행 화면 촬영" 또는 "갤러리 선택"

4. **결과 확인**
   - 기사 찾기 안내 확인
   - "플랫폼 X 방향으로 이동하세요"
   - 기사 위치와의 거리/방향 표시

---

## 📊 GPS 데이터 흐름

```
┌─────────────────┐
│  Mobile App     │
│  - 기사 GPS     │ ──┐
│  - 승객 GPS     │   │
│  - 이미지       │   │
└─────────────────┘   │
                      │ multipart/form-data
                      ▼
┌─────────────────────────────────┐
│  Backend API (NestJS)           │
│  POST /api/detection/detect     │
│  - 파일 수신                     │
│  - GPS 파라미터 추출             │
└─────────────────────────────────┘
                      │
                      │ FormData + GPS
                      ▼
┌─────────────────────────────────┐
│  ML Service (Python)            │
│  - YOLO 객체 감지               │
│  - OCR 숫자 인식                │
│  - GPS 거리/방향 계산 ────────┐ │
│  - Instruction 생성           │ │
└───────────────────────────────┘ │
                      │            │
                      │ Response   │
                      ▼            │
┌─────────────────────────────────┤
│  MySQL Database                 │
│  - detections 테이블           │
│  - driverLatitude              │
│  - driverLongitude             │
│  - passengerLatitude           │
│  - passengerLongitude          │
│  - distanceMeters              │
│  - direction                   │
└─────────────────────────────────┘
```

---

## 🧮 GPS 계산 로직

### 거리 계산 (Haversine Formula)

```python
def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371000  # Earth radius in meters
    φ1 = lat1 * π / 180
    φ2 = lat2 * π / 180
    Δφ = (lat2 - lat1) * π / 180
    Δλ = (lon2 - lon1) * π / 180
    
    a = sin²(Δφ/2) + cos(φ1) * cos(φ2) * sin²(Δλ/2)
    c = 2 * atan2(√a, √(1−a))
    
    distance = R * c
    return distance  # meters
```

### 방향 계산 (Bearing)

```python
def calculate_bearing(lat1, lon1, lat2, lon2):
    Δλ = (lon2 - lon1) * π / 180
    y = sin(Δλ) * cos(φ2)
    x = cos(φ1) * sin(φ2) - sin(φ1) * cos(φ2) * cos(Δλ)
    
    θ = atan2(y, x)
    bearing = (θ * 180 / π + 360) % 360
    
    # Convert to cardinal direction
    directions = ['북', '북동', '동', '남동', '남', '남서', '서', '북서']
    index = round(bearing / 45) % 8
    return directions[index]
```

---

## 📋 API 변경 사항

### 요청 (Request)

**이전:**
```bash
curl -X POST http://localhost:3001/api/detection/detect \
  -F "image=@photo.jpg"
```

**현재:**
```bash
curl -X POST http://localhost:3001/api/detection/detect \
  -F "image=@photo.jpg" \
  -F "user_mode=driver" \
  -F "driver_latitude=37.4563" \
  -F "driver_longitude=126.7052" \
  -F "passenger_latitude=37.4600" \
  -F "passenger_longitude=126.7100"
```

### 응답 (Response)

**추가된 필드:**
```json
{
  "id": "uuid",
  "detections": [...],
  "instruction": "기사님이 현재 플랫폼 12 표지판 근처에 있습니다. 승객님 위치에서 북동쪽으로 약 350m 떨어져 있습니다.",
  "image_width": 1920,
  "image_height": 1080,
  "driver_latitude": 37.4563,         // ← NEW
  "driver_longitude": 126.7052,       // ← NEW
  "passenger_latitude": 37.4600,      // ← NEW
  "passenger_longitude": 126.7100,    // ← NEW
  "distance_meters": 350.5,           // ← NEW
  "direction": "북동"                  // ← NEW
}
```

---

## 🗄️ 데이터베이스 스키마 변경

```sql
-- 추가된 컬럼
ALTER TABLE detections ADD COLUMN driverLatitude DECIMAL(10, 6);
ALTER TABLE detections ADD COLUMN driverLongitude DECIMAL(10, 6);
ALTER TABLE detections ADD COLUMN passengerLatitude DECIMAL(10, 6);
ALTER TABLE detections ADD COLUMN passengerLongitude DECIMAL(10, 6);
ALTER TABLE detections ADD COLUMN distanceMeters DECIMAL(10, 2);
ALTER TABLE detections ADD COLUMN direction VARCHAR(50);
```

**자동 마이그레이션:**
TypeORM의 `synchronize: true` 설정으로 자동 적용됨 (개발 환경)

---

## 🔥 문제 해결

### 문제 1: "위치 권한이 거부되었습니다"

**해결:**
```bash
# Android 설정에서
설정 → 앱 → 공항 픽업 안내 → 권한 → 위치
→ "앱 사용 중에만 허용" 또는 "항상 허용"
```

### 문제 2: Google Maps가 표시 안 됨

**해결:**
```bash
# 1. API 키 확인
cat apps/mobile/app.json | grep apiKey

# 2. Google Cloud Console에서
#    "Maps SDK for Android" 활성화 확인

# 3. 앱 재빌드
cd apps/mobile
npm start -- --clear
```

### 문제 3: GPS 좌표가 0, 0으로 표시됨

**원인:** Android 에뮬레이터는 기본 위치가 없음

**해결:**
```
Android Studio → Emulator → ... (More) → Location
→ 위도/경도 입력 또는 지도에서 선택
```

### 문제 4: 거리 계산이 이상함

**확인:**
```javascript
// Mobile에서 직접 테스트
import { calculateDistance } from './src/services/api';

const dist = calculateDistance(
  37.4563, 126.7052,  // 인천공항
  37.5665, 126.9780   // 서울시청
);
console.log(dist); // 약 52000m (52km)
```

---

## ✅ 테스트 체크리스트

### 기사 모드
- [ ] 모드 선택 화면에서 "택시 기사" 선택
- [ ] GPS "현재 위치" 버튼으로 자동 감지
- [ ] 카메라로 주변 촬영
- [ ] 결과 화면에 "승객용 안내" 표시
- [ ] GPS 거리/방향 표시 확인

### 승객 모드
- [ ] 모드 선택 화면에서 "승객" 선택
- [ ] GPS 3가지 방법 모두 테스트
  - [ ] 현재 위치 자동
  - [ ] 텍스트 입력 (주소)
  - [ ] 텍스트 입력 (좌표)
  - [ ] 지도 선택
- [ ] 결과 화면에 "이동 안내" 표시
- [ ] 기사 위치 정보 표시 확인

### Backend/ML
- [ ] Docker 재시작 후 정상 작동
- [ ] MySQL에 GPS 데이터 저장 확인
- [ ] ML 서비스 health check 확인

---

## 🎉 완성된 기능

1. ✅ 기사/승객 모드 선택
2. ✅ GPS 자동 감지
3. ✅ GPS 수동 입력 (텍스트)
4. ✅ GPS 지도 선택
5. ✅ 거리/방향 계산
6. ✅ GPS 기반 자연어 안내
7. ✅ GPS 데이터 저장
8. ✅ 모드별 맞춤 UI

---

**다음 단계 (선택사항):**
- [ ] 실시간 위치 추적 (Background GPS)
- [ ] 경로 최적화 (Directions API)
- [ ] 도착 예정 시간 (ETA)
- [ ] 푸시 알림 (기사 도착 시)
- [ ] 다국어 안내 (영어, 중국어, 일본어)

**완료! 이제 GPS 기능이 완전히 통합되었습니다 📍🚀**
