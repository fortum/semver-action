const core = require("@actions/core");
const {unpackVersion} = require("./util");

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

function calculateNextVersion(params) {
    core.debug(`calculateNextVersion(${JSON.stringify(params)})`);
    let [major, minor, patch] = unpackVersion(params.lastTag.tag);

    let version = [major, minor, patch];

    // in case the sha to be versioned is not the same from the last version, then we calculate a new version
    if (params.sha !== params.lastTag.sha) {
        version = [major, ++minor, 0];
        if (params.major && params.major !== "" && parseInt(params.major) > major) {
            version = [parseInt(params.major), 0, 0];
        }
    }

    const packedVersion =  packVersion({
        version: version.join("."),
        shouldRelease: params.shouldRelease,
        prefix: params.prefix,
        branch: params.branch
    });

    return {
        packedVersion: packedVersion,
        major: version[0],
        minor: version[1],
        patch: version[2]
    }
}

module.exports = {shouldRelease, calculateNextVersion};
