# neso/crm

UI-focused CRM project on Chatium with strict layered backend boundaries.

## Scope
- This iteration redesigns the **UI layer only**.
- No changes to backend business flow in `api/`, `lib/`, `repos/`, `tables/`.
- Existing routes, permissions, API contracts, and data model stay intact.

## Implemented UI Architecture

### Redesigned pages
- `index.tsx` + `pages/HomePage.vue`
- `web/admin/index.tsx` + `pages/AdminPage.vue`
- `web/tests/index.tsx` + `pages/TestsPage.vue`

### Design system
- Token and theme engine: `shared/design/system.ts`
- Global style layer: `shared/design/globalStyles.ts`
- i18n dictionary and locale controller (RU/EN): `shared/design/i18n.ts`
- Runtime theme customization composable: `shared/design/useDesignSystem.ts`
- Preloader with cookie state restore: `shared/preloader.ts`

### Component architecture
- Base: `components/base/`
- Layout: `components/layout/`
- Navigation: `components/navigation/`
- Data display: `components/data-display/`
- Editors: `components/editors/`
- Feedback: `components/feedback/`
- Feature panels: `components/feature/`

## Theme & Styling Capabilities
- 6 preset themes (dark default).
- Manual overrides for background/surface/text/accent/state colors.
- Typography roles (heading/body/tables/forms/navigation).
- Font catalog: default + 20 additional options.
- Density, radius, shadow, and element scale controls.
- Table density and chart visual mode controls.

## i18n
- RU/EN baseline is implemented with key-based UI translations.
- Locale is persisted in cookies.
- UI language switcher is available in the top bar.

## Design Catalog (`/design`)
- `design/` stores template-only CRM module blueprints.
- Each module folder contains:
  - `screens.md`
  - `states.md`
- Runtime components are not duplicated in `design/`.

## Documentation
- Architecture: `docs/architecture.md`
- API contracts: `docs/api.md`
- Data layer: `docs/data.md`
- ADR: `docs/ADR/`
- Design catalog: `design/README.md`

## Latest Update
- **February 8, 2026**: full UI-layer redesign for Home/Admin/Tests, new token-based design system, 6 themes, extended typography controls, i18n RU/EN, cookie-based preloader state, and module design catalog under `design/`.
