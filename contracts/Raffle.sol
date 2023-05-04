// SPDX-License-Identifier: MIT

pragma solidity ^0.8.8;

// Imports
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AutomationCompatibleInterface.sol";
// import "hardhat/console.sol";

// Custom errors
error Raffle__UpkeepNotNeeded(
    uint256 currentBalance,
    uint256 numPlayers,
    uint256 raffleState
);
error Raffle__TransferFailed();
error Raffle__SendMoreToEnterRaffle();
error Raffle__RaffleNotOpen();

/// @title
/// @author
/// @notice
contract Raffle is VRFConsumerBaseV2, AutomationCompatibleInterface {
    // Enums of raffle state
    enum RaffleState {
        OPEN,
        CALCULATING // when in calculating state, raffle is not open for new players
    }

    // Chainlink VRF
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator; // coodinator to request random numbers
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3; // number of confirmations to wait
    uint32 private constant NUM_WORDS = 1; // number of random words to request

    // Lottery
    uint256 private immutable i_interval;
    uint256 private immutable i_entranceFee;
    uint256 private s_lastTimeStamp;
    address private s_recentWinner;
    address payable[] private s_players; // array of player addresses
    RaffleState private s_raffleState; // state of raffle

    // Events with indexed parameters for easy filtering
    event RequestedRaffleWinner(uint256 indexed requestId); // emmit event that raffle winner has been requested
    event RaffleEnter(address indexed player); // emmit event that player has entered
    event WinnerPicked(address indexed player); // emmit event that winner has been picked

    constructor(
        // constructor is called when contract is deployed
        address vrfCoordinatorV2, // address of Chainlink VRF Coordinator
        uint64 subscriptionId, // subscription id for Chainlink VRF
        bytes32 gasLane, // max gas price to pay for VRF response
        uint256 interval, // time interval between raffles
        uint256 entranceFee, // amount of ETH required to enter raffle
        uint32 callbackGasLimit // max gas to use for callbacks
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        // configure VRFConsumerBaseV2
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_interval = interval;
        i_subscriptionId = subscriptionId;
        i_entranceFee = entranceFee;
        s_raffleState = RaffleState.OPEN;
        s_lastTimeStamp = block.timestamp;
        i_callbackGasLimit = callbackGasLimit;
    }

    function enterRaffle() public payable {
        if (msg.value < i_entranceFee) {
            revert Raffle__SendMoreToEnterRaffle();
        }
        if (s_raffleState != RaffleState.OPEN) {
            revert Raffle__RaffleNotOpen();
        }
        s_players.push(payable(msg.sender)); // typecast address to payable

        emit RaffleEnter(msg.sender); // emmit event that player has entered
    }

    /// @dev Check if the contract needs to be called, called by Keeper
    /// @return upkeepNeeded
    function checkUpkeep(
        bytes memory /* checkData */
    )
        public
        view
        override
        returns (bool upkeepNeeded, bytes memory /* performData */)
    {
        bool isOpen = RaffleState.OPEN == s_raffleState;
        bool timePassed = ((block.timestamp - s_lastTimeStamp) > i_interval);
        bool hasPlayers = s_players.length > 0;
        bool hasBalance = address(this).balance > 0;
        upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers); // upkeep is needed if time has passed, raffle is open, there is a balance, and there are players
        return (upkeepNeeded, "0x0"); // can we comment this out?
    }

    /// @dev Perform the contract's upkeep, is called by Keeper
    function performUpkeep(bytes calldata) external override {
        (bool upkeepNeeded, ) = checkUpkeep(""); // revalidate that upkeep is needed
        if (!upkeepNeeded) {
            revert Raffle__UpkeepNotNeeded(
                address(this).balance,
                s_players.length,
                uint256(s_raffleState)
            );
        }
        s_raffleState = RaffleState.CALCULATING;
        uint256 requestId = i_vrfCoordinator.requestRandomWords( // request random number from Chainlink VRF
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        // after upkeep, update timestamp
        s_lastTimeStamp = block.timestamp;
        emit RequestedRaffleWinner(requestId);
    }

    /// @dev Callback function used by VRF Coordinator, is called after random number is generated
    function fulfillRandomWords(
        uint256 /* requestId */,
        uint256[] memory randomWords // array of random words
    ) internal override {
        uint256 indexOfWinner = randomWords[0] % s_players.length; // mod random number by number of players, get index of winner
        address payable recentWinner = s_players[indexOfWinner];
        s_recentWinner = recentWinner;
        s_players = new address payable[](0);
        s_raffleState = RaffleState.OPEN;
        s_lastTimeStamp = block.timestamp;
        (bool success, ) = recentWinner.call{value: address(this).balance}("");
        if (!success) {
            revert Raffle__TransferFailed();
        }
        emit WinnerPicked(recentWinner);
    }

    // Getters
    function getRaffleState() public view returns (RaffleState) {
        return s_raffleState;
    }

    function getNumWords() public pure returns (uint256) {
        return NUM_WORDS;
    }

    function getRequestConfirmations() public pure returns (uint256) {
        return REQUEST_CONFIRMATIONS;
    }

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }

    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }

    function getLastTimeStamp() public view returns (uint256) {
        return s_lastTimeStamp;
    }

    function getInterval() public view returns (uint256) {
        return i_interval;
    }

    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function getNumberOfPlayers() public view returns (uint256) {
        return s_players.length;
    }
}
