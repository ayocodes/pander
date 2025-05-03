import { ponder } from "ponder:registry";
import schema from "ponder:schema";

// CapyCore Event Handlers
ponder.on("CapyCore:PollCreated", async ({ event, context }) => {
  await context.db.insert(schema.pollCreated).values({
    id: event.id,
    creator: event.args.creator,
    pollAddress: event.args.pollAddress,
    yesToken: event.args.yesToken,
    noToken: event.args.noToken,
    question: event.args.question,
    avatar: event.args.avatar,
    description: event.args.description,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
  });
});

ponder.on("CapyCore:ProtocolFeeUpdated", async ({ event, context }) => {
  await context.db.insert(schema.protocolFeeUpdated).values({
    id: event.id,
    oldFee: event.args.oldFee,
    newFee: event.args.newFee,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
  });
});

ponder.on("CapyCore:CloneablePollUpdated", async ({ event, context }) => {
  await context.db.insert(schema.cloneablePollUpdated).values({
    id: event.id,
    oldAddress: event.args.oldAddress,
    newAddress: event.args.newAddress,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
  });
});

ponder.on("CapyCore:CloneableTokenUpdated", async ({ event, context }) => {
  await context.db.insert(schema.cloneableTokenUpdated).values({
    id: event.id,
    oldAddress: event.args.oldAddress,
    newAddress: event.args.newAddress,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
  });
});

ponder.on("CapyCore:USDETokenUpdated", async ({ event, context }) => {
  await context.db.insert(schema.usdeTokenUpdated).values({
    id: event.id,
    oldAddress: event.args.oldAddress,
    newAddress: event.args.newAddress,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
  });
});

ponder.on("CapyCore:FeesWithdrawn", async ({ event, context }) => {
  await context.db.insert(schema.feesWithdrawn).values({
    id: event.id,
    to: event.args.to,
    amount: event.args.amount,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
  });
});

// CapyPoll Event Handlers
ponder.on("CapyPoll:StakeAdded", async ({ event, context }) => {
  await context.db.insert(schema.stakeAdded).values({
    id: event.id,
    pollAddress: event.log.address,
    user: event.args.user,
    amount: event.args.amount,
    position: event.args.position,
    epoch: event.args.epoch,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
  });
});

ponder.on("CapyPoll:TokensDistributed", async ({ event, context }) => {
  await context.db.insert(schema.tokensDistributed).values({
    id: event.id,
    pollAddress: event.log.address,
    epoch: event.args.epoch,
    amount: event.args.amount,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
  });
});

ponder.on("CapyPoll:PollResolved", async ({ event, context }) => {
  await context.db.insert(schema.pollResolved).values({
    id: event.id,
    pollAddress: event.log.address,
    winningPosition: event.args.winningPosition,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
  });
});

ponder.on("CapyPoll:RewardsDistributed", async ({ event, context }) => {
  await context.db.insert(schema.rewardsDistributed).values({
    id: event.id,
    pollAddress: event.log.address,
    user: event.args.user,
    amount: event.args.amount,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
  });
});

ponder.on("CapyPoll:StakeWithdrawn", async ({ event, context }) => {
  await context.db.insert(schema.stakeWithdrawn).values({
    id: event.id,
    pollAddress: event.log.address,
    user: event.args.user,
    amount: event.args.amount,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
  });
});
