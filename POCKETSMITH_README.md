# PocketSmith MCP Server

*Generated from [cyanheads/mcp-ts-template](https://github.com/cyanheads/mcp-ts-template)*

An MCP (Model Context Protocol) server for managing budgets via the PocketSmith API. This server provides tools for AI agents to interact with PocketSmith accounts, transactions, categories, and budgets.

Built on the [cyanheads/mcp-ts-template](https://github.com/cyanheads/mcp-ts-template), this server follows a modular architecture with robust error handling, logging, and security features.

## Features

- 🏦 **Account Management** - View account balances and information
- 💰 **Transaction Operations** - Search, filter, and create transactions
- 📊 **Category Management** - Access spending categories and hierarchies
- 📈 **Budget Analysis** - Track budget performance and spending patterns
- 📋 **Financial Summary** - Get comprehensive financial overview

## Available Tools

### Account Management

#### `get_accounts`
Get user's PocketSmith accounts with current balances and summary information.

#### `get_user_summary`
Comprehensive financial overview including:
- Total account balances and net worth
- Recent transaction history
- Budget performance highlights
- Category breakdown

### Transaction Management

#### `get_transactions`
Search and filter transactions with support for:
- Date range filtering
- Payee/note search
- Transaction type filtering (credit/debit)
- Limit control

#### `get_transaction`
Get detailed information about a specific transaction by ID, including:
- Full transaction details
- Category and account information
- Creation and update timestamps

#### `create_transaction`
Create new transactions with:
- Payee and amount
- Date and category assignment
- Optional notes
- Account specification

#### `update_transaction`
Modify existing transactions:
- Change payee, amount, or date
- Reassign to different categories
- Update notes and details
- Track what changed

#### `delete_transaction`
Remove transactions with:
- Confirmation requirement
- Pre-deletion details capture
- Permanent deletion warning

### Category Management

#### `get_categories`
View spending categories including:
- Category hierarchy (parent/child relationships)
- Bill and transfer category flags
- Category colors and metadata

#### `create_category`
Add new spending categories with:
- Custom names and colors
- Parent/child relationships
- Bill and transfer type flags
- Automatic validation

#### `update_category`
Modify existing categories:
- Rename categories
- Change colors
- Move to different parents
- Update bill/transfer flags

### Budget Analysis

#### `get_budgets`
Analyze budget performance with:
- Budget vs actual spending comparison
- Category-level budget tracking
- Over/under budget identification
- Budget variance calculations

## Setup

### Prerequisites

- Node.js 20+
- PocketSmith account
- PocketSmith API key or OAuth token

### Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables by copying `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

4. Add your PocketSmith credentials to `.env`:
   ```bash
   # For personal use - get from https://my.pocketsmith.com/api_keys
   POCKETSMITH_API_KEY=your_api_key_here
   
   # OR for OAuth apps
   POCKETSMITH_ACCESS_TOKEN=your_oauth_token_here
   ```

### Building

```bash
npm run build
```

### Running

#### Stdio Transport (for MCP clients like Claude Desktop)

```bash
npm run start:stdio
```

#### HTTP Transport (for web applications)

```bash
npm run start:http
```

## Authentication

### API Key (Recommended for Personal Use)

1. Log into your PocketSmith account
2. Go to Settings → Security & Integrations
3. Create a new developer key
4. Add it to your `.env` file as `POCKETSMITH_API_KEY`

### OAuth2 (For Applications)

For applications that other users will use:

1. Contact PocketSmith at api@pocketsmith.com to register your app
2. Implement OAuth2 flow to get access tokens
3. Pass tokens via the `accessToken` parameter in tool calls

## Usage Examples

### Get Account Summary

```typescript
// Tool call
{
  "name": "get_accounts"
}

// Response includes user info, accounts with balances, and total balance
```

### Search Recent Transactions

```typescript
// Tool call
{
  "name": "get_transactions",
  "arguments": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "search": "coffee",
    "limit": 20
  }
}
```

### Create a New Transaction

```typescript
// Tool call
{
  "name": "create_transaction",
  "arguments": {
    "accountId": 123456,
    "payee": "Coffee Shop",
    "amount": -4.50,
    "date": "2024-01-15",
    "categoryId": 789,
    "note": "Morning coffee"
  }
}
```

### Update Transaction Category

```typescript
// Tool call - Fix incorrect categorization
{
  "name": "update_transaction", 
  "arguments": {
    "transactionId": 987654,
    "categoryId": 456,
    "note": "Updated: Should be food, not transport"
  }
}
```

### Create New Category

```typescript
// Tool call - Add category for a new spending type
{
  "name": "create_category",
  "arguments": {
    "title": "Pet Expenses",
    "colour": "#FF6B6B",
    "parentId": 123
  }
}
```

### Conversational Spending Recording

```typescript
// Example conversation flow:
// 1. "I just spent $12.50 at Whole Foods"
{
  "name": "get_accounts"  // Find checking account
}

{
  "name": "get_categories"  // Find or create "Groceries" category
}

{
  "name": "create_transaction",
  "arguments": {
    "accountId": 12345,
    "payee": "Whole Foods", 
    "amount": -12.50,
    "date": "2024-01-15",
    "categoryId": 678
  }
}

// 2. "Actually that should be $15.50, I forgot the tax"
{
  "name": "update_transaction",
  "arguments": {
    "transactionId": 999888,
    "amount": -15.50,
    "note": "Corrected amount including tax"
  }
}
```

### Get Budget Analysis

```typescript
// Tool call
{
  "name": "get_budgets"
}

// Response includes budget vs actual spending by category
```

### Get Financial Summary

```typescript
// Tool call
{
  "name": "get_user_summary",
  "arguments": {
    "includeRecentTransactions": true,
    "transactionLimit": 10
  }
}
```

## MCP Client Configuration

To use with Claude Desktop or other MCP clients, add this to your MCP configuration:

```json
{
  "mcpServers": {
    "pocketsmith": {
      "command": "node",
      "args": ["/path/to/pocketsmith-mcp/dist/index.js"],
      "env": {
        "POCKETSMITH_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## Development

### Project Structure

```
src/
├── mcp-server/
│   ├── tools/pocketsmith/     # PocketSmith tool implementations
│   └── server.ts              # Server setup and registration
├── services/
│   └── pocketsmith.ts         # PocketSmith API service wrapper
└── utils/                     # Logging, error handling, etc.
```

### Adding New Tools

1. Create a new tool file in `src/mcp-server/tools/pocketsmith/`
2. Follow the existing pattern with input/output schemas and logic functions
3. Register the tool in `src/mcp-server/tools/pocketsmith/index.ts`
4. Add registration call in `src/mcp-server/server.ts`

### Testing

```bash
# Test with MCP Inspector
npm run inspector

# Test specific tool
npm run start:stdio
# Then use MCP client to call tools
```

## Error Handling

The server includes comprehensive error handling:

- **Authentication Errors**: Invalid API keys or expired tokens
- **API Rate Limits**: PocketSmith API rate limit handling
- **Validation Errors**: Input parameter validation
- **Network Errors**: Connection and timeout handling

All errors are logged with context and returned in a structured format.

## Rate Limits

PocketSmith API has rate limits. The server handles these gracefully and includes appropriate error messages when limits are exceeded.

## Security

- API keys and tokens are never logged
- All input is validated using Zod schemas
- Error messages don't expose sensitive information
- Follows security best practices from the MCP template

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License

## Links

- [PocketSmith API Documentation](https://developers.pocketsmith.com/)
- [PocketSmith TypeScript Client](https://github.com/joho/pocketsmith-ts)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP TypeScript Template](https://github.com/cyanheads/mcp-ts-template)

---

*Built with ❤️ and the [Model Context Protocol](https://modelcontextprotocol.io/)*
