# PocketSmith MCP Server - Agent Guide

This file contains essential information for AI agents working on this PocketSmith MCP (Model Context Protocol) server project.

## Project Overview

**Purpose**: A comprehensive MCP server providing AI agents with tools to manage budgets, transactions, categories, and financial data via the PocketSmith API.

**Technology Stack**: TypeScript, Node.js, Zod validation, PocketSmith API client

**Template Base**: Built from [cyanheads/mcp-ts-template](https://github.com/cyanheads/mcp-ts-template)

## Quick Commands

### Development
```bash
npm run build          # Compile TypeScript and make executable
npm run start:stdio    # Start server in stdio mode (for Claude Desktop)
npm run start:http     # Start server in HTTP mode
npm run lint           # Run ESLint
npm run lint:fix       # Fix auto-fixable linting issues
npm run format         # Format code with Prettier
```

### Testing & Debugging
```bash
npm run inspector      # Launch MCP Inspector for testing tools
npm run start          # Start built server
npm run tree           # Generate project structure tree
```

## Project Structure

```
src/
├── index.ts                    # Entry point
├── config/                     # Environment and configuration
├── mcp-server/
│   ├── server.ts              # Main server setup and tool registration
│   ├── tools/pocketsmith/     # All PocketSmith MCP tools (24 tools)
│   │   ├── index.ts           # Tool exports
│   │   ├── getAccounts.ts     # Account management
│   │   ├── getTransactions.ts # Transaction operations
│   │   ├── createTransaction.ts
│   │   ├── updateTransaction.ts
│   │   ├── deleteTransaction.ts
│   │   ├── getCategories.ts   # Category management
│   │   ├── createCategory.ts
│   │   ├── updateCategory.ts
│   │   ├── getCategoryRules.ts # Auto-categorization
│   │   ├── createCategoryRule.ts
│   │   ├── getBudgets.ts      # Budget analysis
│   │   ├── getBudgetSummary.ts
│   │   ├── getRecurringEvents.ts # Scheduled transactions
│   │   ├── getAccountTransactions.ts
│   │   ├── getTransactionAttachments.ts # Receipt management
│   │   ├── getUserAttachments.ts
│   │   ├── createTransactionAttachment.ts
│   │   ├── getCurrencies.ts   # System info
│   │   ├── getInstitutions.ts
│   │   ├── getTransactionAccounts.ts
│   │   └── getUserSummary.ts  # Financial overview
│   └── transports/            # Stdio and HTTP transport
├── services/
│   └── pocketsmith.ts         # PocketSmith API service wrapper
├── types-global/              # Shared TypeScript types
└── utils/                     # Logging, error handling, security
```

## Tool Development Pattern

Each MCP tool follows this consistent pattern:

### 1. Tool Structure
```typescript
// toolName.ts
export const ToolNameInputSchema = z.object({...});
export const ToolNameResponseSchema = z.object({...});
export async function toolNameLogic(params, context): Promise<Response> {...}
export const registerToolNameTool = async (server: McpServer): Promise<void> {...}
```

### 2. Registration Process
1. Create tool file in `src/mcp-server/tools/pocketsmith/`
2. Export registration function from `src/mcp-server/tools/pocketsmith/index.ts`
3. Import and register in `src/mcp-server/server.ts`

### 3. Error Handling
- Use `McpError` with `BaseErrorCode` enum values
- Always provide defensive programming for optional API fields
- Use `logger.debug()` for detailed logging
- Redact sensitive data in logs (API keys, tokens)

## Code Style & Conventions

### TypeScript
- **Strict typing**: No `any` types (use `Record<string, unknown>` instead)
- **Zod validation**: All inputs/outputs must have Zod schemas
- **Defensive programming**: Handle optional API fields with `??` operators
- **Type assertions**: Use specific types like `{ currency_code?: string }` instead of `any`

### Naming Conventions
- **Files**: camelCase (e.g., `getTransactions.ts`)
- **Functions**: camelCase (e.g., `getTransactionsLogic`)
- **Tool names**: snake_case (e.g., `"get_transactions"`)
- **Schema exports**: PascalCase (e.g., `GetTransactionsInputSchema`)

### Tool Implementation
- **Input validation**: Always use Zod schemas
- **API service**: Use `PocketSmithService` class methods
- **Response structure**: Return both `structuredContent` and `content` arrays
- **Context logging**: Pass `RequestContext` through all operations

## PocketSmith API Integration

### Authentication
```typescript
// In service methods
const apiKey = params.apiKey || process.env.POCKETSMITH_API_KEY;
const accessToken = params.accessToken || process.env.POCKETSMITH_ACCESS_TOKEN;
const service = new PocketSmithService(apiKey, accessToken);
```

### Common API Patterns
- Most endpoints require `userId` (get from current user first)
- Transaction endpoints often have optional date ranges, search, limits
- Budget endpoints require specific period parameters
- Category endpoints support hierarchical relationships
- Attachment endpoints work with base64 file data

### API Response Handling
```typescript
// Always handle optional fields defensively
const processedData = apiResponse.map(item => ({
  id: item.id ?? 0,
  name: item.name ?? '',
  amount: item.amount ?? 0,
  // Use optional chaining for nested objects
  category: item.category ? {
    id: item.category.id ?? 0,
    title: item.category.title ?? '',
  } : undefined,
}));
```

## Environment Variables

Required for operation:
```bash
POCKETSMITH_API_KEY=your_api_key_here          # For personal use
# OR
POCKETSMITH_ACCESS_TOKEN=your_oauth_token_here # For OAuth apps

# Optional
MCP_LOG_LEVEL=debug                            # Logging level
MCP_TRANSPORT_TYPE=stdio                       # Transport type
```

## Testing

### MCP Inspector
```bash
npm run inspector
# Opens web interface at http://localhost:3001
# Test individual tools with sample inputs
```

### Claude Desktop Integration
```json
{
  "mcpServers": {
    "pocketsmith": {
      "command": "node",
      "args": ["/path/to/pocketsmith-mcp/dist/index.js"],
      "env": {
        "POCKETSMITH_API_KEY": "your_key"
      }
    }
  }
}
```

## Adding New Tools

### Step-by-step Process
1. **Check API documentation**: Review PocketSmith API endpoints
2. **Create service method**: Add to `src/services/pocketsmith.ts`
3. **Create tool file**: Follow existing pattern in `src/mcp-server/tools/pocketsmith/`
4. **Define schemas**: Input and output Zod schemas
5. **Implement logic**: Handle API calls with error handling
6. **Register tool**: Export from index, import in server.ts
7. **Test build**: Run `npm run build` to verify TypeScript
8. **Test functionality**: Use MCP inspector or Claude Desktop

### Example Service Method
```typescript
async newServiceMethod(
  userId: number,
  params: { optional?: string },
  context: RequestContext
) {
  logger.debug('Calling new service method', { ...context, userId, params });
  const { data, error } = await this.client.GET('/endpoint/{id}', {
    params: { 
      path: { id: userId },
      query: params.optional ? { param: params.optional } : undefined
    }
  });
  
  if (error) {
    throw new McpError(BaseErrorCode.REQUEST_FAILED, `Failed: ${error}`);
  }
  
  return data;
}
```

## Troubleshooting

### Common Issues
1. **Build fails**: Check TypeScript errors, fix type mismatches
2. **Tool not found**: Verify registration in server.ts
3. **API errors**: Check API key validity and endpoint URLs
4. **Claude connection**: Verify config file path and restart Claude

### Debug Commands
```bash
npm run build          # Check compilation errors
npm run lint           # Check code style issues
npm run inspector      # Test tools interactively
```

### Logging
- Use `logger.debug()` for detailed information
- Include context: `{ ...context, additionalData }`
- Redact sensitive data: `{ ...params, apiKey: "[REDACTED]" }`

## Performance Considerations

### Rate Limiting
- PocketSmith API has rate limits
- Service layer handles errors gracefully
- Consider caching for frequently accessed data

### Error Recovery
- All tools have comprehensive error handling
- Failed requests return structured error responses
- Transient errors suggest retry strategies

## Security Notes

### API Key Handling
- Never log API keys or tokens
- Use environment variables or secure parameter passing
- Validate all inputs with Zod schemas
- Sanitize user inputs to prevent injection

### Data Privacy
- Transaction data is sensitive financial information
- Log minimal necessary information
- Respect user privacy in error messages

## Dependencies

### Core Dependencies
- `@modelcontextprotocol/sdk`: MCP protocol implementation
- `pocketsmith-ts`: PocketSmith API client (local dependency)
- `zod`: Runtime type validation
- `winston`: Logging

### Development Dependencies
- `typescript`: Type checking and compilation
- `eslint`: Code linting
- `prettier`: Code formatting

## Future Enhancements

### Potential Additions
- Transaction batch operations
- Advanced budget forecasting
- Category rule templates
- Transaction import/export
- Real-time webhook support
- Multi-currency conversion tools

### Architecture Improvements
- Caching layer for frequently accessed data
- Background job processing for large operations
- GraphQL endpoint for complex queries
- WebSocket support for real-time updates

---

**Last Updated**: December 2024  
**Total Tools**: 24 MCP tools for comprehensive PocketSmith integration  
**Status**: Production ready, fully typed, comprehensive error handling
