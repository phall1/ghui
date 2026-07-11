import { describe, expect, test } from "bun:test"
import { Effect, Layer, Schema } from "effect"
import { CommandRunner, type CommandResult } from "../src/services/CommandRunner.ts"
import { GitHubService } from "../src/services/GitHubService.ts"

interface RecordedCall {
	readonly command: string
	readonly args: readonly string[]
}

const fakeCommandRunner = (recorder: RecordedCall[]) =>
	Layer.succeed(
		CommandRunner,
		CommandRunner.of({
			run: (command, args) => {
				recorder.push({ command, args: [...args] })
				const result: CommandResult = { stdout: "", stderr: "", exitCode: 0 }
				return Effect.succeed(result)
			},
			runSchema: <S extends Schema.Top>(schema: S, command: string, args: readonly string[]) => {
				recorder.push({ command, args: [...args] })
				return Schema.decodeUnknownEffect(schema)(args[0] === "run" && args[1] === "list" ? [] : { login: "kit" }) as Effect.Effect<S["Type"], never, S["DecodingServices"]>
			},
		}),
	)

const runWith = (effect: Effect.Effect<void, unknown, GitHubService>, recorder: RecordedCall[]) => {
	const layer = GitHubService.layerNoDeps.pipe(Layer.provide(fakeCommandRunner(recorder)))
	return Effect.runPromise(effect.pipe(Effect.provide(layer)) as Effect.Effect<void>)
}

const actionCall = (recorder: readonly RecordedCall[]) => {
	const call = recorder.find((entry) => entry.args[0] === "run")
	if (!call) throw new Error("Expected a gh run command")
	return call
}

describe("GitHubService workflow run controls", () => {
	test("lists recent repository workflow runs without a commit filter", async () => {
		const recorder: RecordedCall[] = []
		await Effect.runPromise(
			GitHubService.use((github) => github.listRepositoryWorkflowRuns("owner/repo")).pipe(
				Effect.provide(GitHubService.layerNoDeps.pipe(Layer.provide(fakeCommandRunner(recorder)))),
			) as Effect.Effect<readonly unknown[]>,
		)

		const call = actionCall(recorder)
		expect(call.args[1]).toBe("list")
		expect(call.args).toContain("owner/repo")
		expect(call.args).not.toContain("--commit")
	})

	test("reruns a workflow", async () => {
		const recorder: RecordedCall[] = []
		await runWith(
			GitHubService.use((github) => github.rerunWorkflowRun("owner/repo", 123, false)),
			recorder,
		)

		expect(actionCall(recorder)).toEqual({ command: "gh", args: ["run", "rerun", "123", "--repo", "owner/repo"] })
	})

	test("reruns only failed jobs", async () => {
		const recorder: RecordedCall[] = []
		await runWith(
			GitHubService.use((github) => github.rerunWorkflowRun("owner/repo", 123, true)),
			recorder,
		)

		expect(actionCall(recorder).args).toEqual(["run", "rerun", "123", "--repo", "owner/repo", "--failed"])
	})

	test("cancels a workflow run", async () => {
		const recorder: RecordedCall[] = []
		await runWith(
			GitHubService.use((github) => github.cancelWorkflowRun("owner/repo", 123)),
			recorder,
		)

		expect(actionCall(recorder).args).toEqual(["run", "cancel", "123", "--repo", "owner/repo"])
	})
})
