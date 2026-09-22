# Recommendation explanations

## Bot alignment (2026-09-22)

- Personal requests now match the Bot defaults for the same player and mode: balanced, 500 candidates, 20 results, 0–20 stars, 3600 seconds, seven default Mod combinations, recorded plays excluded, and CTB/taiko converts included. Explicit filters remain available; condition-only discovery retains its separate defaults.
- Personal requests use `/recommend/personal/jobs` with authenticated server-side polling and a 630-second deadline. The frontend preserves the returned item order and does not rerank.
- `botDisplay` selects practice-target PP/ACC/gain when provided by the API, otherwise prediction values. This applies to taiko too; stricter optional evidence-detail parsers no longer silently change primary PP/ACC. Missing gains remain unknown, not zero. Evidence is not invented.
- Local `.env.local` points at the NAS API. No production deployment or credential values are recorded here. The website does not know QQ-specific Bot mode bindings: compare the same UID, mode, target and filters. Bot response caching can retain the previous result for up to 120 seconds.

The personal recommendation table shows a compact explanation and two raw-feature differences against the requested player's BP reference. Mania compares LN ratio and average note density; osu compares jump P90 and density; taiko compares color changes and density; CTB compares direction changes and horizontal jump P90.

- The reference is fetched in parallel with recommendation generation through the existing authenticated backend integration. It is returned with the result snapshot, never taken from subsequently edited controls or the independently selected reference panel.
- References are validated for player identity, mode and minimum sample counts. Mania rows use only the matching key-count group. Missing references do not block recommendations or borrow another group's data.
- Compact BP comparisons use relative percentage differences across all modes, with an absolute-value fallback when the BP baseline is zero. Both sides are raw NM features, even for modded recommendations. They describe style, not mod-adjusted play difficulty.
- Rows show two short, right-aligned comparisons, such as “跳距 +4%”. Original values, feature definitions and samples remain in accessible labels and hover descriptions. Peer evidence is collapsed to a player count. These are feature comparisons, not a complete explanation of ranking. ACC, PP, hard filters and engine ordering are unchanged.
- Personal CTB rows show estimated Miss and highest combo / theoretical maximum as default columns. Rule Miss and experimental-model Miss have separate labels. The optional CTB model supplies combo explicitly; it is never inferred by the frontend from ACC. Missing values display a dash, while zero remains zero. Older deployed APIs safely show unavailable for missing fields.
- This is a local frontend change. No NAS or production website deployment is performed as part of this UI task.

Validation: 42 frontend tests, TypeScript and targeted ESLint checks pass. Browser validation reached the existing recommendation page, but its recommendation request returned the login-required response; authenticated visual verification needs a renewed session.
