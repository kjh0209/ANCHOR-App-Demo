# 🔍 매칭 문제 디버깅 가이드

## 수정 사항

1. **로직 개선**: `existingMatch` 확인을 제거하고 username 조합으로 먼저 찾도록 변경
2. **디버깅 로그 추가**: 매칭 과정의 모든 단계를 로그로 출력

---

## 🔄 백엔드 재시작 및 로그 확인

### 1. 백엔드 재시작

```bash
# 프로젝트 루트에서 실행
docker-compose restart backend

# 또는 재빌드 후 재시작
docker-compose up -d --build backend
```

### 2. 백엔드 로그 실시간 확인

**새 터미널을 열고:**

```bash
# 백엔드 로그 실시간 확인
docker-compose logs -f backend
```

### 3. 매칭 테스트

로그를 보면서 다음을 테스트하세요:

1. **기사 계정 (driver1)으로 로그인**
   - 승객 아이디 입력: `p1`
   - "매칭 요청" 클릭
   - 로그에서 `[매칭 요청]`, `[새 매칭 생성]` 메시지 확인

2. **승객 계정 (p1)으로 로그인**
   - 기사 아이디 입력: `driver1`
   - "매칭 요청" 클릭
   - 로그에서 `[기존 매칭 발견]`, `[매칭 완료]` 메시지 확인

---

## 📊 로그 메시지 설명

### 정상적인 경우:

**기사가 먼저 입력:**
```
[매칭 요청] userId: xxx, username: driver1, role: driver, targetUsername: p1
[매칭 검색] driverUsername: driver1, passengerUsername: p1
[새 매칭 생성] driverUsername: driver1, passengerUsername: p1
[새 매칭 저장 완료] id: xxx, status: pending
```

**승객이 나중에 입력:**
```
[매칭 요청] userId: yyy, username: p1, role: passenger, targetUsername: driver1
[매칭 검색] driverUsername: driver1, passengerUsername: p1
[기존 매칭 발견] id: xxx, driverUsername: driver1, passengerUsername: p1, driverConfirmed: true, passengerConfirmed: false
[매칭 완료] 승객 입력 - 기사가 이미 입력함
[매칭 저장 완료] id: xxx, status: matched
```

---

## 🐛 문제 진단

### 문제 1: "기존 매칭 발견" 메시지가 안 나옴

**원인**: username 조합이 다른 레코드가 생성됨

**해결**:
```bash
# 데이터베이스 확인
docker exec -it anchor-mysql mysql -u anchor -panchor123 anchor_guidance

# 매칭 데이터 확인
SELECT id, driverUsername, passengerUsername, driverConfirmed, passengerConfirmed, status, driverId, passengerId 
FROM matches 
ORDER BY createdAt DESC 
LIMIT 5;
```

### 문제 2: "매칭 완료" 메시지가 나오지만 status가 'pending'

**원인**: 저장 과정에서 문제 발생

**해결**: 로그에서 `[매칭 저장 완료]` 메시지 확인

### 문제 3: 두 개의 레코드가 생성됨

**원인**: username 조합 검색이 실패

**해결**: 
1. 기존 매칭 데이터 삭제
2. 백엔드 재시작
3. 다시 테스트

---

## 🧹 데이터베이스 정리

### 기존 매칭 데이터 확인 및 삭제

```bash
# MySQL 접속
docker exec -it anchor-mysql mysql -u anchor -panchor123 anchor_guidance

# 매칭 데이터 확인
SELECT id, driverUsername, passengerUsername, driverConfirmed, passengerConfirmed, status, createdAt 
FROM matches 
ORDER BY createdAt DESC;

# 모든 pending 매칭 삭제
DELETE FROM matches WHERE status = 'pending';

# 또는 모든 매칭 삭제
DELETE FROM matches;
```

---

## ✅ 체크리스트

- [ ] 백엔드 재시작 완료
- [ ] 로그 실시간 확인 중 (`docker-compose logs -f backend`)
- [ ] 기사가 먼저 입력 → 로그 확인
- [ ] 승객이 나중에 입력 → 로그에서 "매칭 완료" 확인
- [ ] 데이터베이스에서 status가 'matched'로 변경되었는지 확인

---

## 📝 로그 예시

정상 작동 시 다음과 같은 로그가 나와야 합니다:

```
[Nest] 123  - 01/01/2024, 12:00:00 PM   LOG [MatchService] [매칭 요청] userId: abc-123, username: driver1, role: driver, targetUsername: p1
[Nest] 123  - 01/01/2024, 12:00:00 PM   LOG [MatchService] [매칭 검색] driverUsername: driver1, passengerUsername: p1
[Nest] 123  - 01/01/2024, 12:00:00 PM   LOG [MatchService] [새 매칭 생성] driverUsername: driver1, passengerUsername: p1
[Nest] 123  - 01/01/2024, 12:00:00 PM   LOG [MatchService] [새 매칭 저장 완료] id: match-123, status: pending

[Nest] 123  - 01/01/2024, 12:00:05 PM   LOG [MatchService] [매칭 요청] userId: def-456, username: p1, role: passenger, targetUsername: driver1
[Nest] 123  - 01/01/2024, 12:00:05 PM   LOG [MatchService] [매칭 검색] driverUsername: driver1, passengerUsername: p1
[Nest] 123  - 01/01/2024, 12:00:05 PM   LOG [MatchService] [기존 매칭 발견] id: match-123, driverUsername: driver1, passengerUsername: p1, driverConfirmed: true, passengerConfirmed: false
[Nest] 123  - 01/01/2024, 12:00:05 PM   LOG [MatchService] [매칭 완료] 승객 입력 - 기사가 이미 입력함
[Nest] 123  - 01/01/2024, 12:00:05 PM   LOG [MatchService] [매칭 저장 완료] id: match-123, status: matched
```

---

## 🚨 문제가 계속되면

1. **로그 전체 확인**:
   ```bash
   docker-compose logs backend --tail=100
   ```

2. **데이터베이스 상태 확인**:
   ```bash
   docker exec -it anchor-mysql mysql -u anchor -panchor123 anchor_guidance -e "SELECT * FROM matches ORDER BY createdAt DESC LIMIT 5;"
   ```

3. **백엔드 완전 재시작**:
   ```bash
   docker-compose down backend
   docker-compose up -d --build backend
   ```

4. **로그 파일 공유**: 문제가 계속되면 로그를 공유해주세요.

