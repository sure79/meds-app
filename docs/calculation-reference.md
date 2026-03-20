# MEDS 계산 참조 문서 (Calculation Reference)

본 문서는 Marine Electrical Design Suite(MEDS)에서 사용하는 주요 계산식과 그 근거를 정리한 기술 참조 문서입니다.

---

## 1. 전력균형 계산 (Load Balance Calculation)

### 1.1 기본 개념

전력균형(Load Balance)은 선박의 각 운전 조건(Operating Condition)에서 총 전력 수요와 발전기 공급 용량을 비교하여 발전기 구성의 적정성을 검증하는 계산입니다. IEC 61363-1 표준을 기반으로 합니다.

### 1.2 주요 공식

#### 1.2.1 개별 부하의 유효전력 수요 (Active Power Demand)

```
P_demand = P_rated × K_load × K_duty
```

| 변수 | 설명 | 단위 |
|------|------|------|
| P_rated | 부하 정격 출력 (Rated Power) | kW |
| K_load | 부하율 (Load Factor), 0~1 | - |
| K_duty | 가동율 (Duty Factor / Diversity Factor), 0~1 | - |

#### 1.2.2 개별 부하의 무효전력 수요 (Reactive Power Demand)

```
Q_demand = P_demand × tan(arccos(PF))
```

| 변수 | 설명 | 단위 |
|------|------|------|
| PF | 역률 (Power Factor) | - |

#### 1.2.3 총 유효전력 수요 (Total Active Power)

```
P_total = Σ (P_demand_i)    (i = 1 ~ n, 모든 부하)
```

#### 1.2.4 총 무효전력 수요 (Total Reactive Power)

```
Q_total = Σ (Q_demand_i)    (i = 1 ~ n, 모든 부하)
```

#### 1.2.5 총 피상전력 수요 (Total Apparent Power)

```
S_total = √(P_total² + Q_total²)
```

#### 1.2.6 발전기 필요 용량 (Required Generator Capacity)

```
P_gen_required = P_total × (1 + M_class)
```

| 변수 | 설명 | 단위 |
|------|------|------|
| M_class | 선급 여유율 (Class Margin) | - |

### 1.3 선급별 여유율 요구사항 (Class Society Margin Requirements)

| 선급 (Class) | 여유율 (Margin) | 비고 |
|-------------|----------------|------|
| KR (한국선급) | 10% | KR Rules Part 6, Ch 2 |
| ABS (미국선급) | 10% | ABS Rules, Part 4-8-2 |
| DNV (노르웨이선급) | 15% | DNV Rules Pt.4 Ch.8 Sec.2 |
| LR (영국선급) | 10% | LR Rules Part 6, Ch 2 |
| BV (프랑스선급) | 10% | BV Rules NR467, Pt C, Ch 2 |
| NK (일본선급) | 10% | NK Rules Part D, Ch 13 |
| CCS (중국선급) | 10% | CCS Rules Part 4, Ch 3 |

### 1.4 발전기 가동 대수 및 부하율 (Generator Loading)

```
Gen_loading(%) = (P_total / P_gen_online) × 100
```

| 변수 | 설명 |
|------|------|
| P_gen_online | 가동 중인 발전기의 총 정격 용량 (kW) |

적정 발전기 부하율 범위: 60% ~ 80% (최적 효율 구간)

### 1.5 예제 계산 (Example Calculation)

**조건:**
- 발전기: 500kW x 1대
- 부하 5개:

| 부하명 | P_rated (kW) | K_load | K_duty | PF |
|--------|-------------|--------|--------|-----|
| Main Pump | 100 | 0.80 | 1.00 | 0.85 |
| Aux Pump | 50 | 0.75 | 0.80 | 0.82 |
| Compressor | 75 | 0.90 | 0.70 | 0.80 |
| Ventilation Fan | 30 | 1.00 | 1.00 | 0.75 |
| Lighting | 20 | 1.00 | 1.00 | 0.95 |

**계산:**

1. 각 부하의 P_demand:
   - Main Pump: 100 × 0.80 × 1.00 = 80.0 kW
   - Aux Pump: 50 × 0.75 × 0.80 = 30.0 kW
   - Compressor: 75 × 0.90 × 0.70 = 47.25 kW
   - Ventilation Fan: 30 × 1.00 × 1.00 = 30.0 kW
   - Lighting: 20 × 1.00 × 1.00 = 20.0 kW

2. P_total = 80.0 + 30.0 + 47.25 + 30.0 + 20.0 = **207.25 kW**

3. 각 부하의 Q_demand:
   - Main Pump: 80.0 × tan(arccos(0.85)) = 80.0 × 0.6197 = 49.58 kVar
   - Aux Pump: 30.0 × tan(arccos(0.82)) = 30.0 × 0.6984 = 20.95 kVar
   - Compressor: 47.25 × tan(arccos(0.80)) = 47.25 × 0.7500 = 35.44 kVar
   - Ventilation Fan: 30.0 × tan(arccos(0.75)) = 30.0 × 0.8819 = 26.46 kVar
   - Lighting: 20.0 × tan(arccos(0.95)) = 20.0 × 0.3287 = 6.57 kVar

4. Q_total = 49.58 + 20.95 + 35.44 + 26.46 + 6.57 = **139.00 kVar**

5. S_total = sqrt(207.25² + 139.00²) = **249.57 kVA**

6. 발전기 필요 용량 (KR 기준, 10% 여유):
   P_gen_required = 207.25 × 1.10 = **227.98 kW**

7. 발전기 부하율:
   Gen_loading = (207.25 / 500) × 100 = **41.45%** (여유 충분, 다만 부하율 낮음)

---

## 2. 단락전류 계산 (Short Circuit Calculation)

### 2.1 기본 개념

단락전류(Short Circuit Current) 계산은 차단기 정격 선정 및 보호 협조의 기초가 되는 계산으로, IEC 61363-1/2에 따라 수행합니다. 선박 전력계통에서의 주요 단락전류 기여원은 발전기와 전동기입니다.

### 2.2 발전기 기여 단락전류 (Generator Contribution)

#### 2.2.1 초기 대칭 단락전류 (Initial Symmetrical Short-Circuit Current)

```
I"k_gen = (P_rated × 1000) / (√3 × V_rated × X"d × PF_rated)
```

또는 정격 전류 기반:

```
I_rated = (P_rated × 1000) / (√3 × V_rated × PF_rated)
I"k_gen = I_rated / X"d (per unit)
```

| 변수 | 설명 | 일반적 값 |
|------|------|----------|
| P_rated | 발전기 정격 출력 | kW |
| V_rated | 정격 전압 | V |
| X"d | 직축 차과도 리액턴스 (Sub-transient Reactance) | 0.10~0.20 pu |
| PF_rated | 정격 역률 | 0.80 |

#### 2.2.2 첨두 단락전류 (Peak Short-Circuit Current)

```
i_p = √2 × κ × I"k
```

| 변수 | 설명 | 값 |
|------|------|-----|
| κ (kappa) | 첨두계수, R/X비에 의존 | 1.02 ~ 2.0 |

κ 계수 산정:

```
κ = 1.02 + 0.98 × e^(-3 × R/X)
```

선박 발전기의 일반적 R/X 비율: 0.05 ~ 0.15
일반적 κ 값: 1.7 ~ 1.9

#### 2.2.3 차단전류 (Breaking Current)

```
I_b = μ × I"k
```

| 변수 | 설명 |
|------|------|
| μ | 감쇠계수 (Decay Factor), 차단 시간에 의존 |

일반적 μ 값:
- 차단시간 0.02s (1 cycle at 50Hz): μ = 1.0
- 차단시간 0.05s: μ = 0.9 ~ 0.95
- 차단시간 0.10s: μ = 0.8 ~ 0.90

### 2.3 전동기 기여 단락전류 (Motor Contribution)

운전 중인 전동기는 단락 발생 시 관성에 의해 단락전류를 공급합니다.

```
I"k_motor = I_rated / X"d_motor
```

| 변수 | 설명 | 일반적 값 |
|------|------|----------|
| X"d_motor | 전동기 차과도 리액턴스 | 0.16~0.25 pu |

전동기 그룹의 등가 기여:

```
I"k_motors = Σ(I_rated_i / X"d_i) × K_running
```

| 변수 | 설명 |
|------|------|
| K_running | 가동 전동기 비율 (일반적으로 0.8~1.0) |

### 2.4 총 단락전류 (Total Short-Circuit Current)

```
I"k_total = I"k_gen + I"k_motors
```

```
i_p_total = √2 × κ_gen × I"k_gen + √2 × κ_motor × I"k_motors
```

### 2.5 예제 계산 (Example)

**조건:**
- 발전기: 500 kW, 450V, PF=0.80, X"d = 0.15 pu
- 전동기 그룹: 총 200 kW, X"d = 0.20 pu

**계산:**

1. 발전기 정격 전류:
   ```
   I_rated_gen = (500 × 1000) / (√3 × 450 × 0.80) = 500,000 / 623.54 = 802.1 A
   ```

2. 발전기 초기 대칭 단락전류:
   ```
   I"k_gen = 802.1 / 0.15 = 5,347 A = 5.35 kA
   ```

3. 전동기 정격 전류:
   ```
   I_rated_motor = (200 × 1000) / (√3 × 450 × 0.85) = 200,000 / 662.51 = 301.9 A
   ```

4. 전동기 단락전류 기여:
   ```
   I"k_motor = 301.9 / 0.20 = 1,510 A = 1.51 kA
   ```

5. 총 초기 대칭 단락전류:
   ```
   I"k_total = 5.35 + 1.51 = 6.86 kA
   ```

6. 첨두 단락전류 (κ_gen = 1.8, κ_motor = 1.5):
   ```
   i_p = √2 × 1.8 × 5,347 + √2 × 1.5 × 1,510
       = 13,607 + 3,203
       = 16,810 A = 16.81 kA (peak)
   ```

7. 차단전류 (μ = 0.95, 차단시간 0.05s):
   ```
   I_b = 0.95 × 6.86 = 6.52 kA (rms)
   ```

**결론:** 차단기 정격은 최소 10 kA (대칭) / 17 kA (첨두) 이상을 선정해야 합니다.

---

## 3. 전압강하 계산 (Voltage Drop Calculation)

### 3.1 기본 개념

전압강하(Voltage Drop) 계산은 케이블 길이와 부하 전류에 따른 수전단 전압 저하를 산출하여 허용 범위 내인지 확인합니다. IEC 60092-352를 기반으로 합니다.

### 3.2 운전 시 전압강하 (Running Voltage Drop)

```
ΔV_run(%) = (√3 × I_run × L × (R × cos(φ) + X × sin(φ))) / V_rated × 100
```

| 변수 | 설명 | 단위 |
|------|------|------|
| I_run | 운전전류 (Running Current) | A |
| L | 케이블 길이 (편도, One-way Length) | km |
| R | 케이블 저항 (Cable Resistance at operating temp) | Ω/km |
| X | 케이블 리액턴스 (Cable Reactance) | Ω/km |
| cos(φ) | 부하 역률 | - |
| V_rated | 정격 전압 (선간, Line-to-Line) | V |

### 3.3 기동 시 전압강하 (Starting Voltage Drop)

```
ΔV_start(%) = (√3 × I_start × L × (R × cos(φ_start) + X × sin(φ_start))) / V_rated × 100
```

| 변수 | 설명 |
|------|------|
| I_start | 기동전류 = I_rated × 기동배수(Starting Multiplier) |
| cos(φ_start) | 기동 시 역률 (일반적으로 0.3~0.5) |

기동 방법별 기동배수:

| 기동 방법 | 기동배수 | 기동 역률 |
|----------|---------|----------|
| DOL (직입 기동) | 6.0 | 0.30 |
| Y-Delta (성형-삼각 기동) | 2.0 | 0.40 |
| Soft Starter | 3.0 | 0.50 |
| VFD (인버터) | 1.2 | 0.90 |

### 3.4 선급별 전압강하 허용 기준 (Class Society Voltage Drop Limits)

| 선급 | 운전 시 (Running) | 기동 시 (Starting) | 비상 (Emergency) |
|------|-------------------|-------------------|------------------|
| KR | 6% | 15% | 10% |
| ABS | 6% | 15% | 10% |
| DNV | 5% | 15% | 10% |
| LR | 6% | 15% | 10% |
| BV | 5% | 15% | 10% |
| NK | 6% | 15% | 10% |
| CCS | 5% | 15% | 10% |

### 3.5 케이블 사이징 기준 (Cable Sizing Criteria)

케이블 단면적은 다음 3가지 조건을 모두 만족하도록 선정합니다:

1. **허용 전류 (Current Carrying Capacity)**
   ```
   I_cable_rated ≥ I_run × K_derating
   ```
   K_derating: 포설조건, 주위온도, 다심케이블 감소계수 등 고려

2. **전압강하 (Voltage Drop)**
   ```
   ΔV_run ≤ 허용 전압강하(%)
   ΔV_start ≤ 기동 시 허용 전압강하(%)
   ```

3. **단락 내량 (Short-Circuit Withstand)**
   ```
   A ≥ I_sc × √t / K
   ```
   | 변수 | 설명 |
   |------|------|
   | A | 최소 케이블 단면적 (mm²) |
   | I_sc | 단락전류 (A) |
   | t | 차단 시간 (s) |
   | K | 케이블 재질 계수 (Cu: 115, Al: 76) |

### 3.6 예제 계산 (Example)

**조건:**
- 케이블: 95mm² TPYC (3심 차폐 케이블)
- 케이블 길이: 100m (편도)
- 부하 전류: 200A
- 역률: 0.85
- 정격 전압: 450V
- 케이블 특성: R = 0.247 Ω/km, X = 0.083 Ω/km (at 45°C)

**운전 시 전압강하 계산:**

```
ΔV_run(%) = (√3 × 200 × 0.1 × (0.247 × 0.85 + 0.083 × 0.527)) / 450 × 100
         = (346.41 × 0.1 × (0.2100 + 0.0437)) / 450 × 100
         = (34.641 × 0.2537) / 450 × 100
         = 8.786 / 450 × 100
         = 1.95%
```

**기동 시 전압강하 (DOL 기동 가정, I_start = 200 × 6 = 1200A, PF_start = 0.3):**

```
ΔV_start(%) = (√3 × 1200 × 0.1 × (0.247 × 0.3 + 0.083 × 0.954)) / 450 × 100
            = (2078.46 × 0.1 × (0.0741 + 0.0792)) / 450 × 100
            = (207.846 × 0.1533) / 450 × 100
            = 31.863 / 450 × 100
            = 7.08%
```

**결과:**
- 운전 시: 1.95% -- 허용 기준(6%) 이내 (적합)
- 기동 시: 7.08% -- 허용 기준(15%) 이내 (적합)

---

## 4. 보호협조 (Protection Coordination)

### 4.1 기본 개념

보호협조(Protection Coordination)는 전력계통에서 고장 발생 시 고장점에 가장 가까운 보호장치가 우선 동작하도록 보호장치들의 동작 특성을 조정하는 것입니다.

### 4.2 TCC 곡선 (Time-Current Characteristic Curve)

TCC 곡선은 보호장치의 동작 전류와 동작 시간의 관계를 나타내는 곡선입니다.

#### 4.2.1 MCCB (배선용 차단기) 동작 특성

MCCB의 보호 영역:

| 영역 | 설명 | 동작 시간 |
|------|------|----------|
| Long Time (장한시) | 과부하 보호, I ≤ 1.1~1.3 × I_rated | 수 초 ~ 수십 초 |
| Short Time (단한시) | 단락 보호, I > I_rated의 수 배 | 0.1 ~ 0.4초 |
| Instantaneous (순시) | 대전류 단락 보호 | < 0.04초 |

IEC 60947-2에 따른 MCCB trip 곡선 분류:
- **B 타입**: 순시 트립 3~5 × I_n (저항성 부하)
- **C 타입**: 순시 트립 5~10 × I_n (일반 부하)
- **D 타입**: 순시 트립 10~20 × I_n (전동기 부하)

#### 4.2.2 ACB (기중 차단기) 동작 특성

ACB의 보호 영역:

| 영역 | 설명 | 설정 범위 |
|------|------|----------|
| L (Long Time) | 과부하 보호 | 0.4~1.0 × I_rated, 시간: 2~30초 |
| S (Short Time) | 단락 보호 | 1.5~10 × I_rated, 시간: 0.1~0.4초 |
| I (Instantaneous) | 순시 보호 | 1.5~15 × I_rated |
| G (Ground Fault) | 지락 보호 | 0.2~1.0 × I_rated, 시간: 0.1~1.0초 |

### 4.3 보호협조 원칙 (Selectivity Principles)

#### 4.3.1 시간 차별 (Time Discrimination)

상위 차단기의 동작 시간을 하위 차단기보다 지연시키는 방법:

```
T_upstream ≥ T_downstream + ΔT
```

| 변수 | 설명 |
|------|------|
| ΔT | 시간 여유 (Discrimination Margin), 일반적으로 0.1~0.3초 |

#### 4.3.2 전류 차별 (Current Discrimination)

상위 차단기와 하위 차단기의 순시 트립 전류 설정을 다르게 하는 방법:

```
I_inst_upstream > I_sc_downstream_max
```

#### 4.3.3 에너지 차별 (Energy Discrimination)

차단기 제조사가 제공하는 에너지 한계 테이블(I²t)을 이용:

```
I²t_upstream > I²t_downstream (let-through)
```

### 4.4 발전기 보호 (Generator Protection)

선박 발전기에 적용되는 주요 보호 기능:

| 보호 기능 | ANSI Code | 설명 |
|----------|-----------|------|
| 과전류 보호 | 50/51 | 단락 및 과부하 보호 |
| 역전력 보호 | 32 | 발전기가 전동기로 동작하는 것 방지 |
| 과전압 보호 | 59 | 전압 상승 보호 |
| 부족전압 보호 | 27 | 전압 저하 보호 |
| 과주파수/부족주파수 | 81O/81U | 주파수 이상 보호 |
| 차동 보호 | 87 | 발전기 내부 고장 보호 (대형기) |

### 4.5 보호협조 확인 절차

1. 단선결선도(SLD)에서 보호 장치 배치 확인
2. 각 보호 장치의 정격 및 설정값 결정
3. TCC 곡선 작성 및 중첩
4. 다음 사항 확인:
   - 상위-하위 보호장치 간 선택성(Selectivity) 확보
   - 케이블 허용 열적 한계(I²t) 이내 보호
   - 전동기 기동 특성과의 간섭 없음
   - 발전기 과부하 곡선 이내 보호
5. 선급 규정 준수 여부 최종 확인

---

## 참고 표준 (Reference Standards)

| 표준 번호 | 제목 |
|----------|------|
| IEC 61363-1 | Electrical installations of ships and mobile and fixed offshore units - Procedures for calculating short-circuit currents in three-phase a.c. |
| IEC 61363-2 | (Supplement to IEC 61363-1) |
| IEC 60092-202 | Electrical installations in ships - System design |
| IEC 60092-301 | Electrical installations in ships - Equipment - Generators and motors |
| IEC 60092-352 | Electrical installations in ships - Choice and installation of electrical cables |
| IEC 60092-502 | Electrical installations in ships - Tankers - Special features |
| IEC 60947-2 | Low-voltage switchgear and controlgear - Circuit-breakers |
| IEC 60898-1 | Electrical accessories - Circuit-breakers for overcurrent protection |
