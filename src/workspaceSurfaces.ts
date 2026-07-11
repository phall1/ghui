export const repositoryWorkspaceSurfaces = ["pullRequests", "issues", "actions"] as const
export const userWorkspaceSurfaces = ["repos", "pullRequests", "issues"] as const
export const workspaceSurfaces = ["repos", "pullRequests", "issues", "actions"] as const

export type WorkspaceSurface = (typeof workspaceSurfaces)[number]

export const workspaceSurfaceLabels: Record<WorkspaceSurface, string> = {
	repos: "REPOS",
	pullRequests: "PULL REQUESTS",
	issues: "ISSUES",
	actions: "ACTIONS",
}

export const nextWorkspaceSurface = (surface: WorkspaceSurface, delta: 1 | -1, surfaces: readonly WorkspaceSurface[] = workspaceSurfaces): WorkspaceSurface => {
	const index = Math.max(0, surfaces.indexOf(surface))
	const next = (index + delta + surfaces.length) % surfaces.length
	return surfaces[next]!
}
