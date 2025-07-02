# Reddit MCP Server

This MCP server allows Clients to interact with Reddit using OAuth2 authentication, enabling read-only access to search for posts within subreddits.

## Features

- **Search posts**: Search for posts within specific subreddits with various sorting options (relevance, hot, top, new, comments)
- **OAuth2 authentication**: Secure authentication using Reddit's OAuth2 client credentials flow
- **Read-only access**: Safe, read-only access to Reddit data without requiring user credentials

## Quick Start

1. Create a Reddit application to get your API credentials:
   - Go to https://www.reddit.com/prefs/apps
   - Click "Create App" or "Create Another App"
   - Choose "script" as the app type
   - Note down your client ID and client secret

2. Add this configuration to your Claude Desktop config file:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`  
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "reddit-mcp": {
      "command": "npx",
      "args": ["-y", "@enisze/reddit-mcp"],
      "env": {
        "REDDIT_CLIENT_ID": "your_client_id_here",
        "REDDIT_CLIENT_SECRET": "your_client_secret_here",
        "REDDIT_USER_AGENT": "reddit-mcp-server/1.0.0"
      }
    }
  }
}
```

3. Restart Claude Desktop

That's it! Claude can now search Reddit through the `search_posts` tool.

## Example Usage

Try asking Claude:
- "Can you search for posts about 'artificial intelligence' in the MachineLearning subreddit?"
- "Search for the top 10 posts about 'Claude AI' in the artificial subreddit"
- "Find recent discussions about 'programming best practices' in the programming subreddit"

## Environment Variables

- `REDDIT_CLIENT_ID`: Your Reddit app's client ID
- `REDDIT_CLIENT_SECRET`: Your Reddit app's client secret  
- `REDDIT_USER_AGENT`: User agent string (optional, defaults to "reddit-mcp-server/1.0.0")

## Development

If you want to contribute or run from source:

1. Clone the repository:
```bash
git clone <repository-url>
cd reddit-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build:
```bash
npm run build
```

4. Run:
```bash
npm start
```

5. Test:
```bash
# Run unit tests (no API credentials needed)
npm test

# Run API integration tests (requires Reddit credentials)
npm run test:api
```

### Running Evaluations

To test the functionality of the Reddit MCP server:

```bash
npm run eval
```

This will run a series of evaluations to ensure all tools are working correctly.

## Running Evals

The evals package loads an MCP client that then runs the index.ts file, so there is no need to rebuild between tests. You can load environment variables by prefixing the npx command. Full documentation can be found [here](https://www.mcpevals.io/docs).

```bash
OPENAI_API_KEY=your-key npx mcp-eval src/evals/evals.ts src/index.ts
```

## Docker Support

You can also run this MCP server using Docker:

```bash
# Build the Docker image
docker build -t reddit-mcp .

# Run the container with environment variables
docker run -e REDDIT_CLIENT_ID=your_client_id \
           -e REDDIT_CLIENT_SECRET=your_client_secret \
           reddit-mcp
```

## API Documentation


### search_posts

Searches for posts in a Reddit subreddit using OAuth2 authentication.

**Parameters:**
- `query` (string, required): Search query
- `subreddit` (string, required): The subreddit name (without r/ prefix)
- `count` (number, optional): Number of posts to return (1-100, default: 25)
- `sort` (string, optional): Sort order - 'relevance', 'hot', 'top', 'new', 'comments' (default: 'relevance')

## Troubleshooting

### Authentication Issues
- Make sure your Reddit client ID and secret are correct
- Ensure your Reddit app is configured as a "script" type
- Check that your user agent string is descriptive and unique

### Rate Limiting
- The server implements basic rate limiting (2 seconds between requests)
- Reddit has its own rate limits - if you hit them, wait before retrying

### Common Errors
- "Subreddit not found": Check the subreddit name spelling
- "OAuth2 authentication failed": Verify your Reddit app credentials
- "Invalid credentials": Make sure your client ID and secret are correct

## Testing

The project includes comprehensive tests to verify functionality:

### Unit Tests
Run basic functionality tests without requiring Reddit API credentials:
```bash
npm test
```

These tests verify:
- Response formatting
- Type definitions  
- Data structure handling
- Error handling logic

### API Integration Tests
Test actual Reddit API functionality (requires credentials):
```bash
npm run test:api
```

Set up your credentials in `.env` first (copy from `.env.example`).

These tests verify:
- OAuth2 authentication flow
- Search functionality
- API response handling
- Error handling for various scenarios

See `TEST.md` for detailed testing instructions.

## License

MIT
