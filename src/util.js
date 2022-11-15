const SEMVER_REGEX = /([0-9]+.[0-9]+.[0-9]+)/

function unpackVersion(tag) {
    const semver = tag.match(SEMVER_REGEX)[1];
    if (!semver) {
        throw `${tag} is not a valid tag!`;
    }

    return semver.split(".").map(part => parseInt(part));
}


module.exports = {unpackVersion}
