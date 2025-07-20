/**
 * @fileoverview Get transactions from PocketSmith with search and filter options
 */

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { BaseErrorCode, McpError } from "../../../types-global/errors.js";
import {
  ErrorHandler,
  logger,
  RequestContext,
  requestContextService,
} from "../../../utils/index.js";
import { PocketSmithService } from "../../../services/pocketsmith.js";

export const GetTransactionsInputSchema = z.object({
  apiKey: z.string().optional().describe("PocketSmith API key (if not set via environment)"),
  accessToken: z.string().optional().describe("OAuth access token (if not using API key)"),
  startDate: z.string().optional().describe("Start date for transaction search (YYYY-MM-DD)"),
  endDate: z.string().optional().describe("End date for transaction search (YYYY-MM-DD)"),
  search: z.string().optional().describe("Search term to filter transactions by payee or note"),
  type: z.enum(["credit", "debit"]).optional().describe("Filter by transaction type"),
  limit: z.number().int().min(1).max(1000).optional().default(50).describe("Maximum number of transactions to return (1-1000, default 50)"),
});

export type GetTransactionsInput = z.infer<typeof GetTransactionsInputSchema>;

export const GetTransactionsResponseSchema = z.object({
  transactions: z.array(z.object({
    id: z.number(),
    payee: z.string(),
    amount: z.number(),
    date: z.string(),
    note: z.string().nullable(),
    category: z.object({
      id: z.number(),
      title: z.string(),
    }).optional(),
    account: z.object({
      id: z.number(),
      name: z.string(),
    }),
    currency_code: z.string(),
    type: z.string(),
  })).describe("List of transactions"),
  summary: z.object({
    totalCount: z.number(),
    totalCredit: z.number(),
    totalDebit: z.number(),
    netAmount: z.number(),
  }).describe("Summary of transactions"),
});

export type GetTransactionsResponse = z.infer<typeof GetTransactionsResponseSchema>;

export async function getTransactionsLogic(
  params: GetTransactionsInput,
  context: RequestContext,
): Promise<GetTransactionsResponse> {
  logger.debug("Processing get transactions request", {
    ...context,
    toolInput: params,
  });

  const apiKey = params.apiKey || process.env.POCKETSMITH_API_KEY;
  const accessToken = params.accessToken || process.env.POCKETSMITH_ACCESS_TOKEN;

  const service = new PocketSmithService(apiKey, accessToken);
  
  // Get current user first
  const user = await service.getCurrentUser(context);
  
  // Get transactions
  const transactions = await service.getTransactions(user.id ?? 0, context, {
    startDate: params.startDate,
    endDate: params.endDate,
    search: params.search,
    type: params.type,
    limit: params.limit,
  });

  // Calculate summary
  let totalCredit = 0;
  let totalDebit = 0;
  
  const processedTransactions = transactions.map(transaction => {
    const amount = transaction.amount ?? 0;
    if (amount > 0) {
      totalCredit += amount;
    } else {
      totalDebit += Math.abs(amount);
    }
    
    return {
      id: transaction.id ?? 0,
      payee: transaction.payee ?? '',
      amount: transaction.amount ?? 0,
      date: transaction.date ?? '',
      note: transaction.note ?? null,
      category: transaction.category && transaction.category.id && transaction.category.title ? {
        id: transaction.category.id,
        title: transaction.category.title,
      } : undefined,
      account: {
        id: transaction.transaction_account?.id ?? 0,
        name: transaction.transaction_account?.name ?? '',
      },
      currency_code: transaction.transaction_account?.currency_code ?? '',
      type: transaction.type ?? '',
    };
  });

  const response: GetTransactionsResponse = {
    transactions: processedTransactions,
    summary: {
      totalCount: transactions.length,
      totalCredit,
      totalDebit,
      netAmount: totalCredit - totalDebit,
    },
  };

  logger.debug("Get transactions processed successfully", {
    ...context,
    transactionCount: transactions.length,
    totalCredit,
    totalDebit,
  });

  return response;
}

export const registerGetTransactionsTool = async (server: McpServer): Promise<void> => {
  const toolName = "get_transactions";
  const toolDescription = "Get transactions from PocketSmith with optional filtering by date, search term, and type";

  const registrationContext: RequestContext =
    requestContextService.createRequestContext({
      operation: "RegisterTool",
      toolName: toolName,
    });

  logger.info(`Registering tool: '${toolName}'`, registrationContext);

  await ErrorHandler.tryCatch(
    async () => {
      server.registerTool(
        toolName,
        {
          title: "Get PocketSmith Transactions",
          description: toolDescription,
          inputSchema: GetTransactionsInputSchema.shape,
          outputSchema: GetTransactionsResponseSchema.shape,
          annotations: {
            readOnlyHint: true,
            openWorldHint: false,
          },
        },
        async (params: GetTransactionsInput) => {
          const handlerContext: RequestContext =
            requestContextService.createRequestContext({
              parentRequestId: registrationContext.requestId,
              operation: "HandleToolRequest",
              toolName: toolName,
              input: params,
            });

          try {
            const result = await getTransactionsLogic(params, handlerContext);
            return {
              structuredContent: result,
              content: [
                { type: "text", text: JSON.stringify(result, null, 2) },
              ],
            };
          } catch (error) {
            const mcpError = ErrorHandler.handleError(error, {
              operation: "getTransactionsHandler",
              context: handlerContext,
              input: params,
            }) as McpError;

            return {
              isError: true,
              content: [{ type: "text", text: `Error: ${mcpError.message}` }],
              structuredContent: {
                code: mcpError.code,
                message: mcpError.message,
                details: mcpError.details,
              },
            };
          }
        },
      );

      logger.info(
        `Tool '${toolName}' registered successfully.`,
        registrationContext,
      );
    },
    {
      operation: `RegisteringTool_${toolName}`,
      context: registrationContext,
      errorCode: BaseErrorCode.INITIALIZATION_FAILED,
      critical: true,
    },
  );
};
