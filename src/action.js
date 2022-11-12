const core = require("@actions/core");
const github = require('@actions/github');
const {getLastTagOrDefault, extractBranch, tag} = require("./git");
const {shouldRelease, calculateNextVersion} = require("./version");

function createGithubClient() {
    const token = core.getInput('repo-token', {required: true});
    return github.getOctokit(token);
}

function getCurrentBranchName() {
    return extractBranch(github.context.payload.ref || github.context.payload.pull_request.head.ref);
}

async function run() {
    try {
        const client = createGithubClient();
        const prefix = core.getInput('version-prefix');
        const majorVersion = core.getInput('major-version');

        // retrieves last tag matching the prefix
        const lastTag = await getLastTagOrDefault(client, {
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            prefix: prefix
        });

        // retrieves the current branch
        const currentBranch = getCurrentBranchName();

        // determines if the code should be released
        const isRelease = shouldRelease(currentBranch);

        // calculates the next version
        const nextVersion = calculateNextVersion({
            lastTag: lastTag,
            shouldRelease: isRelease,
            prefix: prefix,
            branch: currentBranch,
            major: majorVersion
        });
        core.setOutput("next-version", nextVersion);
        core.setOutput("reference", isRelease ? nextVersion : currentBranch);

        console.log("Previous version: " + lastTag);
        console.log("Next version: " + nextVersion);

        if (!isRelease) {
            return;
        }

        // tag the release
        await tag(client, {
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            sha: core.getInput("sha") === "" ? github.context.sha : core.getInput("sha"),
            version: nextVersion
        });

    } catch (error) {
        core.setFailed(error.message);
    }
}

module.exports = { run };
