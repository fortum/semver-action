# semver-action

Simple action to calculate next version of a project in the semantic version format.

## How does it work?
Calculates the next version based on:
- already existing tags
- configuration (see Inputs below)

The action looks for already existing tags matching the configuration, takes the latest and uses it to calculate the next version.

Multiple version series can be applied to the same repository, as long as you separate them using the `version-prefix` as explained below.

If no tag exists, `0.1.0` will be the initial version.

When `release=false` the next version will be prefixed with the branch name and postfixed with `-SNAPSHOT`


### Inputs

| name           | description                                                                                                                                                  | optional | default             |
|----------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|---------------------|
| repo-token     | the token this action uses to authenticate against github, usually `${{ secrets.GITHUB_TOKEN }}`                                                             | no       | -                   |
| version-prefix | the prefix you want to assign to the version calculated, (e.g. `v` or `lambdas-`)                                                                            | yes      | `''` (empty string) |
| release        | if set to `'true'` the action will create a new tag with the version calculated                                                                              | yes      | `'false'`           |
| major-version  | Allows to control how the next version is calculated, if set to a value > than the current major version, the next version will be major-version.0.0         | yes      | `'0'`               |
| sha            | Sha identifier of the commit to release, if not provided then the `head` is used. This is only relevant for workflows that need to commit in the repo itself | yes      | the sha of `head`   |

### Outputs

| name         | description                                                                          |
|--------------|--------------------------------------------------------------------------------------|
| next-version | the next version calculated based on the previous version (tag) and the inputs above |
| reference    | The tag name if release=true otherwise the branch name                               |

## Examples

### calculate next version and tag
The following configuration will calculate the next version and create a tag

```yaml
- uses: fortum/semver-action@v2
  id: semver
  with:
    repo-token: ${{ secrets.GITHUB_TOKEN }}
    release: true
    
- name: prints next version
  run: echo ${{steps.semver.outputs.next-version}} # 0.1.0
```

### calculate next version without tagging
The following configuration will calculate the next version without tagging
```yaml
- uses: fortum/semver-action@v2
  id: semver
  with:
    repo-token: ${{ secrets.GITHUB_TOKEN }}
    release: false

- name: prints next version
  run: echo ${{steps.semver.outputs.next-version}} # branchName-0.1.0-SNAPSHOT
```

### add a prefix to the version
The following configuration will calculate the prefixed next version and create a tag
```yaml
- uses: fortum/semver-action@v2
  id: semver
  with:
    repo-token: ${{ secrets.GITHUB_TOKEN }}
    release: true
    version-prefix: v

- name: prints next version
  run: echo ${{steps.semver.outputs.next-version}} # v0.1.0
```

### force next major version
The following configuration will calculate the prefixed next version using the provided `major-version` and create a tag
```yaml
- uses: fortum/semver-action@v2
  id: semver
  with:
    repo-token: ${{ secrets.GITHUB_TOKEN }}
    release: true
    major-version: 22

- name: prints next version
  run: echo ${{steps.semver.outputs.next-version}} # 22.0.0
```

subsequent invocation of the same configuration will lead to version `22.1.0`

### tag a specific commit
The following configuration will calculate the next version and create a tag pointing to the commit specified
```yaml
- uses: fortum/semver-action@v2
  id: semver
  with:
    repo-token: ${{ secrets.GITHUB_TOKEN }}
    release: true
    sha: 6721501ef1421f7e5bb15848887a04fc4891290b

- name: prints next version
  run: echo ${{steps.semver.outputs.next-version}} # 0.1.0
```
