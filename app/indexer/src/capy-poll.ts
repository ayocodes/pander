import {
  Initialized as InitializedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  PollResolved as PollResolvedEvent,
  RewardsDistributed as RewardsDistributedEvent,
  StakeAdded as StakeAddedEvent,
  StakeWithdrawn as StakeWithdrawnEvent,
  TokensDistributed as TokensDistributedEvent,
} from "../generated/CapyPoll/CapyPoll";
import {
  CapyPollOwnershipTransferred,
  Initialized,
  PollResolved,
  RewardsDistributed,
  StakeAdded,
  StakeWithdrawn,
  TokensDistributed,
} from "../generated/schema";

import { dataSource } from "@graphprotocol/graph-ts";

let context = dataSource.context();
let creator = context.getBytes("creator");
let pollAddress = context.getBytes("pollAddress");

export function handleInitialized(event: InitializedEvent): void {
  let entity = new Initialized(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.version = event.params.version;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.creator = creator;
  entity.pollAddress = pollAddress;

  entity.save();
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  let entity = new CapyPollOwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.previousOwner = event.params.previousOwner;
  entity.newOwner = event.params.newOwner;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.creator = creator;
  entity.pollAddress = pollAddress;

  entity.save();
}

export function handlePollResolved(event: PollResolvedEvent): void {
  let entity = new PollResolved(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.winningPosition = event.params.winningPosition;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.creator = creator;
  entity.pollAddress = pollAddress;

  entity.save();
}

export function handleRewardsDistributed(event: RewardsDistributedEvent): void {
  let entity = new RewardsDistributed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.user = event.params.user;
  entity.amount = event.params.amount;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.creator = creator;
  entity.pollAddress = pollAddress;

  entity.save();
}

export function handleStakeAdded(event: StakeAddedEvent): void {
  let entity = new StakeAdded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.user = event.params.user;
  entity.amount = event.params.amount;
  entity.position = event.params.position;
  entity.epoch = event.params.epoch;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.creator = creator;
  entity.pollAddress = pollAddress;

  entity.save();
}

export function handleStakeWithdrawn(event: StakeWithdrawnEvent): void {
  let entity = new StakeWithdrawn(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.user = event.params.user;
  entity.amount = event.params.amount;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.creator = creator;
  entity.pollAddress = pollAddress;

  entity.save();
}

export function handleTokensDistributed(event: TokensDistributedEvent): void {
  let entity = new TokensDistributed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.epoch = event.params.epoch;
  entity.amount = event.params.amount;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.creator = creator;
  entity.pollAddress = pollAddress;

  entity.save();
}
