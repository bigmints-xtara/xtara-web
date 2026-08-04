# Xtara Web Product Plan

**Status:** Proposed execution plan  
**Date:** 2026-07-21  
**Companion:** [XTARA_PRODUCT_VISION.md](./XTARA_PRODUCT_VISION.md)

## Executive decision

The web app should begin with a focused **Grade 8–10 Trusted Discovery** journey. Grade 8 learners explore, Grade 9 learners test assumptions, and Grade 10 learners compare routes and make stream or direction decisions. The experience shares one platform and learner profile while changing specificity, activities, language, and outcomes by stage.

The current assessment can be retained only as prototype input and migration reference. It is not sufficient for trusted psychometric or percentage-fit claims. Assessment V2 is a first-class product, research, content, data, and evaluation workstream.

## Current-state assessment verdict

### What is useful

- The questionnaire is configuration-driven and supports conditional Class 10 and Class 12 branches.
- It captures relevant starting signals: subject confidence, activities, interests, self-described traits, career motivations, education context, and parental influence.
- The experience is short enough to complete and is already integrated with recommendation generation.
- The Dream Careers matcher retains per-factor match details, which can become a basis for explainability after redesign.

### Why it is not yet good enough

#### Instrument quality

- The instrument is primarily a short self-description form, not a validated psychometric assessment.
- Broad multi-select questions are easy to answer aspirationally and do not distinguish preference, exposure, confidence, and demonstrated ability.
- There are no repeated or reverse-coded items, consistency checks, uncertainty measures, behavioral scenarios, or normative validation.
- “Strength” and “weakness” are self-reported without evidence such as grades, projects, teacher input, or activity history.
- The output does not distinguish strong evidence from tentative evidence.

#### Coverage

- The current grade question supports only Classes 10 and 12. It excludes Grades 8 and 9, where career conversations and exploration already begin, while product messaging covers ages 13–25 and professionals.
- The assessment does not begin with the learner's actual decision, such as stream choice, course choice, college choice, first role, or career change.
- Work-environment preferences, tolerance for uncertainty, preferred ways of learning, accessibility needs, and real exposure to occupations are insufficiently captured.

#### Fairness and trust

- Gender, family income, education board, and parental approval can directly increase recommendation scores.
- Financial constraints are mixed into fit rather than used to construct affordable or alternative pathways.
- The gender question offers only male and female and lacks “prefer not to say.”
- Sensitive questions are required before Xtara has demonstrated value or explained how the answers will be used.
- A learner with strong parental influence can receive a higher score for a career marked as having high parental approval. This can reproduce social pressure rather than help the learner examine it.

#### Scoring validity

- Weights are hand-configured and additive, but the resulting raw score is displayed like a calibrated percentage.
- Multiple selected tags can accumulate scores beyond a stable or interpretable scale.
- Weak-subject matches add points when career tags overlap rather than applying a clearly designed penalty or uncertainty rule.
- Only the first 50 Dream Careers are loaded for matching, so recommendation coverage can depend on collection ordering.
- The generative step can turn sparse matching data into confident narrative without a sufficiently strict factual contract.

#### Web implementation

- Configured `minSelect` and `maxSelect` constraints are not enforced; required validation only checks that at least one item exists.
- Conditional rules are executed through `new Function`, fail open on errors, and can change the filtered list while navigation is index-based.
- The web flow does not use the available draft/save-and-resume API.
- State, district, city, and location preference are all mandatory before assessment value is shown.
- Failure and retry behavior at the questionnaire/API boundary needs a resilient product state.

### Allowed claims before validation

Use language such as:

- discovery activity;
- learner profile;
- signals based on your answers;
- career areas worth exploring;
- current evidence suggests;
- confidence can improve by completing these activities.

Do not use:

- scientifically proven fit;
- psychometric score;
- perfect match;
- guaranteed success;
- precise percentage compatibility;
- validated personality type;

until independent evidence supports the specific claim.

## Assessment V2 product design

Assessment V2 should be modular, decision-aware, age-appropriate, and progressively enriched. It does not need to be one long test.

### Module 0: Decision orientation

Purpose: understand why the learner is here.

Example prompts:

- What decision are you trying to make?
- When do you need to make it?
- How clear do you feel today?
- Are there options you are already considering?
- Who else is involved in the decision?

Output: decision type, urgency, starting clarity, learner hypotheses, and appropriate journey.

### Module 1: Education and opportunity context

Purpose: understand current stage without ranking human potential.

Capture:

- class, curriculum, and current subjects;
- optional performance evidence and confidence by subject;
- language and accessibility preferences;
- current location and desired study geography only when relevant;
- exposure to activities, careers, and role models.

Location, finance, and support context should be progressive and purpose-explained.

### Module 2: Interests through activities

Purpose: identify recurring task and topic preferences.

Use a mixture of:

- paired or forced choices;
- short situational scenarios;
- “would like to try” versus “have tried and enjoyed” distinctions;
- topic interest separated from preferred daily work;
- an uncertainty or “not enough experience” response.

This avoids treating familiarity as genuine fit.

### Module 3: Strengths and self-efficacy

Purpose: understand what the learner believes they can do and what evidence exists.

For each relevant capability, distinguish:

- enjoyment;
- confidence;
- demonstrated evidence;
- desire to improve.

Allow optional evidence from projects, achievements, grades, teacher feedback, and completed Xtara activities.

### Module 4: Work values and environment

Purpose: reveal tradeoffs that differentiate roles within the same area.

Signals may include:

- working with people, ideas, data, or physical systems;
- structure versus ambiguity;
- collaboration versus independent focus;
- service, creativity, mastery, security, autonomy, recognition, or income;
- indoor, outdoor, field, clinical, laboratory, office, or remote environments;
- education duration and tolerance for delayed entry;
- emotional, physical, social, and schedule demands.

Avoid labeling a preference as a permanent personality trait.

### Module 5: Family and cultural influence

Purpose: represent the real decision environment without converting family preference into learner fit.

Capture family openness, preferred careers, strong expectations, occupational exposure, decision influence, and priorities such as stability, income, recognition, location, education duration, and learner interest. Keep the learner's own preferences and family preferences as separate fields.

### Module 6: Post-result pathway personalization

Purpose: build viable pathways and reveal support needs.

Collect after the learner has received discovery value, explain why each field is used, and make sensitive items optional where possible:

- education budget or affordability concerns;
- relocation flexibility;
- family expectations and support;
- caregiving, accessibility, or schedule constraints;
- available school and community resources.

These answers shape pathway alternatives, scholarships, support, and timing. They do not lower intrinsic career-area alignment.

### Module 7: Reflection and confirmation

Purpose: give the learner agency over the computed profile.

Before generating recommendations, show a plain-language summary:

- “This sounds like me.”
- “This is not accurate.”
- “I am unsure.”
- “Something important is missing.”

Profile correction becomes part of the assessment rather than an afterthought.

### Output contract

Assessment V2 returns structured signals, not a single career verdict:

```text
Decision context
Strong signals
Tentative signals
Contradictory signals
Missing evidence
Promising career areas
Representative role examples
Pathway constraints and support needs
Recommended role examples and learning content that can improve understanding
```

Recommendations should initially use evidence levels such as **strong**, **moderate**, **early**, and **insufficient evidence**. If numerical scoring is retained internally, it must not be displayed as a percentage until it is calibrated and validated.

## Validation plan for Assessment V2

### Content validity

- Review constructs and items with qualified career counselors, educational psychologists, teachers, and labor-market specialists.
- Map every question to a documented construct and product use.
- Remove questions whose answers do not change a legitimate learner outcome.

### Comprehension and usability

- Conduct cognitive interviews with learners from different curricula, languages, geographies, and socioeconomic contexts.
- Verify that learners interpret questions and answer choices as intended.
- Measure completion time, hesitation, abandonment, correction, and “not enough experience” rates.

### Reliability

- Test internal consistency only for modules designed to measure a coherent construct.
- Run short test-retest studies while recognizing that adolescent interests can legitimately change.
- Monitor recommendation stability under small, irrelevant answer changes.

### Construct and criterion evidence

- Compare outputs with counselor assessments and structured learner interviews.
- Test whether recommended areas align with later exploration choices and completed real-world activities.
- Do not use admission, salary, or prestige as the only definition of a successful recommendation.

### Calibration and fairness

- Analyze exposure, recommendation, disagreement, and action rates across gender, geography, curriculum, language, disability, and socioeconomic groups.
- Use counterfactual tests: changing a protected or constraint attribute alone must not alter intrinsic alignment.
- Review for stereotyped career routing and path closure.
- Create an incident and rollback process for harmful recommendation behavior.

### Pilot exit criteria

Assessment V2 is ready for broader release when:

- learners understand the output and can explain the reasoning;
- counselors judge the hypotheses useful for discussion;
- recommendation behavior is stable under irrelevant changes;
- sensitive factors affect pathway support rather than intrinsic fit;
- major learner groups pass defined fairness checks;
- content and scoring versions are reproducible;
- the system clearly communicates uncertainty.

## Grade 8–10 journey design

### Grade 8: Explore

Primary outcome: “I understand several career areas and the kinds of work I want to explore.”

The experience emphasizes:

- interests, activities, curiosity, and exposure rather than fixed ability;
- broad career areas with diverse representative roles;
- short stories and “day in the work” examples;
- myth correction and awareness of unfamiliar roles;
- low-stakes activities that generate new evidence;
- a saved exploration map, not a ranked career verdict.

### Grade 9: Test

Primary outcome: “I have tested some assumptions and can explain what I learned.”

The experience emphasizes:

- role comparisons, stories, microlearning, tools, quizzes, and games;
- enjoyment, effort, confidence, and demonstrated evidence as separate signals;
- comparison of work environments and education expectations;
- reflection on changes in interest after real exposure;
- narrowing to a manageable set of career areas without closing alternatives.

### Grade 10: Decide

Primary outcome: “I can make a considered stream or subject decision and understand which options it preserves or changes.”

The experience emphasizes:

- current career-area hypotheses and supporting evidence;
- subject and stream implications without simplistic one-stream-one-career rules;
- tradeoffs, prerequisite gaps, bridging options, and alternative pathways;
- parent or counselor discussion support;
- a decision record, next three actions, and a future review date.

### Shared longitudinal profile

The learner profile records dated evidence rather than permanent labels. Xtara should show how signals evolved across grades and why a recommendation changed. A learner can correct, retire, or add evidence at any time.

## Clean and simple UI workstream

### Information architecture

The first learner navigation should contain four understandable destinations:

1. **Home / My Direction** — current goal, open question, and next action.
2. **Explore** — career areas, roles, stories, and comparisons.
3. **My Evidence** — assessment signals, completed activities, reflections, and profile corrections.
4. **Plan** — saved direction, subjects or stream implications, and next three actions.

Games, reads, Sparks, rewards, and other content appear contextually inside these journeys. They should not compete as top-level destinations unless evidence shows learners understand and need them there.

### Interaction rules

- One primary action per screen.
- One question per assessment step, with a visible reason when sensitive or consequential.
- Progressive disclosure: summary first, evidence and detail on demand.
- No unexplained score, badge, icon, or status.
- Use consistent verbs such as Explore, Compare, Test, Save, Discuss, Decide, and Review.
- Keep result sets small enough to understand; prefer guided filters over dense catalogs.
- Preserve learner state across back navigation, refresh, locale changes, and authentication.
- Use plain loading, empty, error, offline, and uncertainty states with recovery actions.
- Motion communicates progress or state change and respects reduced-motion preferences.

### Visual system

- Establish shared semantic tokens for typography, spacing, color, elevation, radius, focus, state, and motion.
- Use a restrained palette and reserve accent colors for meaning and action.
- Define readable line length and responsive type scales for both Latin and Indian scripts.
- Standardize page shell, step layout, evidence cards, role summaries, comparisons, action rows, and trust/source treatments.
- Meet WCAG 2.2 AA for the learner journey and test keyboard, screen-reader, zoom, and contrast behavior.
- Test representative low-end mobile devices and constrained networks even though the first implementation is web.

### Usability gates

Before a journey ships, representative learners should be able to answer:

- What is this page for?
- What should I do next?
- Why is Xtara asking this?
- What does this recommendation mean?
- How can I disagree or change it?
- Where did this fact come from?

The target is comprehension without facilitator explanation, not simply task completion.

## Multilingual product workstream

### Locale architecture

- Use BCP 47 locale identifiers and retain locale separately from learner identity and content IDs.
- Route all interface text through structured message catalogs; prohibit new hardcoded learner-facing strings in reviewed product areas.
- Keep question, option, career, pathway, evidence, and source IDs language-neutral.
- APIs accept a locale and return structured content with requested, resolved, and fallback locale metadata.
- Locale changes must not change stored answers, ranking inputs, or recommendation identity.
- Search supports translated names, synonyms, common transliterations, and English terms used in education contexts.

### Content operations

Each translatable record carries:

- source locale and translation locale;
- glossary version;
- translation method;
- translator or reviewer;
- draft, reviewed, approved, or stale status;
- source-content version;
- last-reviewed date.

Changes to approved source content mark dependent translations stale. High-impact content—assessment items, recommendation explanations, eligibility, pathway requirements, consent, safety, and privacy—cannot publish from unreviewed machine translation.

### Language experience

- Offer language choice before sign-up and remember it across sessions.
- Support bilingual display for career titles, streams, courses, exams, and institutions when useful.
- Allow the learner to ask AI in one supported language while grounding the answer in the same reviewed evidence.
- Keep source citations and official names intact even when explanations are translated.
- Clearly label fallback English content.
- Avoid literal translation of career terminology when a locally understood term or bilingual expression is clearer.

### Rollout

The first release should support English plus the regional language required by the first pilot. Add a second Indian language only after the end-to-end workflow—UI, assessment, career content, search, reports, notifications, AI, analytics, and human review—works reliably.

Language selection should follow pilot geography and reviewer availability rather than national reach claims. The language decision remains an approval item.

## Delivery roadmap

### Phase 0: Product truth and trust reset — Weeks 1–3

**Outcome:** public promises and product behavior are honest and internally consistent.

Deliverables:

- approve vision, the Grade 8–10 Explore → Test → Decide scope, and stage-specific outcomes;
- inventory every public scale, accuracy, coverage, salary, and outcome claim;
- remove or substantiate hardcoded match scores and placeholder career facts;
- replace “perfect match” language with evidence-aware guidance;
- define Career Evidence and Source schemas;
- define content review, expiry, and ownership rules;
- define product analytics events and Decision Progress Rate;
- establish an architecture decision that web and mobile use `xtara-api` for product data.
- approve the simplified learner information architecture and usability gates;
- select the pilot language pair and identify qualified language reviewers.

Exit criteria:

- no unsupported public claims remain;
- no fabricated match value is rendered;
- every published time-sensitive career field can carry provenance;
- the first-slice event taxonomy is approved.

### Phase 1: Career knowledge foundation — Weeks 2–6

**Outcome:** Dream Careers becomes a navigable, evidence-backed hierarchy.

Deliverables:

- establish Domain → Career Area → Role → Specialization taxonomy;
- normalize identifiers and relationships for existing Dream Careers;
- define versioned career, pathway, evidence, source, and review records;
- select 25–40 high-quality Grade 8–10-relevant roles across representative areas;
- attach daily work, environment, pathway, tradeoff, related-role, and source information;
- create public list, detail, related-role, and compare APIs;
- implement editorial completeness and freshness checks;
- separate sponsored or referral data from recommendation ranking.

Exit criteria:

- selected roles pass content review;
- every material claim has evidence metadata or is explicitly labeled as general guidance;
- public APIs return stable versioned contracts;
- a learner can navigate from area to role to pathway.

### Phase 2: Public Trusted Explorer — Weeks 4–8

**Outcome:** a visitor can understand Xtara's value without registration.

Deliverables:

- rewrite the home narrative around a learner decision rather than AI capability;
- publish career-area and role exploration;
- build an evidence-forward role page;
- create side-by-side comparison for up to three roles;
- add representative “day in the work,” tradeoff, and pathway views;
- expose sources and last-reviewed dates;
- create sample Grade 8 Explore, Grade 9 Test, and Grade 10 Decide journeys with parent explanations;
- implement locale routing, language selection, typography, fallback metadata, and the first reviewed message catalog;
- add explicit boundaries for guidance and AI-generated content.

Exit criteria:

- a new visitor can inspect real guidance without login;
- learners can compare roles on consistent dimensions;
- usability participants can explain what Xtara does and why it is credible.

### Phase 3: Assessment V2 and recommendation engine — Weeks 5–12

**Outcome:** Xtara produces explainable future directions with concrete role examples.

Deliverables:

- define constructs, item bank, and decision-specific modules;
- conduct expert review and learner cognitive interviews;
- implement schema-based conditional logic without dynamic code execution;
- support save/resume, versioning, correction, and consent;
- separate intrinsic alignment, evidence strength, pathway feasibility, and learner preference;
- generate 2–3 career areas and several representative roles;
- record factor-level reasoning, missing evidence, and uncertainty;
- create counterfactual, regression, fairness, and calibration evaluation suites;
- add operational dashboards for recommendation failures and drift.
- validate each assessment module in the pilot languages rather than assuming translated items preserve meaning.

Exit criteria:

- the first pilot cohort passes comprehension and trust criteria;
- recommendations are reproducible from stored versions;
- protected and constraint attributes do not silently determine intrinsic alignment;
- learners can correct the profile before and after results.

### Phase 4: My Direction vertical slice — Weeks 9–15

**Outcome:** discovery becomes a continuing action journey.

Deliverables:

- decision workspace showing current hypotheses and open questions;
- save, dismiss, compare, and reconsider interactions;
- next-three-actions planner;
- optional evidence-building activities in a later release; they are not required in the initial assessment, result, or dashboard loop;
- evidence journal connecting completed actions to changing confidence;
- scheduled decision reviews;
- shareable parent/counselor report with learner-controlled visibility;
- grounded AI comparison and reflection support.

Exit criteria:

- learners can complete the full Orient → Explore → Compare → Test → Act loop;
- action completion and clarity change are measurable;
- AI answers cite Xtara evidence or state when evidence is unavailable.

### Phase 5: School and counselor pilot — Months 4–6

**Outcome:** Xtara proves responsible guidance value in a real support setting.

Deliverables:

- learner invitation and consent flows;
- counselor queues, learner summaries, discussion prompts, and follow-ups;
- role-based access and auditable sharing;
- cohort-level progress without exposing unnecessary sensitive detail;
- intervention and disagreement capture;
- pilot operations playbook, training, support, and incident response;
- outcome and fairness review with pilot partners.

Exit criteria:

- counselors can use Xtara without treating results as verdicts;
- learners retain visibility and control;
- pilot partners can demonstrate improved decision clarity and action;
- support and privacy operations are sustainable.

### Phase 6: Expansion — Months 6–12

- Class 12 course, exam, alternative-route, and college decision journey;
- college learner specialization, internship, skill, and first-role journey;
- additional regional and multilingual coverage after the first language workflow passes quality gates;
- verified mentor and professional conversations;
- distinct professional Career Shift journey;
- institutional packaging based on proven learner outcomes.

## Target product architecture

### Experience layer

- `xtara-web`: primary web journey, public exploration, learner workspace, parent/counselor views, locale routing, and accessible multilingual rendering.
- `xtara-app`: mobile companion using the same product contracts.
- Shared design tokens and domain language, without forcing shared rendering technology.

### API and domain layer

`xtara-api` becomes the single policy and product-data boundary with modules for:

- identity, learner profile, consent, and sharing;
- decision journeys and assessment versions;
- career taxonomy, roles, pathways, evidence, and sources;
- recommendation jobs, snapshots, explanations, and feedback;
- comparisons, saved hypotheses, decisions, and actions;
- content and activity assignments;
- localization catalogs, translated domain content, glossaries, and review status;
- parent, counselor, and institutional collaboration;
- analytics ingestion and user data rights.

Web and mobile should not implement recommendation rules or read/write Firestore collections directly.

### Data model

Minimum versioned entities:

- `LearnerProfile`
- `DecisionJourney`
- `AssessmentDefinition`
- `AssessmentResponse`
- `LearnerSignal`
- `CareerDomain`
- `CareerArea`
- `CareerRole`
- `CareerSpecialization`
- `Pathway`
- `EvidenceClaim`
- `Source`
- `RecommendationSnapshot`
- `CareerHypothesis`
- `Comparison`
- `ActionPlan`
- `ActionEvidence`
- `ConsentGrant`
- `CollaborationGrant`
- `GuidanceFeedback`

Firestore can remain the initial persistence layer, but data access should be hidden behind typed domain repositories. Structured analytics and research exports should flow to a separate warehouse rather than operational Firestore queries.

### Recommendation pipeline

1. Validate and version the learner input.
2. Derive structured signals with evidence strength.
3. Retrieve eligible career areas and roles from reviewed data.
4. Apply inspectable candidate and exclusion rules.
5. Rank candidates across separate dimensions rather than one opaque percentage.
6. Retrieve evidence for explanation and comparison.
7. Generate constrained, schema-validated language.
8. Run factual, safety, and completeness checks.
9. Persist the complete recommendation snapshot and lineage.
10. Present hypotheses, uncertainties, alternatives, and next evidence-gathering actions.

### AI boundary

AI is appropriate for:

- plain-language explanation;
- reflective questioning;
- summarizing learner-entered evidence;
- comparing verified structured facts;
- generating draft activity prompts for review;
- multilingual adaptation with quality controls.

AI is not authoritative for:

- unsourced salary or demand claims;
- match percentages;
- eligibility rules and admissions requirements;
- medical or mental-health characterization;
- protected-attribute routing;
- deciding what a learner must become.

### Job and reliability model

Recommendation generation is asynchronous with:

- queued, processing, completed, failed, and degraded states;
- idempotent job creation;
- retry and timeout policies;
- progress and recovery UI;
- audit logs and request IDs;
- model, prompt, scoring, assessment, and content versions;
- safe fallback to structured non-generative results.

## First 90-day execution view

### Days 1–30

- approve vision and Grade 8–10 wedge;
- complete trust-claim and hardcoded-data audit;
- approve Dream Career hierarchy and evidence schema;
- select initial reviewed career set;
- define Assessment V2 constructs and research protocol;
- define API boundaries, events, and recommendation lineage;
- approve the simplified information architecture and core screen rules;
- select the first pilot geography and language pair;
- prototype Grade 8 Explore, Grade 9 Test, and Grade 10 Decide journeys.

### Days 31–60

- ship the first public area, role, source, and comparison APIs;
- build public explorer and reviewed role pages;
- implement the first reviewed UI and domain-content locale catalogs;
- conduct assessment cognitive interviews;
- implement the Assessment V2 engine and versioned definitions;
- create candidate-ranking and counterfactual evaluation harnesses;
- reconcile web authentication and product API error states.

### Days 61–90

- run the first Assessment V2 pilot;
- integrate explainable future directions and representative role examples;
- implement My Direction and next-three-actions foundations;
- build parent/counselor share preview;
- test comprehension and assessment meaning in both pilot languages;
- measure clarity, comprehension, disagreement, and action completion;
- decide whether the product meets pilot expansion criteria.

## Prioritized epics

### P0

- Product truth and claims register
- Career taxonomy and identifiers
- Evidence/source/review model
- Public Career Explorer
- Clean learner information architecture and shared UI foundations
- Multilingual locale, content, and review architecture
- Assessment V2 research and engine
- Recommendation lineage and explainability
- My Direction and next-three-actions
- Consent, privacy, and learner correction
- Analytics and evaluation harness

### P1

- Career comparison
- Real-world career tests
- Parent/counselor report
- Grounded AI guide
- School pilot workspace
- Multilingual content workflow
- Career content freshness operations

### Later

- generalized content feed optimization
- broad points, tiers, and leaderboards
- large game expansion
- enterprise employee journeys
- marketplace monetization
- professional career transition

## Key measures

### Learner outcome

- Decision Progress Rate
- change in decision clarity
- ability to explain recommendation reasoning
- next-action completion
- completion of real-world exploration tests
- planned-review return rate

### Trust

- recommendation usefulness and disagreement
- profile correction rate
- evidence/source views
- unsupported-claim incidents
- AI factual-grounding pass rate
- counselor override and escalation outcomes

### Assessment quality

- item comprehension
- module completion and abandonment
- “not enough experience” response rate
- stability under irrelevant answer changes
- counselor agreement at the career-area level
- calibration by evidence level
- counterfactual fairness results

### Platform health

- recommendation job success and recovery
- content source coverage and freshness
- API latency and error rate
- consent and sharing audit completeness
- data export and deletion completion

## Decisions to lock before implementation

1. Confirm the Grade 8–10 Explore → Test → Decide journey as the first wedge.
2. Select the first pilot geography, curriculum mix, English-plus-regional-language pair, and language reviewers.
3. Identify qualified assessment and counseling reviewers.
4. Approve the initial 25–40 Dream Career roles.
5. Decide which current public claims can be proven and remove the rest.
6. Choose the first school or direct-to-learner pilot channel.
7. Define the learner-parent sharing policy for minors.
8. Confirm that commercial partnerships never influence fit ranking.

## Immediate next artifacts

- Product requirements document for Trusted Discovery
- Dream Career taxonomy and evidence schema
- Assessment V2 construct map and item-writing guide
- Recommendation explanation and uncertainty contract
- Grade 8–10 journey maps and simplified information architecture
- Multilingual content model, glossary, and review workflow
- Event taxonomy and evaluation scorecard
- School pilot research and consent protocol

## Approval and branch gate

No implementation branch should be created and no production code should be changed until this plan is explicitly approved.

After approval:

1. Recheck the `v2` worktree and preserve all unrelated existing changes.
2. Create the proposed branch `feature/grade-8-trusted-discovery` from the approved base.
3. Commit the approved product documents as the branch contract.
4. Convert Phase 0 and the first vertical slice into implementation stories with acceptance criteria and evidence requirements.
5. Begin only the approved scope; later phases remain roadmap items until their own gates are met.
