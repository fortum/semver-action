const core = require("@actions/core");
const github = require('@actions/github');
const {run} = require("./action");
jest.mock("./git");
const {getLastTagOrDefault, extractBranch, tag} = require("./git");
jest.mock("./version");
const {shouldRelease, calculateNextVersion} = require("./version");

const nextVersion = {
    packedVersion: "1.0.0-SNAPSHOT",
    major: 1,
    minor: 0,
    patch: 0
};


describe("semver-action", () => {

    beforeEach(() => {
        getLastTagOrDefault.mockImplementation(() => "0.0.0");

    });

    it("should calculate the version for a branch and not tag", async () => {
        // given
        const params = {
            branch: "feature",
            nextVersion: nextVersion
        }
        const outputs = {};
        mock(params, outputs);

        // when
        await run();

        // then
        expect(outputs.reference).toBe(params.branch);
        expect(outputs["next-version"]).toBe(params.nextVersion.packedVersion);
        expect(outputs["major"]).toBe(params.nextVersion.major);
        expect(outputs["minor"]).toBe(params.nextVersion.minor);
        expect(outputs["patch"]).toBe(params.nextVersion.patch);
        expect(tag).toBeCalledTimes(0);
    });

    it("should calculate the version for a PR and not tag", async () => {
        // given
        const params = {
            branch: "feature",
            nextVersion: nextVersion,
            pr: true
        }
        const outputs = {};
        mock(params, outputs);

        // when
        await run();

        // then
        expect(outputs.reference).toBe(params.branch);
        expect(outputs["next-version"]).toBe(params.nextVersion.packedVersion);
        expect(outputs["major"]).toBe(params.nextVersion.major);
        expect(outputs["minor"]).toBe(params.nextVersion.minor);
        expect(outputs["patch"]).toBe(params.nextVersion.patch);
        expect(tag).toBeCalledTimes(0);
    });

    it("should calculate the version for a release and tag the default sha", async () => {
        // given
        const params = {
            branch: "master",
            nextVersion: {...nextVersion, packedVersion: "1.0.0"},
            shouldRelease: true
        }
        const outputs = {};
        mock(params, outputs);

        // when
        await run();

        // then
        expect(outputs.reference).toBe(params.nextVersion.packedVersion);
        expect(outputs["next-version"]).toBe(params.nextVersion.packedVersion);
        expect(outputs["major"]).toBe(params.nextVersion.major);
        expect(outputs["minor"]).toBe(params.nextVersion.minor);
        expect(outputs["patch"]).toBe(params.nextVersion.patch);
        expect(tag).toBeCalledTimes(1);
        expect(tag).toBeCalledWith(expect.anything(), expect.objectContaining({
            version: params.nextVersion.packedVersion,
            sha: 'default'
        }));
    });

    it("should calculate the version for a release and tag the given sha", async () => {
        // given
        const params = {
            branch: "master",
            nextVersion: {...nextVersion, packedVersion: "1.0.0"},
            shouldRelease: true,
            inputs: {
                sha: "xyz"
            }
        }
        const outputs = {};
        mock(params, outputs);

        // when
        await run();

        // then
        expect(outputs.reference).toBe(params.nextVersion.packedVersion);
        expect(outputs["next-version"]).toBe(params.nextVersion.packedVersion);
        expect(outputs["major"]).toBe(params.nextVersion.major);
        expect(outputs["minor"]).toBe(params.nextVersion.minor);
        expect(outputs["patch"]).toBe(params.nextVersion.patch);
        expect(tag).toBeCalledTimes(1);
        expect(tag).toBeCalledWith(expect.anything(), expect.objectContaining({
            version: params.nextVersion.packedVersion,
            sha: params.inputs.sha
        }));
    });
});

function mockInput(params) {
    return (name) => params[name] || "";
}

function mock(params, outputs) {
    jest.resetAllMocks();
    // inputs
    core.getInput = jest.fn(mockInput({"repo-token": "abc", ...params.inputs}));

    // outputs
    core.setOutput = (k,v) => outputs[k] = v;

    // context
    Object.defineProperty(github, 'context', {
        value: {
            repo: {
                owner: "plugsurfing",
                repo: "test"
            },
            payload: {
                ref: params.pr ? undefined : params.branch,
                pull_request: params.pr ? {head: {ref: params.branch}} : undefined
            },
            sha: 'default'
        },
    });

    // functions
    extractBranch.mockImplementation(() => params.branch);
    getLastTagOrDefault.mockImplementation(() => params.previousVersion || "0.0.0");
    calculateNextVersion.mockImplementation(() => params.nextVersion || nextVersion);
    shouldRelease.mockImplementation(() => params.shouldRelease || false);
}
