---
"@kitlangton/ghui": patch
---

fix pull-request pagination wedging at "(50 loaded) 50+". the previous
auto-load mechanism had three concurrent triggers — a 120ms scroll-position
poll, a selection-threshold useEffect, and the j-at-tail step — all gated
on React state via `isLoadingMorePullRequests`. since `setLoadingMoreKey`
is asynchronous, two triggers in the same tick both saw a cleared flag and
fired parallel fetches with the same cursor; the second response then saw
`cursorAdvanced=false` and flipped `hasNextPage=false`, killing pagination
at 50 with the tab stuck on "50+".

the fix removes scroll-polling + selection-threshold auto-fire entirely,
keeps the explicit j-at-tail trigger, and adds a synchronous
`inFlightKeyRef` lock inside `useLoadMore` so multiple triggers within a
single tick can't race. also adds a 15s `Promise.race` timeout so a
hanging GraphQL response surfaces a flash notice + clears the spinner
instead of wedging. the load-more row now prompts "↓ Press j to load more"
so the affordance is explicit.
