import { DataSourceContext } from "@graphprotocol/graph-ts";

import {
  CloneablePollUpdated as CloneablePollUpdatedEvent,
  CloneableTokenUpdated as CloneableTokenUpdatedEvent,
  FeesWithdrawn as FeesWithdrawnEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  PollCreated as PollCreatedEvent,
  ProtocolFeeUpdated as ProtocolFeeUpdatedEvent,
  SUSDETokenUpdated as SUSDETokenUpdatedEvent,
  USDETokenUpdated as USDETokenUpdatedEvent,
} from "../generated/CapyCore/CapyCore";
import {
  CloneablePollUpdated,
  CloneableTokenUpdated,
  FeesWithdrawn,
  OwnershipTransferred,
  PollCreated,
  ProtocolFeeUpdated,
  SUSDETokenUpdated,
  USDETokenUpdated,
} from "../generated/schema";
import { CapyPoll } from "../generated/templates";

export function handleCloneablePollUpdated(
  event: CloneablePollUpdatedEvent
): void {
  let entity = new CloneablePollUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.oldAddress = event.params.oldAddress;
  entity.newAddress = event.params.newAddress;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleCloneableTokenUpdated(
  event: CloneableTokenUpdatedEvent
): void {
  let entity = new CloneableTokenUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.oldAddress = event.params.oldAddress;
  entity.newAddress = event.params.newAddress;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleFeesWithdrawn(event: FeesWithdrawnEvent): void {
  let entity = new FeesWithdrawn(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.to = event.params.to;
  entity.amount = event.params.amount;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.previousOwner = event.params.previousOwner;
  entity.newOwner = event.params.newOwner;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handlePollCreated(event: PollCreatedEvent): void {
  let entity = new PollCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.creator = event.params.creator;
  entity.pollAddress = event.params.pollAddress;
  entity.yesToken = event.params.yesToken;
  entity.noToken = event.params.noToken;
  entity.question = event.params.question;
  entity.avatar = event.params.avatar;
  entity.description = event.params.description;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();

  let context = new DataSourceContext();
  context.setBytes("creator", event.params.creator);
  context.setBytes("pollAddress", event.params.pollAddress);
  CapyPoll.createWithContext(event.params.pollAddress, context);
}

export function handleProtocolFeeUpdated(event: ProtocolFeeUpdatedEvent): void {
  let entity = new ProtocolFeeUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.oldFee = event.params.oldFee;
  entity.newFee = event.params.newFee;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleSUSDETokenUpdated(event: SUSDETokenUpdatedEvent): void {
  let entity = new SUSDETokenUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.oldAddress = event.params.oldAddress;
  entity.newAddress = event.params.newAddress;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleUSDETokenUpdated(event: USDETokenUpdatedEvent): void {
  let entity = new USDETokenUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.oldAddress = event.params.oldAddress;
  entity.newAddress = event.params.newAddress;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}
