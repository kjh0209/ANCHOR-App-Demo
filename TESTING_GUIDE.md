# 🧪 테스트 가이드

## 📋 변경 사항 요약

1. **회원가입 완료 메시지**: Snackbar로 표시
2. **매칭 로직**: 양방향 매칭 조건 확인 개선

---

## 🔄 컨테이너 재시작 방법

### 1. 전체 컨테이너 재시작 (권장)

```bash
# 프로젝트 루트 디렉토리에서 실행
docker-compose down
docker-compose up --build -d
```

### 2. 백엔드만 재시작 (빠른 방법)

```bash
# 백엔드 컨테이너만 재시작
docker-compose restart backend

# 또는 재빌드 후 재시작
docker-compose up -d --build backend
```

### 3. 컨테이너 로그 확인

```bash
# 백엔드 로그 실시간 확인
docker-compose logs -f backend

# 모든 서비스 로그 확인
docker-compose logs -f

# 특정 서비스 상태 확인
docker-compose ps
```

---

## ✅ 테스트 절차

### 1단계: 백엔드 서비스 확인

```bash
# 1. 컨테이너 상태 확인
docker-compose ps

# 2. 백엔드 API 헬스 체크
curl http://localhost:3001/api/auth/user/test

# 3. MySQL 연결 확인
docker exec anchor-mysql mysql -u anchor -panchor123 -e "USE anchor_guidance; SHOW TABLES;"
```

**예상 결과:**
- 모든 컨테이너가 `Up` 상태
- 백엔드 API가 응답
- MySQL 테이블 목록이 표시됨

---

### 2단계: 회원가입 테스트

#### 테스트 시나리오 1: 기사 계정 생성

1. **모바일 앱 실행**
   ```bash
   cd apps/mobile
   npm start
   ```

2. **회원가입 화면에서:**
   - 사용자 유형: 🚕 택시 기사 선택
   - 아이디: `driver1` 입력
   - 비밀번호: `1234` 입력
   - 비밀번호 확인: `1234` 입력
   - "회원가입" 버튼 클릭

3. **확인 사항:**
   - ✅ 하단에 "회원가입이 완료되었습니다!" Snackbar 메시지 표시
   - ✅ 1.5초 후 자동으로 매칭 화면으로 이동

#### 테스트 시나리오 2: 승객 계정 생성

1. **다른 터미널/기기에서 모바일 앱 실행**

2. **회원가입 화면에서:**
   - 사용자 유형: 🧳 승객 선택
   - 아이디: `passenger1` 입력
   - 비밀번호: `1234` 입력
   - 비밀번호 확인: `1234` 입력
   - "회원가입" 버튼 클릭

3. **확인 사항:**
   - ✅ 하단에 "회원가입이 완료되었습니다!" Snackbar 메시지 표시
   - ✅ 1.5초 후 자동으로 매칭 화면으로 이동

---

### 3단계: 매칭 테스트

#### 테스트 시나리오 1: 기사가 먼저 입력

1. **기사 앱 (driver1)에서:**
   - 승객 아이디 입력: `passenger1`
   - "매칭 요청" 버튼 클릭
   - ✅ "매칭 대기" 메시지 표시
   - ✅ "상대방 대기 중..." 상태 표시

2. **승객 앱 (passenger1)에서:**
   - 기사 아이디 입력: `driver1`
   - "매칭 요청" 버튼 클릭
   - ✅ "매칭 완료!" 메시지 표시
   - ✅ 자동으로 각각의 대시보드로 이동
     - 기사: DriverDashboard 화면
     - 승객: PassengerWait 화면

#### 테스트 시나리오 2: 승객이 먼저 입력

1. **승객 앱 (passenger1)에서:**
   - 기사 아이디 입력: `driver1`
   - "매칭 요청" 버튼 클릭
   - ✅ "매칭 대기" 메시지 표시
   - ✅ "상대방 대기 중..." 상태 표시

2. **기사 앱 (driver1)에서:**
   - 승객 아이디 입력: `passenger1`
   - "매칭 요청" 버튼 클릭
   - ✅ "매칭 완료!" 메시지 표시
   - ✅ 자동으로 각각의 대시보드로 이동

---

### 4단계: API 직접 테스트 (선택사항)

#### 회원가입 API 테스트

```bash
# 기사 계정 생성
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "driver1",
    "password": "1234",
    "role": "driver"
  }'

# 승객 계정 생성
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "passenger1",
    "password": "1234",
    "role": "passenger"
  }'
```

#### 매칭 API 테스트

```bash
# 기사가 승객 매칭 요청
curl -X POST http://localhost:3001/api/match/request \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "기사_사용자_ID",
    "username": "driver1",
    "role": "driver",
    "targetUsername": "passenger1"
  }'

# 승객이 기사 매칭 요청
curl -X POST http://localhost:3001/api/match/request \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "승객_사용자_ID",
    "username": "passenger1",
    "role": "passenger",
    "targetUsername": "driver1"
  }'

# 매칭 상태 확인
curl "http://localhost:3001/api/match/status?userId=사용자_ID&role=driver"
```

---

## 🐛 문제 해결

### 문제 1: 백엔드 컨테이너가 시작되지 않음

```bash
# 로그 확인
docker-compose logs backend

# 컨테이너 재빌드
docker-compose up -d --build backend

# MySQL 연결 확인
docker-compose logs mysql
```

### 문제 2: 매칭이 안 됨

```bash
# 데이터베이스에서 매칭 데이터 확인
docker exec anchor-mysql mysql -u anchor -panchor123 anchor_guidance -e "SELECT * FROM matches ORDER BY createdAt DESC LIMIT 5;"

# 사용자 데이터 확인
docker exec anchor-mysql mysql -u anchor -panchor123 anchor_guidance -e "SELECT id, username, role FROM users;"
```

### 문제 3: 모바일 앱이 백엔드에 연결되지 않음

1. **API URL 확인**
   ```bash
   # apps/mobile/src/services/api.ts 파일 확인
   # API_URL이 올바른지 확인 (예: http://10.249.88.14:3001)
   ```

2. **백엔드 포트 확인**
   ```bash
   # 백엔드가 3001 포트에서 실행 중인지 확인
   curl http://localhost:3001/api/auth/user/test
   ```

3. **방화벽 확인**
   - Windows: 방화벽에서 포트 3001 허용 확인
   - 네트워크 설정에서 포트가 열려있는지 확인

---

## 📊 테스트 체크리스트

### 회원가입 기능
- [ ] 기사 계정 생성 시 Snackbar 메시지 표시
- [ ] 승객 계정 생성 시 Snackbar 메시지 표시
- [ ] 회원가입 후 자동으로 매칭 화면으로 이동
- [ ] 중복 아이디 시 에러 메시지 표시

### 매칭 기능
- [ ] 기사가 먼저 입력 → 승객이 입력 → 매칭 완료
- [ ] 승객이 먼저 입력 → 기사가 입력 → 매칭 완료
- [ ] 매칭 완료 시 자동으로 대시보드로 이동
- [ ] 매칭 대기 중 상태 표시
- [ ] 매칭 취소 기능 작동

### 데이터베이스
- [ ] 사용자 데이터가 MySQL에 저장됨
- [ ] 매칭 데이터가 MySQL에 저장됨
- [ ] 매칭 상태가 올바르게 업데이트됨

---

## 🚀 빠른 테스트 명령어

```bash
# 전체 재시작 및 로그 확인
docker-compose down && docker-compose up --build -d && docker-compose logs -f backend

# 백엔드만 재시작
docker-compose restart backend && docker-compose logs -f backend

# 데이터베이스 초기화 (주의: 모든 데이터 삭제)
docker-compose down -v && docker-compose up -d
```

---

## 📝 참고사항

1. **개발 모드**: 백엔드는 `--watch` 모드로 실행되므로 코드 변경 시 자동 재시작됩니다.
2. **모바일 앱**: Expo 개발 서버를 사용하므로 코드 변경 시 핫 리로드됩니다.
3. **데이터베이스**: MySQL 데이터는 `mysql_data` 볼륨에 저장되므로 컨테이너를 삭제해도 데이터가 유지됩니다.

---

## ✅ 테스트 완료 후

모든 테스트가 통과하면:
1. ✅ 회원가입 완료 메시지가 정상적으로 표시됨
2. ✅ 양방향 매칭이 정상적으로 작동함
3. ✅ 매칭 완료 시 자동으로 대시보드로 이동함

이제 다음 기능들을 테스트할 수 있습니다:
- GPS 정보 설정
- 도로 주행 화면 업로드
- YOLO 분석 및 OCR
- 안내문 생성 및 전송

