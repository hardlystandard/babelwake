# Changes to Babelwake

The source is public at https://github.com/hardlystandard/babelwake. GitHub confirms that `main` is protected and pull requests require review. CODEOWNERS names only `@hardlystandard`. The connected GitHub app cannot read detailed protection or repository-wide Actions permission settings; verify the complete policy below in GitHub's settings.

Contributions can be proposed through a fork and a pull request against `main`.

`@hardlystandard` owns every path, including the ownership file and CI configuration. The intended protection requires a pull request, their code-owner approval, resolved review conversations, and a passing `game` check for changes to `main`. New commits must dismiss an earlier approval. Other reviewers' approvals must not satisfy the code-owner requirement.

The repository owner is the only listed collaborator and administrator. The intended protection blocks force pushes and branch deletion on `main`. As the sole administrator, the owner retains GitHub's override authority, including merging their own pull requests, which GitHub does not let them approve. No additional collaborator is to be granted this authority. The committed CI workflow requests read-only repository access; verify that the repository-wide setting also disables Actions approving pull requests. Ubicloud's installed app manages runners using its separate provider permissions and is not a code owner.

Before proposing a change, run `npm run check` and the relevant Playwright tests described in README.md. Native French review and beginner playtest limits remain documented in `content/REVIEW.md` and `docs/PLAYTEST.md`.

## GitHub setup

CODEOWNERS alone does not enforce review. The repository policy above becomes effective after these GitHub settings are applied and verified:

- Public repository owned by `hardlystandard`, with no additional collaborators or pending collaborator invitations.
- Protection for `main`: require one approving review and code-owner review; dismiss stale approvals; require resolved conversations; require the `game` status check from the GitHub Actions app, with the branch up to date.
- Block force pushes and branch deletion. Allow the sole owner to use the administrator override for their own changes.
- Workflow permissions: read-only, with pull-request approval by GitHub Actions disabled. Automatic merging disabled.

These settings require repository administration access, which is separate from permission to upload source files.

The `game` job runs on Ubicloud infrastructure using its GitHub Actions integration. Its check is still reported by the GitHub Actions app; require that check when configuring protection. Runner setup is documented in [docs/CI.md](docs/CI.md).

The owner can add a classic protection rule for `main` at https://github.com/hardlystandard/babelwake/settings/branches. Keep approval of the most recent reviewable push disabled: with only one eligible reviewer, enabling it can prevent the owner from approving a contribution they helped edit. Leave the administrator override available because GitHub prevents authors approving their own pull requests. Workflow defaults are at https://github.com/hardlystandard/babelwake/settings/actions; select read-only permissions and disable approving pull requests.
