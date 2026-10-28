// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CertificateRegistry
 * @notice Decentralized registry for academic certificate fingerprints (CertiChain).
 * @dev Stores only cryptographic Keccak-256 hashes and metadata on-chain.
 *      Personal student data (names, courses, grades) never touches the blockchain.
 */
contract CertificateRegistry is Ownable {
    struct Certificate {
        string certificateId;
        bytes32 documentHash;
        address issuer;
        uint256 issuedAt;
        bool isRevoked;
        uint256 revokedAt;
        bool exists;
    }

    /// @dev Mapping from certificateId string to on-chain Certificate struct
    mapping(string => Certificate) private certificates;

    /// @dev Array of all issued certificate IDs for enumeration and dashboard listing
    string[] private certificateIds;

    /// @notice Total number of revoked certificates
    uint256 public revokedCount;

    /// @notice Emitted when a new certificate fingerprint is recorded on-chain
    event CertificateIssued(
        string certificateId,
        bytes32 indexed documentHash,
        address indexed issuer,
        uint256 issuedAt
    );

    /// @notice Emitted when an existing certificate is revoked by the institution owner
    event CertificateRevoked(
        string certificateId,
        address indexed revokedBy,
        uint256 revokedAt
    );

    /**
     * @notice Initializes the contract setting the deployer as the authorized institution owner.
     */
    constructor() Ownable(msg.sender) {}

    /**
     * @notice Issues a new academic certificate by recording its ID and Keccak-256 document hash.
     * @param _certificateId Unique human-readable identifier (e.g., "CERT-2026-CS101")
     * @param _documentHash Keccak-256 hash of canonical certificate fields
     */
    function issueCertificate(
        string calldata _certificateId,
        bytes32 _documentHash
    ) external onlyOwner {
        require(bytes(_certificateId).length > 0, "Certificate ID cannot be empty");
        require(_documentHash != bytes32(0), "Document hash cannot be zero");
        require(!certificates[_certificateId].exists, "Certificate ID already exists");

        uint256 timestamp = block.timestamp;

        certificates[_certificateId] = Certificate({
            certificateId: _certificateId,
            documentHash: _documentHash,
            issuer: msg.sender,
            issuedAt: timestamp,
            isRevoked: false,
            revokedAt: 0,
            exists: true
        });

        certificateIds.push(_certificateId);

        emit CertificateIssued(_certificateId, _documentHash, msg.sender, timestamp);
    }

    /**
     * @notice Revokes an existing certificate so it can no longer verify as valid.
     * @param _certificateId Unique identifier of the certificate to revoke
     */
    function revokeCertificate(string calldata _certificateId) external onlyOwner {
        require(certificates[_certificateId].exists, "Certificate does not exist");
        require(!certificates[_certificateId].isRevoked, "Certificate is already revoked");

        uint256 timestamp = block.timestamp;
        certificates[_certificateId].isRevoked = true;
        certificates[_certificateId].revokedAt = timestamp;
        revokedCount += 1;

        emit CertificateRevoked(_certificateId, msg.sender, timestamp);
    }

    /**
     * @notice Verifies a certificate ID and recomputed document hash against on-chain records.
     * @dev Explicitly prevents revoked certificates from being verified as valid.
     * @param _certificateId Certificate identifier to verify
     * @param _documentHash Recomputed Keccak-256 hash from candidate certificate details
     * @return isValid True ONLY if the certificate exists, is not revoked, and hashes match
     * @return exists True if the certificate ID was ever issued on-chain
     * @return isRevoked True if the certificate has been revoked by the institution
     * @return hashMatches True if the provided hash matches the on-chain documentHash
     * @return issuer Wallet address of the issuing authority
     * @return issuedAt Block timestamp when the certificate was issued
     * @return revokedAt Block timestamp when the certificate was revoked (0 if active)
     */
    function verifyCertificate(
        string calldata _certificateId,
        bytes32 _documentHash
    )
        external
        view
        returns (
            bool isValid,
            bool exists,
            bool isRevoked,
            bool hashMatches,
            address issuer,
            uint256 issuedAt,
            uint256 revokedAt
        )
    {
        Certificate storage cert = certificates[_certificateId];
        if (!cert.exists) {
            return (false, false, false, false, address(0), 0, 0);
        }

        bool matches = (cert.documentHash == _documentHash);
        bool valid = matches && !cert.isRevoked;

        return (
            valid,
            true,
            cert.isRevoked,
            matches,
            cert.issuer,
            cert.issuedAt,
            cert.revokedAt
        );
    }

    /**
     * @notice Retrieves the raw on-chain record for a given certificate ID.
     * @param _certificateId Unique identifier of the certificate
     */
    function getCertificate(
        string calldata _certificateId
    )
        external
        view
        returns (
            string memory certificateId,
            bytes32 documentHash,
            address issuer,
            uint256 issuedAt,
            bool isRevoked,
            uint256 revokedAt,
            bool exists
        )
    {
        Certificate storage cert = certificates[_certificateId];
        return (
            cert.certificateId,
            cert.documentHash,
            cert.issuer,
            cert.issuedAt,
            cert.isRevoked,
            cert.revokedAt,
            cert.exists
        );
    }

    /**
     * @notice Returns the total number of certificates issued on this contract.
     */
    function getCertificateCount() external view returns (uint256) {
        return certificateIds.length;
    }

    /**
     * @notice Returns all issued certificate IDs for dashboard indexing.
     */
    function getAllCertificateIds() external view returns (string[] memory) {
        return certificateIds;
    }
}
