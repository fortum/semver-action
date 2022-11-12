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

describe("shouldRelease", () => {
    const params = {
        lastTag: "v1.21.0",
        shouldRelease: true,
        prefix: "v",
        branch: "master"
    };

    it("should calculate then next version for release", () => {
        const result = calculateNextVersion(params);
        expect(result).toBe("v1.22.0");
    });

    it("should calculate then next version for a branch", () => {
        const result = calculateNextVersion({...params, shouldRelease: false, branch: "feature"});
        expect(result).toBe("vfeature-1.22.0-SNAPSHOT");
    });

    it("should bump the major version when the current major version is lower than the one configured", () => {
        const result = calculateNextVersion({...params, major: "2"});
        expect(result).toBe("v2.0.0");
    });

    it("should bump the minor version when the current major version is equal to the one configured", () => {
        const result = calculateNextVersion({...params, major: "1"});
        expect(result).toBe("v1.22.0");
    });

    it("should bump the minor version when the current major version is higher than the one configured", () => {
        const result = calculateNextVersion({...params, major: "0"});
        expect(result).toBe("v1.22.0");
    });
});
