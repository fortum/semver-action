const core = require("@actions/core");

// TODO: remove once no project uses this feature
function legacyShouldRelease(currentBranch) {
    const releaseBranch = core.getInput('release-branch');
    if (releaseBranch && releaseBranch !== '') {
        core.warning("release-branch is DEPRECATED, use release instead!");
    }

    return releaseBranch === currentBranch;
}

function shouldRelease(currentBranch) {
    const lShouldRelease = legacyShouldRelease(currentBranch);
    if (core.getInput('release') === 'true') {
        return true;
    } else {
        return lShouldRelease;
    }
}

function packVersion(params) {
    const versionPrefix = params.shouldRelease ? params.prefix : `${params.branch}-${params.prefix}`;
    const versionPostfix = params.shouldRelease ? "" : "-SNAPSHOT";
    return `${versionPrefix}${params.version}${versionPostfix}`;
}

const SEMVER_REGEX = /([0-9]+.[0-9]+.[0-9]+)/
function calculateNextVersion(params) {
    core.debug(`calculateNextVersion(${JSON.stringify(params)})`);
    const lastVersion = params.lastTag.match(SEMVER_REGEX)[1];
    if (!lastVersion) {
        throw `${params.lastTag} is not a valid tag!`;
    }

    let [major, minor, patch] = lastVersion.split(".").map(part => parseInt(part));

    let version = [major, ++minor, 0];
    if (params.major && params.major !== "" && parseInt(params.major) > major) {
        version = [parseInt(params.major), 0, 0];
    }

    return packVersion({
        version: version.join("."),
        shouldRelease: params.shouldRelease,
        prefix: params.prefix,
        branch: params.branch
    });
}

module.exports = { shouldRelease, calculateNextVersion };
