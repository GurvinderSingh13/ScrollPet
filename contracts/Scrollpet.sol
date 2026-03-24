// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ScrollPet — Lineage Handshake Engine
 * @notice Anonymous pet registry with lineage tracking, status toggles,
 *         and permanent ownership history.
 */
contract ScrollPet {
    // ───────────────────────────── Enums ─────────────────────────────

    enum Status {
        None,
        ForSale,
        Mating,
        Lost
    }

    // ───────────────────────────── Structs ───────────────────────────

    struct Pet {
        address owner;
        Status status;
        uint256 parentA;
        uint256 parentB;
        bool parentASet;
        bool parentBSet;
        address[] previousOwners;
    }

    struct LineageRequest {
        uint256 childId;
        uint256 parentId;
        address requester;
        bool approved;
        bool exists;
    }

    // ──────────────────────────── Storage ────────────────────────────

    uint256 private _nextPetId = 1;
    uint256 private _nextRequestId = 1;

    mapping(uint256 => Pet) private _pets;
    mapping(uint256 => LineageRequest) private _lineageRequests;

    // ──────────────────────────── Events ─────────────────────────────

    event PetMinted(uint256 indexed petId, address indexed owner);
    event StatusChanged(uint256 indexed petId, Status newStatus);
    event LineageRequested(
        uint256 indexed requestId,
        uint256 indexed childId,
        uint256 indexed parentId,
        address requester
    );
    event LineageApproved(
        uint256 indexed requestId,
        uint256 indexed childId,
        uint256 indexed parentId
    );
    event PetTransferred(
        uint256 indexed petId,
        address indexed from,
        address indexed to
    );

    // ──────────────────────────── Errors ─────────────────────────────

    error NotPetOwner(uint256 petId, address caller);
    error PetDoesNotExist(uint256 petId);
    error InvalidAddress(address addr);
    error TransferToSelf(uint256 petId);
    error RequestDoesNotExist(uint256 requestId);
    error RequestAlreadyApproved(uint256 requestId);
    error LineageSlotsExhausted(uint256 childId);
    error CannotBeOwnParent(uint256 petId);

    // ──────────────────────────── Modifiers ──────────────────────────

    modifier onlyPetOwner(uint256 petId) {
        if (_pets[petId].owner == address(0)) revert PetDoesNotExist(petId);
        if (_pets[petId].owner != msg.sender) revert NotPetOwner(petId, msg.sender);
        _;
    }

    modifier petExists(uint256 petId) {
        if (_pets[petId].owner == address(0)) revert PetDoesNotExist(petId);
        _;
    }

    // ──────────────────── Core Functions ─────────────────────────────

    /**
     * @notice Mint a new, anonymous Pet ID.
     * @return petId The newly created pet's unique identifier.
     */
    function mintPet() external returns (uint256 petId) {
        petId = _nextPetId++;

        Pet storage pet = _pets[petId];
        pet.owner = msg.sender;
        // status defaults to None, parents default to 0 / false

        emit PetMinted(petId, msg.sender);
    }

    /**
     * @notice Toggle the status flag on a pet you own.
     * @param petId  The pet to update.
     * @param status The new status (None, ForSale, Mating, Lost).
     */
    function setStatus(uint256 petId, Status status) external onlyPetOwner(petId) {
        _pets[petId].status = status;
        emit StatusChanged(petId, status);
    }

    // ──────────────── Lineage Handshake System ──────────────────────

    /**
     * @notice Request lineage: Pet `childId` (owned by caller) asks
     *         Pet `parentId` to be registered as a parent.
     * @param childId  The child pet (caller must own).
     * @param parentId The proposed parent pet (must exist).
     * @return requestId The ID of the newly created lineage request.
     */
    function requestLineage(
        uint256 childId,
        uint256 parentId
    )
        external
        onlyPetOwner(childId)
        petExists(parentId)
        returns (uint256 requestId)
    {
        if (childId == parentId) revert CannotBeOwnParent(childId);

        Pet storage child = _pets[childId];
        if (child.parentASet && child.parentBSet) {
            revert LineageSlotsExhausted(childId);
        }

        requestId = _nextRequestId++;

        _lineageRequests[requestId] = LineageRequest({
            childId: childId,
            parentId: parentId,
            requester: msg.sender,
            approved: false,
            exists: true
        });

        emit LineageRequested(requestId, childId, parentId, msg.sender);
    }

    /**
     * @notice Approve a pending lineage request. Only the owner of
     *         the parent pet may call this.
     * @param requestId The lineage request to approve.
     */
    function approveLineage(uint256 requestId) external {
        LineageRequest storage req = _lineageRequests[requestId];
        if (!req.exists) revert RequestDoesNotExist(requestId);
        if (req.approved) revert RequestAlreadyApproved(requestId);

        // Caller must own the parent pet
        uint256 parentId = req.parentId;
        if (_pets[parentId].owner != msg.sender) {
            revert NotPetOwner(parentId, msg.sender);
        }

        Pet storage child = _pets[req.childId];

        // Fill the first empty parent slot
        if (!child.parentASet) {
            child.parentA = parentId;
            child.parentASet = true;
        } else if (!child.parentBSet) {
            child.parentB = parentId;
            child.parentBSet = true;
        } else {
            revert LineageSlotsExhausted(req.childId);
        }

        req.approved = true;
        emit LineageApproved(requestId, req.childId, parentId);
    }

    // ──────────────────── Transfer Function ─────────────────────────

    /**
     * @notice Transfer pet ownership. The current owner's address is
     *         permanently appended to the pet's history.
     * @param petId The pet to transfer.
     * @param to    The new owner's address.
     */
    function transferPet(uint256 petId, address to) external onlyPetOwner(petId) {
        if (to == address(0)) revert InvalidAddress(to);
        if (to == msg.sender) revert TransferToSelf(petId);

        Pet storage pet = _pets[petId];

        // Permanently log the outgoing owner
        pet.previousOwners.push(msg.sender);
        pet.owner = to;

        // Reset status on transfer
        pet.status = Status.None;

        emit PetTransferred(petId, msg.sender, to);
    }

    // ─────────────────────── View Helpers ────────────────────────────

    /**
     * @notice Get full details of a pet.
     */
    function getPet(uint256 petId)
        external
        view
        petExists(petId)
        returns (
            address owner,
            Status status,
            uint256 parentA,
            bool parentASet,
            uint256 parentB,
            bool parentBSet,
            address[] memory previousOwners
        )
    {
        Pet storage pet = _pets[petId];
        return (
            pet.owner,
            pet.status,
            pet.parentA,
            pet.parentASet,
            pet.parentB,
            pet.parentBSet,
            pet.previousOwners
        );
    }

    /**
     * @notice Get details of a lineage request.
     */
    function getLineageRequest(uint256 requestId)
        external
        view
        returns (
            uint256 childId,
            uint256 parentId,
            address requester,
            bool approved
        )
    {
        LineageRequest storage req = _lineageRequests[requestId];
        if (!req.exists) revert RequestDoesNotExist(requestId);
        return (req.childId, req.parentId, req.requester, req.approved);
    }

    /**
     * @notice Get the permanent ownership history for a pet.
     */
    function getPreviousOwners(uint256 petId)
        external
        view
        petExists(petId)
        returns (address[] memory)
    {
        return _pets[petId].previousOwners;
    }

    /**
     * @notice Total number of pets minted so far.
     */
    function totalPets() external view returns (uint256) {
        return _nextPetId - 1;
    }
}
