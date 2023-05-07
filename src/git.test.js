const {getLastTagOrDefault, extractBranch} = require('./git');

const listTagsMock = jest.fn();
const client = {
    paginate: () => listTagsMock(),
    rest: {
        repos: {
            listTags: listTagsMock
        }
    }
}

describe("getLastTagOrDefault", () => {

    const config = {
        owner: "plugsurfing",
        repo: "test"
    }

    it("should return the default tag when no tag exists", async () => {
        // given
        listTagsMock.mockReturnValue([]);
        // when
        const result = await getLastTagOrDefault(client, config);
        // then
        expect(result.tag).toBe("0.0.0");
        expect(result.sha).toBe("");
    });

    it("should return the default tag when no tag exists with the given prefix", async () => {
        // given
        listTagsMock.mockReturnValue([
            {name: "v1.22.0", commit: {sha: "abc"}}
        ]);
        // when
        const result = await getLastTagOrDefault(client, {...config, prefix: "prefix-"});
        // then
        expect(result.tag).toBe("prefix-0.0.0");
        expect(result.sha).toBe("");
    });

    it("should return the latest tag when tags exist with the given prefix", async () => {
        // given
        listTagsMock.mockReturnValue([
            {name: "v1.22.0", commit: {sha: "def"}},
            {name: "v1.21.0", commit: {sha: "abc"}}
        ]);
        // when
        const result = await getLastTagOrDefault(client, {...config, prefix: "v"});
        // then
        expect(result.tag).toBe("v1.22.0");
        expect(result.sha).toBe("def");
    });

    it("should return the latest no-prefix tag when no-prefix tags exist", async () => {
        // given
        listTagsMock.mockReturnValue([
            {name: "1.22.0", commit: {sha: "def"}},
            {name: "1.21.0", commit: {sha: "abc"}}
        ]);
        // when
        const result = await getLastTagOrDefault(client, config);
        // then
        expect(result.tag).toBe("1.22.0");
        expect(result.sha).toBe("def");
    });

    it("should ignore non-semver tags", async () => {
        // given
        listTagsMock.mockReturnValue([
            {name: "v1.23.Ö", commit: {sha: "ghi"}},
            {name: "v1.22.0", commit: {sha: "def"}},
            {name: "v1.21.0", commit: {sha: "abc"}}
        ]);
        // when
        const result = await getLastTagOrDefault(client, {...config, prefix: "v"});
        // then
        expect(result.tag).toBe("v1.22.0");
        expect(result.sha).toBe("def");
    });

    it("should select the last tag matching the given prefix", async () => {
        // given
        listTagsMock.mockReturnValue([
            {name: "lambdas-0.3.0", commit: {sha: "ghi"}},
            {name: "1.22.0", commit: {sha: "def"}},
            {name: "lambdas-0.2.0", commit: {sha: "abc"}}
        ]);

        // when
        const resultService = await getLastTagOrDefault(client, config);
        // then
        expect(resultService.tag).toBe("1.22.0");
        expect(resultService.sha).toBe("def");

        // when
        const resultLambda = await getLastTagOrDefault(client, {...config, prefix: "lambdas-"});
        // then
        expect(resultLambda.tag).toBe("lambdas-0.3.0");
        expect(resultLambda.sha).toBe("ghi");
    });

    it("should return the latest no-prefix tag when no-prefix tags exist correctly sorting semver", async () => {
        // given
        listTagsMock.mockReturnValue([
            {name: "1.22.0", commit: {sha: "1"}},
            {name: "1.200.9", commit: {sha: "2"}},
            {name: "1.200.10", commit: {sha: "3"}},
            {name: "9.9.999", commit: {sha: "4"}},
            {name: "10.10.9", commit: {sha: "5"}},
            {name: "10.10.1000", commit: {sha: "6"}},
            {name: "v1.9.0", commit: {sha: "7"}},
            {name: "v2.0.0", commit: {sha: "8"}},
            {name: "v2.1.0", commit: {sha: "9"}},
            {name: "v2.2.0", commit: {sha: "99"}},
        ]);
        // when
        let result = await getLastTagOrDefault(client, config);
        // then
        expect(result.tag).toBe("10.10.1000");
        expect(result.sha).toBe("6");

        // when
        result = await getLastTagOrDefault(client, {...config, prefix: "v"});
        // then
        expect(result.tag).toBe("v2.2.0");
        expect(result.sha).toBe("99");
    });
});

describe("extractBranch", () => {
    it("should extract the branch name", () => {
        expect(extractBranch("refs/heads/branch-name")).toBe("branch-name");
        expect(extractBranch("/branch-name")).toBe("branch-name");
        expect(extractBranch("branch-name")).toBe("branch-name");
    });
});
