# 선급 규정 요약 (Classification Society Rules Summary)

본 문서는 선박 전기 설계에 관련된 주요 선급 규정과 국제 표준을 요약합니다.

---

## 1. KR (한국선급, Korean Register)

### 적용 규칙
- **KR Rules for the Classification of Steel Ships**
  - Part 6: Electrical Installations
  - Chapter 2: System Design

### 주요 요구사항

#### 1.1 발전기 용량 (Generator Capacity)
- 최대 연속 부하 조건에서 발전기 용량의 **90% 이하**로 운전 (여유율 10%)
- 최대 부하 조건에서 1대의 최대 발전기가 고장 나더라도 필수 부하에 전력 공급 가능해야 함
- 비상 발전기는 비상 부하를 최소 18시간 공급 가능해야 함

#### 1.2 전압강하 (Voltage Drop)
- 운전 시: 정격 전압의 **6%** 이내
- 기동 시: 정격 전압의 **15%** 이내
- 과도 전압 변동: 정격 전압의 **±20%** 이내 (0.5초 이내 회복)

#### 1.3 단락전류 (Short Circuit)
- 모든 차단기는 예상 단락전류 이상의 차단 용량 보유
- 비대칭 첨두 단락전류에 대한 내량(Making Capacity) 확인 필요
- IEC 61363-1에 따른 계산 또는 동등한 방법 사용

#### 1.4 보호장치 (Protection)
- 과전류 보호: 모든 전력 회로에 설치
- 단락 보호: 모든 급전선에 설치
- 역전력 보호: 병렬 운전 발전기에 설치
- 절연감시장치: IT 계통에 설치

#### 1.5 케이블 (Cables)
- IEC 60092-352에 따른 선정
- 최소 허용 단면적: 동력 회로 1.5mm², 조명 회로 1.0mm²
- 방화 케이블: IEC 60332-3에 적합한 난연 케이블 사용

---

## 2. ABS (미국선급, American Bureau of Shipping)

### 적용 규칙
- **ABS Rules for Building and Classing Marine Vessels**
  - Part 4: Vessel Systems and Machinery
  - Chapter 8: Electrical Systems
  - Section 2: System Design

### 주요 요구사항

#### 2.1 발전기 용량
- 최대 연속 부하의 **110%** 이상 (여유율 10%)
- 최대 발전기 1대 고장 시 필수 서비스 유지 가능
- 비상 발전기: SOLAS 규정에 따른 비상 부하 공급

#### 2.2 전압강하
- 정상 운전: **6%** 이내
- 전동기 기동: **15%** 이내
- 과도 상태 복구: 1.5초 이내에 정격의 ±3% 이내 회복

#### 2.3 단락 보호
- 계산 방법: IEC 61363 또는 ABS 승인 방법
- 차단기 정격: 예상 단락전류의 **100%** 이상
- 케이블 단락 내량: 차단기 동작 시간 동안 케이블 열적 한계 이내

#### 2.4 접지 시스템 (Grounding)
- 주 배전반: IT 계통 (비접지) 권장
- 440V 이상 계통: 고저항 접지 또는 비접지
- 절연감시: 모든 비접지 계통에 설치

#### 2.5 비상 전원 (Emergency Power)
- SOLAS Ch II-1, Reg 42~44 준수
- 비상 발전기 자동 기동: 정전 후 **45초** 이내
- 비상 배터리: 최소 30분간 비상 조명 공급

---

## 3. DNV (노르웨이선급, Det Norske Veritas)

### 적용 규칙
- **DNV Rules for Classification of Ships**
  - Part 4: Systems and Components
  - Chapter 8: Electrical Installations

### 주요 요구사항

#### 3.1 발전기 용량
- 최대 연속 부하 조건에서 **85% 이하** 부하율 운전 (여유율 15%)
- 가장 큰 발전기 1대 상실 시: 필수 서비스 및 항해 안전 관련 부하 유지
- 과도 부하: 정격의 110%를 1시간 이내

#### 3.2 전압강하
- 정상 운전: **5%** 이내
- 전동기 기동: **15%** 이내
- 주파수 과도 변동: ±10% 이내, 5초 이내 회복

#### 3.3 단락전류
- IEC 61363에 따른 계산 필수
- 발전기 및 전동기 기여 모두 고려
- 차단기 정격 선정 시 안전 계수(Safety Factor) 적용 권장

#### 3.4 보호 협조 (Protection Coordination)
- 선택성(Selectivity) 확보: TCC 곡선에 의한 검증 필수
- 보호 협조 해석 결과서 선급 제출 필요
- 발전기 보호: 과전류(50/51), 역전력(32), 과/부족전압(59/27)

#### 3.5 특수 요구사항
- DP(Dynamic Positioning) 선박: FMEA(Failure Mode and Effects Analysis) 필수
- 전폐형 배전반(Enclosed Switchboard): Arc fault 보호 고려
- 고조파: THD 8% 이내 (개별 고조파 5% 이내)

---

## 4. SOLAS 요구사항 (Safety of Life at Sea)

### Chapter II-1: Construction - Structure, Subdivision, Stability, Machinery and Electrical Installations

#### 4.1 주 전원 (Regulation 40)
- 최소 2대의 발전기 설치
- 1대 고장 시 필수 서비스 유지 가능한 용량

#### 4.2 비상 전원 (Regulation 42 - 여객선, Regulation 43 - 화물선)

##### 여객선 (Passenger Ships)
- 비상 발전기: 비상 부하를 **36시간** 공급
- 자동 기동: 정전 후 **45초** 이내
- 과도 배터리: 최소 **30분** 공급

##### 화물선 (Cargo Ships)
- 비상 발전기: 비상 부하를 **18시간** 공급
- 자동 기동: 정전 후 **45초** 이내
- 과도 배터리: 최소 **30분** 공급

#### 4.3 비상 부하 목록 (Emergency Loads)
- 비상 조명 (Emergency Lighting)
- 항해등 (Navigation Lights)
- 통신 장비 (Communication Equipment)
- 화재 탐지 및 경보 (Fire Detection and Alarm)
- 비상 소방 펌프 (Emergency Fire Pump)
- 조타기 (Steering Gear) - 1대
- 수밀문 (Watertight Doors)
- 선내 통신 장치 (Internal Communication)
- 일반 경보 장치 (General Alarm)

#### 4.4 비상 발전기실 위치
- 최상층 연속 갑판 상부 (Above the uppermost continuous deck)
- 기관실 외부에 위치
- 침수 위험이 없는 위치

---

## 5. IEC 표준 참조 (Referenced IEC Standards)

### 5.1 IEC 60092 시리즈 - 선박 전기 설비 (Electrical Installations in Ships)

| 표준 번호 | 제목 | 주요 내용 |
|----------|------|----------|
| IEC 60092-101 | Definitions and general requirements | 기본 정의 및 일반 요구사항 |
| IEC 60092-201 | System design - General | 계통 설계 일반 |
| IEC 60092-202 | System design - Protection | 보호 설계 |
| IEC 60092-301 | Equipment - Generators and motors | 발전기 및 전동기 장비 |
| IEC 60092-302 | Equipment - Low-voltage switchgear assemblies | 저압 배전반 |
| IEC 60092-303 | Equipment - Transformers for power and lighting | 변압기 |
| IEC 60092-350 | General construction and test methods of cables | 케이블 일반 |
| IEC 60092-352 | Choice and installation of electrical cables | 케이블 선정 및 설치 |
| IEC 60092-353 | Power cables for rated voltages 1 kV and 3 kV | 전력 케이블 |
| IEC 60092-401 | Installation and test of completed installation | 설치 및 시험 |
| IEC 60092-502 | Tankers - Special features | 유조선 특수 요구사항 |
| IEC 60092-503 | Special features - A.C. supply systems with voltages in the range above 1 kV up to and including 15 kV | 고압 계통 |

### 5.2 IEC 61363 시리즈 - 단락전류 계산

| 표준 번호 | 제목 | 주요 내용 |
|----------|------|----------|
| IEC 61363-1 | Procedures for calculating short-circuit currents in three-phase a.c. | 3상 교류 단락전류 계산 절차 |

### 5.3 기타 관련 표준

| 표준 번호 | 제목 | 주요 내용 |
|----------|------|----------|
| IEC 60947-2 | Low-voltage switchgear - Circuit-breakers | 저압 차단기 |
| IEC 60947-4-1 | Contactors and motor-starters | 전자접촉기 및 기동기 |
| IEC 60529 | Degrees of protection (IP Code) | 보호 등급 |
| IEC 60332-3 | Tests on electric cables - Flame propagation | 케이블 난연 시험 |
| IEC 60331 | Tests for electric cables under fire conditions | 내화 케이블 시험 |

---

## 6. 주요 규정 비교표 (Comparison Table)

| 항목 | KR | ABS | DNV | SOLAS |
|------|-----|-----|-----|-------|
| 발전기 여유율 | 10% | 10% | 15% | - |
| 운전 시 전압강하 | 6% | 6% | 5% | - |
| 기동 시 전압강하 | 15% | 15% | 15% | - |
| 비상 발전기 기동 | 45초 | 45초 | 45초 | 45초 |
| 비상 전원 지속 (화물선) | 18시간 | 18시간 | 18시간 | 18시간 |
| 비상 전원 지속 (여객선) | 36시간 | 36시간 | 36시간 | 36시간 |
| 과도 배터리 | 30분 | 30분 | 30분 | 30분 |
| 주파수 변동 허용 | ±5% | ±5% | ±5% | - |
| 전압 과도 변동 | ±20% | - | ±10% | - |
| 전압 과도 회복 | 0.5초 | 1.5초 | 5초 | - |
| 접지 방식 (권장) | IT | IT | IT | - |
| 고조파 THD | - | - | 8% | - |

---

## 7. 선급 제출 서류 (Class Submission Documents)

선박 전기 설계 시 선급에 제출해야 하는 주요 도면 및 서류:

| 번호 | 서류명 (한글) | 서류명 (영문) | 비고 |
|------|-------------|-------------|------|
| 1 | 전력균형표 | Electrical Load Balance | 모든 운전 조건 포함 |
| 2 | 주 배전 단선결선도 | Main Switchboard Single Line Diagram | |
| 3 | 비상 배전 단선결선도 | Emergency Switchboard Single Line Diagram | |
| 4 | 단락전류 계산서 | Short Circuit Calculation | |
| 5 | 전압강하 계산서 | Voltage Drop Calculation | 주요 부하 |
| 6 | 보호협조 해석서 | Protection Coordination Study | TCC 곡선 포함 |
| 7 | 케이블 스케줄 | Cable Schedule | |
| 8 | 발전기 사양서 | Generator Specification | |
| 9 | 배전반 사양서 | Switchboard Specification | |
| 10 | 전기 장비 배치도 | Electrical Equipment Arrangement | |
| 11 | 케이블 포설도 | Cable Routing Plan | |
| 12 | 위험구역 장비 목록 | Hazardous Area Equipment List | 유조선 등 |
