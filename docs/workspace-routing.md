# Xtara workspace and routing manifest

Xtara has three separate product workspaces. A Firebase account is only an identity; authorization comes from the workspace-specific role or membership checked by the API.

| Workspace | People | Login entry | Home | Profile | Route ownership | API ownership |
| --- | --- | --- | --- | --- | --- | --- |
| Student | Individual learners, including students enrolled in a school | `/login` | `/dashboard` | `/profile` | `/dashboard`, `/assessment`, `/direction`, `/dream-careers`, `/explore`, `/achievements`, `/profile` | Learner assessment, career path, rewards, and personal profile APIs |
| Educator | School owners, organization administrators, class administrators, teachers, and counselors | `/login?mode=educator` | `/organization` | `/organization/profile` | `/organization/**` | `/api/v1/organizations/**` |
| Xtara admin | Authorized Xtara platform administrators and content editors | `/admin` | `/admin` | None; identity and access are managed inside admin settings | `/admin/**` | `/api/v1/admin/**` |

## Routing rules

1. `/admin` is the only admin login entry. Admin login is not linked from the public student/educator login. A signed-out request to any nested `/admin/**` route returns to `/admin`.
2. `/login` contains only Student and Educator modes. It never accepts `/admin` as a post-login destination.
3. A staff membership opens `/organization`. Staff who request a student-only route are moved to `/organization`; `/profile` maps to `/organization/profile`.
4. A student membership does not grant access to educator dashboards. Organization pages and APIs must verify the active membership and its role.
5. Platform admin status is independent of organization membership. The admin UI checks `super_admin`, `admin`, or `editor`; every admin API repeats authorization server-side.
6. `/join/[code]` is a shared onboarding route. The invitation decides whether the account is joining as a student or staff member, and the API enforces role conflicts.

## Authorization source of truth

- Student or educator identity: the active organization context and membership returned by `GET /api/v1/organizations/context`.
- Platform admin identity: the server-authorized user profile role used by `/api/v1/admin/**`.
- UI route guards provide navigation and privacy-safe loading states. They do not replace API authorization.

The executable client manifest lives in `src/lib/workspace-manifest.ts`. Route guards, login destinations, workspace home links, and profiles should import that manifest instead of adding new hard-coded workspace paths.
