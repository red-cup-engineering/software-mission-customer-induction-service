import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

// The historical RMN-v2 content identity dependency is workspace-owned and
// intentionally not reimplemented by this standalone source qualification.
// Run the EXACT production module body in native Node with only that foreign
// identity port replaced. No filesystem/application effects can be reached.
// This qualifies byte custody and path law, NOT the installed identity service.
const originalSource = readFileSync(new URL("../src/customer-induction.mjs", import.meta.url), "utf8");
const externalCrypto = 'import { createHash } from "node:crypto";';
const externalIdentity = 'import { EMPTY_WITNESS_ROOT, identifyJsonSemanticContent } from "@red-cup-engineering/semantic-content-identify-service";';
const entrypoint = "export function createSoftwareMissionCustomerInduction()";
assert.equal(originalSource.split(externalCrypto).length, 2, "same native SHA-256 implementation");
assert.equal(originalSource.split(externalIdentity).length, 2, "historical identity dependency is the only mocked source");
assert.equal(originalSource.split(entrypoint).length, 2, "the original callable producer is unchanged");
const isolatedSource = originalSource.replace(externalCrypto, "")
  .replace(externalIdentity, "").replace(entrypoint,
    "function createSoftwareMissionCustomerInduction()");
const identity = ({ objectKind, value, witnessRoot }) => ({
  id: "ni:///sha-256;" + createHash("sha256")
    .update(JSON.stringify({ objectKind, value, witnessRoot }))
    .digest("base64url"),
});
const createSoftwareMissionCustomerInduction = new Function("createHash", "Buffer",
  "EMPTY_WITNESS_ROOT", "identifyJsonSemanticContent",
  '"use strict";\n' + isolatedSource + "\nreturn createSoftwareMissionCustomerInduction;")
  (createHash, Buffer, "fixture:identity-provider-isolated", identity);
const { induceVerifiedMissionProposal } = createSoftwareMissionCustomerInduction();
const sha256 = bytes => "sha256:" + createHash("sha256").update(bytes).digest("hex");
const textBytes = value => Buffer.from(value, "utf8");
const before = textBytes("original source\n");
const after = textBytes("export const answer = 42;\n");
const empty = Buffer.alloc(0);
const change = (path = "src/fix.mjs") => ({
  path, beforeExisted: true, beforeDigest: sha256(before),
  afterDigest: sha256(after), afterBytesBase64: after.toString("base64"),
});
const mission = Object.freeze({
  id: "ni:///sha-256;original-mission", territory: "ni:///sha-256;original-territory",
  writablePaths: ["src"], verifyCommand: "npm test",
});
const result = edits => ({
  semanticId: "ni:///sha-256;verified-result",
  outcome: { candidateVerified: true, proposal: {
    type: "SoftwareMissionChangeProposal", proposalOnly: true, customerMutation: false,
    authorProviders: ["verified-deterministic-source"], changes: edits,
  } },
});
const withChange = (base, replacement) => ({
  ...base, outcome: {
    ...base.outcome, proposal: {
      ...base.outcome.proposal,
      changes: [replacement],
    },
  },
});

test("real source-byte delta becomes an inert content-addressed customer admission manifest", () => {
  const source = result([change()]);
  const manifest = induceVerifiedMissionProposal(mission, source);
  assert.equal(manifest.type, "SoftwareMissionCustomerInductionManifest");
  assert.equal(manifest.disposition, "proposal-awaiting-js-mark-admission");
  assert.equal(manifest.customerMutation, false);
  assert.equal(manifest.providerProposal, source.semanticId);
  assert.deepEqual(manifest.proposal, source.outcome.proposal);
  assert.deepEqual(manifest.writablePaths, ["src"]);
  assert.equal(manifest.verifyCommand, "npm test");
  assert.equal(manifest.acceptanceCommand, "npm test");
  assert.equal(typeof manifest.id, "string");
  assert.ok(manifest.id.length > 0);
});

test("proposal bytes and valid exact digest must agree; a string pretending to be SHA-256 cannot pass", () => {
  const base = result([change()]);
  for (const payload of [
    { afterDigest: "sha256:bogus" },
    { beforeDigest: "sha256:after" },
    { afterDigest: sha256(textBytes("unrelated bytes")) },
    { afterBytesBase64: textBytes("malicious replacement").toString("base64") },
    { afterBytesBase64: "garbage?" },
    { afterBytesBase64: "eA" },
    { afterBytesBase64: "eB==" },
    { afterBytesBase64: "eA===" },
  ]) {
    const candidate = withChange(base, { ...change(), ...payload });
    assert.throws(() => induceVerifiedMissionProposal(mission, candidate),
      /delta evidence|digest differs|noncanonical/u,
      "unverified byte and digest evidence cannot become an accepted customer induction candidate");
  }
});

test("traversal, alias, Git internals and out-of-lane edits fail before manifest creation", () => {
  const base = result([change()]);
  for (const name of [
    "../outside.mjs", "/src/test.mjs", "src/../outside.mjs",
    "src/./test.mjs", "src//test.mjs", "src\\..\\outside.mjs",
    "src/..\\outside.mjs", "src/.git/hooks/prepare-commit-msg",
    "src/.GIT/config", "src/x.", "src/x ", "src/one\u0000bad.mjs",
    "C:\\src\\test.mjs",
  ]) {
    assert.throws(() => induceVerifiedMissionProposal(mission,
      withChange(base, change(name))), /invalid proposal path/u, name);
  }
  assert.throws(() => induceVerifiedMissionProposal(mission,
    withChange(base, change("src-other/fix.mjs"))),
  /outside the customer writable lane/u);
  assert.throws(() => induceVerifiedMissionProposal({
    ...mission, writablePaths: ["src/../other"],
  }, base), /distinct safe explicit writable lanes/u);
  assert.throws(() => induceVerifiedMissionProposal({
    ...mission, writablePaths: ["src", "src"],
  }, base), /distinct safe explicit writable lanes/u);
});

test("absent original files have the empty source digest and legitimately support empty new files", () => {
  const created = {
    path: "src/new-empty.txt", beforeExisted: false,
    beforeDigest: sha256(empty), afterDigest: sha256(empty),
    afterBytesBase64: "",
  };
  const manifest = induceVerifiedMissionProposal(mission, result([created]));
  assert.equal(manifest.proposal.changes[0].afterBytesBase64, "");
  assert.deepEqual(manifest.proposal.changes[0], created);
  for (const defect of [
    { ...created, beforeDigest: sha256(before) },
    { ...created, beforeExisted: "false" },
  ]) assert.throws(() => induceVerifiedMissionProposal(mission,
    result([defect])), /nonempty source preimage|delta evidence/u);
});

test("no-op edits, duplicate paths and unsupported Gitlink side effects are not a billable file change", () => {
  const base = change();
  for (const defect of [
    { ...base, beforeDigest: base.afterDigest },
    { ...base, beforeExisted: undefined },
    { ...base, kind: "gitlink" },
  ]) assert.throws(() => induceVerifiedMissionProposal(mission,
    result([defect])), /identical source|delta evidence/u);
  assert.throws(() => induceVerifiedMissionProposal(mission,
    result([base, { ...base }])), /invalid proposal path/u);
});

test("wrongly asserted verification or explicit customer-induction opt-out cannot fabricate delivery", () => {
  assert.equal(induceVerifiedMissionProposal({ ...mission, induceVerifiedChanges: false },
    result([change()])), null);
  assert.equal(induceVerifiedMissionProposal(mission, {
    ...result([change()]), outcome: { ...result([change()]).outcome,
      candidateVerified: false },
  }), null);
  assert.throws(() => induceVerifiedMissionProposal(mission,
    result([])), /bounded proposal-only/u);
  assert.throws(() => induceVerifiedMissionProposal(mission,
    result(Array.from({ length: 129 }, (_, i) => change("src/new" + i)))),
  /bounded proposal-only/u);
});

test("the content-addressed proposal is a detached, deeply frozen original byte-evidence snapshot", () => {
  const source = result([change()]);
  const manifest = induceVerifiedMissionProposal(mission, source);
  const retained = manifest.proposal.changes[0].afterDigest;
  const initial = manifest.id;
  source.outcome.proposal.changes[0].afterDigest = sha256(textBytes("not our original result"));
  source.outcome.proposal.authorProviders.push("later-invented-agent");
  assert.equal(manifest.proposal.changes[0].afterDigest, retained);
  assert.deepEqual(manifest.proposal.authorProviders, ["verified-deterministic-source"]);
  assert.equal(manifest.id, initial);
  assert.ok(Object.isFrozen(manifest));
  assert.ok(Object.isFrozen(manifest.proposal));
  assert.ok(Object.isFrozen(manifest.proposal.changes));
  assert.ok(Object.isFrozen(manifest.proposal.changes[0]));
  assert.ok(Object.isFrozen(manifest.proposal.authorProviders));
  assert.ok(Object.isFrozen(manifest.writablePaths));
  assert.throws(() => { manifest.proposal.changes[0].path = "outside.mjs"; }, TypeError);
});

test("aggregate proposal bytes remain bounded without introducing any host or customer effect", () => {
  const big = "A".repeat(4 * Math.ceil((16 * 1024 * 1024) / 3) + 4);
  assert.throws(() => induceVerifiedMissionProposal(mission,
    result([{ ...change(), afterBytesBase64: big }])),
  /noncanonical or oversized base64 bytes/u);
  assert.equal(induceVerifiedMissionProposal(mission, result([change()])).customerMutation,
    false);
});
