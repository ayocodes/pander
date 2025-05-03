import { onchainTable } from "ponder";

// CapyCore Events
export const pollCreated = onchainTable("pollCreated", (t) => ({
  id: t.text().primaryKey(),
  creator: t.hex().notNull(),
  pollAddress: t.hex().notNull(),
  yesToken: t.hex().notNull(),
  noToken: t.hex().notNull(),
  question: t.text().notNull(),
  avatar: t.text().notNull(),
  description: t.text().notNull(),
  blockNumber: t.bigint().notNull(),
  blockTimestamp: t.bigint().notNull(),
  transactionHash: t.hex().notNull(),
}));

export const protocolFeeUpdated = onchainTable("protocolFeeUpdated", (t) => ({
  id: t.text().primaryKey(),
  oldFee: t.bigint().notNull(),
  newFee: t.bigint().notNull(),
  blockNumber: t.bigint().notNull(),
  blockTimestamp: t.bigint().notNull(),
  transactionHash: t.hex().notNull(),
}));

export const cloneablePollUpdated = onchainTable(
  "cloneablePollUpdated",
  (t) => ({
    id: t.text().primaryKey(),
    oldAddress: t.hex().notNull(),
    newAddress: t.hex().notNull(),
    blockNumber: t.bigint().notNull(),
    blockTimestamp: t.bigint().notNull(),
    transactionHash: t.hex().notNull(),
  })
);

export const cloneableTokenUpdated = onchainTable(
  "cloneableTokenUpdated",
  (t) => ({
    id: t.text().primaryKey(),
    oldAddress: t.hex().notNull(),
    newAddress: t.hex().notNull(),
    blockNumber: t.bigint().notNull(),
    blockTimestamp: t.bigint().notNull(),
    transactionHash: t.hex().notNull(),
  })
);

export const usdeTokenUpdated = onchainTable("usdeTokenUpdated", (t) => ({
  id: t.text().primaryKey(),
  oldAddress: t.hex().notNull(),
  newAddress: t.hex().notNull(),
  blockNumber: t.bigint().notNull(),
  blockTimestamp: t.bigint().notNull(),
  transactionHash: t.hex().notNull(),
}));

export const feesWithdrawn = onchainTable("feesWithdrawn", (t) => ({
  id: t.text().primaryKey(),
  to: t.hex().notNull(),
  amount: t.bigint().notNull(),
  blockNumber: t.bigint().notNull(),
  blockTimestamp: t.bigint().notNull(),
  transactionHash: t.hex().notNull(),
}));

// CapyPoll Events
export const stakeAdded = onchainTable("stakeAdded", (t) => ({
  id: t.text().primaryKey(),
  pollAddress: t.hex().notNull(),
  user: t.hex().notNull(),
  amount: t.bigint().notNull(),
  position: t.boolean().notNull(),
  epoch: t.bigint().notNull(),
  blockNumber: t.bigint().notNull(),
  blockTimestamp: t.bigint().notNull(),
  transactionHash: t.hex().notNull(),
}));

export const tokensDistributed = onchainTable("tokensDistributed", (t) => ({
  id: t.text().primaryKey(),
  pollAddress: t.hex().notNull(),
  epoch: t.bigint().notNull(),
  amount: t.bigint().notNull(),
  blockNumber: t.bigint().notNull(),
  blockTimestamp: t.bigint().notNull(),
  transactionHash: t.hex().notNull(),
}));

export const pollResolved = onchainTable("pollResolved", (t) => ({
  id: t.text().primaryKey(),
  pollAddress: t.hex().notNull(),
  winningPosition: t.boolean().notNull(),
  blockNumber: t.bigint().notNull(),
  blockTimestamp: t.bigint().notNull(),
  transactionHash: t.hex().notNull(),
}));

export const rewardsDistributed = onchainTable("rewardsDistributed", (t) => ({
  id: t.text().primaryKey(),
  pollAddress: t.hex().notNull(),
  user: t.hex().notNull(),
  amount: t.bigint().notNull(),
  blockNumber: t.bigint().notNull(),
  blockTimestamp: t.bigint().notNull(),
  transactionHash: t.hex().notNull(),
}));

export const stakeWithdrawn = onchainTable("stakeWithdrawn", (t) => ({
  id: t.text().primaryKey(),
  pollAddress: t.hex().notNull(),
  user: t.hex().notNull(),
  amount: t.bigint().notNull(),
  blockNumber: t.bigint().notNull(),
  blockTimestamp: t.bigint().notNull(),
  transactionHash: t.hex().notNull(),
}));
