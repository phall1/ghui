import type { RunsViewModel } from "../hooks/useRunsView.js"
import { RepositoryRunsPane } from "../ui/runs/RunsPane.js"

export interface ActionsSurfaceProps {
	readonly repository: string
	readonly runsView: RunsViewModel
	readonly contentWidth: number
	readonly height: number
	readonly loadingIndicator: string
	readonly showScrollbar: boolean
}

export const ActionsSurface = ({ repository, runsView, contentWidth, height, loadingIndicator, showScrollbar }: ActionsSurfaceProps) => (
	<RepositoryRunsPane
		repository={repository}
		inDetail={runsView.inDetail}
		runsState={runsView.runsState}
		detailState={runsView.detailState}
		runsSelection={runsView.runsSelection}
		detailSelection={runsView.detailSelection}
		detailRows={runsView.detailRows}
		onSelectRow={runsView.selectRow}
		onActivateRow={runsView.activateRow}
		contentWidth={contentWidth}
		height={height}
		loadingIndicator={loadingIndicator}
		showScrollbar={showScrollbar}
	/>
)
