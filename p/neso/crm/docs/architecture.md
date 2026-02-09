# Architecture

## Purpose
`p/neso/crm` is a Chatium CRM project with strict layered backend boundaries and an extensible, token-driven UI architecture.

## Platform Constraints
- Chatium controls runtime and deployment.
- Stack and dependency model remain platform-defined.
- Deployment is automatic after push.

## Routing
- `index.tsx` → Home page (SSR + Vue)
- `web/admin/index.tsx` → Admin page (`requireAccountRole('Admin')`)
- `web/profile/index.tsx` → Profile page (`requireRealUser()`)
- `web/tests/index.tsx` → Tests page (`requireRealUser()`)
- `web/login/index.tsx` → Login redirect page

## Layer Separation (Data Flow)

Reference ADR: `docs/ADR/0002-settings-heap-and-layered-api.md`

| Layer | Folder | Responsibility |
| --- | --- | --- |
| Tables | `tables/` | Heap schema only |
| Repositories | `repos/` | CRUD and Heap queries only |
| Business logic | `lib/` | Rules, validation, computation |
| API | `api/` | HTTP input, access checks, calls to lib |

Data flow: `HTTP -> API -> lib -> repos -> Heap`.

## UI Architecture

### Runtime UI folders
- `pages/` — Vue page components
- `components/` — reusable UI components by domain level
- `shared/design/` — design engine (tokens/themes/i18n/preferences)
- `shared/preloader.ts` — global preloader and boot behavior

### Component domain structure
- `components/base/`
- `components/layout/`
- `components/navigation/`
- `components/data-display/`
- `components/editors/`
- `components/feedback/`
- `components/feature/`

### Design system core
- `shared/design/system.ts`
  - 6 preset themes
  - token schema
  - font catalog (default + 20)
  - cookie-based preference persistence
- `shared/design/useDesignSystem.ts`
  - runtime customization API (density/radius/shadow/scale/colors/fonts)
- `shared/design/globalStyles.ts`
  - global CSS variables and shared visual primitives
- `shared/design/i18n.ts`
  - RU/EN key-based dictionary and locale switching

## Design vs Runtime Source of Truth

### `design/` folder
Contains template-only assets:
- module screen blueprints (`screens.md`)
- module state blueprints (`states.md`)
- mock compositions and UI-state coverage

### Runtime folders
Contain real reusable UI entities used by pages:
- `components/`
- `shared/design/`
- `pages/`

No component duplication between `design/` and runtime folders.

## Preloader
- Global UI preloader is implemented in `shared/preloader.ts`.
- Preloader state is persisted in cookies (`crm_ui_loader_v1`).
- State is restored on reload before page hydration.

## i18n
- RU/EN baseline implemented.
- All new UI copy is key-based in `shared/design/i18n.ts`.
- Locale switcher is available in the top navigation.

## Redesigned Pages
- Home page: modern CRM overview with design-system previews.
- Admin page: operational controls + Theme & Styling Settings panel.
- Tests page: grouped validation dashboards and live log stream panel.

## Design Catalog Modules
The `design/` directory includes module folders for:
- Base CRM modules
- Process management modules
- Knowledge modules
- Learning modules
- Analytics modules
- Administration modules
- Additional UX modules

Each module defines multiple screens and `empty/loading/error/filled` states.
