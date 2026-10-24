# software-mission-customer-induction-service

<!-- 561-group-standards:badges:start -->
[![Red Cup Engineering](https://img.shields.io/badge/561%20Group-Red%20Cup%20Engineering-c0392b)](https://github.com/red-cup-engineering)
[![License: MIT](https://img.shields.io/badge/license-MIT-c0392b)](LICENSE)
[![Indigenous data: CARE](https://img.shields.io/badge/Indigenous%20data-CARE-4b6f44)](https://github.com/red-cup-engineering/.github/blob/main/GOVERNANCE.md)
[![Tips welcome](https://img.shields.io/badge/tips-welcome-d4a017)](https://github.com/561-group/.github/blob/main/TIPS.md)
<!-- 561-group-standards:badges:end -->

Deterministic actuator that validates proposal delta evidence and forms a JS-Mark induction manifest.


## Customer-controlled software-delivery evidence

This is the **existing** source-owned adapter between verified
[`SoftwareMissionChangeProposal`](https://github.com/red-cup-engineering/software-mission-execution-service/blob/main/src/mission-runtime.mjs)
results and a separate customer's JS-Mark admission. It is **not** the
customer's repository, a source-control host, a merge queue, a purchaser, a
code generator, or a work-acceptance/payment service.

`createSoftwareMissionCustomerInduction().induceVerifiedMissionProposal(mission, result)`
returns `null` for an unverified result or a mission explicitly opting out.
For a candidate the original producer reports as verified, it requires:

- An explicit, safe set of relative customer-writable lanes, with each
  proposed ordinary-file path contained in one lane. No POSIX/Windows
  traversal aliases, repeated source paths, Git administration directories,
  unsupported Gitlink/effect records, or ambiguous path components.
- A source `beforeExisted: boolean`, canonical lowercase
  `sha256:<64 hex>` preimage and result digests, canonical RFC 4648 Base64
  after-bytes, and **actual SHA-256 agreement** with the supplied bytes.
  A new file has the empty-byte preimage; an empty newly-created file is
  legitimate. A purported edit yielding the identical digest is not.
- At most 128 changed files, and at most 16 MiB total proposed changed-file
  bytes. An oversized candidate is refused **before** host mutation.
- One detached, transitively frozen proposal snapshot and frozen writable
  lanes for the existing content-addressed manifest. Mutating the original
  provider result afterwards cannot change the manifest's content behind
  its reported identity.

The manifest deliberately states
`disposition:"proposal-awaiting-js-mark-admission"` and
`customerMutation:false`. It does **not** authenticate a foreign result,
prove the preimage bytes exist on the customer's actual selected revision,
execute `verifyCommand` or `acceptanceCommand`, grant customer rights,
change a GitHub branch, bind an invoice, or attest earned revenue. The
competent separate JS Mark must reread actual file preimages and verify
source/identity, customer authority and result acceptance before any effect.
If that receiver is not mounted, the delivery remains *a verified proposal
claim*, not a customer-accepted code change.

### Source-only native qualification and dependency boundary

`npm run check && npm test` executes the **exact original production
source body** under Node, with Node's real built-in SHA-256 and Buffer.
The unit test replaces **only** the workspace's historical
`@red-cup-engineering/semantic-content-identify-service` identity port
with a deterministic local test stub, since the original workspace
dependency closure is not installed by this public source-only CI.
This proves the byte/path/bound/proposal behavior but does **not** qualify
the historical identity owner, a real installed mission engine, a customer
workspace or a software delivery. Run separately selected full dependency
and receiver tests before publishing or deploying the integrated system.
