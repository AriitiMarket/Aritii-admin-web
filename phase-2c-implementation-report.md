# Ariiti Market Admin Web — Phase 2C Unknown-Role Protection

**Status:** Implemented with policy-sensitive compatibility behavior preserved.

## Implementation summary

Phase 1, the Phase 2 remediation plan, and Phase 2B readiness report were inspected before editing. The worktree contained no prior Phase 2C implementation. The change is limited to the active frontend authentication and role-normalization paths.

The implementation now:

- rejects missing, non-string, unknown, and malformed role claims instead of defaulting them to `SUPER_ADMIN`;
- rejects malformed `adminRoles` containers;
- preserves the existing first-recognized `adminRoles` behavior and documented coarse-role compatibility mappings because their policy decisions remain unresolved;
- prevents the legacy `mapUserTypeToRole()` helper from returning `SUPER_ADMIN` for an unsupported runtime value;
- clears the complete local session when profile normalization fails;
- clears tokens and user state on login failure, including failures after token issuance;
- treats an unsupported-role error during refresh as a session-invalidating failure.

## Exact changed file paths

- `src\services\real\auth.ts`
- `src\context\AuthContext.tsx`
- `src\utils\auth-roles.ts`
- `phase-2c-implementation-report.md`

## Security behavior before and after

| Area | Before Phase 2C | After Phase 2C |
|---|---|---|
| Unknown `role` | `ROLE_MAP[raw.role] ?? 'SUPER_ADMIN'` elevated unknown values | Unknown, missing, non-string, or unmapped values throw `UnsupportedAdminRoleError` |
| Missing `role` | Could become `SUPER_ADMIN` through the fallback | Rejected; no `AdminUser` is created |
| Malformed `adminRoles` | Could cause an uncontrolled runtime failure or fall through to coarse-role mapping | Rejected when present but not an array |
| Unknown-only `adminRoles` | Could fall through to the privileged final fallback | Falls back only to an explicitly recognized coarse-role mapping; otherwise rejected |
| Invalid profile during login | Tokens were stored before profile normalization and could remain after failure | Login catch clears complete local session state and rethrows the original error |
| Invalid profile during bootstrap | Bootstrap already cleared local state; normalization errors were not explicitly typed | Profile normalization clears complete local state; bootstrap also clears state and removes the cached user |
| Invalid profile during refresh | Unsupported-role errors were not recognized as auth failures, so React state could remain | Profile normalization clears storage and the refresh path logs out, clearing React state |
| Legacy helper fallback | Runtime default returned `SUPER_ADMIN` | Unsupported runtime values throw instead of receiving a privileged role |
| Permissions | A normalized `SUPER_ADMIN` could receive the existing wildcard compatibility fallback | Unknown roles cannot reach permission construction; no new wildcard fallback was added |

### Policy-sensitive behavior intentionally preserved

- `STAFF` remains mapped to `SUPER_ADMIN` in the active compatibility map and legacy helper. Phase 2B explicitly found that approval of `STAFF` as an Admin Web alias is unresolved; changing it here would invent policy.
- Coarse `ADMIN` remains mapped to `SUPER_ADMIN` for the existing compatibility contract. Phase 2B identified whether that is an approved full-access alias as unresolved.
- Multiple recognized `adminRoles` continue to use the existing first-recognized behavior. No new precedence policy was introduced.

These are remaining policy questions, not claims that the mappings are approved long-term authorization policy.

## Validation commands and actual results

| Command | Result | Actual result |
|---|---|---|
| `npm run typecheck` | **PASSED** | `tsc --noEmit` exited with code 0 |
| `npx eslint src\services\real\auth.ts src\context\AuthContext.tsx src\utils\auth-roles.ts` | **PASSED** | Changed authentication files passed ESLint |
| `npm run lint` | **FAILED** | ESLint reported 221 existing repository problems, primarily `no-explicit-any`, outside the changed files; no changed-file lint errors were identified |
| `npm run test:lifecycle` | **FAILED** | Script could not resolve `..\backend-services\delivery-service\src\shared\constants\index.js`; this is an existing sibling-repository/path prerequisite and unrelated to the Phase 2C source changes |
| `npm run test:map` | **NOT RUN** | Unrelated to role/session protection |
| `npm run cy:run` | **NOT RUN** | No Cypress test files were identified in the Phase 2B inspection, and this change has no existing Cypress coverage |

`git diff --check` also passed with no whitespace errors.

## Git diff summary

Source changes:

- 3 files changed
- 61 insertions
- 20 deletions

The existing untracked Phase 1/Phase 2 planning and report files were not modified:

- `phase-2-admin-web-role-remediation-plan.md`
- `phase-2b-role-policy-readiness.md`
- `report.md`
- `report2.md`

## Remaining policy questions and risks

1. Is `STAFF` an approved Admin Web alias, or must it be rejected?
2. Is coarse `ADMIN` approved to receive the frontend `SUPER_ADMIN` compatibility role?
3. Are multiple recognized `adminRoles` claims valid, and what precedence or combination rule is authoritative?
4. What approved UX should be used for an authenticated Identity account with no valid Admin Web role: return to login, show an unsupported-account state, or route elsewhere?
5. The frontend remains UI/session protection only. Backend authorization must remain authoritative.
6. The full repository lint and lifecycle scripts remain blocked by pre-existing issues documented above.
