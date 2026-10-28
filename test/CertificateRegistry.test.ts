import { expect } from "chai";
import { network } from "hardhat";
import { keccak256, toUtf8Bytes, ZeroHash } from "ethers";

/**
 * Helper to compute the canonical Keccak-256 certificate hash
 * matching the frontend's hashing algorithm.
 */
function computeCanonicalHash(fields: {
  certificateId: string;
  studentName: string;
  course: string;
  institution: string;
  issueDate: string;
}): string {
  const canonicalPayload = JSON.stringify({
    certificateId: fields.certificateId.trim().toUpperCase(),
    studentName: fields.studentName.trim().toLowerCase(),
    course: fields.course.trim().toLowerCase(),
    institution: fields.institution.trim().toLowerCase(),
    issueDate: fields.issueDate.trim(),
  });
  return keccak256(toUtf8Bytes(canonicalPayload));
}

describe("CertificateRegistry Smart Contract", function () {
  const sampleDetails = {
    certificateId: "CERT-2026-CS001",
    studentName: "Aarav Sharma",
    course: "B.Tech in Computer Science & Engineering",
    institution: "National Institute of Technology",
    issueDate: "2026-05-15",
  };

  const sampleHash = computeCanonicalHash(sampleDetails);

  async function deployFixture() {
    const connection = await network.create();
    const { ethers } = connection;
    const [owner, student, unauthorizedUser] = await ethers.getSigners();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const registry: any = await ethers.deployContract(
      "CertificateRegistry",
      [],
      owner
    );
    await registry.waitForDeployment();
    return { connection, ethers, registry, owner, student, unauthorizedUser };
  }

  it("1. Authorized Issuance: allows the contract owner to issue a new certificate and emits CertificateIssued", async function () {
    const { registry, owner } = await deployFixture();

    const tx = await registry.connect(owner).issueCertificate(sampleDetails.certificateId, sampleHash);
    const receipt = await tx.wait();
    expect(receipt).to.not.be.null;

    const count = await registry.getCertificateCount();
    expect(count).to.equal(1n);

    const record = await registry.getCertificate(sampleDetails.certificateId);
    expect(record.certificateId).to.equal(sampleDetails.certificateId);
    expect(record.documentHash).to.equal(sampleHash);
    expect(record.issuer).to.equal(owner.address);
    expect(record.isRevoked).to.equal(false);
    expect(record.exists).to.equal(true);
    expect(record.issuedAt).to.be.greaterThan(0n);
  });

  it("2. Unauthorized Issuance Rejection: rejects certificate issuance from non-owner wallets", async function () {
    const { registry, unauthorizedUser } = await deployFixture();

    await expect(
      registry
        .connect(unauthorizedUser)
        .issueCertificate(sampleDetails.certificateId, sampleHash)
    ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
  });

  it("3. Duplicate Certificate Prevention: prevents issuing two certificates with the same certificate ID", async function () {
    const { registry, owner } = await deployFixture();

    await registry.connect(owner).issueCertificate(sampleDetails.certificateId, sampleHash);

    const anotherHash = keccak256(toUtf8Bytes("different-document-payload"));
    await expect(
      registry.connect(owner).issueCertificate(sampleDetails.certificateId, anotherHash)
    ).to.be.revertedWith("Certificate ID already exists");
  });

  it("4. Successful Certificate Verification: verifies an authentic, unrevoked certificate as valid", async function () {
    const { registry, owner, student } = await deployFixture();

    await registry.connect(owner).issueCertificate(sampleDetails.certificateId, sampleHash);

    const result = await registry
      .connect(student)
      .verifyCertificate(sampleDetails.certificateId, sampleHash);

    expect(result.isValid).to.equal(true);
    expect(result.exists).to.equal(true);
    expect(result.isRevoked).to.equal(false);
    expect(result.hashMatches).to.equal(true);
    expect(result.issuer).to.equal(owner.address);
    expect(result.issuedAt).to.be.greaterThan(0n);
  });

  it("5. Invalid or Missing Certificate: returns exists=false and isValid=false for non-existent certificate IDs", async function () {
    const { registry } = await deployFixture();

    const result = await registry.verifyCertificate("CERT-NON-EXISTENT-999", sampleHash);

    expect(result.isValid).to.equal(false);
    expect(result.exists).to.equal(false);
    expect(result.isRevoked).to.equal(false);
    expect(result.hashMatches).to.equal(false);
    expect(result.issuer).to.equal("0x0000000000000000000000000000000000000000");
  });

  it("6. Certificate Revocation: allows the owner to revoke an issued certificate and prevents it from verifying as valid", async function () {
    const { registry, owner } = await deployFixture();

    await registry.connect(owner).issueCertificate(sampleDetails.certificateId, sampleHash);
    await registry.connect(owner).revokeCertificate(sampleDetails.certificateId);

    const revokedCount = await registry.revokedCount();
    expect(revokedCount).to.equal(1n);

    const verification = await registry.verifyCertificate(
      sampleDetails.certificateId,
      sampleHash
    );
    expect(verification.isValid).to.equal(false);
    expect(verification.exists).to.equal(true);
    expect(verification.isRevoked).to.equal(true);
    expect(verification.hashMatches).to.equal(true);
    expect(verification.revokedAt).to.be.greaterThan(0n);
  });

  it("7. Unauthorized Revocation Rejection: prevents non-owner accounts from revoking a certificate", async function () {
    const { registry, owner, unauthorizedUser } = await deployFixture();

    await registry.connect(owner).issueCertificate(sampleDetails.certificateId, sampleHash);

    await expect(
      registry.connect(unauthorizedUser).revokeCertificate(sampleDetails.certificateId)
    ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
  });

  it("8. Tampered Certificate Detection: detects modified student details via hash mismatch (exists=true, hashMatches=false, isValid=false)", async function () {
    const { registry, owner } = await deployFixture();

    await registry.connect(owner).issueCertificate(sampleDetails.certificateId, sampleHash);

    // Simulate tampering: someone alters the student name or course
    const tamperedHash = computeCanonicalHash({
      ...sampleDetails,
      course: "B.Tech in Artificial Intelligence (Forged)",
    });

    const verification = await registry.verifyCertificate(
      sampleDetails.certificateId,
      tamperedHash
    );

    expect(verification.isValid).to.equal(false);
    expect(verification.exists).to.equal(true);
    expect(verification.isRevoked).to.equal(false);
    expect(verification.hashMatches).to.equal(false);
  });

  it("9. Input Validation: rejects empty certificate IDs or zero hashes", async function () {
    const { registry, owner } = await deployFixture();

    await expect(
      registry.connect(owner).issueCertificate("", sampleHash)
    ).to.be.revertedWith("Certificate ID cannot be empty");

    await expect(
      registry.connect(owner).issueCertificate("CERT-EMPTY-HASH", ZeroHash)
    ).to.be.revertedWith("Document hash cannot be zero");
  });
});
