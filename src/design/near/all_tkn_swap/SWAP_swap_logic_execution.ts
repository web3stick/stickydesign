import * as near from "fastintear";
import type { SwapQuote, TransactionAction } from "./SWAP_swap_logic_types";

/**
 * Executes swap transaction using FastNEAR with multiple transactions in single wallet popup
 */
export async function executeSwap(quote: SwapQuote): Promise<void> {
  if (!quote.selectedRoute || !near) {
    throw new Error("No route selected or FastNEAR not available");
  }

  const route = quote.selectedRoute;
  const instructions = route.execution_instructions;

  if (!instructions || instructions.length === 0) {
    throw new Error("No execution instructions found");
  }

  const accountId = near.accountId();
  if (!accountId) {
    throw new Error("No account signed in");
  }

  const transactions: any[] = [];

  for (let i = 0; i < instructions.length; i++) {
    const instruction = instructions[i];

    if (instruction.NearTransaction) {
      const { receiver_id, actions } = instruction.NearTransaction;

      const nearActions = actions
        .filter((action: TransactionAction) => action.FunctionCall)
        .map((action: TransactionAction) => {
          const fc = action.FunctionCall as NonNullable<
            typeof action.FunctionCall
          >;
          return near.actions.functionCall({
            methodName: fc.method_name,
            args: JSON.parse(atob(fc.args)),
            gas: fc.gas,
            deposit: fc.deposit,
          });
        });

      transactions.push({
        signerId: accountId,
        receiverId: receiver_id,
        actions: nearActions,
      });
    }
  }

  // Execute all transactions in a single wallet popup using the adapter
  // this is going to throw errors that is fine
  // it must be this exactly
  //   await near.state._adapter.sendTransactions({
  await near.state._adapter.sendTransactions({
    transactions: transactions,
  });
}