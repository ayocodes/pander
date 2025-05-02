import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Address } from "@graphprotocol/graph-ts"
import {
  Initialized,
  OwnershipTransferred,
  PollResolved,
  RewardsDistributed,
  StakeAdded,
  StakeWithdrawn,
  TokensDistributed
} from "../generated/CapyPoll/CapyPoll"

export function createInitializedEvent(version: BigInt): Initialized {
  let initializedEvent = changetype<Initialized>(newMockEvent())

  initializedEvent.parameters = new Array()

  initializedEvent.parameters.push(
    new ethereum.EventParam(
      "version",
      ethereum.Value.fromUnsignedBigInt(version)
    )
  )

  return initializedEvent
}

export function createOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferred {
  let ownershipTransferredEvent = changetype<OwnershipTransferred>(
    newMockEvent()
  )

  ownershipTransferredEvent.parameters = new Array()

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownershipTransferredEvent
}

export function createPollResolvedEvent(
  winningPosition: boolean
): PollResolved {
  let pollResolvedEvent = changetype<PollResolved>(newMockEvent())

  pollResolvedEvent.parameters = new Array()

  pollResolvedEvent.parameters.push(
    new ethereum.EventParam(
      "winningPosition",
      ethereum.Value.fromBoolean(winningPosition)
    )
  )

  return pollResolvedEvent
}

export function createRewardsDistributedEvent(
  user: Address,
  amount: BigInt
): RewardsDistributed {
  let rewardsDistributedEvent = changetype<RewardsDistributed>(newMockEvent())

  rewardsDistributedEvent.parameters = new Array()

  rewardsDistributedEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  rewardsDistributedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return rewardsDistributedEvent
}

export function createStakeAddedEvent(
  user: Address,
  amount: BigInt,
  position: boolean,
  epoch: BigInt
): StakeAdded {
  let stakeAddedEvent = changetype<StakeAdded>(newMockEvent())

  stakeAddedEvent.parameters = new Array()

  stakeAddedEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  stakeAddedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  stakeAddedEvent.parameters.push(
    new ethereum.EventParam("position", ethereum.Value.fromBoolean(position))
  )
  stakeAddedEvent.parameters.push(
    new ethereum.EventParam("epoch", ethereum.Value.fromUnsignedBigInt(epoch))
  )

  return stakeAddedEvent
}

export function createStakeWithdrawnEvent(
  user: Address,
  amount: BigInt
): StakeWithdrawn {
  let stakeWithdrawnEvent = changetype<StakeWithdrawn>(newMockEvent())

  stakeWithdrawnEvent.parameters = new Array()

  stakeWithdrawnEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  stakeWithdrawnEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return stakeWithdrawnEvent
}

export function createTokensDistributedEvent(
  epoch: BigInt,
  amount: BigInt
): TokensDistributed {
  let tokensDistributedEvent = changetype<TokensDistributed>(newMockEvent())

  tokensDistributedEvent.parameters = new Array()

  tokensDistributedEvent.parameters.push(
    new ethereum.EventParam("epoch", ethereum.Value.fromUnsignedBigInt(epoch))
  )
  tokensDistributedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return tokensDistributedEvent
}
