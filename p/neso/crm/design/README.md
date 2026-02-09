# CRM Design Catalog

This folder stores **design templates only** and is not used directly by runtime pages.

## Start Here
- Main navigation page: `index.md`
- Direct link: [Open design index](./index.md)

## Rules
- Runtime UI source of truth: `components/`, `shared/`, `pages/`, `styles`.
- `design/` contains mock structures and reusable design blueprints.
- Each module has at least two files:
  - `screens.md` (multi-screen composition)
  - `states.md` (empty/loading/error/filled behavior)

## Module Groups

### Base CRM
- `dashboard`
- `leads-deals`
- `contacts`
- `companies`
- `tasks`
- `notifications`
- `files`
- `activity-log-audit`

### Process Management
- `kanban`
- `calendar`
- `timeline`
- `pipeline`
- `project-progress`
- `milestones`
- `roadmap`
- `gantt`

### Knowledge Management
- `internal-documentation`
- `knowledge-base`
- `wiki`
- `notes`
- `templates-library`

### Learning
- `courses`
- `lessons`
- `progress-tracking`
- `certificates`

### Analytics
- `reports`
- `custom-dashboards`
- `funnels`
- `cohorts`

### Administration
- `users`
- `roles-permissions`
- `feature-toggles`
- `integrations`
- `system-settings`
- `theme-styling-settings`

### Additional UX
- `chat-comments`
- `mentions`
- `tags-labels`
- `global-search`
- `command-palette`
- `help-onboarding`
- `system-states`

## Cross-Module Design Contract
- Dark mode is default.
- High-density enterprise layout with mobile card fallback.
- Token-driven customization (theme, fonts, density, radius, shadows, element scale).
- i18n-ready labels and actions (RU/EN baseline).
