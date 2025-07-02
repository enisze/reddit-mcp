#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ErrorCode,
    ListToolsRequestSchema,
    McpError,
    TextContent,
    Tool
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { ResponseFormatter } from './formatter.js';
import { RedditClient } from './reddit-api.js';
import {
    Config, ConfigSchema,
    RedditError,
    SearchPostsSchema
} from './types.js';

export class RedditServer {
  private server: Server;
  private client: RedditClient;

  constructor(config: Config) {
    // Validate config
    const result = ConfigSchema.safeParse(config);
    if (!result.success) {
      throw new Error(`Invalid configuration: ${result.error.message}`);
    }

    this.client = new RedditClient(config);
    this.server = new Server({
      name: 'reddit-mcp',
      version: '1.0.0'
    }, {
      capabilities: {
        tools: {}
      }
    });

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Error handler
    this.server.onerror = (error) => {
      console.error('[MCP Error]:', error);
    };

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.error('Shutting down server...');
      await this.server.close();
      process.exit(0);
    });

    // Register tool handlers
    this.setupToolHandlers();
  }

  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'search_posts',
          description: 'Search for posts in a Reddit subreddit',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query'
              },
              subreddit: {
                type: 'string',
                description: 'The subreddit name (without r/ prefix)',
                pattern: '^[A-Za-z0-9_]+$'
              },
              count: {
                type: 'number',
                description: 'Number of posts to return (1-100)',
                minimum: 1,
                maximum: 100,
                default: 25
              },
              sort: {
                type: 'string',
                description: 'Sort order for search results',
                enum: ['relevance', 'hot', 'top', 'new', 'comments'],
                default: 'relevance'
              }
            },
            required: ['query', 'subreddit']
          }
        } as Tool
      ]
    }));

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      console.error(`Tool called: ${name}`, args);

      try {
        switch (name) {
          case 'search_posts':
            return await this.handleSearchPosts(args);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        return this.handleError(error);
      }
    });
  }

  private async handleSearchPosts(args: unknown) {
    const result = SearchPostsSchema.safeParse(args);
    if (!result.success) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid parameters: ${result.error.message}`
      );
    }

    const { posts, users } = await this.client.searchPosts(
      result.data.query,
      result.data.subreddit,
      result.data.count,
      result.data.sort
    );

    const formattedResponse = ResponseFormatter.formatSearchResponse(
      result.data.query,
      result.data.subreddit,
      posts,
      users
    );

    return {
      content: [{
        type: 'text',
        text: ResponseFormatter.toMcpResponse(formattedResponse)
      }] as TextContent[]
    };
  }

  private handleError(error: unknown) {
    if (error instanceof McpError) {
      throw error;
    }

    if (error instanceof RedditError) {
      if (RedditError.isRateLimit(error)) {
        return {
          content: [{
            type: 'text',
            text: 'Rate limit exceeded. Please wait a moment before trying again.',
            isError: true
          }] as TextContent[]
        };
      }

      return {
        content: [{
          type: 'text',
          text: `Reddit API error: ${(error as RedditError).message}`,
          isError: true
        }] as TextContent[]
      };
    }

    console.error('Unexpected error:', error);
    throw new McpError(
      ErrorCode.InternalError,
      'An unexpected error occurred'
    );
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Reddit MCP server running on stdio');
  }
}

// Start the server
dotenv.config();

const config = {
  clientId: process.env.REDDIT_CLIENT_ID!,
  clientSecret: process.env.REDDIT_CLIENT_SECRET!,
  userAgent: process.env.REDDIT_USER_AGENT || 'reddit-mcp-server/1.0.0'
};

const server = new RedditServer(config);
server.start().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
