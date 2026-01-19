# 🚀 서버 실행 가이드

## 📱 Expo 모바일 앱 실행

### 1. 모바일 앱 디렉토리로 이동

```bash
cd apps/mobile
```

### 2. 의존성 설치 (최초 1회만)

```bash
npm install
```

### 3. Expo 개발 서버 시작

```bash
npm start
```

또는

```bash
npx expo start
```

### 4. 실행 옵션 선택

Expo 개발 서버가 시작되면 다음 옵션이 표시됩니다:

```
› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press r │ reload app
› Press m │ toggle menu
› Press ? │ show all commands
```

#### 옵션별 실행 방법:

**A. 웹 브라우저에서 실행**
```bash
# 터미널에서 'w' 키 입력
# 또는
npm run web
```

**B. Android 에뮬레이터에서 실행**
```bash
# 터미널에서 'a' 키 입력
# 또는
npm run android
```

**C. 실제 Android 기기에서 실행**
1. Expo Go 앱 설치 (Google Play Store)
2. 터미널에 표시된 QR 코드 스캔
3. 또는 네트워크가 같은 경우 자동으로 감지됨

**D. iOS 시뮬레이터에서 실행 (Mac만 가능)**
```bash
# 터미널에서 'i' 키 입력
# 또는
npm run ios
```

### 5. Expo 개발 도구

브라우저에서 `http://localhost:8081`이 자동으로 열립니다.

- **Metro Bundler**: 코드 번들링 및 핫 리로드
- **QR 코드**: 실제 기기에서 스캔
- **로그**: 앱 실행 로그 확인

---

## 🌐 웹 서버 (Next.js 프론트엔드) 실행

### 방법 1: Docker Compose 사용 (권장)

```bash
# 프로젝트 루트에서
docker-compose up frontend

# 또는 백그라운드 실행
docker-compose up -d frontend
```

**접속**: http://localhost:3000

### 방법 2: 로컬에서 직접 실행

```bash
# 프론트엔드 디렉토리로 이동
cd apps/frontend

# 의존성 설치 (최초 1회만)
npm install

# 개발 서버 시작
npm run dev
```

**접속**: http://localhost:3000

---

## 🔄 모든 서비스 한번에 실행

### Docker Compose로 모든 서비스 실행

```bash
# 프로젝트 루트에서
docker-compose up

# 백그라운드 실행
docker-compose up -d
```

실행되는 서비스:
- ✅ MySQL (포트 3307)
- ✅ ML Service (포트 8000)
- ✅ Backend API (포트 3001)
- ✅ Frontend Web (포트 3000)

### 로컬에서 여러 서비스 동시 실행

```bash
# 프로젝트 루트에서
npm run dev
```

이 명령어는 다음을 동시에 실행합니다:
- Backend API (포트 3001)
- Frontend Web (포트 3000)
- ML Service (포트 8000)

---

## 📋 빠른 참조

### Expo 앱 실행
```bash
cd apps/mobile
npm start
# 터미널에서 'w' (웹), 'a' (Android), 'i' (iOS) 입력
```

### 웹 서버 실행
```bash
# Docker 사용
docker-compose up frontend

# 또는 로컬 실행
cd apps/frontend
npm run dev
```

### 모든 서비스 실행
```bash
# Docker 사용
docker-compose up

# 또는 로컬 실행
npm run dev  # 루트 디렉토리에서
```

---

## 🔍 포트 확인

각 서비스가 사용하는 포트:

| 서비스 | 포트 | 접속 URL |
|--------|------|----------|
| Frontend Web | 3000 | http://localhost:3000 |
| Backend API | 3001 | http://localhost:3001 |
| ML Service | 8000 | http://localhost:8000 |
| MySQL | 3307 | localhost:3307 |
| Expo Metro | 8081 | http://localhost:8081 |

---

## 🐛 문제 해결

### Expo 서버가 시작되지 않음

```bash
# 캐시 클리어
cd apps/mobile
npx expo start --clear

# 또는 node_modules 재설치
rm -rf node_modules
npm install
npx expo start
```

### 웹 서버 포트 충돌

```bash
# 포트 3000이 사용 중인 경우
# 다른 포트로 실행
cd apps/frontend
PORT=3002 npm run dev
```

### Docker 컨테이너가 실행되지 않음

```bash
# 컨테이너 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs frontend

# 재시작
docker-compose restart frontend
```

---

## ✅ 실행 확인 체크리스트

### Expo 앱
- [ ] `npm start` 실행 성공
- [ ] 브라우저에서 Metro Bundler 열림
- [ ] 웹/Android/iOS 중 하나에서 앱 실행됨

### 웹 서버
- [ ] http://localhost:3000 접속 가능
- [ ] Next.js 개발 서버 로그 표시됨

### 백엔드 서비스
- [ ] http://localhost:3001 접속 가능
- [ ] API 엔드포인트 응답 확인

---

## 🎯 개발 워크플로우

### 일반적인 개발 순서:

1. **백엔드 서비스 시작**
   ```bash
   docker-compose up -d
   ```

2. **Expo 앱 시작** (새 터미널)
   ```bash
   cd apps/mobile
   npm start
   # 'w' 키로 웹에서 실행하거나 'a' 키로 Android 실행
   ```

3. **웹 서버 시작** (선택사항, 새 터미널)
   ```bash
   cd apps/frontend
   npm run dev
   ```

4. **코드 수정**
   - 모바일 앱: `apps/mobile/src/` 수정 → 자동 리로드
   - 웹 앱: `apps/frontend/` 수정 → 자동 리로드
   - 백엔드: `apps/backend/src/` 수정 → 자동 재시작 (watch 모드)

---

## 💡 팁

1. **Expo 웹 실행**: 컴퓨터에서 빠르게 테스트할 때 유용
2. **Android 에뮬레이터**: 실제 기기처럼 테스트 가능
3. **핫 리로드**: 코드 수정 시 자동으로 반영됨
4. **터미널 분할**: 각 서비스를 다른 터미널에서 실행하면 로그 확인이 쉬움

