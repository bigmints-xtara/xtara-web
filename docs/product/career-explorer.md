# Career Explorer

The public `/explore` journey presents published directions in a full-width
carousel, then Dream Careers and optional specializations in organic bubbles.
The API supplies catalogue identities, relationships, localized facts, and
illustration URLs with alternative text. Missing artwork and unpublished facts
have explicit placeholders; the browser does not contain a fallback catalogue.
The presentation uses the existing Xtara theme, fonts, and native web controls.

Only the focused choice exposes its opening action. Neighboring choices can be
focused by tapping, dragging, arrows, pagination, or keyboard navigation.
Horizontal touch drags follow the pointer and snap on release; cancelled drags
restore the choice and vertical scrolling remains available. Browser history
restores the route, while in-session carousel positions survive returning to a
direction. A parent Dream Career can be opened without choosing a specialization.

The career overview retains three connected bubbles and four fact chapters:
daily work, skills, workplaces, and things to know. Daily-work facts use a
swipeable bubble carousel. Bubbles grow to fit API text, and unavailable chapters
show an honest empty state. Carousel preview summaries are shortened visually;
the opened overview retains the full published summary. Public study planning
is not exposed by this presentation. Motion can be paused and follows the
system's reduced-motion preference.

## Save and authentication continuity

“Pursue this career” sends only `careerId` and `directionId` to the authenticated
`PUT /api/v1/me/career-pursuit` contract. The API owns relationship validation,
selection limits, parent/specialization resolution, and persistence. The client
checks `GET /api/v1/me/career-pursuit` and the returned saved Direction before
showing success. The operation stays bound to the initiating account.

Guests carry both selected IDs through signup and login in the URL. After an
account is created, a failed session or pursuit save can be retried using that
account instead of attempting signup again. Navigation to My Direction happens
only after verified readback. The existing assessment continuation remains a
separate supported path.

## Local preview

Run the local API first, then use its reachable bind address as the proxy target.
For an API listening on loopback port 3111:

```bash
XTARA_API_PROXY_TARGET=http://127.0.0.1:3111 \
NEXT_PUBLIC_XTARA_API_BASE_URL=/xtara-service \
npm run dev -- --hostname 127.0.0.1 --port 8840
```

Open `http://127.0.0.1:8840/explore`. The API base is `/xtara-service`, without
`/api/v1`; the API client appends the versioned route. `npm run dev` uses the
repository's Firebase configuration loader, validating the expected project.
`dev:plain` is suitable only when the required Firebase configuration is already
supplied. Never record configuration values or credentials in preview evidence.

Focused checks cover the Explorer, pointer carousel, pursuit client,
signup-continuation retry, and existing login/signup routes. Run TypeScript,
the frontend-boundary check, and the repository ESLint regression gate alongside
them. Browser verification must include compact and desktop layouts, API artwork,
published facts, and retained career intent at signup/login. A local preview is
not evidence of production deployment or a production authenticated journey.
