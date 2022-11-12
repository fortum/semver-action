const core = require("@actions/core");
const github = require("@actions/github");

async function getLastTagOrDefault(prefix) {
    const defaultTag = "0.0.0";
    const tagPrefix = prefix || "";
    const tagPattern = new RegExp(`^${tagPrefix}[0-9]+.[0-9]+.[0-9]+$`);
    const token = core.getInput('repo-token', {required: true});
    const client = github.getOctokit(token);

    const tags = await client.rest.repos.listTags({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        per_page: 100,
    });

    const candidates = tags.data
        .filter(tag => tagPattern.test(tag.name))
        .map(tag => tag.name);

    const lastTag = candidates[0] || `${tagPrefix}${defaultTag}`;
    console.log(lastTag);
}

getLastTagOrDefault();
