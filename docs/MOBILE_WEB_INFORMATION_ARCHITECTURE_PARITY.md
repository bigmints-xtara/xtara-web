# Mobile and web information architecture parity

Status: implemented in `xtara-web` on 2026-08-01.

Source of truth: `xtara-app/docs/MOBILE_INFORMATION_ARCHITECTURE.md` and the current signed-in Flutter learner shell.

## Comparison and resolution

| Area | Mobile | Web before this change | Resolution on web |
| --- | --- | --- | --- |
| Primary learner navigation | Career, Learn, Achievements, Profile | My Career Path, Educators, Profile | Uses Career, Learn, Achievements, Profile on desktop and a persistent mobile-web bottom bar. Educator navigation remains role-scoped. |
| Notifications | Global bell and dedicated screen | No learner inbox route or global bell | Added a global bell and `/notifications`. No unread badge is invented before a durable inbox contract exists. |
| Career | Direction, Dream Careers, active career overview, My Next Steps, compact achievements snapshot | Also contained every learning library | Career now owns decisions and next actions only. It retains the existing `/dashboard` URL for compatibility. |
| Learn | Continue, Stories, Sparks, Games, Reading Challenges, Good Reads | No primary destination; learning was embedded in Career | Added `/learn` with the same order. Root shelves show at most five items and expose View all. Existing web players and mobile-app handoff remain intact. |
| Achievements | Summary, weekly progress, medals, points history | Repeated Direction, Dream Careers, and career next steps | Removed career-choice content. Added an activity summary, weekly targets, medal breakdown, and server-backed points history. |
| Profile | Learner information; Preferences; Support and legal; Account actions | Personal, study, academic progress, assessment, account | Removed assessment/career content and introduced the same four ownership groups. Appearance, language, and API-persisted notification preferences live under Preferences. |
| Assessment and career facts | Career | Assessment summary also appeared in Profile | Career links to assessment review and Direction change. Profile no longer duplicates assessment output. |
| Responsive behavior | Persistent four-tab bottom navigation | Learner destinations hidden in a hamburger at smaller widths | Signed-in learners get the same four always-visible destinations at smaller web widths. |

## Canonical web route map

| Destination | Route | Owns |
| --- | --- | --- |
| Career | `/dashboard` | Career Direction, Dream Careers, active career overview, My Next Steps, achievement snapshot |
| Learn | `/learn` | Continue, Stories, Sparks, Games, Reading Challenges, Good Reads |
| Achievements | `/achievements` | Points, tier, weekly progress, medals, points history |
| Profile | `/profile` | Learner data, preferences, support/legal, account actions |
| Notifications | `/notifications` | Important updates and its honest empty state |

## Intentional compatibility boundaries

- `/dashboard` remains the Career URL so saved links and login redirects continue to work.
- Existing activity player URLs under `/dashboard/sparks`, `/dashboard/challenges`, and `/dashboard/good-reads` remain valid. They are content details owned by Learn, not extra primary destinations.
- Web games continue to use the existing mobile-app handoff because the native game players are intentionally not rewritten for the browser.
- Certificates stay omitted until a verified certificate contract exists.
- Notifications do not show unread counts until the API supports a durable inbox and read state.
