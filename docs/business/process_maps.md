# Process Maps — CreatorPulse India

BPMN-style swim-lane diagrams for the three headline journeys, rendered in Mermaid (GitHub renders these inline). Each lane is a subgraph representing an actor or system. Diamonds are decision gateways.

---

## 1. Creator onboarding & analysis journey

```mermaid
flowchart LR
  subgraph Creator
    A1([Visits app]) --> A2[Selects 'Creator']
    A2 --> A3[Searches channel by name]
    A6{Channel<br/>indexed?}
    A6 -- No --> A7[Sees 'not indexed yet']
    A6 -- Yes --> A8[Views profile + growth curve]
    A8 --> A9[Reads engagement-quality percentile]
    A9 --> A10[Views niche-demand forecast]
    A10 --> A11([Acts on optimisation tip])
  end
  subgraph System
    S1[persona_selected event]
    S2[Query corpus for channel]
    S3[Load metrics time series + embedding]
    S4[Compute archetype percentile]
    S5[Serve 12-week niche forecast]
  end
  A2 --> S1
  A3 --> S2 --> A6
  A8 --> S3 --> S4 --> A9
  A10 --> S5
```

---

## 2. Brand campaign-launch journey

```mermaid
flowchart LR
  subgraph Brand
    B1([Visits app]) --> B2[Selects 'Brand']
    B2 --> B3[Composes brief + niche + budget]
    B3 --> B4[Clicks 'Find creators']
    B7[Reviews ranked top-20]
    B8[Opens score breakdown + risk signals]
    B9{Risk<br/>acceptable?}
    B9 -- No --> B10[Skips creator]
    B9 -- Yes --> B11[Adds to shortlist]
    B11 --> B12{Shortlist<br/>full / done?}
    B12 -- No --> B7
    B12 -- Yes --> B13[Compares side by side]
    B13 --> B14([Exports shortlist CSV])
  end
  subgraph MatchEngine
    M1[Embed brief]
    M2[Stage 1: similarity candidates]
    M3[Stage 2: rerank by similarity + niche + risk + budget]
    M4[Attach risk indicator + cost estimate]
  end
  B4 --> M1 --> M2 --> M3 --> M4 --> B7
  B8 -. reads .-> M4
```

---

## 3. Engagement-risk feedback loop

```mermaid
flowchart LR
  subgraph Ingestion
    I1[Daily/weekly API refresh] --> I2[Land raw + normalise]
    I2 --> I3[Update metrics time series]
  end
  subgraph Features
    F1[Recompute engagement + growth + cadence features]
  end
  subgraph Model
    P1[Score engagement-risk indicator]
    P2[SHAP: top contributing signals]
    G1{F1 vs baseline<br/>drop > 5%?}
    G1 -- Yes --> G2[Block release in CI]
    G1 -- No --> G3[Ship updated scores]
  end
  subgraph Product
    R1[Risk indicator shown on profile + match]
    R2[Brand reviews, accepts/rejects]
  end
  I3 --> F1 --> P1 --> P2 --> R1 --> R2
  P1 --> G1
  G3 --> R1
```

---

*Notes: lanes are modelled as Mermaid subgraphs (BPMN pools/lanes); decision gateways are diamonds. The risk indicator is reported as risk-on-public-signals, never platform-verified fraud, consistent with `FRD.md` F14 and the model card.*
