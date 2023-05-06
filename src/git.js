const core = require("@actions/core");
const {unpackVersion} = require("./util");

function compareTag(a, b) {
    const [majorA, minorA, patchA] = unpackVersion(a.name);
    const [majorB, minorB, patchB] = unpackVersion(b.name);

    const major = Math.sign(majorA - majorB) * 100;
    const minor = Math.sign(minorA - minorB) * 10;
    const patch = Math.sign(patchA - patchB);

    return major + minor + patch;
}

async function getLastTagOrDefault(client, params) {
    core.debug(`getLastTagOrDefault(${JSON.stringify(params)})`);
    const defaultTag = "0.0.0";
    const tagPrefix = params.prefix || "";
    const tagPattern = new RegExp(`^${tagPrefix}[0-9]+.[0-9]+.[0-9]+$`);

    const tags = await client.paginate(client.rest.repos.listTags, {
        owner: params.owner,
        repo: params.repo,
        per_page: 100,
    });

    core.debug(`tags response: ${JSON.stringify(tags)}`);

    const candidates = tags
        .filter(tag => tagPattern.test(tag.name))
        .sort(compareTag)
        .reverse();

    core.debug(`tags matching prefix: ${JSON.stringify(candidates)}`);

    const tag = candidates[0]?.name || `${tagPrefix}${defaultTag}`;
    const sha = candidates[0]?.commit?.sha || "";

    return {tag, sha};
}

function extractBranch(gitRef) {
    return gitRef.replace(new RegExp("^refs/heads|\/", "g"), "");
}

async function tag(client, params) {
    // add tag
    await client.rest.git.createRef({
        owner: params.owner,
        repo: params.repo,
        ref: `refs/tags/${params.version}`,
        sha: params.sha
    });

    // create GitHub release
    await client.rest.repos.createRelease({
        owner: params.owner,
        repo: params.repo,
        tag_name: params.version,
        name: `Version ${params.version}`,
        body: ""
    });
}

module.exports = {getLastTagOrDefault, extractBranch, tag};
