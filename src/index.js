const core = require('@actions/core');
const github = require('@actions/github');

const semverRexEx = /^[0-9]+.[0-9]+.[0-9]+$/

async function getLastRelease(client, prefix) {
    const lastRelease = await client.repos.getLatestRelease({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
    });
    const rawVersion = lastRelease.data.tag_name.replace(new RegExp("^" + prefix, "g"), "");

    if (!(rawVersion && semverRexEx.test(rawVersion))) {
        core.warning(`never versioned before or ${rawVersion} is not a valid semver tag`);
        return "0.0.0";
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
    while (lastTaggedCommitSha !== commits[i].sha) {
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
        sha: github.context.sha
    });
    await client.repos.createRelease({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        tag_name: nextVersion,
        name: `Version ${nextVersion}`,
        body: changeLog
    });
}

async function calculateNextVersion(rawVersion, rawBranch) {
    const [branch] = rawBranch.split("/").slice(-1);
    let [major, minor, path] = rawVersion.split(".").map(part => parseInt(part));
    console.log("Previous version: " + rawVersion)
    minor += 1;
    const nextVersion = [major, minor, path].join(".");
    console.log("Next version: " + nextVersion);
    return branch === "master" ? nextVersion : branch + "-" + nextVersion;
}

async function run() {
    try {
        const token = core.getInput('repo-token', {required: true});
        const prefix = core.getInput('version-prefix');
        const client = new github.GitHub(token);

        const rawVersion = prefix + await getLastRelease(client, prefix);
        const nextVersion = prefix + await calculateNextVersion(rawVersion, github.context.payload.ref);
        core.setOutput("next-version", nextVersion);

        if (core.getInput('release') === 'false') {
            return;
        }

        if (rawVersion === "0.0.0") {
            const changeLog = await buildChangeLog(client, null, nextVersion);
            await release(client, changeLog, nextVersion);
            return;
        }

        const lastTag = await client.git.getRef({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            ref: `tags/${rawVersion}`,
        });

        console.log(JSON.stringify(lastTag));

        const changeLog = await buildChangeLog(client, lastTag.data.object.sha, nextVersion);
        await release(client, changeLog, nextVersion);
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
