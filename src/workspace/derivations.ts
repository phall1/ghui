import type { ComponentProps } from "react"
import type { IssueItem, LoadStatus, PullRequestComment, PullRequestItem } from "../domain.js"
import { ACTIVE_FILTER_BAR_HEIGHT } from "../ui/ActiveFilterBar.js"
import type { DetailCommentsStatus } from "../ui/DetailsPane.js"
import { getDetailHeaderHeight, getDetailJunctionRows, getScrollableDetailBodyHeight } from "../ui/DetailsPane.js"
import { getIssueDetailJunctionRows, issueListVisualLineCount } from "../ui/IssueList.js"
import type { IssueList } from "../ui/IssueList.js"
import { type PullRequestGroups, type PullRequestListRow, pullRequestListVisualLineCount } from "../ui/PullRequestList.js"
import type { PullRequestList } from "../ui/PullRequestList.js"
import type { RepoList, RepositoryListItem } from "../ui/RepoList.js"
import { workspaceTabSeparatorColumns } from "../ui/WorkspaceTabs.js"
import type { WorkspaceSurface } from "../workspaceSurfaces.js"

export interface WorkspaceDerivationsInput {
	readonly contentWidth: number
	readonly isWideLayout: boolean
	readonly leftPaneWidth: number
	readonly rightPaneWidth: number
	readonly rightContentWidth: number
	readonly fullscreenContentWidth: number
	readonly wideBodyHeight: number
	readonly dividerJunctionAt: number
	readonly showWorkspaceTabs: boolean
	readonly detailFullView: boolean
	readonly diffFullView: boolean
	readonly commentsViewActive: boolean
	readonly activeWorkspaceSurface: WorkspaceSurface
	readonly workspaceTabSurfaces: readonly WorkspaceSurface[]
	readonly selectedPullRequest: PullRequestItem | null
	readonly selectedIssue: IssueItem | null
	readonly selectedRepository: string | null
	readonly selectedComments: readonly PullRequestComment[]
	readonly selectedCommentsStatus: DetailCommentsStatus
	readonly isSelectedPullRequestDetailLoading: boolean
	readonly pullRequestStatus: LoadStatus
	readonly pullRequestError: string | null
	readonly pullRequestActiveFilterLabel: string | null
	readonly issueActiveFilterLabel: string | null
	readonly pullRequestListRows: readonly PullRequestListRow[]
	readonly visibleGroups: PullRequestGroups
	readonly visiblePullRequests: readonly PullRequestItem[]
	readonly issues: readonly IssueItem[]
	readonly showIssueRepositoryGroups: boolean
	readonly issuesStatus: LoadStatus
	readonly issuesError: string | null
	readonly repositoryItems: readonly RepositoryListItem[]
	readonly selectedIssueIndex: number
	readonly selectedRepositoryIndex: number
	readonly hasMorePullRequests: boolean
	readonly isLoadingMorePullRequests: boolean
	readonly loadedPullRequestCount: number
	readonly loadingIndicator: string
	readonly filterMode: boolean
	readonly visibleFilterText: string
	readonly selectPullRequestByUrl: (url: string) => void
	readonly setSelectedIssueIndex: (index: number) => void
	readonly setSelectedRepositoryIndex: (index: number) => void
}

export interface WorkspaceDerivations {
	readonly fullscreenDetailHeaderHeight: number
	readonly fullscreenDetailBodyScrollable: boolean
	readonly wideDetailHeaderHeight: number
	readonly wideDetailBodyScrollable: boolean
	readonly narrowPullRequestListHeight: number
	readonly narrowDetailsPaneHeight: number
	readonly narrowRepoListHeight: number
	readonly narrowRepoDetailHeight: number
	readonly narrowIssueListHeight: number
	readonly narrowIssueDetailHeight: number
	readonly narrowPreviewBodyHeight: number
	readonly narrowPreviewBodyScrollable: boolean
	readonly widePullRequestListHeight: number
	readonly narrowPullRequestRowsHeight: number
	readonly widePullRequestListNeedsScroll: boolean
	readonly narrowPullRequestListNeedsScroll: boolean
	readonly detailJunctions: readonly number[]
	readonly prListProps: Omit<ComponentProps<typeof PullRequestList>, "contentWidth">
	readonly issueListProps: Omit<ComponentProps<typeof IssueList>, "contentWidth">
	readonly repoListProps: Omit<ComponentProps<typeof RepoList>, "contentWidth">
	readonly showWideSplit: boolean
	readonly showRepoSplit: boolean
	readonly showIssueSplit: boolean
	readonly issueJunctions: readonly number[]
	readonly showPaneSplit: boolean
	readonly issueListNeedsScroll: boolean
	readonly narrowIssueListNeedsScroll: boolean
	readonly repoListNeedsScroll: boolean
	readonly narrowRepoListNeedsScroll: boolean
	readonly workspaceTabCounts: { readonly repos: number; readonly pullRequests: number | string; readonly issues: number }
	readonly filterPlaceholder: string
	readonly workspaceTabJunctions: readonly number[]
	readonly workspaceTopDividerJunctions: readonly { readonly at: number; readonly char: string }[]
	readonly workspaceBottomDividerJunctions: readonly { readonly at: number; readonly char: string }[]
}

export const computeWorkspaceDerivations = (input: WorkspaceDerivationsInput): WorkspaceDerivations => {
	const {
		contentWidth,
		isWideLayout,
		leftPaneWidth: _leftPaneWidth,
		rightPaneWidth,
		rightContentWidth,
		fullscreenContentWidth,
		wideBodyHeight,
		dividerJunctionAt,
		showWorkspaceTabs,
		detailFullView,
		diffFullView,
		commentsViewActive,
		activeWorkspaceSurface,
		workspaceTabSurfaces,
		selectedPullRequest,
		selectedIssue,
		selectedRepository,
		selectedComments,
		selectedCommentsStatus,
		isSelectedPullRequestDetailLoading,
		pullRequestStatus,
		pullRequestError,
		pullRequestActiveFilterLabel,
		issueActiveFilterLabel,
		pullRequestListRows,
		visibleGroups,
		visiblePullRequests,
		issues,
		showIssueRepositoryGroups,
		issuesStatus,
		issuesError,
		repositoryItems,
		selectedIssueIndex,
		selectedRepositoryIndex,
		hasMorePullRequests,
		isLoadingMorePullRequests,
		loadedPullRequestCount,
		loadingIndicator,
		filterMode,
		visibleFilterText,
		selectPullRequestByUrl,
		setSelectedIssueIndex,
		setSelectedRepositoryIndex,
	} = input
	void _leftPaneWidth

	const fullscreenDetailHeaderHeight = getDetailHeaderHeight(selectedPullRequest, contentWidth, isWideLayout, selectedComments, selectedCommentsStatus)
	const fullscreenDetailBodyViewportHeight = Math.max(1, wideBodyHeight - fullscreenDetailHeaderHeight)
	const fullscreenDetailBodyHeight = getScrollableDetailBodyHeight(selectedPullRequest, fullscreenContentWidth)
	const fullscreenDetailBodyScrollable = fullscreenDetailBodyHeight > fullscreenDetailBodyViewportHeight
	const wideDetailHeaderHeight = getDetailHeaderHeight(selectedPullRequest, rightPaneWidth, true, selectedComments, selectedCommentsStatus)
	const wideDetailBodyViewportHeight = Math.max(1, wideBodyHeight - wideDetailHeaderHeight)
	const wideDetailBodyHeight = getScrollableDetailBodyHeight(selectedPullRequest, rightContentWidth)
	const wideDetailBodyScrollable = wideDetailBodyHeight > wideDetailBodyViewportHeight
	const narrowPullRequestListHeight = Math.max(1, Math.ceil((wideBodyHeight - 1) / 2))
	const narrowDetailsPaneHeight = Math.max(1, wideBodyHeight - narrowPullRequestListHeight - 1)
	const narrowRepoListHeight = narrowPullRequestListHeight
	const narrowRepoDetailHeight = narrowDetailsPaneHeight
	const narrowIssueListHeight = narrowPullRequestListHeight
	const narrowIssueDetailHeight = narrowDetailsPaneHeight
	const narrowPreviewHeaderHeight = getDetailHeaderHeight(selectedPullRequest, contentWidth, false, selectedComments, selectedCommentsStatus)
	const narrowPreviewBodyHeight = Math.max(1, narrowDetailsPaneHeight - narrowPreviewHeaderHeight)
	const narrowPreviewBodyScrollable = getScrollableDetailBodyHeight(selectedPullRequest, fullscreenContentWidth) > narrowPreviewBodyHeight
	const pullRequestFilterBarHeight = pullRequestActiveFilterLabel ? ACTIVE_FILTER_BAR_HEIGHT : 0
	const widePullRequestListHeight = Math.max(1, wideBodyHeight - pullRequestFilterBarHeight)
	const narrowPullRequestRowsHeight = Math.max(1, narrowPullRequestListHeight - pullRequestFilterBarHeight)
	const pullRequestVisualLineCount = pullRequestListVisualLineCount(pullRequestListRows)
	const widePullRequestListNeedsScroll = pullRequestStatus === "ready" && pullRequestVisualLineCount > widePullRequestListHeight
	const narrowPullRequestListNeedsScroll = pullRequestStatus === "ready" && pullRequestVisualLineCount > narrowPullRequestRowsHeight
	const detailJunctions = isSelectedPullRequestDetailLoading
		? []
		: getDetailJunctionRows({
				pullRequest: selectedPullRequest,
				paneWidth: rightPaneWidth,
				showChecks: true,
				comments: selectedComments,
				commentsStatus: selectedCommentsStatus,
			})

	const prListProps = {
		groups: visibleGroups,
		selectedUrl: selectedPullRequest?.url ?? null,
		status: pullRequestStatus,
		error: pullRequestError,
		filterText: visibleFilterText,
		loadedCount: loadedPullRequestCount,
		hasMore: hasMorePullRequests,
		isLoadingMore: isLoadingMorePullRequests,
		loadingIndicator,
		onSelectPullRequest: selectPullRequestByUrl,
		showTitle: false,
		showRepositoryGroups: selectedRepository === null,
	} as const
	const issueListProps = {
		issues,
		selectedIndex: selectedIssueIndex,
		status: issuesStatus,
		error: issuesError,
		repository: selectedRepository,
		filterText: visibleFilterText,
		showFilterBar: false,
		isFilterEditing: filterMode,
		onSelectIssue: setSelectedIssueIndex,
	} as const
	const repoListProps = {
		repositories: repositoryItems,
		selectedIndex: selectedRepositoryIndex,
		filterText: visibleFilterText,
		showFilterBar: false,
		isFilterEditing: filterMode,
		onSelectRepository: setSelectedRepositoryIndex,
	} as const
	const showWideSplit = activeWorkspaceSurface === "pullRequests" && isWideLayout && !detailFullView && !diffFullView && !commentsViewActive
	const showRepoSplit = activeWorkspaceSurface === "repos" && isWideLayout && !detailFullView && !diffFullView && !commentsViewActive
	const showIssueSplit = activeWorkspaceSurface === "issues" && isWideLayout && !detailFullView && !diffFullView && !commentsViewActive
	const issueJunctions = showIssueSplit ? getIssueDetailJunctionRows(selectedIssue, rightPaneWidth) : []
	const showPaneSplit = showWideSplit || showRepoSplit || showIssueSplit
	const issueFilterBarHeight = issueActiveFilterLabel ? ACTIVE_FILTER_BAR_HEIGHT : 0
	const wideIssueRowsHeight = Math.max(1, wideBodyHeight - issueFilterBarHeight)
	const narrowIssueRowsHeight = Math.max(1, narrowIssueListHeight - issueFilterBarHeight)
	const issueVisualLineCount = issueListVisualLineCount(issues, showIssueRepositoryGroups)
	const issueListNeedsScroll = issuesStatus === "ready" && issueVisualLineCount > wideIssueRowsHeight
	const narrowIssueListNeedsScroll = issuesStatus === "ready" && issueVisualLineCount > narrowIssueRowsHeight
	const repoListNeedsScroll = repositoryItems.length > wideBodyHeight
	const narrowRepoListNeedsScroll = repositoryItems.length > narrowRepoListHeight
	const workspaceTabCounts = {
		repos: repositoryItems.length,
		pullRequests: hasMorePullRequests ? `${visiblePullRequests.length}+` : visiblePullRequests.length,
		issues: issues.length,
	}
	const filterPlaceholder = activeWorkspaceSurface === "pullRequests" ? "filter pull requests" : activeWorkspaceSurface === "issues" ? "filter issues" : "filter repositories"
	const workspaceTabJunctions = workspaceTabSeparatorColumns(workspaceTabCounts, workspaceTabSurfaces)
	const workspaceTopDividerJunctions = showWorkspaceTabs ? workspaceTabJunctions.map((at) => ({ at, char: "┬" })) : []
	const workspaceBottomDividerJunctions = showWorkspaceTabs
		? [...workspaceTabJunctions.map((at) => ({ at, char: "┴" })), ...(showPaneSplit ? [{ at: dividerJunctionAt, char: "┬" }] : [])]
		: []

	return {
		fullscreenDetailHeaderHeight,
		fullscreenDetailBodyScrollable,
		wideDetailHeaderHeight,
		wideDetailBodyScrollable,
		narrowPullRequestListHeight,
		narrowDetailsPaneHeight,
		narrowRepoListHeight,
		narrowRepoDetailHeight,
		narrowIssueListHeight,
		narrowIssueDetailHeight,
		narrowPreviewBodyHeight,
		narrowPreviewBodyScrollable,
		widePullRequestListHeight,
		narrowPullRequestRowsHeight,
		widePullRequestListNeedsScroll,
		narrowPullRequestListNeedsScroll,
		detailJunctions,
		prListProps,
		issueListProps,
		repoListProps,
		showWideSplit,
		showRepoSplit,
		showIssueSplit,
		issueJunctions,
		showPaneSplit,
		issueListNeedsScroll,
		narrowIssueListNeedsScroll,
		repoListNeedsScroll,
		narrowRepoListNeedsScroll,
		workspaceTabCounts,
		filterPlaceholder,
		workspaceTabJunctions,
		workspaceTopDividerJunctions,
		workspaceBottomDividerJunctions,
	}
}
