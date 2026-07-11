import { RegistryContext, useAtom, useAtomSet, useAtomValue } from "@effect/atom-react"
import { useCallback, useContext, useEffect, useMemo, useState } from "react"
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult"
import * as Cause from "effect/Cause"
import type { PullRequestItem, WorkflowRun, WorkflowRunDetails } from "../domain.js"
import { errorMessage } from "../errors.js"
import type { RunsViewCtx } from "../keymap/runsView.js"
import type { WorkspaceSurface } from "../workspaceSurfaces.js"
import { openUrlAtom } from "../services/systemAtoms.js"
import {
	pullRequestRunsFor,
	cancelWorkflowRunAtom,
	repositoryRunDetailSelectionAtom,
	repositoryRunsListSelectionAtom,
	repositorySelectedRunIdAtom,
	repositoryWorkflowRunsFor,
	rerunWorkflowRunAtom,
	runDetailKey,
	runDetailSelectionAtom,
	runsFullViewAtom,
	runsKey,
	runsListSelectionAtom,
	selectedRunIdAtom,
	workflowRunDetailsFor,
} from "../ui/runs/atoms.js"
import { canCancelRun, canRerunFailedJobs, canRerunRun, failureRowIndices, flattenRunRows, type RunDetailRow } from "../ui/runs/runsRows.js"

const clamp = (value: number, max: number) => Math.max(0, Math.min(value, Math.max(0, max)))

type ResultState<A> = { readonly status: "loading" } | { readonly status: "error"; readonly message: string } | { readonly status: "ready"; readonly value: A }

const toState = <A, E>(result: AsyncResult.AsyncResult<A, E>): ResultState<A> => {
	if (AsyncResult.isSuccess(result)) return { status: "ready", value: result.value }
	if (AsyncResult.isFailure(result)) return { status: "error", message: errorMessage(Cause.squash(result.cause)) }
	return { status: "loading" }
}

export interface RunsViewModel {
	readonly ctx: RunsViewCtx
	readonly runsFullView: boolean
	readonly inDetail: boolean
	readonly runsState: ResultState<readonly WorkflowRun[]>
	readonly detailState: ResultState<WorkflowRunDetails> | null
	readonly runsSelection: number
	readonly detailSelection: number
	readonly detailRows: readonly RunDetailRow[]
	// Click-to-select then act on a row (run row → open run; detail row → no-op extra).
	readonly selectRow: (index: number) => void
	readonly activateRow: (index: number) => void
}

export interface RepositoryRunsViewOptions {
	readonly repository: string | null
	readonly active: boolean
	readonly onClose: () => void
	readonly switchWorkspaceSurface: (surface: WorkspaceSurface) => void
	readonly cycleWorkspaceSurface: (delta: 1 | -1) => void
}

/**
 * Owns all runs-view atom state + navigation. Self-contained so the runs feature
 * lives in one module rather than threaded through the app-shell God-hook. Reads
 * the runs/detail family atoms (which auto-suspend) and exposes the keymap ctx
 * plus the data the pane renders.
 */
export const useRunsView = (
	selectedPullRequest: PullRequestItem | null,
	halfPage: number,
	flashNotice: (message: string) => void,
	repositoryOptions?: RepositoryRunsViewOptions,
): RunsViewModel => {
	const registry = useContext(RegistryContext)
	const repositoryMode = repositoryOptions !== undefined
	const repositoryActive = repositoryOptions?.active ?? false
	const closeRepositoryView = repositoryOptions?.onClose
	const switchRepositorySurface = repositoryOptions?.switchWorkspaceSurface
	const cycleRepositorySurface = repositoryOptions?.cycleWorkspaceSurface
	const [pullRequestRunsFullView, setPullRequestRunsFullView] = useAtom(runsFullViewAtom)
	const [selectedRunId, setSelectedRunId] = useAtom(repositoryMode ? repositorySelectedRunIdAtom : selectedRunIdAtom)
	const [runsSelection, setRunsSelection] = useAtom(repositoryMode ? repositoryRunsListSelectionAtom : runsListSelectionAtom)
	const [detailSelection, setDetailSelection] = useAtom(repositoryMode ? repositoryRunDetailSelectionAtom : runDetailSelectionAtom)
	const openUrl = useAtomSet(openUrlAtom, { mode: "promise" })
	const rerunWorkflowRun = useAtomSet(rerunWorkflowRunAtom, { mode: "promise" })
	const cancelWorkflowRun = useAtomSet(cancelWorkflowRunAtom, { mode: "promise" })
	const [actionPending, setActionPending] = useState(false)

	const repository = repositoryMode ? repositoryOptions.repository : (selectedPullRequest?.repository ?? null)
	const runsListKey = !repositoryMode && selectedPullRequest ? runsKey(selectedPullRequest) : null
	const pullRequestRunsResult = useAtomValue(pullRequestRunsFor(runsListKey ?? "\u0000\u0000"))
	const repositoryRunsResult = useAtomValue(repositoryWorkflowRunsFor(repositoryMode ? (repository ?? "") : ""))
	const runsResult = repositoryMode ? repositoryRunsResult : pullRequestRunsResult
	const runsState = useMemo<ResultState<readonly WorkflowRun[]>>(() => toState(runsResult), [runsResult])
	const runs: readonly WorkflowRun[] = runsState.status === "ready" ? runsState.value : []

	const inDetail = selectedRunId !== null
	const detailAtomKey = repository && selectedRunId !== null ? runDetailKey(repository, selectedRunId) : null
	const detailResult = useAtomValue(workflowRunDetailsFor(detailAtomKey ?? "\u0000\u0000"))
	const detailState = detailAtomKey ? toState(detailResult) : null
	const detailRun = detailState?.status === "ready" ? detailState.value : null
	const detailRows = useMemo(() => (detailRun ? flattenRunRows(detailRun) : []), [detailRun])

	useEffect(() => {
		if (!repositoryMode) return
		setSelectedRunId(null)
		setRunsSelection(0)
		setDetailSelection(0)
	}, [repositoryMode, repository, setSelectedRunId, setRunsSelection, setDetailSelection])

	const closeRunsView = useCallback(() => {
		if (repositoryMode) closeRepositoryView?.()
		else setPullRequestRunsFullView(false)
		setSelectedRunId(null)
	}, [repositoryMode, closeRepositoryView, setPullRequestRunsFullView, setSelectedRunId])

	const backToList = useCallback(() => {
		if (selectedRunId !== null) {
			const selectedIndex = runs.findIndex((run) => run.id === selectedRunId)
			if (selectedIndex >= 0) setRunsSelection(selectedIndex)
		}
		setSelectedRunId(null)
		setDetailSelection(0)
	}, [selectedRunId, runs, setRunsSelection, setSelectedRunId, setDetailSelection])

	const handleEscape = useCallback(() => {
		if (inDetail) backToList()
		else closeRunsView()
	}, [inDetail, backToList, closeRunsView])

	const moveSelection = useCallback(
		(delta: number) => {
			if (inDetail) setDetailSelection((current) => clamp(current + delta, detailRows.length - 1))
			else setRunsSelection((current) => clamp(current + delta, runs.length - 1))
		},
		[inDetail, detailRows.length, runs.length, setDetailSelection, setRunsSelection],
	)

	const moveSelectionToBoundary = useCallback(
		(boundary: "first" | "last") => {
			if (inDetail) setDetailSelection(boundary === "first" ? 0 : Math.max(0, detailRows.length - 1))
			else setRunsSelection(boundary === "first" ? 0 : Math.max(0, runs.length - 1))
		},
		[inDetail, detailRows.length, runs.length, setDetailSelection, setRunsSelection],
	)

	const openRunAt = useCallback(
		(index: number) => {
			const run = runs[index]
			if (!run) return
			setSelectedRunId(run.id)
			setDetailSelection(0)
		},
		[runs, setSelectedRunId, setDetailSelection],
	)

	const openStepLogAt = useCallback(
		(index: number) => {
			const row = detailRows[index]
			const url = row?.kind === "step" ? row.job.url : detailRun?.url
			if (url) void openUrl(url)
		},
		[detailRows, detailRun, openUrl],
	)

	// `enter` (or click-activate): open the focused run, or open the focused
	// step's job log in the browser. There's no inline log expansion in slice 1.
	const openSelected = useCallback(() => {
		if (inDetail) openStepLogAt(detailSelection)
		else openRunAt(runsSelection)
	}, [inDetail, openStepLogAt, openRunAt, detailSelection, runsSelection])

	const jumpFailure = useCallback(
		(direction: 1 | -1) => {
			if (!inDetail) return
			const failures = failureRowIndices(detailRows)
			if (failures.length === 0) return
			const current = detailSelection
			const next =
				direction === 1 ? (failures.find((index) => index > current) ?? failures[0]!) : ([...failures].reverse().find((index) => index < current) ?? failures[failures.length - 1]!)
			setDetailSelection(next)
		},
		[inDetail, detailRows, detailSelection, setDetailSelection],
	)

	const openInBrowser = useCallback(() => {
		const url = inDetail ? detailRun?.url : runs[runsSelection]?.url
		if (url) void openUrl(url)
	}, [inDetail, detailRun, runs, runsSelection, openUrl])

	// Mouse: first click selects the row, second (or click on the already-selected
	// row) activates it — opening a run, or a step's log in the browser.
	const selectRow = useCallback(
		(index: number) => {
			if (inDetail) setDetailSelection(clamp(index, detailRows.length - 1))
			else setRunsSelection(clamp(index, runs.length - 1))
		},
		[inDetail, detailRows.length, runs.length, setDetailSelection, setRunsSelection],
	)

	const activateRow = useCallback(
		(index: number) => {
			if (inDetail) openStepLogAt(index)
			else openRunAt(index)
		},
		[inDetail, openStepLogAt, openRunAt],
	)

	const refresh = useCallback(() => {
		if (repositoryMode && repository) registry.refresh(repositoryWorkflowRunsFor(repository))
		else if (runsListKey) registry.refresh(pullRequestRunsFor(runsListKey))
		if (detailAtomKey) registry.refresh(workflowRunDetailsFor(detailAtomKey))
	}, [registry, repositoryMode, repository, runsListKey, detailAtomKey])

	useEffect(() => {
		const active = repositoryMode ? repositoryActive : pullRequestRunsFullView
		if (!active || runsState.status !== "ready" || !runs.some((run) => run.status !== "completed")) return
		const timeout = globalThis.setTimeout(refresh, 5_000)
		return () => globalThis.clearTimeout(timeout)
	}, [repositoryMode, repositoryActive, pullRequestRunsFullView, runsState.status, runs, refresh])

	const rerun = useCallback(
		(failedOnly: boolean) => {
			if (!repository || !detailRun || actionPending) return
			if (!canRerunRun(detailRun)) {
				flashNotice("Only completed workflow runs can be rerun")
				return
			}
			if (failedOnly && !canRerunFailedJobs(detailRun)) {
				flashNotice("This run has no failed jobs to rerun")
				return
			}

			setActionPending(true)
			flashNotice(failedOnly ? "Rerunning failed jobs" : "Rerunning workflow")
			void rerunWorkflowRun({ repository, runId: detailRun.id, failedOnly })
				.then(() => {
					refresh()
					flashNotice(failedOnly ? "Failed jobs queued" : "Workflow rerun queued")
				})
				.catch((error) => flashNotice(errorMessage(error)))
				.finally(() => setActionPending(false))
		},
		[repository, detailRun, actionPending, flashNotice, rerunWorkflowRun, refresh],
	)

	const cancel = useCallback(() => {
		if (!repository || !detailRun || actionPending) return
		if (!canCancelRun(detailRun)) {
			flashNotice("Only queued or in-progress workflow runs can be cancelled")
			return
		}

		setActionPending(true)
		flashNotice("Cancelling workflow run")
		void cancelWorkflowRun({ repository, runId: detailRun.id })
			.then(() => {
				refresh()
				flashNotice("Workflow run cancelled")
			})
			.catch((error) => flashNotice(errorMessage(error)))
			.finally(() => setActionPending(false))
	}, [repository, detailRun, actionPending, flashNotice, cancelWorkflowRun, refresh])

	const ctx: RunsViewCtx = useMemo(
		() => ({
			halfPage,
			inDetail,
			handleEscape,
			moveSelection,
			moveSelectionToBoundary,
			openSelected,
			nextFailure: () => jumpFailure(1),
			previousFailure: () => jumpFailure(-1),
			refresh,
			rerun,
			cancel,
			openInBrowser,
			repositorySurface: repositoryMode,
			switchWorkspaceSurface: repositoryMode && switchRepositorySurface ? switchRepositorySurface : () => undefined,
			cycleWorkspaceSurface: repositoryMode && cycleRepositorySurface ? cycleRepositorySurface : () => undefined,
		}),
		[
			halfPage,
			inDetail,
			handleEscape,
			moveSelection,
			moveSelectionToBoundary,
			openSelected,
			jumpFailure,
			refresh,
			rerun,
			cancel,
			openInBrowser,
			repositoryMode,
			switchRepositorySurface,
			cycleRepositorySurface,
		],
	)

	return {
		ctx,
		runsFullView: repositoryMode ? repositoryActive : pullRequestRunsFullView,
		inDetail,
		runsState,
		detailState,
		runsSelection: clamp(runsSelection, runs.length - 1),
		detailSelection: clamp(detailSelection, detailRows.length - 1),
		detailRows,
		selectRow,
		activateRow,
	}
}
