# User Stories — CreatorPulse India

**Cadence:** Agile-Scrum, two-week sprints. **Tracking:** GitHub Projects board (Backlog → In Progress → Review → Done), one issue per story, labelled `creator` / `brand`, story points on the Fibonacci scale (1, 2, 3, 5, 8).
**Companion to:** `FRD.md` (each story references the functional requirements it satisfies).

Story-point total: **48** across 12 stories.

---

## Creator persona (supply side)

### CS-1 — Find my channel  ·  3 pts  ·  satisfies F22
**As** an independent creator, **I want** to search my channel by name, **so that** I can pull up my own analytics without knowing my channel ID.
- **AC1:** Typing a partial name returns matching indexed channels.
- **AC2:** Selecting a result loads the profile with subscribers, views, niche/archetype badge and average views per video.
- **AC3:** A channel not in the corpus returns a clear "not indexed yet" message, not an error.

### CS-2 — See my growth trajectory  ·  5 pts  ·  satisfies F23
**As** a creator, **I want** to see my subscriber/view growth with a forward projection, **so that** I can judge whether my channel is accelerating or stalling.
- **AC1:** Growth curve renders from the channel's metrics time series.
- **AC2:** A forward projection overlays the historical curve.
- **AC3:** The projection is visually distinct from actuals and labelled as a projection.

### CS-3 — Understand my engagement quality  ·  5 pts  ·  satisfies F24
**As** a creator, **I want** an engagement-quality score with my percentile inside my archetype, **so that** I know how I compare to similar creators rather than to the whole platform.
- **AC1:** Score is shown with its percentile within the creator's archetype.
- **AC2:** The comparison cohort (archetype) is named on screen.
- **AC3:** Methodology is linked, with honest framing (public-signal based).

### CS-4 — Track my niche's demand  ·  3 pts  ·  satisfies F25, F28
**As** a creator, **I want** a 12-week niche-demand forecast, **so that** I can time content to rising demand.
- **AC1:** Forecast renders for the creator's niche with credible-interval bands.
- **AC2:** Whether the niche is accelerating or declining is stated in plain language.
- **AC3:** The forecast is labelled as a simulated weekly series pending real demand history.

### CS-5 — Benchmark against peers  ·  3 pts  ·  satisfies F26
**As** a creator, **I want** a table of the closest creators in my archetype, **so that** I can benchmark against direct peers.
- **AC1:** Up to 10 nearest peers in the same archetype are listed by subscriber proximity.
- **AC2:** Each row shows comparable metrics (subs, growth, engagement).

### CS-6 — Get optimisation suggestions  ·  2 pts  ·  satisfies F27
**As** a creator, **I want** plain rule-based suggestions, **so that** I have a concrete next action.
- **AC1:** At least one suggestion is generated from a clear rule (e.g. cadence vs cluster median).
- **AC2:** Suggestions are labelled rule-based, not ML predictions.

---

## Brand persona (demand side)

### BR-1 — Compose a brief  ·  3 pts  ·  satisfies F16
**As** a brand marketer, **I want** to write a free-text brief with a niche and budget, **so that** I can describe my campaign in my own words.
- **AC1:** Brief composer accepts free text, a niche selector and a budget input.
- **AC2:** The brief is captured for the match request.

### BR-2 — Get a ranked, screened shortlist  ·  8 pts  ·  satisfies F17, F18, F19
**As** a brand marketer, **I want** a ranked list of fit creators with engagement-risk already applied, **so that** I can shortlist quickly without manual vetting.
- **AC1:** Submitting a brief returns the top 20 creators.
- **AC2:** Each result shows a match score and an engagement-risk indicator.
- **AC3:** Ranking completes within a few seconds on the deployed app.

### BR-3 — Understand why a creator ranked  ·  5 pts  ·  satisfies F19, F13
**As** a brand marketer, **I want** a visible score breakdown per creator, **so that** I trust the ranking instead of treating it as a black box.
- **AC1:** A breakdown shows the components (similarity, niche overlap, risk penalty, budget fit).
- **AC2:** The risk indicator lists its top contributing signals.
- **AC3:** Wording frames risk as public-signal based, never verified fraud.

### BR-4 — See estimated integration cost  ·  3 pts  ·  satisfies F21
**As** a brand marketer, **I want** a reach-based cost estimate per creator, **so that** I can sanity-check fit against budget.
- **AC1:** Each creator shows an estimated sponsored-video cost.
- **AC2:** The estimate is disclosed as a reach-based estimate, not the creator's actual income or quote.

### BR-5 — Build and compare a shortlist  ·  5 pts  ·  satisfies F20
**As** a brand marketer, **I want** to add up to 5 creators to a shortlist and compare them side by side, **so that** I can make a final pick.
- **AC1:** Up to 5 creators can be added to a shortlist that persists per session.
- **AC2:** A comparison view shows the shortlisted creators' key metrics side by side.

### BR-6 — Export the shortlist  ·  3 pts  ·  satisfies F30
**As** an agency planner running many briefs, **I want** to export a shortlist to CSV, **so that** I can share it with clients and reuse it across tools.
- **AC1:** A shortlist or results table exports to CSV.
- **AC2:** The export action is captured as a product-analytics event.

---

*Sprint plan: creator-side stories (CS-1…CS-6) and core brand stories (BR-1…BR-3) are sprint-1 must-haves; BR-4…BR-6 and CS-5/CS-6 are sprint-2. All stories are tracked as GitHub Projects issues with the labels and point values above.*
