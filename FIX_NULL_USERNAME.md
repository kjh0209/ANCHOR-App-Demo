# 🔧 NULL Username 문제 수정

## 문제
데이터베이스에 `driverUsername`과 `passengerUsername`이 NULL로 저장되는 문제가 있었습니다.

## 수정 사항
기존 매칭을 찾았을 때 username이 NULL이면 자동으로 설정하도록 수정했습니다.

---

## 🔄 다음 단계

### 1. 기존 NULL 데이터 정리

```bash
# MySQL 접속
docker exec -it anchor-mysql mysql -u anchor -panchor123 anchor_guidance

# NULL username이 있는 매칭 삭제
DELETE FROM matches WHERE driverUsername IS NULL OR passengerUsername IS NULL;

# 또는 모든 매칭 삭제 후 재시작
DELETE FROM matches;
```

### 2. 백엔드 재시작

```bash
# 프로젝트 루트에서
docker-compose restart backend
```

### 3. 매칭 테스트

1. 기사 계정 (driver1)으로 로그인
   - 승객 아이디 입력: `p1`
   - "매칭 요청" 클릭

2. 승객 계정 (p1)으로 로그인
   - 기사 아이디 입력: `driver1`
   - "매칭 요청" 클릭

### 4. 데이터베이스 확인

```bash
docker exec -it anchor-mysql mysql -u anchor -panchor123 anchor_guidance

# username이 제대로 저장되었는지 확인
SELECT id, driverUsername, passengerUsername, driverConfirmed, passengerConfirmed, status 
FROM matches 
ORDER BY createdAt DESC 
LIMIT 5;
```

**예상 결과:**
```
+--------------------------------------+----------------+-------------------+-----------------+--------------------+---------+
| id                                   | driverUsername | passengerUsername | driverConfirmed | passengerConfirmed | status  |
+--------------------------------------+----------------+-------------------+-----------------+--------------------+---------+
| xxx-xxx-xxx                          | driver1        | p1                |               1 |                  1 | matched |
+--------------------------------------+----------------+-------------------+-----------------+--------------------+---------+
```

---

## ✅ 확인 사항

- [ ] 기존 NULL 데이터 삭제 완료
- [ ] 백엔드 재시작 완료
- [ ] 매칭 테스트 완료
- [ ] 데이터베이스에서 username이 제대로 저장되었는지 확인

