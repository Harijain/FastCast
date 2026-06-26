## FastCast Frontend Build Plan

Premium, engineering-focused streaming UI. Dark-only. Linear/Vercel/Railway quality bar. All 10 pages in one pass.

### Stack adaptation

- **Routing:** TanStack Start file-based routes (platform requirement) — same URLs as spec
- **State:** Zustand (auth store, player store, upload store)
- **Data:** Axios client + TanStack Query (already installed) for caching/retries
- **Styling:** Tailwind v4 with full FastCast design token system in `src/styles.css`
- **Motion:** `motion` package (Framer Motion successor)
- **Charts:** Recharts
- **Video:** HLS.js
- **Icons:** lucide-react (already installed)

### Design system (`src/styles.css`)

OKLCH conversions of the spec palette as `@theme inline` tokens:
- `bg #050816`, `card #0B1120`, `card-hover #111827`, `border rgba(255,255,255,0.08)`
- `primary #7C5CFF`, `accent #00D4FF`, `success/warning/danger`
- `text #FFFFFF` / `text-secondary #A9B1D6`
- Gradient tokens: `--gradient-primary`, `--gradient-mesh` (hero), `--gradient-glow`
- Shadow tokens: `--shadow-glass`, `--shadow-glow-primary`, `--shadow-glow-accent`
- Glassmorphism utility (`@utility glass-card`) with backdrop-blur
- Custom button variants: `hero`, `glass`, `glow`
- Typography: Geist (display) + Geist Mono (code/metrics) via `@fontsource`
- Animations: fade-up, stagger, shimmer (skeleton), pulse-glow, counter

### Folder layout

```
src/
  api/              axios client, interceptors, endpoint constants
  services/         videoService, authService, uploadService, metricsService, watchHistoryService, downloadsService
  hooks/            useAuth, useVideos, useHlsPlayer, useUpload, useMetrics, useCountUp
  store/            authStore, playerStore, uploadStore (zustand)
  layouts/          AppLayout (sidebar + topbar), AuthLayout (split)
  components/       ui/* (existing shadcn) + shared: Sidebar, Topbar, VideoCard, StatusBadge, StatCard, Skeleton, EmptyState, AnimatedCounter, GlassPanel
  features/
    auth/           LoginForm, RegisterForm, ArchitectureDiagram
    player/         VideoPlayer (HLS.js), QualityMenu, BufferHealth, MetadataPanel
    upload/         Dropzone, ProcessingPipeline (animated stages)
    metrics/        LatencyChart, ThroughputChart, CacheChart, HealthGrid
    home/           Hero, StatsRow, FeaturedRail, ProcessingQueue
  utils/            cn, formatDuration, formatBytes, formatRelativeTime, mock data generators
  routes/           file-based routes mapping to URLs below
```

### Routes (URLs match spec exactly)

| File | URL | Purpose |
|---|---|---|
| `__root.tsx` | — | Shell, QueryClient, Sonner toaster |
| `_authenticated.tsx` | — | Auth gate, mounts AppLayout |
| `_authenticated.index.tsx` | `/` | Home |
| `_authenticated.search.tsx` | `/search` | Discovery + infinite scroll |
| `_authenticated.upload.tsx` | `/upload` | Drag/drop + pipeline |
| `_authenticated.watch.$id.tsx` | `/watch/$id` | HLS player |
| `_authenticated.history.tsx` | `/history` | Watch history |
| `_authenticated.downloads.tsx` | `/downloads` | Downloads |
| `_authenticated.metrics.tsx` | `/metrics` | Observability dash |
| `_authenticated.profile.tsx` | `/profile` | User profile |
| `auth.login.tsx` / `auth.register.tsx` | `/auth/login`, `/auth/register` | Split-screen auth |
| `$.tsx` | catch-all | 404 |

### API integration

- `src/api/client.ts` — Axios instance, `VITE_API_BASE_URL`, JWT in `Authorization`, refresh-token interceptor on 401
- `src/api/endpoints.ts` — All endpoints from spec: `/auth/login`, `/auth/register`, `/auth/me`, `/auth/refresh`, `/videos`, `/videos/search`, `/videos/{id}`, `/streaming/{id}/master.m3u8`, `/streaming/{id}/info`, `/streaming/{id}/progress`, `/upload`, `/watch-history`, `/watch-history/{videoId}`, `/watch-history/progress`, `/downloads/history`, `/downloads/{videoId}`, `/metrics/summary`
- **Mock mode:** `VITE_USE_MOCKS=true` (default until backend URL is set) — services return realistic mock data with simulated latency so every page renders fully

### Page-by-page highlights

- **Auth:** Split layout. Left = FastCast wordmark + tagline + animated SVG pipeline diagram (`Upload → Kafka → FFmpeg → HLS → S3`) with traveling dots. Right = glass card with form, password toggle, Zod validation, error toasts.
- **Home:** Mesh-gradient hero, headline + sub, 4 animated stat counters, "Featured" rail (horizontal scroll), "Recent uploads" grid, "Processing queue" list with live status badges.
- **Search:** Sticky search bar, status filter chips (ALL/READY/PROCESSING/FAILED), infinite scroll grid, hover-glow cards.
- **Watch:** HLS.js player with custom controls (play/pause/seek/volume/PiP/fullscreen/speed/quality menu showing 240–1080p), resume from saved progress, progress POST throttled to 5s. Sidebar: metadata, streaming status, live buffer health bar, quality indicator. Suggested videos rail below.
- **Upload:** Large dropzone, file validation (mp4/mov/mkv, size cap), upload progress bar, then animated 6-stage pipeline (Uploaded → Kafka Queued → Transcoding → Generating HLS → Uploading Segments → Completed) with connecting lines that fill as stages complete.
- **History:** "Continue Watching" rail with progress bars, full history list grouped by date.
- **Downloads:** Table-style list with status badges and metadata.
- **Metrics:** 4 KPI cards (Avg latency, Throughput, Cache hit %, Active streams) + area chart (latency 24h), line chart (throughput), donut (cache hit/miss), Kafka events feed, system health grid. Geist Mono for numbers.
- **Profile:** Avatar + name/email/role, 4 stat cards, recent activity timeline.
- **404:** Glitchy "STREAM_NOT_FOUND" with home CTA.

### Cross-cutting

- Sidebar collapses to icons on `lg:` and slides over on mobile
- Skeleton loaders on every async surface
- Page transitions via `motion` (fade + slide-up, staggered children)
- Animated count-up hook for all numeric stats
- Empty states with illustration + retry
- Network/error fallbacks per query
- Sonner toasts for auth + upload events

### Out of scope for this pass

- Real backend wiring beyond the Axios layer (you supply `VITE_API_BASE_URL`)
- Notification dropdown logic (UI shell only)
- Theme toggle (spec says dark-only)
- Tests
