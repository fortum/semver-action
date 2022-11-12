const { getLastTagOrDefault, extractBranch } = require('./git');

const listTagsMock = jest.fn();
const client = {
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
        listTagsMock.mockReturnValue({data: []});
        // when
        const result = await getLastTagOrDefault(client, config);
        // then
        expect(result).toBe("0.0.0");
    });

    it("should return the default tag when no tag exists with the given prefix", async () => {
        // given
        listTagsMock.mockReturnValue({data: [{name: "v1.22.0"}]});
        // when
        const result = await getLastTagOrDefault(client, {...config, prefix: "prefix-"});
        // then
        expect(result).toBe("prefix-0.0.0");
    });

    it("should return the latest tag when tags exist with the given prefix", async () => {
        // given
        listTagsMock.mockReturnValue({data: [{name: "v1.22.0"}, {name: "v1.21.0"}]});
        // when
        const result = await getLastTagOrDefault(client, {...config, prefix: "v"});
        // then
        expect(result).toBe("v1.22.0");
    });

    it("should return the latest no-prefix tag when no-prefix tags exist", async () => {
        // given
        listTagsMock.mockReturnValue({data: [{name: "1.22.0"}, {name: "1.21.0"}]});
        // when
        const result = await getLastTagOrDefault(client, config);
        // then
        expect(result).toBe("1.22.0");
    });

    it("should ignore non-semver tags", async () => {
        // given
        listTagsMock.mockReturnValue({data: [{name: "v1.23.Ö"}, {name: "v1.22.0"}, {name: "v1.21.0"}]});
        // when
        const result = await getLastTagOrDefault(client, {...config, prefix: "v"});
        // then
        expect(result).toBe("v1.22.0");
    });

    it("should select the last tag matching the given prefix", async () => {
        // given
        listTagsMock.mockReturnValue({data: [{name: "lambdas-0.3.0"}, {name: "1.22.0"}, {name: "lambdas-0.2.0"}]});

        // when
        const resultService = await getLastTagOrDefault(client, config);
        // then
        expect(resultService).toBe("1.22.0");

        // when
        const resultLambda = await getLastTagOrDefault(client, {...config, prefix: "lambdas-"});
        // then
        expect(resultLambda).toBe("lambdas-0.3.0");
    });
});

describe("extractBranch", () => {
    it("should extract the branch name", () => {
        expect(extractBranch("refs/heads/branch-name")).toBe("branch-name");
        expect(extractBranch("/branch-name")).toBe("branch-name");
        expect(extractBranch("branch-name")).toBe("branch-name");
    });
});
