# Claude Code용 슬라이드 자동 생성 프롬프트
_기반 문서: 시간 기반 분석 프레임워크 PDF 전체 텍스트_

## 사용 목적
이 문서는 Claude Code에게 다음 작업을 지시하기 위한 **단일 프롬프트 마크다운 파일**입니다.

1. 아래에 포함된 **원문 전체 텍스트를 빠짐없이 보존**한다.
2. 원문의 의미를 유지하면서 **슬라이드용으로 재구성**한다.
3. 결과물은 **일관된 PPT 생성용 구조**로 정리한다.
4. 필요 시 슬라이드 제목/소제목/본문/도표 제안/발표자 노트까지 생성한다.
5. 원문 누락, 축약, 임의 삭제 없이 작업한다.

---

# Claude Code 지시문

## 역할
너는 전략 컨설팅 스타일의 프레젠테이션 디자이너이자 정보 구조화 에디터다.  
너의 임무는 아래 원문 전체를 바탕으로 **슬라이드 자동 생성용 중간 산출물**을 만드는 것이다.

## 절대 규칙
- 아래 `원문 전체 텍스트`는 **한 줄도 빠뜨리지 말고 참조**할 것
- 결과물을 만들 때 **원문에 없는 새로운 주장**을 임의로 추가하지 말 것
- 단, 슬라이드 전달력을 높이기 위한 **표현 정리, 병합, 중복 제거, 재구성**은 허용
- 슬라이드는 **논리 흐름**이 보여야 하며, 단순 문장 나열이 되지 않도록 할 것
- 각 슬라이드는 다음 중 하나의 타입으로 분류할 것:
  - Title Slide
  - Overview Slide
  - Concept Slide
  - Example Slide
  - Framework Slide
  - Data/Report Slide
  - CRM/Experiment Slide
  - Exercise Slide
  - Summary Slide
- 결과물은 아래 형식으로 작성할 것

## 출력 형식
각 슬라이드는 아래 포맷으로 출력:

```md
## Slide {번호}. {슬라이드 제목}
- Type: {슬라이드 타입}
- Objective: {이 슬라이드의 목적}

### Key Message
- ...

### Body
- ...
- ...
- ...

### Visual Suggestion
- ...

### Speaker Note
- ...
```

## 스타일 가이드
- 불필요하게 장황하지 않게
- 교육용이면서도 실무형
- Mixpanel / CRM / Experimentation 연결이 자연스럽게 드러나게
- 동일 메시지 반복은 줄이되, 원문 내용은 빠짐없이 반영
- 필요 시 여러 장으로 나눠도 괜찮다
- 최종 결과는 “강의 + 실무 워크숍 + 컨설팅 소개” 어디에도 재활용 가능해야 한다

## 추가 작업 지시
1. 먼저 전체 원문을 읽고 **최적 슬라이드 목차**를 설계할 것
2. 그 다음 각 장표를 상세 작성할 것
3. 원문이 긴 경우, **한 슬라이드에 과적재하지 말고 적절히 분할**할 것
4. “실습 과제”, “CRM 실행”, “실험 설계”, “Mixpanel 리포트 설정”은 별도 슬라이드로 분리하는 것을 우선 고려할 것
5. 최종적으로 아래 3가지 부록도 추가할 것
   - Appendix A. Mixpanel에서 구현 가능한 리포트 목록
   - Appendix B. 팀 실습 운영안
   - Appendix C. 이 프레임워크로 도출 가능한 액션 체계

---

# 원문 전체 텍스트

## Page 1
2026-04-08 v1.0  
시간 기반 분석 프레임워크

## Page 2
1. Calendar Time 분석  
1⃣ Calendar Time & Time Structure “시간을 쪼개고 → 패턴을 읽고 → 해석하는 능력”을 만든다  
① 절대 시간 구조 (Calendar Layer)  
시간 단위를 계층적으로 이해  
● 연 / 분기 / 월 / 주 / 일 / 시간 / 분  
● 월초 - 월중 - 월말  
● 요일 (월~일)  
● 주중 vs 주말  
● 시간대별 분석  
② 비즈니스 시간 구간 (Daily Context Layer)  
“하루 안에서도 시간은 다 다르다”  
● 출근 시간대 (07~10시)  
● 업무 오전 (10~12시)  
● 점심 시간 (12~13시)  
● 업무 오후 (13~18시)  
● 퇴근 시간 (18~20시)  
● 퇴근 후 / 야간 (20~24시)  
● 심야 (00~06시)  
③ 상대 시간 개념 (Relative Time)  
● 특정 날짜 기준 전/후 (캠페인, 릴리즈 등)  
● N일/주/월 전후  
● 이벤트 기준 Day 0 / 1 / 7 / 30  
④ Time Series 구조 이해  
● Trend (추세)  
● Seasonality (계절성)  
● Noise (불규칙)

## Page 3
1. Calendar Time 분석  
💡 핵심 분석 사례  
📌 사례 1: 월초 vs 월말 소비 패턴  
질문  
● “월말 매출 상승은 프로모션 때문인가, 급여 때문인가?”  
인사이트  
● 월급일 이후 구매 집중  
● 월말 budget 소진 행동  
📌 사례 2: 요일별 행동 차이  
질문  
● “주중 vs 주말 유저는 같은 유저인가, 다른 유저인가?”  
인사이트  
● 주중: 탐색 / 비교  
● 주말: 구매 / 소비  
📌 사례 3: 시간대별 intent 차이  
질문  
● “왜 오전과 밤의 행동이 다른가?”  
인사이트  
● 출근 시간: 빠른 소비 (짧은 session)  
● 업무 시간: 정보 탐색  
● 야간: 콘텐츠 소비 / 구매  
📌 사례 4: 업무시간 vs 비업무시간  
질문  
● “B2B SaaS는 언제 쓰이는가?”  
인사이트  
● 업무시간 집중 사용  
● 야간은 거의 inactive

## Page 4
1. Calendar Time 분석  
💡 2. 핵심 분석 사례  
📌 사례 5: 피크 타임 분석  
질문  
● “트래픽이 몰리는 순간은 언제인가?”  
인사이트  
● 서버 부하  
● 프로모션 타이밍 최적화  
📌 사례 6: Trend vs Seasonality 분리  
질문  
● “성장인가, 계절 효과인가?”  
인사이트  
● 12월 매출 상승 = 시즌 영향  
● 지속 상승 = 실제 성장

## Page 5
1. Calendar Time 분석  
Quiz. 월초 / 월중 / 월말 비교 분석이 특히 잘 먹히는 산업 분야는?  
Think. Time-of-Day 와 Weekday vs Weekend + 데모그래픽 정보를 함께 고려해 만들 수 있는 페르소나를 생각해 보아요  
복수 시즈널리티·조합 축  
“하루·일주·한 달·일 년” 여러 주기를 동시에 보는 관점입니다.  
● 시간대 × 요일 매트릭스: 이미 하시는 요일·시간대 분석을 히트맵으로 결합(예: 화요일 14–16시, 토요일 21–23시).  
● 요일 × 월초/월말: “월말 금요일 저녁” 같은 특정 블록에서만 터지는 행동(급여일 후 소비 등) 탐색.  
● 시간대 × 시즌: 평소 vs 명절/방학/연말에 “야간 피크가 당겨지는지/늦춰지는지” 등 패턴 변화 비교.

## Page 6
1. Calendar Time 분석  
(이미지 예시 슬라이드)  
IV. 요일 및 시간대/성별 사용자 행동 차이  
(2) 시간대 별 Session, PV 비교  
- Mobile의 경우 Session은 취침시간을 제외한 시간에서 대체적으로 일정, 반면, Desktop은 17시를 기점으로 하락하기 시작하여 오후5시부터 아침 7시까지 하향 트렌드.  
- Desktop의 PV 트렌드는 세션과 비슷한 추세를 나타내나, Mobile의 경우 19시 이후 대폭 상승하는 것을 확인할 수 있음  
→ 업무 시간 Desktop 활용 비중이 높고, 업무 외 시간 Mobile 활용 비중이 높은 패턴을 보임

## Page 7
1. Calendar Time 분석  
(이미지 예시 슬라이드)  
(3) 주중 vs 주말 주요 서비스 PV 비교  
- 평일(월~금), 주말(토,일)의 서비스 그룹 별 1일 평균 PV를 통한 비교  
- Desktop의 경우 주요 페이지 모두 평일 대비 주말 PV 감소 현상을 보임  
- 반면, Mobile의 경우 주요 페이지 모두 평일 대비 주말 PV 증가 현상을 보임  
→ 주중 Desktop 활용 비중이 높고, 주말 Mobile 활용 비중이 높은 일반적인 직장인 생활 패턴을 보임

## Page 8
1. Calendar Time 분석  
(이미지 예시 슬라이드)  
V. 결론  
✓ Mobile First, 특히 Mobile 에서 결제 편의 도모 필요  
✓ 기기를 2개 이상 교차로 사용했을 경우의 비중이 15%로 전체 대비 비중이 높지는 않지만, 단일 디바이스 사용 대비 인당 주문액 평균이 더 높았음  
✓ 기기 별 서비스 이용 패턴을 비교한 결과 특정 기기에서는 브라우징, 특정 기기에서는 주문전환 행동을 하기보다는 기기에 상관없이 그 순간 접속하기 편한 기기를 자신의 목적에 맞게 활용하는 패턴을 보이는 것으로 추정됨.  
✓ 이에 따라, 사용자가 입장하는 시점에 해당 사용자가 구매 전체 단계 중 현재 어떤 단계에 있는지를 기준으로 그 경험을 이어나갈 수 있도록 사용자 경험을 관리하고 설계하는 것이 중요함  
(ex. 사용자의 이전 방문에서의 최종 페이지 기준 맞춤 오퍼링 제공, 마지막 본 제품/카테고리 기준 상품 추천)  
✓ Seamless 경험 설계 시 PC 주문수 → MC 장바구니, MC 단품 → PC 검색 부분을 집중적으로 보아야함

## Page 9
1. Calendar Time 분석  
(이미지 예시 슬라이드)  
Seamless 고객 경험 설계 사례  
- 델 사는 구매 고객에 대한 리타겟팅을 위해 dell.com 에 구매 후 방문하면 관련 네비게이션에 오선읜 다양한 제안하여 최적의 오퍼를 찾아냄  
- 즉, 구매 후 재방문하면 메인에 “웰컴 백” 메시지와 함께  
  주문상태 확인하기, 기술 지원 연락하기, 관련 액세서리 구매하기, PC 및 홈서비스 정보 보기 옵션이 보임  
과거 사이트 이용 행태를 통해 단계 오퍼 제공하기  
- 마지막으로 본 제품  
- 마지막으로 본 카테고리  
- 마지막으로 본 브랜드  
- 장바구니에 마지막으로 담긴 제품  
- 위쉬리스트 등에 저장된 아이템들  
- 마지막 구매에 의거한 크로스 셀링  
- 마지막 구매에 의거한 업셀링  
- 구매 후 서포트(서비스) 메시지  
메인 키비주얼의 마지막 행동 기준으로 변경

## Page 10
1. Calendar Time 분석  
기본 시간 단위 확장  
단순 일/주/월 외에, “여러 계층의 시즈널리티”를 동시에 보는 관점입니다.  
● 월별·분기별·연도별 시즌: 월 단위(1–12월), 분기(Q1–Q4), 회계연도, 성수기/비수기, 세일 시즌(블랙프라이데이, 설·추석, 연말 등).  
● 주차(week of year): 1년을 52주 기준으로 보고, 특정 주차(예: 1주차·52주차)의 특징을 보는 분석.  
● 일령(day-of-cycle): 캠페인 시작 D0, D+1, D+2…, 기능 런칭 후 N일 차, 프로모션 N일 차 등 “캠페인 수명 주기 상의 날짜”  
결제·빌링·급여일 기준  
특히 커머스·구독 서비스에서 강력한 시간 축입니다.  
● 급여일/카드 결제일 전후: 월급일 전후 3일, 카드 결제일 직전·직후 n일, 공과금 납부 전후 소비 패턴.  
● 구독 갱신 주기: 갱신 예정일 D-7, D-3, D-1, 갱신 당일, 갱신 후 N일의 로그인·기능 사용·이탈률.  
● 무료 체험 종료 전후: 트라이얼 종료 D-3, D-1, 당일, D+1 등 단계에서의 전환/이탈 분석.  
달력·사회 이벤트 기준  
“날짜”에 맥락을 더해주는 기준입니다.  
● 공휴일/평일/샌드위치 데이: 공휴일 전날·당일·다음날, 샌드위치 데이(임시공휴일 포함)별 트래픽·구매·콘텐츠 소비 패턴.  
● 시즌 이벤트: 설·추석, 어린이날, 수능 시즌, 방학/개학, 크리스마스, 연말 등 시즌별 카테고리별 반응 차이.  
● 외부 이슈·캠페인: 대형 스포츠 경기(월드컵, 올림픽), 정치 이벤트, 대형 방송/예능 방영 시간대 전후 트래픽 변화.  
캠페인·프로덕트 이벤트 기준  
“시계열을 특정 이벤트를 중심으로 재정렬”하는 방식입니다.  
● 기능 출시 전후: 기능 론칭 T0를 기준으로 T-7~T+30일의 기능 사용률, 전체 유지율, ARPU 변화.  
● 가격/정책 변경 전후: 요금제 개편, 약관 변경, 배송비 인상 등 이벤트 이전 vs 이후 코호트의 전환·이탈 패턴.  
● 마케팅 캠페인 윈도: 캠페인 기간 내/직후(예: 캠페인 종료 후 1주) 사용자 행동·리텐션·재구매 분석.

## Page 11
1. Calendar Time 분석  
시간대별 페르소나 세분화 (Temporal Persona)  
단순히 “오전/오후”가 아니라, 사용자의 라이프 스테이지를 반영한 구분입니다.  
분석 기준 | 설명  
- 얼리버드 vs 나이트 아울: 새벽 6시~8시 활동자와 자정 이후 활동자의 구매 품목/성향 비교  
- 점심시간 ‘반짝 쇼핑’: 12:00 ~ 13:30 사이의 모바일 집중도와 전환율 분석  
- 데드 타임(Dead Time): 활동이 가장 저조한 시간대의 원인 분석 (서버 점검, 타겟의 수면 등)  
- 정기 구독/결제 주기: 자동 결제가 일어나는 시점과 실제 서비스 이용 시점의 괴리 분석

## Page 12
1. Calendar Time 분석  
사용자 개인별 “평소 시간대” 기준  
집단 평균이 아니라 “각 유저의 평소 패턴”과 비교하는 축입니다.  
● 개인별 활동 창(activity window): 유저별로 평소 활동 시간대(예: 09–18시)를 추정하고, 그 범위 안/밖에서의 반응률 비교.  
● 평소 패턴 대비 이탈/이상행동: 평소에는 주중 낮에만 방문하던 유저가 새벽·주말에만 접속하는 등 패턴 변화 감지.  
● 개인별 “골든 타임”: 유저별 가장 전환율 높은 시간대를 찾고, 그 구간에 푸시/이메일/앱 메시지 발송 최적화

## Page 13
1. Calendar Time 분석  
과제 1: Golden Time 찾기  
질문  
● 언제 구매가 가장 많이 발생하는가?  
분석  
● hour_of_day breakdown  
🧪 과제 2: 월초 vs 월말 비교  
질문  
● 월말에 왜 매출이 증가하는가?  
분석  
● month_phase breakdown  
🧪 과제 3: 요일별 행동 차이  
질문  
● 주말 유저는 다른 유저인가?  
🧪 과제 4: 시간대별 전환율  
질문  
● 언제 전환율이 높은가?  
🧪 과제 5 (고급)  
질문  
● “야간 구매 유저는 retention이 높은가?”  
🧪 과제 3: 요일별 행동 차이  
질문  
● 주말 유저는 다른 유저인가?  
🧪 과제 4: 시간대별 전환율  
질문  
● 언제 전환율이 높은가?  
🧪 과제 5 (고급)  
질문  
● “야간 구매 유저는 retention이 높은가?”  
Actionable Insight 를 도출하려면?  
1) Golden Time 기반 CRM 실행 아이디어로 연결  
2) A/B 테스트 연결

## Page 14
1. Calendar Time 분석  
“언제 행동하는가 → 언제 개입할 것인가”  
💡 핵심 인사이트 유형  
● Golden Time 존재  
● 시간대별 intent 차이  
● 월초 vs 월말 소비 패턴  
🚀 CRM 실행 아이디어  
1. Golden Time 푸시 최적화  
● 밤 9~11시 구매 집중 → 푸시 집중 발송  
2. 월말 소비 촉진  
● 월말 할인 / 리마인드 메시지  
3. 시간대별 메시지 분기  
아침 → 빠른 CTA  
점심 → 가벼운 콘텐츠  
야간 → 구매 유도

## Page 15
1. Calendar Time 분석  
🧪 실험 설계  
Experiment 1: 푸시 시간 테스트  
● A: 오전 발송  
● B: 저녁 발송  
KPI  
● CTR  
● Conversion Rate  
Experiment 2: 시간대별 메시지 차별화  
● A: 동일 메시지  
● B: 시간별 다른 메시지  
🎯 핵심 KPI  
● Time-based Conversion Rate  
● Notification Response Time

## Page 16
1. Calendar Time 분석  
📌 1. 시간대별 사용 (Hour of Day)  
🖱 클릭 순서  
1. Mixpanel 좌측 메뉴 → Analysis  
2. → Insights 클릭  
3. 상단 Event 선택 → App Open (또는 Purchase)  
4. Measure:  
○ Unique Users 선택  
5. 우측 Breakdown 클릭  
6. → Time  
7. → Hour of Day 선택  
8. Visualization → Line Chart  
⚠ 실수 포인트  
● Event Count vs Unique Users 헷갈림  
● Timezone 설정 확인 (KST)  
📌 2. 요일 분석 (Day of Week)  
🖱 클릭  
1. Insights 유지  
2. Breakdown: → Time → Day of Week  
3. Visualization: → Bar Chart

## Page 17
1. Calendar Time 분석  
📌 3. Heatmap (요일 x 시간) ⭐  
🖱 클릭  
1. Insights  
2. Breakdown 1: → Day of Week  
3. + Add Breakdown 클릭  
4. Breakdown 2: → Hour of Day  
5. Visualization: → Heatmap 선택  
🎯 결과  
“패턴이 한 눈에 보임”  
📌 4. 월초 / 월말 분석  
🖱 클릭  
1. Data Management → Custom Property 생성  
2. 이름: month_phase  
if day <= 10 → early  
if day <= 20 → mid  
else → late  
3. 다시 Insights  
4. Breakdown: → month_phase

## Page 18
1. Calendar Time 분석  
5. 시간 블록 분석  
🖱 클릭  
1. Custom Property 생성 time_block  
2. 규칙 입력:  
07-10 commute  
10-12 work_morning  
12-13 lunch  
13-18 work_afternoon  
18-20 commute_home  
20-24 evening  
00-06 night  
3. Insights → Breakdown: → time_block

## Page 19
2. Event-relative Time (Time-to-X) 분석  
커리큘럼 주제  
핵심 정의  
Time-to-X = 특정 행동(X)까지 걸리는 시간  
이 분석은 단순 시간 측정이 아닙니다:  
“사용자가 얼마나 빠르고 쉽게 목적을 달성하는가”를 측정하는 UX 지표  
🧠 왜 중요한가  
시간은 아래를 모두 포함합니다:  
● 사용 편의성 (UX friction)  
● 의사결정 난이도  
● 정보 탐색 비용  
● 설계된 사용자 흐름의 효율성  
핵심 분석 사례  
1. 가입 후 1시간 내 미활성 유저 이탈률 증가  
2. 장바구니 후 3시간 내 구매율 급감  
3. 첫 콘텐츠 소비까지 시간 vs retention  
4. 푸시 후 10분 내 반응 집중  
5. Feature adoption 속도 vs 장기 retention  
6. 빠른 구매 유저 vs 느린 유저 LTV 차이  
🔥 핵심 관점  
시간이 길어질수록:  
● 사용자는 피로해진다  
● 의사결정이 지연된다  
● 이탈 확률이 증가한다  
📌 정리  
Time-to-X = UX 품질 지표 + 전환 효율 지표

## Page 20
2. Event-relative Time (Time-to-X) 분석  
📌 사례 3: 장바구니 → 구매 지연  
질문  
● “왜 장바구니에 넣고 안 살까?”  
인사이트  
● 결제 과정 friction  
● 의사결정 미완료  
📌 사례 4: 콘텐츠 첫 소비까지 시간  
질문  
● “왜 콘텐츠를 늦게 소비하면 retention이 떨어질까?”  
인사이트  
● value 전달 실패  
💡 핵심 사례  
“가입 후 24시간 내 미활성 유저 → 이탈 확률 급증”  
“장바구니 후 3시간 내 구매 안 하면 전환율 급락”  
“푸시 발송 후 10분 내 반응 집중”  
📌 사례 1: 가입 → 첫 행동 (Activation Time)  
질문  
● “가입 후 왜 아무 것도 안 하고 떠날까?”  
인사이트  
● onboarding friction 존재  
📌 사례 2: 상품 조회 → 구매  
질문  
● “왜 어떤 유저는 바로 사고, 어떤 유저는 며칠 고민할까?”  
인사이트  
● 가격 / 확신 / UX 문제

## Page 21
2. Event-relative Time (Time-to-X) 분석  
📌 사례 5: 푸시 → 반응 시간  
질문  
● “알림을 언제 보내야 효과적인가?”  
인사이트  
● 반응 window 존재  
📌 사례 6: 기능 도입 속도  
질문  
● “새 기능을 빨리 쓰는 유저는 왜 더 오래 남을까?”

## Page 22
2. Event-relative Time (Time-to-X) 분석  
팀 실습 과제  
🧪 과제 1 “우리 서비스 Time to First Action 계산”  
🧪 과제 2 “가장 느린 Funnel 단계 찾기”  
🧪 과제 3 “Fast vs Slow 유저 정의”  
● 기준 설정  
● 행동 차이 분석  
🧪 과제 4 “지연 구간에서 이탈률 분석”  
🧪 과제 5 “Time-to-X 기반 CRM 전략 설계”  
● 언제 개입할 것인가?  
🧪 과제 6 (고급) “Time-to-X vs Retention 상관관계 분석”  
🧪 추천 실습 질문  
1. Fast 유저 비율은?  
2. Slow 유저는 왜 느린가?  
3. 몇 분 이후 전환율 급감하는가?  
4. CRM 개입 타이밍은?  
5. 할인 vs 리마인드 어떤 전략이 맞는가?

## Page 23
2. Event-relative Time (Time-to-X) 분석  
“얼마나 빨리 행동하는가 → 어떻게 속도를 줄일 것인가”  
💡 핵심 인사이트  
● conversion delay 존재  
● early vs late converter 차이  
🚀 CRM 실행  
1. Delayed Conversion 리마인드  
● 장바구니 후 3시간 → 리마인드  
● 24시간 → 할인 제공  
2. Activation 가속화  
● 가입 후 1시간 내 미활성 유저 → onboarding push  
3. Notification Timing 최적화  
● 반응 peak 시간에 재발송  
🧪 실험 설계  
Experiment 1: 리타겟팅 타이밍  
● A: 1시간 후  
● B: 6시간 후  
● C: 24시간 후  
Experiment 2: Activation 가속  
● A: 기본 onboarding  
● B: 즉시 가이드 push  
🎯 KPI  
● Time to Conversion ↓  
● Activation Rate ↑

## Page 24
2. Event-relative Time (Time-to-X) 분석  
📊 Report 1: Time to Convert  
🔧 생성 경로  
● Mixpanel → Funnels  
⚙ 설정  
● Step 1: Sign Up  
● Step 2: Purchase  
핵심 옵션  
● Conversion Window: 7일 / 30일  
● Display → Time to Convert 활성화  
결과  
● 평균 / median conversion 시간 확인  
📊 Report 2: Time to Activation  
⚙ 설정  
● Funnel:  
○ Step 1: Sign Up  
○ Step 2: Key Action (예: 상품 조회 / 콘텐츠 재생)  
KPI  
● Activation까지 걸린 시간

## Page 25
2. Event-relative Time (Time-to-X) 분석  
📌 1. Time to First Purchase ⭐  
🖱 클릭 순서  
1. 좌측 → Analysis → Funnels  
2. Step 1: → Sign Up  
3. Step 2: → Purchase Completed  
4. 우측 옵션: → “Time to Convert” ON  
🎯 결과  
● 평균 시간  
● Median 시간  
📊 Report 3: Repeat Interval  
🔧 생성 경로  
● Insights  
⚙ 설정  
● Event: Purchase  
● Measurement: → Frequency per User  
● Advanced: → Time between events (JQL or formula 활용 가능)  
또는 Cohort 활용  
● “1회 구매자 → 2회 구매까지 시간”

## Page 26
2. Event-relative Time (Time-to-X) 분석  
📌 3. Fast vs Slow Segment  
🖱 클릭  
1. Funnel 결과 화면  
2. 우측 → Filter  
3. 조건 추가:  
conversion time < 1 day → Fast  
> 3 days → Slow  
📌 2. Funnel Lag 분석  
🖱 클릭  
1. Funnels  
2. Step 설정:  
Product Viewed → Add to Cart → Purchase  
3. Time to convert ON

## Page 27
3. Cohort & Retention Curve  
같은 시점에 유입된 사용자들의 시간에 따른 변화  
🎯 1. 주제  
● Cohort 분석 (가입 시점 기준)  
● D+1 / D+7 / D+30  
● Retention Curve  
● Cohort별 행동 속도 차이  
핵심 가치  
이 분석으로 알 수 있는 것:  
1. 언제 이탈이 발생하는가  
● Day 1에서 급락 → onboarding 문제  
● Day 7 이후 급락 → 가치 부족  
2. Retention이 plateau 되는가  
● 일정 수준에서 유지 → “습관 형성 성공”  
● 계속 하락 → product-market fit 문제  
3. 어떤 행동이 retention을 만든다  
● 특정 행동 한 유저 → retention 높음 (핵심 기능 발견 가능)  
4. 언제 메시지를 보내야 하는가  
● 이탈 직전 타이밍 → CRM 개입 가능  
🔥 정리  
Retention = 제품이 살아있는지 확인하는 가장 중요한 지표

## Page 28
3. Cohort & Retention Curve  
핵심 분석  
● 주차별 retention curve  
● cohort별 conversion timing 차이  
● 특정 cohort의 seasonality 영향 비교  
확장 포인트  
● “1월 cohort vs 3월 cohort → 행동 속도 차이”  
● “빠르게 구매한 cohort가 더 오래 남는다”  
● “온보딩 완료 cohort vs 미완료 cohort”  
● 마케팅 캠페인 cohort vs organic cohort 비교  
이건 Mixpanel에서 바로 강력하게 먹히는 영역  
핵심 분석 사례  
📌 사례 1: Day 1 급락  
상황  
● 가입 후 다음날 retention 20%  
인사이트  
● onboarding 실패  
● 첫 경험에서 value 전달 안 됨  
액션  
● Day 0~1 CRM 강화

## Page 29
3. Cohort & Retention Curve  
📌 사례 2: Day 7 급락  
상황  
● 1주일 이후 retention 급락  
인사이트  
● 반복 사용 이유 부족  
액션  
● habit 형성 전략 필요  
📌 사례 3: 특정 cohort만 retention 높음  
상황  
● 특정 월 cohort만 retention 높음  
인사이트  
● 시즌 / 캠페인 / 제품 변경 영향  
📌 사례 4: 특정 행동한 유저 retention ↑  
상황  
● “A 기능 사용 유저” retention 높음  
인사이트  
● 핵심 기능 발견  
액션  
● onboarding에 A 기능 강조

## Page 30
3. Cohort & Retention Curve  
📌 사례 5: plateau 존재  
상황  
● Day 30 이후 retention 안정  
인사이트  
● core user 확보  
📌 사례 6: channel별 retention 차이  
상황  
● 광고 유입 retention 낮음  
인사이트  
● low quality traffic  
📌 사례 7: “Day 0 행동 여부”  
상황  
● Day 30 이후 retention 안정  
인사이트  
● retention predictor

## Page 31
3. Cohort & Retention Curve  
팀 실습 과제  
🧪 과제 1 “우리 서비스 Retention Curve 그리기”  
🧪 과제 2 “이탈이 가장 많이 발생하는 시점 찾기”  
onboarding 개선 가설 도출  
🧪 과제 3 “Best Cohort vs Worst Cohort 비교”  
🧪 과제 4 “Retention driver 행동 찾기”  
● 특정 행동 여부로 cohort 나누기  
🧪 과제 5 cohort별 conversion 속도 비교  
🧪 과제 6 “Retention plateau 존재 여부 확인”  
🧪 과제 7 “Retention 기반 CRM 전략 설계”  
● 언제 메시지 보낼 것인가  
🧪 과제 7 (고급) “Time-to-X와 Retention 관계 분석”

## Page 32
3. Cohort & Retention Curve  
“누가 오래 남는가 → 어떻게 재현할 것인가”  
💡 인사이트  
● 좋은 cohort vs 나쁜 cohort 존재  
● early 행동이 retention 결정  
🚀 CRM 실행  
1. 좋은 cohort 복제 전략  
● best cohort 행동 패턴 → onboarding에 반영  
2. Day 1 행동 유도  
● 가입 후 24시간 집중 메시지  
3. cohort별 메시지 차별화  
● 광고 유입 vs organic  
🧪 실험 설계  
Experiment 1: Day 1 집중 전략  
● A: 일반 onboarding  
● B: Day 1 집중 CRM  
Experiment 2: Cohort별 메시지  
● A: 동일 메시지  
● B: 채널별 메시지  
🎯 KPI  
● D1 / D7 Retention ↑  
● Cohort Gap 감소

## Page 33
3. Cohort & Retention Curve  
📊 Report 1: Retention Curve  
🔧 생성 경로  
● Mixpanel → Retention  
⚙ 설정  
● First Event: Sign Up  
● Returning Event: App Open 또는 Key Action  
● Interval: Daily / Weekly  
📊 Report 2: Cohort별 Conversion  
🔧 방법  
● Funnel 생성  
● Breakdown: → First Touch UTM Source → 또는 Signup Date (Cohort)  
📊 Report 3: Campaign Cohort 비교  
⚙ 설정  
● Breakdown: ○ utm_campaign ○ channel  
여기서 마케팅팀과 연결됨

## Page 34
4. Velocity / Lag 분석  
커리큘럼 주제  
Velocity = 얼마나 빠르게, 얼마나 자주 행동하는가  
Lag = 행동과 행동 사이에 얼마나 시간이 걸리는가, 얼마나 빠르게 행동하는가  
🧠 쉽게 이해하면  
● Velocity = “이 유저 얼마나 열심히 쓰고 있지?”  
● Lag = “다음 행동까지 왜 이렇게 오래 걸리지?”  
🎯 왜 중요한가  
이 분석은 단순 사용량이 아니라:  
● 의도 (Intent)  
● 몰입도 (Engagement)  
● 이탈 위험 (Churn Risk)  
을 동시에 보여줍니다.  
🔥 핵심 지표  
● action velocity (예: 하루 이벤트 수)  
● Session interval  
● Recency / Frequency  
● funnel step 간 이동 속도  
● feature adoption speed  
🔥 핵심 관점  
Velocity가 높으면 → 관심 높음 / 구매 가능성 높음  
Lag가 길어지면 → 관심 감소 / 이탈 신호  
📌 정리  
Velocity = “얼마나 뜨거운 유저인가”  
Lag = “식고 있는가”  
● high intent user vs low intent user 구분 가능  
● early churn prediction 가능

## Page 35
4. Velocity / Lag 분석  
💡 사례  
● “빠르게 행동하는 유저 = high intent”  
● “session 간격이 늘어나는 순간 churn 시작”  
● “짧은 session 반복 = friction”  
📌 사례 1: 빠른 행동 유저 (High Intent)  
상황  
● 가입 후 바로 상품 탐색 + 구매  
인사이트  
● 강한 구매 의도  
액션  
● upsell / cross-sell  
📌 사례 2: Session 간격 증가  
상황  
● 방문 간격이 점점 길어짐  
인사이트  
● churn 초기 신호  
액션  
● re-engagement CRM  
📌 사례 3: Binge vs Slow User  
상황  
● 짧은 시간에 많은 행동 vs 느리게 반복  
인사이트  
● 소비 패턴 차이

## Page 36
4. Velocity / Lag 분석  
📌 사례 4: search → purchase lag  
상황  
● 검색 후 구매까지 2~3일  
인사이트  
● 고민 / 비교 과정  
액션  
● 리타겟팅 광고 타이밍  
사례 5: Feature 사용 밀도  
상황  
● 특정 기능 자주 사용하는 유저 retention 높음  
인사이트  
● 핵심 기능 발견  
📌 사례 6: 행동 속도 감소  
상황  
● 이벤트 발생 빈도 감소  
인사이트  
● 관심도 감소  
액션  
● churn 방지

## Page 37
4. Velocity / Lag 분석  
핵심 인사이트  
🧠 메시지 1 “속도는 의도다”  
🧠 메시지 2 “간격이 길어지면, 관심이 식고 있다”  
🧠 메시지 3 “많이 쓰는 유저가 아니라, 자주 쓰는 유저가 중요하다”  
🧠 메시지 4 “Lag는 churn의 초기 신호다”  
🧠 메시지 5 “행동 밀도는 product-market fit의 신호다”  
팀 실습 과제  
🧪 과제 1 “High Velocity User 정의”  
● 기준 설정  
● 특징 분석  
🧪 과제 2 “Session Interval 분석”  
● 평균 간격  
● 증가 패턴  
🧪 과제 3 “Churn 직전 패턴 찾기”  
● 이벤트 감소  
● 간격 증가  
🧪 과제 4 “Velocity vs Retention 분석”  
🧪 과제 5 “Lag 기반 CRM 전략 설계”  
● 언제 개입할 것인가  
🧪 과제 6 “Fast vs Slow 구매 유저 비교”  
🧪 과제 7 (고급) “Feature usage density 분석”

## Page 38
4. Velocity / Lag 분석  
🧪 과제 4 “Velocity vs Retention 분석”  
🧪 과제 5 “Lag 기반 CRM 전략 설계”  
● 언제 개입할 것인가  
🧪 과제 6 “Fast vs Slow 구매 유저 비교”  
🧪 과제 7 (고급) “Feature usage density 분석”  
🚀 다음 단계 연결  
이걸 이해하면 바로 연결됩니다:  
● CRM 타이밍 최적화  
● High intent targeting  
● Churn 예방 전략

## Page 39
4. Velocity / Lag 분석  
“행동 속도 = 의도 → 속도를 활용하라”  
💡 인사이트  
● fast user = high intent  
● slow user = risk  
🚀 CRM 실행  
1. Fast User 집중 공략  
● 빠른 구매 유저 → upsell  
2. Slow User 가속화  
● 행동 지연 시 nudging  
3. Session 간격 기반 CRM  
● 방문 간격 늘어지면 re-engagement  
🧪 실험 설계  
Experiment 1: High Intent 타겟  
● A: 전체 타겟  
● B: fast user 타겟  
Experiment 2: Nudging Timing  
● A: 즉시  
● B: 지연 후  
🎯 KPI  
● Velocity ↑  
● Conversion Rate ↑

## Page 40
4. Velocity / Lag 분석  
📊 Report 1: Event Velocity  
🔧 생성 경로  
● Insights  
⚙ 설정  
● Event: Any Event  
● Measurement: → Events per User  
Segmentation  
● High vs Low activity user  
📊 Report 2: Funnel Step Lag  
🔧 Funnels  
⚙ 설정  
● Step: ○ Product View → Add to Cart → Purchase  
● 옵션: → Time to convert  
📊 Report 3: Feature Adoption Speed  
⚙ 설정  
● Funnel: ○ Signup → 특정 Feature 사용  
Breakdown:  
● User Type / Channel

## Page 41
4. Velocity / Lag 분석  
📌 1. Events per User  
🖱 클릭  
1. Insights  
2. Event: Any Event  
3. Measure: → Events per User  
📌 2. Session 분석 (세션 이벤트 필요)  
🖱 클릭  
1. Event: Session Start  
2. Measure: → Sessions per User

## Page 42
5. Lifecycle Time 분석  
Lifecycle Time = 유저가 ‘어떤 상태’에 있고, 언제 그 상태가 바뀌는지를 시간 기준으로 분석  
🧠 쉽게 이해하면  
유저는 이런 흐름을 가집니다:  
신규 → 활성 → 반복 → 휴면 → 이탈 → 복귀  
Lifecycle 분석은  
**“지금 이 유저가 어디에 있고, 언제 다음 상태로 넘어가는가”**를 보는 것  
예시  
● 신규 → 활성까지 걸리는 시간  
● 활성 → 휴면까지 걸리는 시간  
● 휴면 → 복귀까지 걸리는 시간  
활용  
● CRM / 리텐션 전략 설계 핵심  
● push timing, re-engagement 타이밍 최적화  
🎯 주제  
● Activation → Retention → Churn  
● Recency 기반 lifecycle  
● Repeat / Reactivation  
🎯 핵심 인사이트  
● 언제 유저가 죽는지  
● 언제 다시 살릴 수 있는지

## Page 43
5. Lifecycle Time 분석  
🔥 핵심 가치  
Lifecycle 분석으로 할 수 있는 것:  
1. Churn을 “사전 탐지” 가능  
● 갑자기 떠나는 게 아니라 특정 단계에서 떨어짐  
2. 개입 타이밍 정확히 잡기  
● 언제 CRM 보내야 하는지 명확해짐  
3. VIP 유저 정의 가능  
● 반복 행동 패턴으로 구분  
4. Retention 전략 설계 가능  
📌 정리  
Lifecycle = “언제, 어떤 상태에서 개입할 것인가”를 알려주는 분석  
핵심 인사이트  
“유저는 상태를 가진다”  
“이탈은 갑자기 일어나지 않는다”  
“모든 유저에게 같은 메시지를 보내면 안 된다”  
“개입 타이밍이 전부다”  
“좋은 유저는 반복한다”

## Page 44
5. Lifecycle Time 분석  
핵심 분석 사례  
📌 사례 1: Activation 실패  
상황  
● 가입은 했는데 사용 안 함  
인사이트  
● onboarding 실패  
액션  
● 가입 직후 CRM  
ex. 7일 inactive = churn  
📌 사례 2: Active → Dormant 전환  
상황  
● 사용하다가 갑자기 안 옴  
인사이트  
● 관심 감소  
액션  
● re-engagement  
📌 사례 3: Repeat 유저 (VIP)  
상황  
● 반복 구매 유저 존재  
인사이트  
● high LTV  
액션  
● 혜택 제공  
ex. 첫 구매 후 7일 내 재구매

## Page 45
5. Lifecycle Time 분석  
핵심 분석 사례  
📌 사례 4: Churn 직전 행동  
상황  
● 사용 빈도 감소  
인사이트  
● 이탈 신호  
📌 사례 5: Reactivation  
상황  
● 다시 돌아오는 유저  
인사이트  
● 복귀 트리거 존재  
📌 사례 6: Lifecycle별 행동 차이  
상황  
● 신규 vs 기존 유저 행동 다름  
인사이트  
● 메시지 분리 필요  
ex. lifecycle별 Feature Usage

## Page 46
5. Lifecycle Time 분석  
팀 실습 과제  
🧪 과제 1 “Lifecycle 정의하기”  
● 단계 정의  
● 기준 설정  
🧪 과제 2 “Churn 기준 정의”  
● 7일 / 30일 비교  
🧪 과제 3 “각 단계별 유저 비율 분석”  
최종 핵심 정리  
👉 Lifecycle 분석은 ‘상태 변화’를 보는 것이다  
👉  
● 언제 활성화되는가  
● 언제 식는가  
● 언제 떠나는가  
● 언제 돌아오는가  
🚀 다음 단계 연결  
이걸 이해하면 바로 연결됩니다:  
● CRM 자동화  
● Churn 예방  
● LTV 극대화  
🧪 과제 4 “Churn 직전 행동 분석”  
🧪 과제 5 “Reactivation timing 찾기”  
🧪 과제 6 “VIP 유저 정의”  
🧪 과제 7 (고급) “Lifecycle별 CRM 전략 설계”

## Page 47
5. Lifecycle Time 분석  
“유저 상태 변화 → 언제 개입할 것인가”  
💡 인사이트  
● churn 전 신호 존재  
● reactivation window 존재  
🚀 CRM 실행  
1. Churn 방지  
● inactivity 7일 → 리마인드  
2. Reactivation 캠페인  
● dormant user 대상 할인  
3. VIP 육성  
● early repeat user → 혜택 제공  
🧪 실험 설계  
Experiment 1: Churn 방지 타이밍  
● A: 7일  
● B: 14일  
Experiment 2: Reactivation 메시지  
● A: 할인  
● B: 콘텐츠  
🎯 KPI  
● Churn Rate ↓  
● Reactivation Rate ↑

## Page 48
5. Lifecycle Time 분석  
📊 Report 1: Recency Distribution  
🔧 생성 경로  
● Insights  
⚙ 설정  
● Metric: → Last Seen (computed property 활용)  
● 또는 → cohort: ○ “Last active within 1 day / 7 days / 30 days”  
📊 Report 2: Lifecycle Funnel  
⚙ 설정  
● Funnel: ○ Signup → Active → Repeat  
Active 정의 중요  
● 예: “3회 이상 사용”  
📊 Report 3: Reactivation  
⚙ 방법  
● Cohort 생성: ○ “30일 inactive user”  
● 이후: ○ 해당 cohort의 이벤트 발생 여부 분석

## Page 49
5. Lifecycle Time 분석  
📌 2. Reactivation  
🖱 클릭  
1. cohort: → dormant users  
2. Event: → App Open  
📌 1. Churn 분석  
🖱 클릭  
1. Cohort 생성: → “Last Active > 7 days”  
2. Insights: → cohort 선택

## Page 50
6. External Context 분석  
1⃣ 커리큘럼 주제  
🎯 한 줄 정의  
External Context 분석 =  
사용자 행동을 ‘외부 환경/상황’과 함께 해석하는 분석  
🧠 쉽게 이해하면  
같은 시간이라도:  
● 월요일 오전 vs 공휴일 오전  
● 비 오는 날 vs 맑은 날  
● 급여일 전 vs 후  
행동은 완전히 달라집니다  
🎯 왜 중요한가  
기존 분석은 이렇게 합니다:  
❌ “매출이 올랐다”  
External Context 분석은 이렇게 바꿉니다:  
● 급여일 때문인가?  
● 프로모션 때문인가?  
● 시즌 효과인가?  
예시  
● 날씨 (비 오는 날 vs 맑은 날)  
● 급여일 (월급날 전후)  
● 공휴일 / 연휴 vs 평일  
● 프로모션 기간 vs 비기간  
이건 온/오프 연동 분석으로 자연스럽게 이어짐

## Page 51
6. External Context 분석  
📌 정리  
External Context = “왜 그때 행동했는가”를 설명하는 변수  
핵심 인사이트  
“데이터는 항상 맥락과 함께 해석해야 한다”  
“모든 변화에는 이유가 있다”  
“시간만 보면 절반만 보는 것이다”  
“External Context는 실험 변수다”  
“마케팅은 타이밍 게임이다”  
🎯 주제  
● 캠페인 전/중/후  
● 급여일 / 공휴일 / 날씨  
● 릴리즈 / 업데이트 영향  
🔥 핵심 가치  
이 분석으로 할 수 있는 것:  
1. 진짜 원인 vs 착시 구분  
● 광고 효과인지  
● 계절성인지  
2. 타이밍 기반 마케팅 가능  
● 언제 캠페인 해야 하는지 명확  
3. 상황 맞춤 개인화 가능  
4. 실험 설계 정확도 상승

## Page 52
6. External Context 분석  
2⃣ 핵심 분석 사례  
📌 사례 1: 급여일 효과  
상황  
● 매달 10일 이후 구매 급증  
인사이트  
● 가처분 소득 증가  
액션  
● 고가 상품 노출  
📌 사례 2: 프로모션 종료 직전 Rush  
상황  
● 종료 직전 트래픽 폭증  
인사이트  
● urgency 효과  
📌 사례 3: 공휴일 패턴 변화  
상황  
● 주말보다 공휴일 트래픽 높음  
인사이트  
● 여유 시간 증가

## Page 53
6. External Context 분석  
2⃣ 핵심 분석 사례  
📌 사례 4: 날씨 영향  
상황  
● 비 오는 날 콘텐츠 소비 증가  
인사이트  
● 실내 활동 증가  
📌 사례 5: 릴리즈 이후 변화  
상황  
● 기능 업데이트 후 retention 감소  
인사이트  
● UX 문제 발생  
📌 사례 6: 시즌성 (성수기 / 비수기)  
상황  
● 여름/겨울 매출 차이  
인사이트  
● 산업 구조 영향

## Page 54
6. External Context 분석  
팀 실습 과제  
🧪 과제 1 “급여일 효과 분석”  
🧪 과제 2 “캠페인 전후 성과 비교”  
🧪 과제 3 “공휴일 vs 평일 행동 차이”  
🧪 과제 4 “날씨 또는 이벤트 영향 분석”  
🔥 최종 핵심 정리  
👉 External Context 분석의 본질  
시간 → 언제  
Event → 얼마나 빠르게  
Lifecycle → 상태  
Context → 왜  
👉  
“왜 그때 행동했는가”를 설명할 수 있어야 진짜 인사이트다  
🧪 과제 5 “Release 전후 UX 변화 분석”  
🧪 과제 6 “Context 기반 CRM 전략 설계”  
🧪 과제 7 (고급) “Context별 전환율 비교”

## Page 55
6. External Context 분석  
🚀 다음 단계 연결  
이걸 이해하면:  
● 타이밍 기반 CRM  
● 시즌 전략  
● 캠페인 최적화  
“시간 = 실험 변수”  
💡 인사이트  
● 급여일 효과  
● 캠페인 carry-over  
● 날씨 영향  
🧪 실험 설계  
Experiment 1: Payday 타겟팅  
● A: 일반  
● B: payday 집중  
Experiment 2: 캠페인 종료 효과  
● A: 종료 없음  
● B: 종료 24시간 전 알림  
🎯 KPI  
● Campaign Lift  
● Context-based Conversion  
🚀 CRM 실행  
1. Payday Campaign  
● 급여일 직후 고가 상품 노출  
2. 캠페인 종료 직전 push  
● urgency 활용  
3. 날씨 기반 메시지  
● 비 오는 날 → 실내 콘텐츠 추천

## Page 56
6. External Context 분석  
📊 Mixpanel 설계  
Dashboard: Context  
1. Campaign Analysis  
● Filter: ○ campaign 기간  
2. Before vs After  
● feature release 기준 비교  
3. External Tagging  
● property: ○ holiday / payday flag  
📌 1. 캠페인 분석  
🖱 클릭  
1. Insights  
2. Filter: → campaign = X  
📌 2. Before vs After  
🖱 클릭  
1. Date filter  
2. Compare: → before / after  
📌 3. Payday 분석  
🖱 클릭  
1. Property 생성: → is_payday  
2. Breakdown: → is_payday

---

# 최종 확인 규칙
작업 완료 전 아래를 반드시 체크할 것.

- [ ] 원문 전체 내용이 슬라이드 구조에 반영되었는가
- [ ] 각 섹션별 개념 / 사례 / 실습 / CRM / 실험 / Mixpanel 리포트가 모두 포함되었는가
- [ ] 중복은 정리했되 내용 손실은 없는가
- [ ] 교육용/실무용/제안용으로 모두 재활용 가능하게 구성했는가
- [ ] 발표 흐름이 자연스러운가

