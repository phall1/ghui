import { describe, expect, test } from "bun:test"

describe("item view atoms", () => {
	test("switching a subscribed repo list to author:@me reads that view's cached rows", async () => {
		// The app runtime layer is selected at module-import time. Exercise the
		// atom graph in a child process so this test cannot change the mock/live
		// layer used by terminal-render tests in the same Bun test run.
		const probe = `
			import * as AtomRegistry from "effect/unstable/reactivity/AtomRegistry"
			import { activeViewAtom, loadedPullRequestCountAtom, queueLoadCacheAtom, visiblePullRequestsAtom } from "./src/ui/pullRequests/atoms.ts"
			import { viewCacheKey } from "./src/pullRequestViews.ts"
			const registry = AtomRegistry.make()
			const repositoryView = { _tag: "Repository", repository: "anomalyco/opencode" }
			const authoredView = { _tag: "Queue", mode: "authored", repository: "anomalyco/opencode" }
			const item = (number, author) => ({ repository: "anomalyco/opencode", author, number, url: String(number), createdAt: new Date(2026, 0, number), updatedAt: new Date(2026, 0, number) })
			const load = (view, data) => ({ view, data, fetchedAt: new Date(), endCursor: null, hasNextPage: false })
			registry.set(queueLoadCacheAtom, {
				[viewCacheKey(repositoryView)]: load(repositoryView, [item(1, "kitlangton"), item(2, "another-author")]),
				[viewCacheKey(authoredView)]: load(authoredView, [item(1, "kitlangton")]),
			})
			registry.set(activeViewAtom, repositoryView)
			const unsubscribe = registry.subscribe(visiblePullRequestsAtom, () => {})
			registry.get(visiblePullRequestsAtom)
			registry.set(activeViewAtom, authoredView)
			const visible = registry.get(visiblePullRequestsAtom)
			console.log(visible.map((pullRequest) => pullRequest.author).join(",") + "|" + registry.get(loadedPullRequestCountAtom))
			unsubscribe()
		`
		const process = Bun.spawn(["bun", "--eval", probe], { cwd: new URL("..", import.meta.url).pathname, stdout: "pipe", stderr: "pipe" })
		const stdout = await new Response(process.stdout).text()
		const stderr = await new Response(process.stderr).text()

		expect(await process.exited, stderr).toBe(0)
		expect(stdout.trim()).toBe("kitlangton|1")
	})

	test("issue display atoms follow the active cached view after a repo filter switch", async () => {
		const probe = `
			import * as AtomRegistry from "effect/unstable/reactivity/AtomRegistry"
			import { activeIssueViewAtom, issueListAtom, issueQueueLoadCacheAtom, loadedIssueCountAtom } from "./src/ui/issues/atoms.ts"
			import { issueViewCacheKey } from "./src/issueViews.ts"
			const registry = AtomRegistry.make()
			const repositoryView = { _tag: "Repository", repository: "anomalyco/opencode" }
			const authoredView = { _tag: "Queue", mode: "authored", repository: "anomalyco/opencode" }
			const item = (number, author) => ({ repository: "anomalyco/opencode", author, number, url: String(number) })
			const load = (view, data) => ({ view, data, fetchedAt: new Date(), endCursor: null, hasNextPage: false })
			registry.set(issueQueueLoadCacheAtom, {
				[issueViewCacheKey(repositoryView)]: load(repositoryView, [item(1, "kitlangton"), item(2, "another-author")]),
				[issueViewCacheKey(authoredView)]: load(authoredView, [item(1, "kitlangton")]),
			})
			registry.set(activeIssueViewAtom, repositoryView)
			const unsubscribe = registry.subscribe(issueListAtom, () => {})
			registry.get(issueListAtom)
			registry.set(activeIssueViewAtom, authoredView)
			const visible = registry.get(issueListAtom)
			console.log(visible.map((issue) => issue.author).join(",") + "|" + registry.get(loadedIssueCountAtom))
			unsubscribe()
		`
		const process = Bun.spawn(["bun", "--eval", probe], { cwd: new URL("..", import.meta.url).pathname, stdout: "pipe", stderr: "pipe" })
		const stdout = await new Response(process.stdout).text()
		const stderr = await new Response(process.stderr).text()

		expect(await process.exited, stderr).toBe(0)
		expect(stdout.trim()).toBe("kitlangton|1")
	})
})
