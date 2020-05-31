# semver-action

Simple action to calculate next version of a project

## Usage

### calculate next version and create a release
The following configuration will calculate the next version and create a release (tag head and create changelog since previous release)
```
- uses: fortum/semver-action@v1
  id: semver
  with:
    repo-token: ${{ secrets.GITHUB_TOKEN }}
    release: true
```

### calculate next version without releasing
The following configuration will calculate the next version without tagging
```
- uses: fortum/semver-action@v1
  id: semver
  with:
    repo-token: ${{ secrets.GITHUB_TOKEN }}
    release: false
```

### retrieve calculated version
```
- uses: fortum/semver-action@v1
  id: semver
  with:
    repo-token: ${{ secrets.GITHUB_TOKEN }}
    release: false

- name: prints next version
  run: echo ${{steps.semver.outputs.next-version}}
```

## notes
When invoking semveraction on branch master the version will be pure semver (i.e. 1.2.0)   
When invoking from aby other branch the version will be `branch_name-1.2.0`
