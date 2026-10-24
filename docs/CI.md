# CI on Ubicloud

All build and test jobs in `.github/workflows/ci.yml` select `ubicloud-standard-4-ubuntu-2404`: an x64 Ubuntu 24.04 Ubicloud runner with four virtual CPUs. Pinning the OS keeps Playwright's Linux dependencies predictable. The runner executes content validation, Vitest, strict TypeScript, the production build, and all production Playwright tests.

Ubicloud provides the machines. Its managed service integrates with GitHub Actions, which still coordinates the workflow and displays its results. No job selects a GitHub-hosted runner or falls back to one. The required check remains `game`, reported by the GitHub Actions app, so the approval policy does not need a new check name.

## Account setup

In the [Ubicloud console](https://console.ubicloud.com), select the project that should run CI, open GitHub Runners, and connect the `hardlystandard` account. Authorize the Ubicloud Managed Runners app for `hardlystandard/babelwake`. Ubicloud requires a payment method before it starts managed runners; account and billing setup must be completed by the account owner.

The workflow does not require an Ubicloud API key or a repository secret. An unavailable or unconnected runner leaves a job queued; changing `runs-on` alone is not proof that a job ran on Ubicloud. Confirm that a run acquired an Ubicloud runner and completed before claiming the migration verified.

Ubicloud's account-level premium-runner setting can route standard labels to premium machines. Select the desired runner tier in GitHub Runners settings; the workflow label alone does not establish the billing tier.

## Changes and permissions

Keep the `game` job name and read-only workflow permissions. New pushes cancel superseded runs on the same branch. Each running job has a 20-minute limit. Pull requests use the normal `pull_request` event, without privileged `pull_request_target` execution. GitHub's approval rules for workflows from public forks continue to apply.

Runner configuration does not enforce code-owner review. The independent review and branch-protection requirements are in [CONTRIBUTING.md](../CONTRIBUTING.md).

References: [Ubicloud quickstart](https://ubicloud.com/docs/github-actions-integration/quickstart), [runner types](https://ubicloud.com/docs/github-actions-integration/runner-types), and the [official runner label registry](https://github.com/ubicloud/ubicloud/blob/main/config/github_runner_labels.yml).
