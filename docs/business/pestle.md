# PESTLE — CreatorPulse India

Macro-environment analysis for an Indian creator-economy intelligence product.

---

## Political

- The Indian government has signalled strong support for the creator economy, including a large announced fund to foster content creators, innovation and reach — a tailwind for the broader ecosystem.
- Advertising-disclosure norms for paid promotions are tightening (ASCI guidelines requiring clear disclosure of material connections). A tool that helps brands vet creators and document due diligence aligns with this direction.
- **Implication:** Position CreatorPulse as a compliance-friendly diligence layer, not a way to game metrics.

## Economic

- The Indian influencer-marketing market is estimated at **~₹3,400 cr in 2025**, growing **~25% YoY** (EY; Kofluence; Goat/Kantar — see `market_sizing.md`).
- Creator professionalisation is rising — a growing share of creators now operate as formal businesses — increasing both supply quality and willingness to pay for self-serve tooling.
- Brands are shifting budget from vanity metrics toward engagement and outcome measurement, raising demand for quality screening.
- **Implication:** Demand for affordable discovery + quality screening is structurally rising; mid-market budgets favour transparent, low-cost tools.

## Social

- Gen Z and millennial audiences place high trust in creators for product discovery and purchase decisions; trust and credibility are the top reasons brands engage influencers.
- Tier-2/tier-3 and regional-language creators are a fast-growing segment, making India-specific niche and archetype intelligence valuable.
- Audience scepticism toward inflated engagement raises the value of visible quality screening.
- **Implication:** India-specific, multi-language-aware intelligence and transparent screening match where social trust is shifting.

## Technological

- Embedding-based matching and LLM-augmented discovery are moving from differentiator to table stakes; incumbents are already adding AI search and conversational interfaces.
- Free-tier OSS infrastructure (managed Postgres, vector search, scheduled CI, free analytics tiers) makes a zero-marginal-cost product viable.
- **Implication:** Technique alone is not a moat; data quality and India-specificity are. Build on free-tier OSS to keep the cost structure defensible.

## Legal

- Platform terms of service govern data acquisition; CreatorPulse uses only the **official YouTube Data API** in accordance with its terms and does not scrape (`LEGAL.md`).
- Engagement-risk screening must be framed as risk-on-public-signals, never platform-verified fraud, to avoid defamation/accuracy exposure.
- Open-dataset seed lists carry attribution duties (the seed corpus is Kaggle ODC-By; credited in `LEGAL.md`).
- **Implication:** Compliance and honest framing are non-negotiable product constraints, documented in `LEGAL.md` and the model card.

## Environmental

- Limited direct environmental impact for a software product. The lightweight free-tier footprint (no always-on heavy compute; cloud demos torn down immediately) is a minor positive.
- **Implication:** Not a decision driver, but the low-compute posture is consistent with cost discipline and is worth noting for completeness.

---

*PESTLE read: political, economic and social forces are tailwinds; the binding constraints are legal (API terms, honest framing) and technological (data quality as the moat, not the algorithm).*
