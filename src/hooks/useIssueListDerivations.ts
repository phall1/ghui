import { useMemo } from "react"
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult"
import { Cause } from "effect"
import type { IssueItem, LoadStatus } from "../domain.js"
import { errorMessage } from "../errors.js"
import { issueListRowIndex, orderIssuesForDisplay } from "../ui/IssueList.js"
import { filterByScore, issueFilterScore } from "../ui/filter/scoring.js"

type IssuesResult = AsyncResult.AsyncResult<unknown, unknown>

export interface UseIssueListDerivationsInput {
	readonly rawIssues: readonly IssueItem[]
	readonly issueOverrides: Readonly<Record<string, IssueItem>>
	readonly showIssueRepositoryGroups: boolean
	readonly activeWorkspaceSurface: string
	readonly visibleFilterText: string
	readonly selectedRepository: string | null
	readonly issuesResult: IssuesResult
	readonly selectedIssueIndex: number
}

export interface IssueListDerivations {
	readonly allIssues: readonly IssueItem[]
	readonly issues: readonly IssueItem[]
	readonly issuesStatus: LoadStatus
	readonly issuesError: string | null
	readonly selectedIssue: IssueItem | null
	readonly selectedIssueRowIndex: number | null
}

/**
 * Folds three layers into the displayed issue list:
 *   1. `rawIssues` from the server.
 *   2. `issueOverrides` for optimistic local mutations + closed orphans
 *      that should stay visible until the next refresh removes them.
 *   3. The active filter text (fuzzy score order, preserving load order
 *      when the query is empty).
 *
 * Server applies mode-based filtering (authored / assigned / mentioned)
 * upstream, so there's no client-side scope filter here.
 */
export const useIssueListDerivations = ({
	rawIssues,
	issueOverrides,
	showIssueRepositoryGroups,
	activeWorkspaceSurface,
	visibleFilterText,
	selectedRepository,
	issuesResult,
	selectedIssueIndex,
}: UseIssueListDerivationsInput): IssueListDerivations => {
	const allIssues = useMemo(() => {
		const seen = new Set<string>()
		const mapped: IssueItem[] = []
		for (const issue of rawIssues) {
			seen.add(issue.url)
			mapped.push(issueOverrides[issue.url] ?? issue)
		}
		const orphans = Object.values(issueOverrides).filter((issue) => !seen.has(issue.url) && issue.state === "closed")
		const merged = [...mapped, ...orphans].sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())
		return orderIssuesForDisplay(merged, showIssueRepositoryGroups)
	}, [rawIssues, issueOverrides, showIssueRepositoryGroups])

	const issues = useMemo(() => {
		if (activeWorkspaceSurface !== "issues" || visibleFilterText.trim().length === 0) return allIssues
		const filtered = filterByScore(allIssues, visibleFilterText, issueFilterScore, (issue) => issue.updatedAt.getTime())
		return orderIssuesForDisplay(filtered, showIssueRepositoryGroups)
	}, [activeWorkspaceSurface, allIssues, visibleFilterText, showIssueRepositoryGroups])

	const issuesStatus: LoadStatus = selectedRepository === null ? "ready" : issuesResult.waiting ? "loading" : AsyncResult.isFailure(issuesResult) ? "error" : "ready"
	const issuesError = AsyncResult.isFailure(issuesResult) ? errorMessage(Cause.squash(issuesResult.cause)) : null
	const selectedIssue = issues[Math.max(0, Math.min(selectedIssueIndex, issues.length - 1))] ?? null
	const selectedIssueRowIndex = issueListRowIndex(issues, selectedIssueIndex, showIssueRepositoryGroups)

	return { allIssues, issues, issuesStatus, issuesError, selectedIssue, selectedIssueRowIndex }
}
