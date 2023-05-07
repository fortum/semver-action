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

        // determines which commit (identified by its sha) should be tagged
        const sha = core.getInput("sha") === "" ? github.context.sha : core.getInput("sha");

        // calculates the next version
        const nextVersion = calculateNextVersion({
            lastTag: lastTag,
            shouldRelease: isRelease,
            prefix: prefix,
            branch: currentBranch,
            major: majorVersion,
            sha: sha
        });
        core.setOutput("next-version", nextVersion.packedVersion);
        core.setOutput("major", nextVersion.major);
        core.setOutput("minor", nextVersion.minor);
        core.setOutput("patch", nextVersion.patch);
        core.setOutput("reference", isRelease ? nextVersion.packedVersion : currentBranch);

        console.log("Previous version: " + lastTag.tag);
        console.log("Next version: " + nextVersion.packedVersion);

        if (!isRelease) {
            return;
        }

        if (sha === lastTag.sha) {
            console.info("This commit is already tagged")
            return;
        }

        // tag the release
        await tag(client, {
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            sha: core.getInput("sha") === "" ? github.context.sha : core.getInput("sha"),
            version: nextVersion.packedVersion
        });
    } catch (error) {
        core.setFailed(error.message);
    }
}

module.exports = {run};
