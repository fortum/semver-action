const core = require("@actions/core");

async function getLastTagOrDefault(client, params) {
    core.debug(`getLastTagOrDefault(${JSON.stringify(params)})`);
    const defaultTag = "0.0.0";
    const tagPrefix = params.prefix || "";
    const tagPattern = new RegExp(`^${tagPrefix}[0-9]+.[0-9]+.[0-9]+$`);

    const tags = await client.rest.repos.listTags({
        owner: params.owner,
        repo: params.repo,
        per_page: 100,
    });

    core.debug(`tags response: ${JSON.stringify(tags)}`);

    const candidates = tags.data
        .filter(tag => tagPattern.test(tag.name))
        .map(tag => tag.name);

    core.debug(`tags matching prefix: ${JSON.stringify(candidates)}`);

    return candidates[0] || `${tagPrefix}${defaultTag}`;
}

function extractBranch(gitRef) {
    return gitRef.replace(new RegExp("^refs/heads|\/", "g"), "");
}

async function tag(client, params) {
    await client.rest.git.createRef({
        owner: params.owner,
        repo: params.repo,
        ref: `refs/tags/${params.version}`,
        sha: params.sha
    });
}

module.exports = {getLastTagOrDefault, extractBranch, tag};
