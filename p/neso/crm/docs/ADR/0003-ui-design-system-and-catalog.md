# ADR-0003: UI Design System, Catalog Separation, and Runtime Customization

- Date: 2026-02-08
- Status: Accepted

## Context
The CRM needed a full UI-layer redesign without touching backend behavior, API contracts, or data schemas.

Key requirements:
- Dark-first enterprise UX with high information density.
- Reusable component architecture with clear folder hierarchy.
- 6 preset themes and manual runtime customization.
- i18n RU/EN with language switching.
- Design catalog (`/design`) separated from runtime UI source of truth.

## Decision
1. Introduce a design engine in `shared/design/`:
- `system.ts` for tokens, themes, fonts, and persisted preferences.
- `useDesignSystem.ts` for runtime updates.
- `globalStyles.ts` for CSS variable-based primitives.
- `i18n.ts` for key-based RU/EN dictionary and locale management.

2. Restructure runtime UI components by domain level:
- `components/base/`, `layout/`, `navigation/`, `data-display/`, `editors/`, `feedback/`, `feature/`.

3. Keep backend layers unchanged:
- No API/lib/repo/table contract changes.

4. Use `design/` only for template blueprints:
- One folder per CRM module.
- Multiple screen compositions (`screens.md`).
- State coverage (`states.md`: empty/loading/error/filled).

5. Store preloader state in cookies:
- `crm_ui_loader_v1` persisted and restored before hydration.

## Consequences
### Positive
- UI becomes scalable and themeable without backend coupling.
- Strong separation between template exploration and runtime UI code.
- Faster extension path for new CRM modules.
- Predictable i18n and styling governance.

### Tradeoffs
- Additional UI-layer complexity (theme + i18n orchestration).
- Need to maintain parity between runtime components and design blueprints.

## Out of Scope
- Business logic changes.
- API contract changes.
- Data schema changes.
