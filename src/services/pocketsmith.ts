/**
 * @fileoverview PocketSmith API service integration
 * This module provides a service wrapper around the PocketSmith TypeScript client
 * for use within the MCP server environment.
 */

import { createPocketSmithClient } from 'pocketsmith-ts';
import { logger, type RequestContext } from '../utils/index.js';
import { BaseErrorCode, McpError } from '../types-global/errors.js';

export class PocketSmithService {
  private client: ReturnType<typeof createPocketSmithClient>;

  private formatError(error: unknown): string {
    if (typeof error === 'string') return error;
    if (error && typeof error === 'object') {
      return JSON.stringify(error, null, 2);
    }
    return String(error);
  }
  
  constructor(apiKey?: string, accessToken?: string) {
    if (!apiKey && !accessToken) {
      throw new McpError(
        BaseErrorCode.INITIALIZATION_FAILED,
        'Either apiKey or accessToken must be provided'
      );
    }
    
    this.client = createPocketSmithClient({
      apiKey,
      accessToken,
    });
  }

  async getCurrentUser(context: RequestContext) {
    logger.debug('Fetching current user', context);
    const { data, error } = await this.client.GET('/me');
    
    if (error) {
      throw new McpError(
        BaseErrorCode.REQUEST_FAILED,
        `Failed to fetch user: ${error}`
      );
    }
    
    return data;
  }

  async getAccounts(userId: number, context: RequestContext) {
    logger.debug('Fetching user accounts', { ...context, userId });
    const { data, error } = await this.client.GET('/users/{id}/accounts', {
      params: { path: { id: userId } }
    });
    
    if (error) {
      throw new McpError(
        BaseErrorCode.REQUEST_FAILED,
        `Failed to fetch accounts: ${error}`
      );
    }
    
    return data;
  }

  async getTransactions(
    userId: number, 
    context: RequestContext,
    options?: {
      startDate?: string;
      endDate?: string;
      search?: string;
      type?: 'credit' | 'debit';
      limit?: number;
    }
  ) {
    logger.debug('Fetching transactions', { ...context, userId, options });
    const { data, error } = await this.client.GET('/users/{id}/transactions', {
      params: {
        path: { id: userId },
        query: {
          start_date: options?.startDate,
          end_date: options?.endDate,
          search: options?.search,
          type: options?.type,
          limit: options?.limit,
        }
      }
    });
    
    if (error) {
      throw new McpError(
        BaseErrorCode.REQUEST_FAILED,
        `Failed to fetch transactions: ${error}`
      );
    }
    
    return data;
  }

  async createTransaction(
    accountId: number,
    transaction: {
      payee: string;
      amount: number;
      date: string;
      category_id?: number;
      note?: string;
    },
    context: RequestContext
  ) {
    logger.debug('Creating transaction', { ...context, accountId, transaction });
    const { data, error } = await this.client.POST('/transaction_accounts/{id}/transactions', {
      params: { path: { id: accountId } },
      body: transaction
    });
    
    if (error) {
      throw new McpError(
        BaseErrorCode.REQUEST_FAILED,
        `Failed to create transaction: ${error}`
      );
    }
    
    return data;
  }

  async getTransaction(transactionId: number, context: RequestContext) {
    logger.debug('Fetching transaction', { ...context, transactionId });
    const { data, error } = await this.client.GET('/transactions/{id}', {
      params: { path: { id: transactionId } }
    });
    
    if (error) {
      throw new McpError(
        BaseErrorCode.REQUEST_FAILED,
        `Failed to fetch transaction: ${error}`
      );
    }
    
    return data;
  }

  async updateTransaction(
    transactionId: number,
    updates: {
      payee?: string;
      amount?: number;
      date?: string;
      category_id?: number;
      note?: string;
    },
    context: RequestContext
  ) {
    logger.debug('Updating transaction', { ...context, transactionId, updates });
    const { data, error } = await this.client.PUT('/transactions/{id}', {
      params: { path: { id: transactionId } },
      body: updates
    });
    
    if (error) {
      throw new McpError(
        BaseErrorCode.REQUEST_FAILED,
        `Failed to update transaction: ${error}`
      );
    }
    
    return data;
  }

  async deleteTransaction(transactionId: number, context: RequestContext) {
    logger.debug('Deleting transaction', { ...context, transactionId });
    const { data, error } = await this.client.DELETE('/transactions/{id}', {
      params: { path: { id: transactionId } }
    });
    
    if (error) {
      throw new McpError(
        BaseErrorCode.REQUEST_FAILED,
        `Failed to delete transaction: ${error}`
      );
    }
    
    return data;
  }

  async createCategory(
    userId: number,
    category: {
      title: string;
      colour?: string;
      parent_id?: number;
      is_bill?: boolean;
      is_transfer?: boolean;
    },
    context: RequestContext
  ) {
    logger.debug('Creating category', { ...context, userId, category });
    const { data, error } = await this.client.POST('/users/{id}/categories', {
      params: { path: { id: userId } },
      body: category
    });
    
    if (error) {
      throw new McpError(
        BaseErrorCode.REQUEST_FAILED,
        `Failed to create category: ${error}`
      );
    }
    
    return data;
  }

  async updateCategory(
    categoryId: number,
    updates: {
      title?: string;
      colour?: string;
      parent_id?: number;
      is_bill?: boolean;
      is_transfer?: boolean;
    },
    context: RequestContext
  ) {
    logger.debug('Updating category', { ...context, categoryId, updates });
    const { data, error } = await this.client.PUT('/categories/{id}', {
      params: { path: { id: categoryId } },
      body: updates
    });
    
    if (error) {
      throw new McpError(
        BaseErrorCode.REQUEST_FAILED,
        `Failed to update category: ${error}`
      );
    }
    
    return data;
  }

  async getCategories(userId: number, context: RequestContext) {
    logger.debug('Fetching categories', { ...context, userId });
    const { data, error } = await this.client.GET('/users/{id}/categories', {
      params: { path: { id: userId } }
    });
    
    if (error) {
      throw new McpError(
        BaseErrorCode.REQUEST_FAILED,
        `Failed to fetch categories: ${error}`
      );
    }
    
    return data;
  }

  async getBudgets(userId: number, context: RequestContext) {
    logger.debug('Fetching budgets', { ...context, userId });
    const { data, error } = await this.client.GET('/users/{id}/budget', {
      params: { path: { id: userId } }
    });
    
    if (error) {
      throw new McpError(
        BaseErrorCode.REQUEST_FAILED,
        `Failed to fetch budgets: ${error}`
      );
    }
    
    return data;
  }

  async getBudgetSummary(
    userId: number, 
    options: {
      period: 'weeks' | 'months' | 'years';
      interval: number;
      startDate: string;
      endDate: string;
    },
    context: RequestContext
  ) {
    logger.debug('Fetching budget summary', { ...context, userId, options });
    const { data, error } = await this.client.GET('/users/{id}/budget_summary', {
      params: { 
        path: { id: userId },
        query: {
          period: options.period,
          interval: options.interval,
          start_date: options.startDate,
          end_date: options.endDate,
        }
      }
    });
    
    if (error) {
      throw new McpError(
        BaseErrorCode.REQUEST_FAILED,
        `Failed to fetch budget summary: ${error}`
      );
    }
    
    return data;
  }

  async getAccountTransactions(
    accountId: number,
    context: RequestContext,
    options?: {
      startDate?: string;
      endDate?: string;
      search?: string;
      limit?: number;
    }
  ) {
    logger.debug('Fetching account transactions', { ...context, accountId, options });
    const { data, error } = await this.client.GET('/transaction_accounts/{id}/transactions', {
      params: {
        path: { id: accountId },
        query: options?.startDate || options?.endDate || options?.search || options?.limit ? {
          start_date: options?.startDate,
          end_date: options?.endDate,
          search: options?.search,
          limit: options?.limit,
        } : undefined
      }
    });
    
    if (error) {
      throw new McpError(
        BaseErrorCode.REQUEST_FAILED,
        `Failed to fetch account transactions: ${this.formatError(error)}`
      );
    }
    
    return data;
  }

  async getCategoryTransactions(
    categoryIds: number | number[],
    context: RequestContext,
    options?: {
      startDate?: string;
      endDate?: string;
      page?: number;
    }
  ) {
    const categoryIdString = Array.isArray(categoryIds) ? categoryIds.join(',') : String(categoryIds);
    logger.debug('Fetching category transactions', { ...context, categoryIds, options });
    const { data, error } = await this.client.GET('/categories/{id}/transactions', {
      params: {
        path: { id: categoryIdString },
        query: options?.startDate || options?.endDate || options?.page ? {
          start_date: options?.startDate,
          end_date: options?.endDate,
          page: options?.page,
        } : undefined
      }
    });
    
    if (error) {
      throw new McpError(
        BaseErrorCode.REQUEST_FAILED,
        `Failed to fetch category transactions: ${error}`
      );
    }
    
    return data;
  }

  async getTransactionAttachments(transactionId: number, context: RequestContext) {
    logger.debug('Fetching transaction attachments', { ...context, transactionId });
    const { data, error } = await this.client.GET('/transactions/{id}/attachments', {
      params: { path: { id: transactionId } }
    });
    
    if (error) {
      throw new McpError(
        BaseErrorCode.REQUEST_FAILED,
        `Failed to fetch transaction attachments: ${error}`
      );
    }
    
    return data;
  }

  async getUserAttachments(userId: number, context: RequestContext) {
    logger.debug('Fetching user attachments', { ...context, userId });
    const { data, error } = await this.client.GET('/users/{id}/attachments', {
      params: { path: { id: userId } }
    });
    
    if (error) {
      throw new McpError(
        BaseErrorCode.REQUEST_FAILED,
        `Failed to fetch user attachments: ${error}`
      );
    }
    
    return data;
  }

  async createUserAttachment(
    userId: number,
    attachment: {
      title?: string;
      file_name?: string;
      file_data?: string;
    },
    context: RequestContext
  ) {
    logger.debug('Creating user attachment', { ...context, userId, attachment: { ...attachment, file_data: attachment.file_data ? '[REDACTED]' : undefined } });
    const { data, error } = await this.client.POST('/users/{id}/attachments', {
      params: { path: { id: userId } },
      body: attachment
    });
    
    if (error) {
      throw new McpError(
        BaseErrorCode.REQUEST_FAILED,
        `Failed to create user attachment: ${error}`
      );
    }
    
    return data;
  }

  async assignAttachmentToTransaction(
    transactionId: number,
    attachmentId: number,
    context: RequestContext
  ) {
    logger.debug('Assigning attachment to transaction', { ...context, transactionId, attachmentId });
    const { data, error } = await this.client.POST('/transactions/{id}/attachments', {
      params: { path: { id: transactionId } },
      body: { attachment_id: attachmentId }
    });
    
    if (error) {
      throw new McpError(
        BaseErrorCode.REQUEST_FAILED,
        `Failed to assign attachment to transaction: ${error}`
      );
    }
    
    return data;
  }

  async getRecurringEvents(
    userId: number, 
    startDate: string, 
    endDate: string, 
    context: RequestContext
  ) {
    logger.debug('Fetching recurring events', { ...context, userId, startDate, endDate });
    const { data, error } = await this.client.GET('/users/{id}/events', {
      params: { 
        path: { id: userId },
        query: { start_date: startDate, end_date: endDate }
      }
    });
    
    if (error) {
      throw new McpError(
        BaseErrorCode.REQUEST_FAILED,
        `Failed to fetch recurring events: ${error}`
      );
    }
    
    return data;
  }

  async getCategoryRules(userId: number, context: RequestContext) {
    logger.debug('Fetching category rules', { ...context, userId });
    const { data, error } = await this.client.GET('/users/{id}/category_rules', {
      params: { path: { id: userId } }
    });
    
    if (error) {
      throw new McpError(
        BaseErrorCode.REQUEST_FAILED,
        `Failed to fetch category rules: ${error}`
      );
    }
    
    return data;
  }

  async createCategoryRule(
    categoryId: number,
    rule: {
      payee_matches: string;
      apply_to_uncategorised?: boolean;
      apply_to_all?: boolean;
    },
    context: RequestContext
  ) {
    logger.debug('Creating category rule', { ...context, categoryId, rule });
    const { data, error } = await this.client.POST('/categories/{id}/category_rules', {
      params: { path: { id: categoryId } },
      body: rule
    });
    
    if (error) {
      throw new McpError(
        BaseErrorCode.REQUEST_FAILED,
        `Failed to create category rule: ${error}`
      );
    }
    
    return data;
  }

  async getInstitutions(userId: number, context: RequestContext) {
    logger.debug('Fetching institutions', { ...context, userId });
    const { data, error } = await this.client.GET('/users/{id}/institutions', {
      params: { path: { id: userId } }
    });
    
    if (error) {
      throw new McpError(
        BaseErrorCode.REQUEST_FAILED,
        `Failed to fetch institutions: ${error}`
      );
    }
    
    return data;
  }

  async getTransactionAccounts(userId: number, context: RequestContext) {
    logger.debug('Fetching transaction accounts', { ...context, userId });
    const { data, error } = await this.client.GET('/users/{id}/transaction_accounts', {
      params: { path: { id: userId } }
    });
    
    if (error) {
      throw new McpError(
        BaseErrorCode.REQUEST_FAILED,
        `Failed to fetch transaction accounts: ${error}`
      );
    }
    
    return data;
  }

  async getCurrencies(context: RequestContext) {
    logger.debug('Fetching currencies', context);
    const { data, error } = await this.client.GET('/currencies');
    
    if (error) {
      throw new McpError(
        BaseErrorCode.REQUEST_FAILED,
        `Failed to fetch currencies: ${error}`
      );
    }
    
    return data;
  }
}
