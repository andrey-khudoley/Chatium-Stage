# Design Catalog

`design/` is a template-only layer for CRM module blueprints.

## Purpose
- Capture screen compositions and state matrices per module.
- Keep runtime UI free from mock/demo data coupling.

## Folder Contract
Each module folder contains:
- `screens.md`
- `states.md`

## States
All modules are documented with:
- empty
- loading
- error
- filled

## Runtime Boundary
Nothing in `design/` is imported by production pages.
Runtime source of truth remains:
- `components/`
- `shared/design/`
- `pages/`
