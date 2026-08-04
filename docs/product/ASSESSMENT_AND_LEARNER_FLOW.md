# Xtara Assessment and Learner Flow

**Status:** Approved product structure; implementation baseline  
**Initial audience:** Indian students from Grade 8 through Grade 10  
**Assessment definition:** `career-discovery` version `3.0.0`

## Product boundary

Xtara gives learners useful direction without claiming to identify one predetermined career. The assessment translates interests, lived experience, strengths, weakness context, working-style tendencies, values, and family influence into several future directions with concrete role examples and plain-language reasoning.

A single answer must never produce a role recommendation. For example, selecting singing can contribute to a creative-expression pattern. It cannot independently recommend dancer, singer, or another occupation. A future direction appears only when compatible signals recur across multiple questions.

## One grade-adaptive assessment

The product uses one assessment definition with a shared core and conditional grade modules:

- **Grade 8:** curiosity, exposure, strengths, personality tendencies, values, family context, and broad future directions;
- **Grade 9:** the same shared core plus experience and evidence gathered through school, family, clubs, projects, and conversations;
- **Grade 10:** the same shared core plus subject confidence, stream or subject urgency, and family or school decision context.

The learner is never asked to decide how Xtara should conduct Grade 8 exploration. Xtara adapts the experience from the selected grade.

## Assessment dimensions

1. **Curiosity versus experience** — what the learner wants to try is stored separately from what they have tried and enjoyed.
2. **Strengths versus evidence** — confidence is distinguished from projects, practice, feedback, responsibilities, schoolwork, and marks.
3. **Meaning of weakness** — dislike, low confidence, low marks, limited exposure, teaching experience, and willingness to improve remain distinct.
4. **Personality and working style** — short situations derive current tendencies such as reflective, social, structured, flexible, practical, conceptual, collaborative, independent, adaptive, and persistent. These are not permanent types.
5. **Motivations and values** — creativity, contribution, mastery, practical outcomes, leadership, stability, recognition, and balance are explicit tradeoffs.
6. **Family and cultural influence** — family openness, preferred careers, strong expectations, uncertainty, priorities, and occupational exposure are visible but do not become intrinsic fit.

## Result contract

The assessment produces:

- emerging strength patterns and the answers supporting them;
- current personality and working-style tendencies;
- up to three future directions supported by more than one question;
- representative roles inside each direction;
- family and weakness context for a better conversation;
- uncertainty expressed through early or developing evidence language;
- learner confirmation: accurate, inaccurate, unsure, or something missing.

The product does not display a career-match percentage, a perfect career, or an unexplained rank.

## Pathway personalization after results

Location and financial context are collected after the learner has seen the discovery result. The separate pathway profile includes:

- state, district, and city;
- education board;
- preferred study language;
- willingness to study near home, elsewhere in the state, elsewhere in India, or abroad;
- affordability preference;
- scholarship or financial-aid interest.

This information personalizes schools, colleges, courses, scholarships, and alternative routes. It must not raise or lower discovery directions.

## Signup and durable saving

The complete assessment and pathway flow works before registration. Data remains temporary in the current browser until the learner selects **Create account and save**. After authentication, Xtara writes one versioned discovery bundle to the authenticated account and transfers the learner directly to the dashboard without repeating questions.

The saved bundle contains the assessment definition and version, stage, answer IDs, result factors, learner reflection, pathway profile, and completion time. A signed-in dashboard can restore this bundle from the account when browser storage is unavailable.

## Direction-led dashboard

The dashboard is organized around the learner's future directions rather than Xtara's internal feature categories:

1. recommended future directions and representative roles;
2. emerging transferable skills;
3. pathway context;
4. one learning continuation area that can contain microlearning, career stories, games, challenges, and useful reading;
5. tools used in roles connected to the learner's directions.

Learning content must eventually carry direction, skill, grade, locale, duration, difficulty, and learning-outcome metadata so personalization is evidence-based. Game performance contributes to learning progress; it must not silently become career-fit evidence.

## Reusable assessment architecture

The reusable module owns:

- definition, question, option, condition, answer, and result-envelope contracts;
- common plus contextual question composition;
- conditional visibility;
- validation;
- exclusive multi-select behavior and answer normalization;
- generic score-channel aggregation;
- pluggable storage adapters.

The career-discovery feature owns its question catalog, grade contexts, score channels, interpretation, result language, career-area mapping, and role examples. Future use cases can supply a new definition and interpreter without changing the assessment engine.
