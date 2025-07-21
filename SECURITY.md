# Security Considerations for PocketSmith MCP Server

## ⚠️ CRITICAL SECURITY WARNINGS

**This server provides full access to your PocketSmith financial data including:**
- All account balances and transaction history
- Ability to create, modify, and delete transactions
- Access to budgets, categories, and financial attachments
- Complete financial profile and forecasting data

**Treat your PocketSmith API key like your banking password.**

## 🚨 Threat Model

### High-Risk Scenarios
1. **API Key Compromise**: If your API key is exposed, attackers gain complete access to your financial data
2. **MCP Client Compromise**: Malicious or compromised MCP clients can manipulate your financial records
3. **Man-in-the-Middle Attacks**: Unsecured HTTP transport can expose sensitive data
4. **Injection Attacks**: Malicious input through MCP calls could corrupt financial data

### Attack Vectors
- Environment variable exposure in process lists
- Log file leakage of API keys
- Memory dumps containing sensitive data
- Malicious MCP client applications
- Network interception (HTTP mode)

## 🔒 Security Best Practices

### API Key Security
- **Store Securely**: Only use environment variables, never hardcode
- **Rotate Regularly**: Change your PocketSmith API key every 90 days
- **Monitor Access**: Check PocketSmith logs for unauthorized API usage
- **Scope Limitation**: Use read-only keys when possible (if PocketSmith supports it)

### Transport Security
- **Prefer stdio**: Use stdio transport for single-user local scenarios
- **HTTPS Only**: If using HTTP transport, ensure TLS encryption
- **Authentication**: Always enable JWT/OAuth for HTTP mode

### MCP Client Security
- **Trust Verification**: Only use trusted MCP clients like official Claude Desktop
- **Confirmation Prompts**: Enable user confirmation for destructive operations
- **Auto-Approval**: Never add financial operations to auto-approve lists

### Environment Security
- **File Permissions**: Ensure .env files have restrictive permissions (600)
- **Process Isolation**: Run the server with minimal privileges
- **Network Isolation**: Use firewall rules to restrict access if using HTTP mode

## 🔍 Data Protection

### What This Server Can Access
- Complete transaction history across all connected accounts
- Real-time account balances and financial positions
- Budget data and spending analytics
- Personal financial categories and rules
- Attached receipts and financial documents

### Data Retention
- This server does not store financial data locally
- All data is retrieved in real-time from PocketSmith
- Logs may contain transaction references - ensure log security

## 🚨 Incident Response

### If You Suspect Compromise
1. **Immediately revoke** your PocketSmith API key
2. **Check** your PocketSmith account for unauthorized changes
3. **Review** recent transactions and account modifications
4. **Generate** a new API key and update your configuration
5. **Monitor** your accounts for unusual activity

### Reporting Security Issues
If you discover a security vulnerability in this MCP server:
- **DO NOT** open a public GitHub issue
- Email the repository maintainer privately
- Include reproduction steps and potential impact assessment

## ⚙️ Secure Configuration

### Recommended Environment Setup
```bash
# Secure file permissions
chmod 600 .env

# Example .env content
POCKETSMITH_API_KEY=your_api_key_here
MCP_TRANSPORT_TYPE=stdio  # Preferred for security
LOG_LEVEL=info            # Avoid debug in production
```

### Claude Desktop Configuration
```json
{
  "mcpServers": {
    "pocketsmith": {
      "command": "node",
      "args": ["/path/to/pocketsmith-mcp/dist/index.js"],
      "env": {
        "POCKETSMITH_API_KEY": "your_api_key_here"
      },
      "autoApprove": []  // NEVER auto-approve financial operations
    }
  }
}
```

## 📋 Security Checklist

Before using this MCP server:

- [ ] Read and understand all security warnings above
- [ ] Secure your PocketSmith API key in environment variables
- [ ] Configure your MCP client to require confirmation for modifications
- [ ] Test with non-critical data first
- [ ] Set up account monitoring and alerts
- [ ] Plan your API key rotation schedule

## 🔗 Additional Resources

- [PocketSmith Security Documentation](https://learn.pocketsmith.com/article/67-data-and-security)
- [Model Context Protocol Security Best Practices](https://modelcontextprotocol.io/docs/tools/security)
- [MCP Authentication Specification](https://modelcontextprotocol.io/docs/concepts/authentication)
