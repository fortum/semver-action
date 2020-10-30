const core = require('@actions/core');
const github = require('@actions/github');

const semverRexEx = /^[0-9]+.[0-9]+.[0-9]+$/
const defaultVersion = "0.0.0";

async function getLastRelease(client, prefix) {
    let rawVersion;
    const versionMatcher = new RegExp("^" + prefix, "g");
    try {
        const lastRelease = await client.repos.getLatestRelease({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
        });
        if (versionMatcher.test(lastRelease.data.tag_name)) {
            rawVersion = lastRelease.data.tag_name.replace(versionMatcher, "");
        } else {
            const tags = await client.repos.listTags({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                per_page: 100,
            });

            const candidates = tags.data
                .filter(tag => versionMatcher.test(tag.name))
                .map(tag => tag.name.replace(versionMatcher, ""));

            rawVersion = candidates[0] || defaultVersion;
        }
        
    } catch (e) {
        if (e.status === 404) {
            const tags = await client.repos.listTags({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
            });
            if (tags.data.length > 0) {
                throw Error("Tags are present but none is marked as release, please mark the last one as release and try again");
            }
            core.warning(`This appears to be the first release, starting from ${defaultVersion}`);
            rawVersion = defaultVersion
        } else {
            core.warning(`Unexpected error while retrieving latest release: ${JSON.stringify(e)}`);
            throw e;
        }
    }

    if (!(rawVersion && semverRexEx.test(rawVersion))) {
        throw Error(`Cannot calculate next version starting from version [${rawVersion}]`)
    }

    return rawVersion;
}

async function buildChangeLog(client, lastTaggedCommitSha, nextVersion) {
    const commitsSinceLastTag = await client.repos.listCommits({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        per_page: 100
    });
    const commits = commitsSinceLastTag.data;
    let i = 0;
    let changeLog = `# Version ${nextVersion}\n`;
    changeLog += "changes:\n";
    while (commits[i] && lastTaggedCommitSha !== commits[i].sha) {
        changeLog += `* ${commits[i].commit.message}\n`;
        i++;
    }

    return changeLog;
}

async function release(client, changeLog, nextVersion) {
    await client.git.createRef({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        ref: `refs/tags/${nextVersion}`,
        sha: core.getInput('sha').length === 0 ? github.context.sha : core.getInput('sha')
    });
    await client.repos.createRelease({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        tag_name: nextVersion,
        name: `Version ${nextVersion}`,
        body: changeLog
    });
}

function extractBranch(rawBranch) {
    return rawBranch.replace(new RegExp("^refs/heads|\/", "g"), "");
}

async function calculateNextVersion(rawVersion, branch, releaseBranch) {
    let [major, minor, path] = rawVersion.split(".").map(part => parseInt(part));
    console.log("Previous version: " + rawVersion)
    minor += 1;
    const nextVersion = [major, minor, path].join(".");
    console.log("Next version: " + nextVersion);
    return branch === releaseBranch ? nextVersion : branch + "-" + nextVersion;
}

async function run() {
    try {
        const token = core.getInput('repo-token', {required: true});
        const prefix = core.getInput('version-prefix');
        const client = new github.GitHub(token);
        const releaseBranch = core.getInput('release-branch');

        const rawVersion = await getLastRelease(client, prefix);
        const currentBranch = extractBranch(github.context.payload.ref);
        const nextVersion = prefix + await calculateNextVersion(rawVersion, currentBranch, releaseBranch);
        console.log("prefixed next version: " + nextVersion);
        core.setOutput("next-version", nextVersion);
        core.setOutput("reference", branch === releaseBranch ? nextVersion : branch);

        if (core.getInput('release') === 'false') {
            return;
        }

        if (rawVersion === defaultVersion) {
            const changeLog = await buildChangeLog(client, null, nextVersion);
            await release(client, changeLog, nextVersion);
            return;
        }

        const lastTag = await client.git.getRef({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            ref: `tags/${prefix + rawVersion}`,
        });

        const changeLog = await buildChangeLog(client, lastTag.data.object.sha, nextVersion);
        await release(client, changeLog, nextVersion);
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
