# Reddit MCP Server

This MCP server allows Clients to interact with Reddit, enabling posting comments to subreddits and searching for posts.

## Features

- **Post comments**: Post comments to any subreddit
- **Search posts**: Search for posts within specific subreddits with various sorting options

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
      "args": ["-y", "@enescinar/reddit-mcp"],
      "env": {
        "REDDIT_CLIENT_ID": "your_client_id_here",
        "REDDIT_CLIENT_SECRET": "your_client_secret_here",
        "REDDIT_USERNAME": "your_reddit_username",
        "REDDIT_PASSWORD": "your_reddit_password",
        "REDDIT_USER_AGENT": "reddit-mcp-server/1.0.0"
      }
    }
  }
}
```

3. Restart Claude Desktop

That's it! Claude can now interact with Reddit through two tools:

- `post_comment`: Post a comment to a subreddit
- `search_posts`: Search for posts in a subreddit

## Example Usage

Try asking Claude:
- "Can you post a comment saying 'Great post!' to the programming subreddit?"
- "Can you search for posts about 'artificial intelligence' in the MachineLearning subreddit?"
- "Search for the top 10 posts about 'Claude AI' in the artificial subreddit"

## Environment Variables

- `REDDIT_CLIENT_ID`: Your Reddit app's client ID
- `REDDIT_CLIENT_SECRET`: Your Reddit app's client secret  
- `REDDIT_USERNAME`: Your Reddit username
- `REDDIT_PASSWORD`: Your Reddit password
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

### Running Evaluations

To test the functionality of the Reddit MCP server:

```bash
npm run eval
```

This will run a series of evaluations to ensure all tools are working correctly.

## Docker Support

You can also run the Reddit MCP server using Docker:

1. Build the Docker image:
```bash
docker build -t reddit-mcp .
```

2. Run the container:
```bash
docker run -e REDDIT_CLIENT_ID=your_client_id \
           -e REDDIT_CLIENT_SECRET=your_client_secret \
           -e REDDIT_USERNAME=your_username \
           -e REDDIT_PASSWORD=your_password \
           -e REDDIT_USER_AGENT=reddit-mcp:v1.0.0 \
           -p 3000:3000 \
           reddit-mcp
```

## API Documentation

### post_comment

Posts a comment to a Reddit subreddit.

**Parameters:**
- `text` (string, required): The content of your comment (max 10,000 characters)
- `subreddit` (string, required): The subreddit name (without r/ prefix)
- `parent_id` (string, optional): ID of the post or comment to reply to

### search_posts

Searches for posts in a Reddit subreddit.

**Parameters:**
- `query` (string, required): Search query
- `subreddit` (string, required): The subreddit name (without r/ prefix)
- `count` (number, optional): Number of posts to return (1-100, default: 25)
- `sort` (string, optional): Sort order - 'relevance', 'hot', 'top', 'new', 'comments' (default: 'relevance')

## Troubleshooting

### Authentication Issues
- Make sure your Reddit credentials are correct
- Ensure your Reddit app is configured as a "script" type
- Check that your user agent string is descriptive and unique

### Rate Limiting
- The server implements basic rate limiting (2 seconds between requests)
- Reddit has its own rate limits - if you hit them, wait before retrying

### Common Errors
- "Subreddit not found": Check the subreddit name spelling
- "Permission denied": Make sure the subreddit allows posting/commenting
- "Invalid credentials": Verify your Reddit app credentials

## License

MIT
