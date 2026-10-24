// Deterministic checksum of the ORIGINAL mission provider's byte-delta
// representation. A digest string is not evidence unless it matches bytes.
// Node's own crypto implements the same SHA-256 over Buffer used by the
// original software-mission execution provider; no filesystem is accessed.
import { createHash } from "node:crypto";
// This cell is intentionally host-neutral.  A supplier can prove and propose
// a transition; only the JS Mark admission boundary may inspect a filesystem,
// check its preimages, and perform the transition.
import { EMPTY_WITNESS_ROOT, identifyJsonSemanticContent } from "@red-cup-engineering/semantic-content-identify-service";

export function createSoftwareMissionCustomerInduction() {
  const rmnId = (value) => identifyJsonSemanticContent({ objectKind: "software-mission-customer-induction.manifest", value, witnessRoot: EMPTY_WITNESS_ROOT }).id;
  const record = (body) => Object.freeze({ id: rmnId(body), ...body });

  const SHA256 = /^sha256:[0-9a-f]{64}$/u;
  const MAX_CHANGES = 128;
  const MAX_DELTA_BYTES = 16 * 1024 * 1024;
  const checksum = bytes => "sha256:" + createHash("sha256").update(bytes).digest("hex");
  const EMPTY_DIGEST = checksum(Buffer.alloc(0));

  // An induction manifest names a path; the host's separate JS Mark checks
  // canonical filesystem identity and symlinks before it can apply effects.
  // Reject ambiguous POSIX/Windows spelling here rather than silently
  // making a hostile path look like a purchased writable lane.
  function ordinaryRelativePath(value) {
    if (typeof value !== "string" || value.length > 4096 || value.length === 0 ||
        value.startsWith("/") || value.includes("\\") ||
        /^[a-z]:/iu.test(value) || /[\u0000-\u001f\u007f]/u.test(value)) return false;
    return value.split("/").every(part =>
      part.length > 0 && part !== "." && part !== ".." &&
      part.toLowerCase() !== ".git" && !/[. ]$/u.test(part));
  }

  function canonicalBytes(base64, path) {
    if (typeof base64 !== "string" ||
        base64.length > 4 * Math.ceil(MAX_DELTA_BYTES / 3) ||
        (base64.length % 4) !== 0 ||
        !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u.test(base64)) {
      throw new Error("proposal change has noncanonical or oversized base64 bytes: " + path);
    }
    const bytes = Buffer.from(base64, "base64");
    if (bytes.length > MAX_DELTA_BYTES || bytes.toString("base64") !== base64)
      throw new Error("proposal change has noncanonical or oversized base64 bytes: " + path);
    return bytes;
  }

  function verifiedProposal(mission, result) {
    if (mission?.induceVerifiedChanges === false || result?.outcome?.candidateVerified !== true)
      return null;
    const proposal = result.outcome.proposal;
    if (proposal?.type !== "SoftwareMissionChangeProposal" ||
        proposal.proposalOnly !== true || proposal.customerMutation !== false ||
        !Array.isArray(proposal.changes) || proposal.changes.length === 0 ||
        proposal.changes.length > MAX_CHANGES) {
      throw new Error("verified mission result lacks one bounded proposal-only change set");
    }
    const lanes = mission?.writablePaths;
    if (!Array.isArray(lanes) || lanes.length === 0 || lanes.length > MAX_CHANGES ||
        lanes.some(lane => !ordinaryRelativePath(lane)) ||
        new Set(lanes).size !== lanes.length) {
      throw new Error("customer induction requires distinct safe explicit writable lanes");
    }
    const seen = new Set();
    let totalBytes = 0;
    for (const change of proposal.changes) {
      if (!ordinaryRelativePath(change?.path) || seen.has(change.path))
        throw new Error("invalid proposal path: " + change?.path);
      seen.add(change.path);
      if (!lanes.some(lane => change.path === lane ||
          change.path.startsWith(lane + "/"))) {
        throw new Error("proposal path is outside the customer writable lane: " + change.path);
      }
      if (typeof change.beforeExisted !== "boolean" ||
          !SHA256.test(change.beforeDigest ?? "") ||
          !SHA256.test(change.afterDigest ?? "") ||
          typeof change.afterBytesBase64 !== "string") {
        throw new Error("proposal change lacks canonical delta evidence: " + change.path);
      }
      const bytes = canonicalBytes(change.afterBytesBase64, change.path);
      totalBytes += bytes.length;
      if (totalBytes > MAX_DELTA_BYTES)
        throw new Error("software induction exceeds bounded aggregate delta bytes");
      if (checksum(bytes) !== change.afterDigest)
        throw new Error("proposal after digest differs from actual delta bytes: " + change.path);
      if (!change.beforeExisted && change.beforeDigest !== EMPTY_DIGEST)
        throw new Error("new proposal file has nonempty source preimage: " + change.path);
      if (change.beforeExisted && change.beforeDigest === change.afterDigest)
        throw new Error("proposal claims a change with identical source and result: " + change.path);
    }
    // Deliberately no mutation, account grant or reported customer acceptance.
    // The receiving JS Mark must still independently inspect source preimages,
    // customer writable rights and actual verification before any Work effect.
    return proposal;
  }

/** Produce the sole input to host admission.  This does not inspect or mutate
 * `territory`; that reference is opaque until the JS Mark resolves it. */
  function induceVerifiedMissionProposal(mission, result) {
    const proposal = verifiedProposal(mission, result); if (proposal === null) return null;
    return record({ type: "SoftwareMissionCustomerInductionManifest", providerProposal: result.semanticId ?? null, mission: mission.id ?? null, territory: mission.territory, writablePaths: [...mission.writablePaths], verifyCommand: mission.verifyCommand, acceptanceCommand: mission.acceptanceCommand ?? mission.verifyCommand, proposal, disposition: "proposal-awaiting-js-mark-admission", customerMutation: false });
  }

  return Object.freeze({ induceVerifiedMissionProposal });
}
