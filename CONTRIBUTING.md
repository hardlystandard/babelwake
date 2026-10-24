# Changes to Babelwake

This is the intended publication policy. Repository creation and branch protection are pending; these GitHub controls are not active yet.

Once published, the repository will be public. Contributions can be proposed through a fork and a pull request against `main`.

`@hardlystandard` owns every path, including the ownership file and CI configuration. Changes to `main` require a pull request, their code-owner approval, resolved review conversations, and a passing `game` check. New commits dismiss an earlier approval. Other reviewers' approvals do not satisfy the code-owner requirement.

The repository owner will be the only writer and administrator. Force pushes and branch deletion will be blocked on `main`. As the sole administrator, the owner retains GitHub's override authority, including merging their own pull requests, which GitHub does not let them approve. No collaborator or automation will be granted this authority. GitHub Actions will have read-only repository access with pull-request approval disabled.

Before proposing a change, run `npm run check` and the relevant Playwright tests described in README.md. Native French review and beginner playtest limits remain documented in `content/REVIEW.md` and `docs/PLAYTEST.md`.

## GitHub setup

CODEOWNERS alone does not enforce review. The repository policy above becomes effective after these GitHub settings are applied and verified:

- Public repository owned by `hardlystandard`, with no additional collaborators or pending collaborator invitations.
- Protection for `main`: require one approving review and code-owner review; dismiss stale approvals; require resolved conversations; require the `game` status check from the GitHub Actions app, with the branch up to date.
- Block force pushes and branch deletion. Allow the sole owner to use the administrator override for their own changes.
- Workflow permissions: read-only, with pull-request approval by GitHub Actions disabled. Automatic merging disabled.

These settings require repository administration access, which is separate from permission to upload source files.
