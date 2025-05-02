import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  CloneablePollUpdated,
  CloneableTokenUpdated,
  FeesWithdrawn,
  OwnershipTransferred,
  PollCreated,
  ProtocolFeeUpdated,
  SUSDETokenUpdated,
  USDETokenUpdated
} from "../generated/CapyCore/CapyCore"

export function createCloneablePollUpdatedEvent(
  oldAddress: Address,
  newAddress: Address
): CloneablePollUpdated {
  let cloneablePollUpdatedEvent = changetype<CloneablePollUpdated>(
    newMockEvent()
  )

  cloneablePollUpdatedEvent.parameters = new Array()

  cloneablePollUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "oldAddress",
      ethereum.Value.fromAddress(oldAddress)
    )
  )
  cloneablePollUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newAddress",
      ethereum.Value.fromAddress(newAddress)
    )
  )

  return cloneablePollUpdatedEvent
}

export function createCloneableTokenUpdatedEvent(
  oldAddress: Address,
  newAddress: Address
): CloneableTokenUpdated {
  let cloneableTokenUpdatedEvent = changetype<CloneableTokenUpdated>(
    newMockEvent()
  )

  cloneableTokenUpdatedEvent.parameters = new Array()

  cloneableTokenUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "oldAddress",
      ethereum.Value.fromAddress(oldAddress)
    )
  )
  cloneableTokenUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newAddress",
      ethereum.Value.fromAddress(newAddress)
    )
  )

  return cloneableTokenUpdatedEvent
}

export function createFeesWithdrawnEvent(
  to: Address,
  amount: BigInt
): FeesWithdrawn {
  let feesWithdrawnEvent = changetype<FeesWithdrawn>(newMockEvent())

  feesWithdrawnEvent.parameters = new Array()

  feesWithdrawnEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )
  feesWithdrawnEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return feesWithdrawnEvent
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

export function createPollCreatedEvent(
  creator: Address,
  pollAddress: Address,
  yesToken: Address,
  noToken: Address,
  question: string,
  avatar: string,
  description: string
): PollCreated {
  let pollCreatedEvent = changetype<PollCreated>(newMockEvent())

  pollCreatedEvent.parameters = new Array()

  pollCreatedEvent.parameters.push(
    new ethereum.EventParam("creator", ethereum.Value.fromAddress(creator))
  )
  pollCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "pollAddress",
      ethereum.Value.fromAddress(pollAddress)
    )
  )
  pollCreatedEvent.parameters.push(
    new ethereum.EventParam("yesToken", ethereum.Value.fromAddress(yesToken))
  )
  pollCreatedEvent.parameters.push(
    new ethereum.EventParam("noToken", ethereum.Value.fromAddress(noToken))
  )
  pollCreatedEvent.parameters.push(
    new ethereum.EventParam("question", ethereum.Value.fromString(question))
  )
  pollCreatedEvent.parameters.push(
    new ethereum.EventParam("avatar", ethereum.Value.fromString(avatar))
  )
  pollCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "description",
      ethereum.Value.fromString(description)
    )
  )

  return pollCreatedEvent
}

export function createProtocolFeeUpdatedEvent(
  oldFee: BigInt,
  newFee: BigInt
): ProtocolFeeUpdated {
  let protocolFeeUpdatedEvent = changetype<ProtocolFeeUpdated>(newMockEvent())

  protocolFeeUpdatedEvent.parameters = new Array()

  protocolFeeUpdatedEvent.parameters.push(
    new ethereum.EventParam("oldFee", ethereum.Value.fromUnsignedBigInt(oldFee))
  )
  protocolFeeUpdatedEvent.parameters.push(
    new ethereum.EventParam("newFee", ethereum.Value.fromUnsignedBigInt(newFee))
  )

  return protocolFeeUpdatedEvent
}

export function createSUSDETokenUpdatedEvent(
  oldAddress: Address,
  newAddress: Address
): SUSDETokenUpdated {
  let susdeTokenUpdatedEvent = changetype<SUSDETokenUpdated>(newMockEvent())

  susdeTokenUpdatedEvent.parameters = new Array()

  susdeTokenUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "oldAddress",
      ethereum.Value.fromAddress(oldAddress)
    )
  )
  susdeTokenUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newAddress",
      ethereum.Value.fromAddress(newAddress)
    )
  )

  return susdeTokenUpdatedEvent
}

export function createUSDETokenUpdatedEvent(
  oldAddress: Address,
  newAddress: Address
): USDETokenUpdated {
  let usdeTokenUpdatedEvent = changetype<USDETokenUpdated>(newMockEvent())

  usdeTokenUpdatedEvent.parameters = new Array()

  usdeTokenUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "oldAddress",
      ethereum.Value.fromAddress(oldAddress)
    )
  )
  usdeTokenUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newAddress",
      ethereum.Value.fromAddress(newAddress)
    )
  )

  return usdeTokenUpdatedEvent
}
