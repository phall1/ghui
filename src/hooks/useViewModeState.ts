import { useAtom, useAtomSet } from "@effect/atom-react"
import { commentsViewActiveAtom, commentsViewSelectionAtom } from "../ui/comments/atoms.js"
import { detailFullViewAtom, detailScrollOffsetAtom } from "../ui/detail/atoms.js"
import { diffFullViewAtom } from "../ui/diff/atoms.js"

/**
 * The three full-screen view-mode flags plus the comments-view
 * selection cursor. Together they decide which sub-mode is showing
 * inside `PullRequestSurface` and which keymap layer is active.
 */
export const useViewModeState = () => {
	const [detailFullView, setDetailFullView] = useAtom(detailFullViewAtom)
	const setDetailScrollOffset = useAtomSet(detailScrollOffsetAtom)
	const [diffFullView, setDiffFullView] = useAtom(diffFullViewAtom)
	const [commentsViewActive, setCommentsViewActive] = useAtom(commentsViewActiveAtom)
	const [commentsViewSelection, setCommentsViewSelection] = useAtom(commentsViewSelectionAtom)
	return {
		detailFullView,
		setDetailFullView,
		setDetailScrollOffset,
		diffFullView,
		setDiffFullView,
		commentsViewActive,
		setCommentsViewActive,
		commentsViewSelection,
		setCommentsViewSelection,
	}
}
