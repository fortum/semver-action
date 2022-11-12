const core = require("@actions/core");
const github = require("@actions/github");

async function getLastTag(prefix) {
    const tagPattern = new RegExp(`^${prefix}[0-9]+.[0-9]+.[0-9]+$`);
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
        //.map(tag => tag.name.replace(versionMatcher, ""));

    console.log(JSON.stringify(candidates));
}

getLastTag("v");
