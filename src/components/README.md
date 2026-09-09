# Frontend structure

- Feature folders own their components, hooks, and `types.ts` contracts.
- Components render the UI; `use-*.ts` hooks own state, effects, and requests.
- `constants.ts` holds runtime defaults. `*-variants.ts` holds shared style variants,
  allowing prop types to derive from them without importing a component.
- `common/` contains shared presentation components; `ui/` contains UI primitives.
- `src/types/pages.ts` holds page, layout, and error boundary props.
- `src/types/api.ts` holds response shapes shared by frontend hooks.
- Pages in `src/app/` keep routing, metadata, session checks, and server data loading.

Import types with `import type`. Reuse the existing server view models as types
when they describe the API response; keep server runtime imports out of client
components. Component extraction should preserve markup, classes, text, and the
parent that owns state, including loading and disabled states shared by rows.
