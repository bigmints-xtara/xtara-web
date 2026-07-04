# Blueprint: xtara-web

## Tech Stack

| Layer | Technology | Version / Notes |
|-------|------------|-----------------|
| **Framework** | Next.js | 16.1.0 (App Router) |
| **Language** | TypeScript | ^5 |
| **UI Library** | React | 19.2.3 |
| **Styling** | Tailwind CSS | v4 (with `@tailwindcss/postcss`) |
| **Animation** | Framer Motion | ^12.23.26 |
| **State Management** | TanStack React Query | ^5.101.0 |
| **Form Validation** | Zod | ^4.2.1 |
| **Authentication** | NextAuth.js | ^4.24.13 |
| **Backend / Database** | Firebase (client) + Firebase Admin | ^12.7.0 / ^13.6.0 |
| **Search** | Algolia | ^5.46.1 |
| **Testing** | Vitest | ^4.1.8 (with coverage) |
| **Linting** | ESLint | ^9 (with `eslint-config-next`) |
| **Package Manager** | pnpm | workspace (monorepo) |
| **Font Optimization** | `next/font` (Geist) | Default |

## Framework Configurations

- **Next.js Config**: `next.config.ts` (TypeScript-based)
- **TypeScript Config**: `tsconfig.json` + `tsconfig.tsbuildinfo`
- **PostCSS Config**: `postcss.config.mjs` (Tailwind CSS v4)
- **ESLint Config**: `eslint.config.mjs` (flat config)
- **Vitest Config**: `vitest.config.ts`
- **Environment Variables**: Managed via `set-env.sh`, `SECRETS.md` (not committed)
- **Deployment**: Docker (`Dockerfile`, `deploy.sh`, `start.sh`) + Vercel (based on README)

## Directory Structure Map

```
📁 root/
├── 📄 AGENTS.md
├── 📄 components.json              # shadcn/ui component registry
├── 📄 deploy.sh
├── 📄 DEPLOYMENT.md
├── 📄 dev_output.log
├── 📄 Dockerfile
├── 📄 eslint.config.mjs
├── 📄 firestore.indexes.json
├── 📄 next-env.d.ts
├── 📄 next.config.ts
├── 📄 package-lock.json
├── 📄 package.json
├── 📄 pnpm-lock.yaml
├── 📄 pnpm-workspace.yaml          # Monorepo workspace definition
├── 📄 postcss.config.mjs
├── 📄 prompts.md
├── 📄 query_spark.js
├── 📄 README.md
├── 📄 SECRETS.md
├── 📄 set-env.sh
├── 📄 start.sh
├── 📄 tsconfig.json
├── 📄 tsconfig.tsbuildinfo
├── 📄 unique_skills_list.txt
├── 📄 vitest.config.ts
│
├── 📁 assets/                     # Static assets (icons, screenshots, appstore)
│   ├── 📄 android-cover.jpg
│   ├── 📄 appicon-source.png
│   ├── 📄 logo-color.svg
│   ├── 📄 logo-colorgram.svg
│   ├── 📄 logo-dark.svg
│   ├── 📄 logo-light.svg
│   ├── 📄 logo.svg
│   ├── 📁 AppIcons/
│   ├── 📁 appstore/
│   ├── 📁 favicons/
│   └── 📁 screenshots/
│
├── 📁 data_models/                # JSON schemas and data models
│   ├── 📄 assessment.json
│   ├── 📄 career_cluster_resources.json
│   ├── 📄 career_cluster.json
│   ├── 📄 career_path_AI_call_only.json
│   ├── 📄 career_path_comparison_analysis.json
│   ├── 📄 career_path_expected_output.json
│   ├── 📄 career_path.json
│   ├── 📄 challenge.json
│   ├── 📄 college.json
│   ├── 📄 configurations.json
│   ├── 📄 content_repo.json
│   ├── 📄 dream_career.json
│   ├── 📄 enriched_career_cluster_data.json
│   ├── 📄 field_availability_check.json
│   ├── 📄 game_template.json
│   ├── 📄 games_instance_quiz.json
│   ├── 📄 good_reads.json
│   ├── 📄 images.json
│   ├── 📄 india_states_districts_major_cities.json
│   ├── 📄 indian_board_subjects_remote_config.json
│   ├── 📄 llm_input_data_flow.json
│   ├── 📄 medals.json
│   ├── 📄 points_data_structure.json
│   ├── 📄 points.json
│   ├── 📄 ragOutput.json
│   ├── 📄 soft_skills.json
│   └── 📄 sparks_progress_tracking.json
│
├── 📁 app/                        # Next.js App Router (pages & layouts)
│   ├── 📄 layout.tsx
│   ├── 📄 page.tsx
│   ├── 📁 api/                    # API routes (Next.js Route Handlers)
│   └── ... (components, lib, etc.)
```

## Active Integrations

| Integration | Purpose | Client/Server |
|-------------|---------|---------------|
| **Firebase** | Authentication, Firestore, Realtime Database | Both (@firebase/app + firebase-admin) |
| **Algolia** | Full‑text search (career data, etc.) | Client |
| **NextAuth.js** | OAuth / credential authentication | Server + Client |
| **TanStack React Query** | Server state caching & synchronization | Client |
| **Radix UI** | Accessible UI primitives (Avatar, Dropdown Menu, Progress, Select, Separator, Slot) | Client |
| **Framer Motion** | Page transitions, animations | Client |
| **Lucide React** | Icon library | Client |
| **Canvas Confetti** | Celebratory effects | Client |
| **Tailwind CSS v4** | Utility‑first styling | Client |
| **Zod** | Schema validation (forms, API) | Both |
| **Vitest** | Unit & component testing | Dev |
| **ESLint** | Code quality & consistency | Dev |
| **Docker** | Containerized deployment | Production |
| **Vercel** | Hosting & deployment | Production |
