# Goddi — Session 2B Content Outline

**Goal:** ~60 cards across 5 years of a Ward 37 Councillor tenure. This is the
*shape* — character, hook, choices, stat impact, arc/flag tags. Bilingual prose
(bn + en) gets written in **Session 2C** once you've reacted to this.

**Legend:**
- `S##` / `C##` = existing stub cards (already in deck)
- `A##` = new arc/standalone cards
- `M##` = milestone events (forced on a specific day)
- `→` = right swipe, `←` = left swipe
- `[req: …]` = requires flag set
- `[blk: …]` = blocked by flag set
- `[party: …]` = restricted to specific party
- Stats: **J**=janata (people), **D**=dol (party), **P**=proshashon (admin), **T**=tohobil (treasury)

---

## YEAR 1 — Settling in

*Honeymoon period. Small dilemmas. Player learns the role. Stakes low.*

| # | Char (role) | Hook | ← Left | → Right |
|---|---|---|---|---|
| **S03** | Azad Chacha (security guard) | 3 months unpaid, Eid coming | Pay him (+J −T) | Later (−J +T) |
| **S05** | Teen delegation | Want a basketball court | Approved (+J −T) | Studies first (−J +D) |
| **S08** | Shahidul Haque (party worker) | Wants a selfie | Take it (+D −J) | Back to work (−D +T) |
| **S14** | Karim Miah (resident) | 6 months tax unpaid | Let it go (+J −T) | Law for everyone (−J +T) |
| **S27** | Rehana Begum (resident) | No water 3 days | Pressure DNCC (−P +J) | Send tankers (−T +J) |
| **C01** | Rafy Hossain (SBYC president) | Health camp ribbon-cutting | I'll be there (+J −T) | Send deputy (−J +D) |
| **A01** | Imam saheb (mosque committee) | Wants ward fund for new mic system | Donate (−T +J) `→ trigger: mosque_funded` | Personal money only (−D +P) |
| **A02** | Garbage truck driver's family | Truck hit a child, want compensation | Pay quietly (−T +J) `→ trigger: compensation_paid` | Push to insurance (−J +P) |
| **A03** | Local trader (envelope) | "Festival gift" cash envelope | Accept gracefully (+T −P) `→ trigger: taking_envelopes` | Decline politely (−D +P) |
| **A04** | Footpath hawkers' rep | Hawkers blocking school footpath | Evict them (−J +P) | Designated zone (+J −T) |
| **A05** | BPDB area engineer | Defend load-shedding publicly | Defend BPDB (−J +P) | Public criticism (+J −P) |
| **A06** | Old Hindu widow | Pension paperwork stuck for 8 months | Personally fix it (+J −P slightly) | Refer to office (−J +P) |
| **M01** | **Eid-ul-Fitr** | `force_on_day: ~110` — Bonus expectations from staff | Pay all bonuses (−T +D +J) | Token gift (+T −D −J) |

**Year 1 count:** 13 cards (6 existing + 6 new + 1 milestone)

---

## YEAR 2 — Real problems

*Stakes rise. First scandals. Tower arc + PA scandal arc both start here.*

| # | Char (role) | Hook | ← Left | → Right |
|---|---|---|---|---|
| **A07** | Bashir Developer | 12-story tower on plot zoned for 6 — wants safety waivers | Approve (+T −P) `→ trigger: tower_approved` | Hold to code (−T +P) |
| **A08** | DNCC officer | Garbage contract renewal — MP's cousin wants it | Award to cousin (+T +D −P) | Open tender (−D +P +J) |
| **A09** | News flash (PA scandal #1) | Your PA Selim caught taking ৳50K bribe | Defend publicly (−P +D) `→ trigger: pa_protected` | Suspend immediately (−D +P) `→ trigger: pa_fired` |
| **A10** | ACC inquiry letter | `[req: pa_protected]` — Anti-Corruption Commission writes | Stonewall (−P) `→ trigger: acc_stonewalled` | Cooperate fully (−D +P) |
| **A11** | Daily Star reporter | `[req: pa_protected]` — Wants comment on Selim case | "Witch hunt" statement (−J +D) | Concede mistakes (−D +J) |
| **A12** | 2am phone call | `[req: pa_protected]` — Selim arrested | Hire defense lawyer (−T) `→ trigger: pa_loyal` | Public distance (−D +P) |
| **A13** | School principal | Drug dealing near girls' school | Police raid (+J −D) | Quiet warning (−J +D) |
| **A14** | Madrasa committee | Want ward-funded scholarships (50 students) | Fund (−T +J) `[party: islami_oikko adds +D]` | Refer to private donors (−D +T) |
| **A15** | MP's office (call) | MP's nephew wants out-of-zone govt school seat | Make it happen (+D −P) | Apply normally (−D +P) |
| **A16** | Rival party councillor | Joint Iftar event invite | Accept (+J −D) | Decline (−J +D) |
| **A17** | Slum committee | Eviction notice from city — they want you to fight it | Fight eviction (+J −P) | Stay neutral (−J +P) |
| **M02** | **Monsoon flood** | `force_on_day: ~520` — Wards 36/37/38 underwater | Personal walkthrough waist-deep (+J −T) `→ trigger: flood_walk` | Statement from office (−J +D) |

**Year 2 count:** 12 cards

---

## YEAR 3 — Mid-tenure pressure

*Callbacks. Tower might collapse. Halfway-through fatigue. Single woman tenant arc.*

| # | Char (role) | Hook | ← Left | → Right |
|---|---|---|---|---|
| **A18** | News flash | `[req: tower_approved]` `force_on_day: ~900` — **Tower collapses. 7 dead, 23 injured.** | Take responsibility (−D +J +P) | Blame contractor (−J +D) `→ trigger: tower_blamed_contractor` |
| **S24** | Single-woman tenant (school teacher) | Landlord cutting her water, harassing her to vacate | Confront landlord (+J −D if landlord is donor) | Refer to courts (−J +P) |
| **A19** | Health officer | Dengue outbreak — fogging budget short | Reallocate from road fund (−T +J +P) | Wait for DNCC (−J −P) |
| **A20** | Old friend Ariful | Now broke, asks for ward driver job (no qualification) | Hire him (+D −P) | Refer to skills training (−D +P) |
| **A21** | Police OC | Asks you to "calm" complaints about a custodial death | Issue calming statement (+P −J) `→ trigger: oc_owes_you` | Demand independent inquiry (−P +J) |
| **A22** | Rohingya family | Seeks emergency shelter — politically toxic | Quiet referral to NGO (−T +J) | Refuse, "not my jurisdiction" (−J +D) |
| **A23** | Bashir Developer (callback) | `[req: tower_approved] [blk: tower_blamed_contractor]` — Wants 2nd tower approved | Approve again (+T) `→ trigger: tower2_approved` | Refuse (−T +P) |
| **A24** | Party VP | Demands ৳5 lakh "campaign fund contribution" | Pay (−T +D) | Refuse (−D +P) |
| **A25** | Hindu families' delegation | Durga Puja pandal permit blocked by extremist mob | Police protection, permit granted (+J −D if islami_oikko) | Suggest different venue (−J +P) |
| **A26** | ACC investigator | `[req: acc_stonewalled OR taking_envelopes]` — Visits in person | Settle quietly (−T +P) | Fight charges (−P +D) |
| **A27** | Karim Miah (S14 callback) | Now sick, asks for hospital admission help | Personal call to director (+J −P slightly) `→ trigger: karim_helped` | Refer to ward officer (−J) |
| **M03** | **Eid-ul-Azha waste crisis** | `force_on_day: ~1080` — Hides and offal piling up | Emergency cleanup overtime (−T +J) | Wait it out (−J) |

**Year 3 count:** 12 cards (1 conditional collapse may not fire)

---

## YEAR 4 — Election year

*Campaign noise. Defection offers. Vote-buying. Family pressure.*

| # | Char (role) | Hook | ← Left | → Right |
|---|---|---|---|---|
| **A28** | Party youth wing | Opposition tearing down posters | Fund counter-blitz (−T +D) | Ignore (−D +J) |
| **A29** | Rival party emissary | Defection offer + ward chairman seat | Accept (−D heavy +T +P) `→ trigger: defected` | Stay loyal (+D −T) |
| **A30** | Wealthy industrialist | Wants ward-level land allotment for "industrial park" | Approve (+T heavy −J −P) | Refuse (−T +J) |
| **A31** | Cousin (family) | Asks for ward staff job (assistant) | Hire him (+D −P) | Refer to recruitment (−D +P) |
| **A32** | Activist youth (S05 grown up) | Demand transparent budget audit | Publish audit (+J −D if `taking_envelopes`) | Defer (−J +D) |
| **A33** | TV producer | 30-min prime-time interview slot | Accept (+J +D if no scandal flags) | Decline (−J +P) |
| **A34** | MP (private call) | Suggests ৳500/household vote-buying in slum areas | Quietly fund (+D −T −P) `→ trigger: votebuying` | Refuse (−D +P) |
| **A35** | Imam (A01 callback) | Will mention you favorably in Friday khutba if you fund madrasa | Fund (−T +J) `[party: islami_oikko +D]` | Decline (−J) |
| **A36** | Election Commission inspector | `[req: votebuying]` — Audit visit | Bribe (−T) `→ trigger: ec_bribed` | Cooperate (−D +P) |
| **A37** | Wife (private) | Complains you're never home | Take 3-day break (−D +P) | Push through (+D −P) |
| **A38** | Old voter (S14/A27 thread) | `[req: karim_helped]` — Campaigns for you in his neighborhood | Thank him publicly (+J +D) | Take it for granted (−J) |
| **M04** | **Election Day** | `force_on_day: ~1500` — Turnout decision | Aggressive GOTV (−T +D, +J if no `votebuying`) | Hands-off (−D) |

**Year 4 count:** 12 cards

---

## YEAR 5 — Final reckoning

*Legacy. Old debts called in. Final scandals. End of tenure.*

| # | Char (role) | Hook | ← Left | → Right |
|---|---|---|---|---|
| **A39** | Party leadership | Re-inauguration — public thanks expected | Effusive thanks (+D −P) | Brief polite mention (−D +P) |
| **A40** | News flash | `[req: tower2_approved]` `force_on_day: ~1620` — **Second tower collapses. Worse than the first.** | Resign (−D heavy +J) | Deny everything (−J −P +D) |
| **A41** | Selim (PA, callback) | `[req: pa_loyal]` — Released from jail, wants relocation help | Set him up overseas (−T) | Refuse (−D) `→ trigger: pa_betrayed` |
| **A42** | Investigative journalist | Writing a book about your tenure, wants sit-down | Sit for interview (+J if clean, −J if dirty) | Decline (−J +P) |
| **A43** | Imam (A01/A35 callback) | `[blk: mosque_funded if Yr1 declined]` — Backs opposition publicly | Withdraw mosque funding (−J +D) | Continue funding (−D +J) |
| **A44** | Engineering dept | Final big infra: ৳3 crore canal bridge | Push it through (−T +J +D legacy) | Defer to next councillor (−D) |
| **A45** | Party general secretary | Wants you to back X as successor; Y is more popular locally | Back X (+D −J) | Back Y (−D +J) |
| **A46** | Rafy Hossain (C01 callback) | Asks for permanent SBYC building grant | Approve (−T +J) `→ trigger: sbyc_legacy` | Polite refusal (−J) |
| **A47** | Self / family | Final Eid-ul-Fitr as Councillor — distribution scale | Big personal distribution (−T +J) | Restrained, dignified (−J +P) |
| **A48** | Party old guard | Quiet retirement offer: overseas property in exchange for endorsing party candidate | Accept (+T −J if leaks) `→ trigger: corrupt_retirement` | Decline (−T +P) |
| **A49** | Opposition leak | `[req: taking_envelopes OR tower_approved]` — Long-suppressed audit leaked | Public defense (−J −P +D) | Quiet settlement (−T −D +P) |
| **A50** | Karim Miah's family | `[req: karim_helped]` — Karim died, janaza tonight | Attend personally (+J) | Send wreath (−J) |
| **M05** | **Year-5 final speech** | `force_on_day: ~1800` — Speech to ward committee | Honest reflection (+J +P −D) | Triumphalist victory (+D −J −P) |

**Year 5 count:** 13 cards (some conditional)

---

## Totals & arc map

- **Total cards:** 6 stub + 50 new + 5 milestones = **61**
- **Major arcs:**
  - **Tower arc:** A07 → A18 (collapse if approved) → A23 (2nd tower offer) → A40 (2nd collapse)
  - **PA scandal arc:** A09 → A10 → A11 → A12 → A41 (Selim release callback)
  - **Karim Miah thread:** S14 → A27 → A38 → A50
  - **Mosque/Imam thread:** A01 → A35 → A43
  - **Anti-Corruption thread:** A03 (envelope) → A26 → A49
  - **SBYC/Rafy thread:** C01 → A46
  - **Activist youth thread:** S05 → A32
- **5 milestones:** Eid-ul-Fitr Yr1, Monsoon flood Yr2, Eid-ul-Azha Yr3, Election Day Yr4, Final speech Yr5
- **Party-variant candidates** (~12 cards where party framing changes): A01, A03, A14, A15, A22, A24, A25, A29, A33, A35, A39, A45

---

## Open questions for you

1. **Tone calibration**: Is this the right mix of dark/satirical/grounded? A18 (tower collapse with deaths) is the heaviest moment. M02 (monsoon flood walkthrough) is the most heroic. A22 (Rohingya family) is the most politically charged.
2. **Missing card types?** Anything specifically about Dhaka ward life I haven't touched: e.g., gangster (mastaan) extortion, school admission VIP quotas in detail, drainage/road repair theatrics, NRB returnee tensions, mobile court harassment, traffic jam politics, kabuliwala loan sharks, student political wings.
3. **Real-world echoes**: Anything that's *too* close to a real Dhaka incident and should be made more abstract?
4. **Character names**: All names are placeholders — Bashir Developer, Selim PA, Ariful, etc. Want to keep, swap, or want me to invent more?
5. **Player ending**: Right now there's no win condition tied to flag state — only "survive 1825 days." Should "winning clean" (no `taking_envelopes`, no `corrupt_retirement`, no `tower_approved` collapse) trigger a *better* victory screen than "winning dirty"?

Mark up this doc however works for you — strikethroughs, comments, ALL CAPS REWRITE THIS, whatever. Once you sign off, 2C writes the full bilingual prose.
