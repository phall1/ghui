// Merge kitlangton/ghui (upstream) into this fork's main, validate, and push to origin.
//
// Usage: bun run sync:upstream [--no-push]
//
// - Never touches upstream. Only ever pushes to `origin` (this fork).
// - Aborts on a dirty working tree or merge conflicts rather than guessing.
// - Runs the same gates AGENTS.md requires before a commit (format, typecheck, lint, test).

const noPush = process.argv.includes("--no-push")

const run = (cmd: string[], opts: { allowFailure?: boolean } = {}) => {
	const proc = Bun.spawnSync({ cmd, stdout: "inherit", stderr: "inherit" })
	if (proc.exitCode !== 0 && !opts.allowFailure) {
		console.error(`\nCommand failed (${proc.exitCode}): ${cmd.join(" ")}`)
		process.exit(proc.exitCode ?? 1)
	}
	return proc.exitCode === 0
}

const runCapture = (cmd: string[]) => {
	const proc = Bun.spawnSync({ cmd, stdout: "pipe", stderr: "pipe" })
	return proc.stdout.toString().trim()
}

const currentBranch = runCapture(["git", "branch", "--show-current"])
const dirty = runCapture(["git", "status", "--porcelain"])
if (dirty) {
	console.error("Working tree is dirty. Commit or stash changes before syncing.")
	process.exit(1)
}

console.log("Fetching upstream and origin...")
run(["git", "fetch", "upstream"])
run(["git", "fetch", "origin"])

const behind = Number(runCapture(["git", "rev-list", "--count", "main..upstream/main"]))
if (behind === 0) {
	console.log("Already up to date with upstream/main. Nothing to do.")
	if (currentBranch !== "main") run(["git", "checkout", currentBranch])
	process.exit(0)
}

console.log(`\n${behind} new commit(s) on upstream/main:`)
run(["git", "log", "--oneline", "main..upstream/main"])

run(["git", "checkout", "main"])

console.log("\nMerging upstream/main into main...")
const merged = run(["git", "merge", "upstream/main", "--no-edit"], { allowFailure: true })
if (!merged) {
	console.error(`
Merge conflict. Resolve manually:
  git status                # see conflicting files
  ...fix conflicts...
  git add <files>
  git merge --continue

Then rerun: bun run sync:upstream
`)
	process.exit(1)
}

console.log("\nInstalling dependencies (in case they changed)...")
run(["bun", "install"])

console.log("\nRunning quality gates...")
const gates: Array<[string, string[]]> = [
	["format:check", ["bun", "run", "format:check"]],
	["typecheck", ["bun", "run", "typecheck"]],
	["lint", ["bun", "run", "lint"]],
	["test", ["bun", "run", "test"]],
]

for (const [name, cmd] of gates) {
	console.log(`\n> ${name}`)
	const ok = run(cmd, { allowFailure: true })
	if (!ok) {
		console.error(`
${name} failed after merging upstream. The merge commit is already on main
(local only, not pushed). Fix the failure, commit, then rerun:
  bun run sync:upstream --no-push   # to push once you've verified manually
`)
		process.exit(1)
	}
}

if (noPush) {
	console.log("\nAll gates passed. --no-push set, skipping push to origin/main.")
	process.exit(0)
}

console.log("\nAll gates passed. Pushing to origin/main (your fork)...")
run(["git", "push", "origin", "main"])

console.log("\nDone. main is now up to date with upstream and pushed to your fork.")
if (currentBranch !== "main") {
	console.log(`\nYou were on '${currentBranch}'. To bring it up to date:`)
	console.log(`  git checkout ${currentBranch} && git merge main`)
}
