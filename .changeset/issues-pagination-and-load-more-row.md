---
"@kitlangton/ghui": patch
---

issues now paginate the same way pull requests do. previously the
Issues tab cap'd at 50 with no way to load more — the tab read
"ISSUES 50" even when a repo had hundreds of open issues.

the page fetch shape mirrors pull-request pagination end to end:
`listIssuePageAtom` + `nextIssueLoadAfterPage` for the cursor-aware
append, a `useIssuesLoadMore` hook with the same `inFlightKeyRef`
race lock and 15s timeout, and a `loadMoreIssueRowSelectedAtom` that
makes the load-more row an explicit selectable slot. the Issues tab
now shows "50+" while more pages are available; pressing j past the
last issue lands on the load-more row, pressing Enter triggers the
next page fetch.

both pull requests and issues share the same UX:

  ↓ Press enter to load more  ·  N loaded

and the same race protection — concurrent triggers within a single
render tick can't fire parallel fetches with the same cursor.
