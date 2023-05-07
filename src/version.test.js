const core = require("@actions/core");
const {shouldRelease, calculateNextVersion} = require("./version");

describe("shouldRelease", () => {
    function mockInput(release, branchRelease) {
        return (name) => {
            if (name === "release") {
                return release;
            } else {
                return branchRelease || "";
            }
        }
    }

    beforeEach(() => {
        core.warning = jest.fn();
    });

    it("should return true when release=true and branchRelease is not set", () => {
        // given
        core.getInput = jest.fn(mockInput("true"));
        // when
        const result = shouldRelease("master");
        // then
        expect(core.warning).toHaveBeenCalledTimes(0);
        expect(result).toBeTruthy();
    });

    it("should return true when release=false and branchRelease matches the current branch", () => {
        // given
        core.getInput = jest.fn(mockInput("false", "master"));
        // when
        const result = shouldRelease("master");
        // then
        expect(core.warning).toHaveBeenCalledTimes(1);
        expect(result).toBeTruthy();
    });

    it("should return false when release=false and branchRelease doesn't match the current branch", () => {
        // given
        core.getInput = jest.fn(mockInput("false", "feature"));
        // when
        const result = shouldRelease("master");
        // then
        expect(core.warning).toHaveBeenCalledTimes(1);
        expect(result).toBeFalsy();
    });
});

describe("calculateNextVersion", () => {
    const params = {
        lastTag: {tag: "v1.21.0", sha: "abc"},
        shouldRelease: true,
        prefix: "v",
        branch: "master"
    };

    it("should calculate then next version for release", () => {
        const result = calculateNextVersion(params);
        expect(result).toEqual({
            packedVersion: "v1.22.0",
            major: 1,
            minor: 22,
            patch: 0
        });
    });

    it("should calculate then next version for a branch", () => {
        const result = calculateNextVersion({...params, shouldRelease: false, branch: "feature"});
        expect(result).toEqual({
            packedVersion: "feature-v1.22.0-SNAPSHOT",
            major: 1,
            minor: 22,
            patch: 0
        });
    });

    it("should bump the major version when the current major version is lower than the one configured", () => {
        const result = calculateNextVersion({...params, major: "2"});
        expect(result).toEqual({
            packedVersion: "v2.0.0",
            major: 2,
            minor: 0,
            patch: 0
        });
    });

    it("should bump the minor version when the current major version is equal to the one configured", () => {
        const result = calculateNextVersion({...params, major: "1"});
        expect(result).toEqual({
            packedVersion: "v1.22.0",
            major: 1,
            minor: 22,
            patch: 0
        });
    });

    it("should bump the minor version when the current major version is higher than the one configured", () => {
        const result = calculateNextVersion({...params, major: "0"});
        expect(result).toEqual({
            packedVersion: "v1.22.0",
            major: 1,
            minor: 22,
            patch: 0
        });
    });

    it("should not bump anything when the sha is already tagged", () => {
        const result = calculateNextVersion({...params, sha: params.lastTag.sha});
        expect(result).toEqual({
            packedVersion: params.lastTag.tag,
            major: 1,
            minor: 21,
            patch: 0
        });
    });
});
