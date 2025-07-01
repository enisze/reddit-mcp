import Snoowrap from 'snoowrap';
import { Config, RedditError, RedditPost, RedditUser, PostedComment } from './types.js';

export class RedditClient {
    private client: Snoowrap;
    private rateLimitMap = new Map<string, number>();

    constructor(config: Config) {
        this.client = new Snoowrap({
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            username: config.username,
            password: config.password,
            userAgent: config.userAgent
        });

        console.error('Reddit API client initialized');
    }

    async postComment(text: string, subreddit: string, parentId?: string): Promise<PostedComment> {
        try {
            const endpoint = 'comment/create';
            await this.checkRateLimit(endpoint);

            let comment: any;
            if (parentId) {
                // Reply to a specific post or comment
                const submission = this.client.getSubmission(parentId);
                comment = await (submission as any).reply(text);
            } else {
                // Post a top-level comment to the first hot post in the subreddit
                const subredditObj = this.client.getSubreddit(subreddit);
                const hotPosts = await (subredditObj as any).getHot({ limit: 1 });
                
                if (!hotPosts || hotPosts.length === 0) {
                    throw new RedditError(
                        'No posts found in subreddit to comment on',
                        'no_posts_found'
                    );
                }

                comment = await hotPosts[0].reply(text);
            }

            console.error(`Comment posted successfully with ID: ${comment.id} in r/${subreddit}`);

            return {
                id: comment.id,
                text: comment.body,
                subreddit: subreddit,
                url: `https://reddit.com${comment.permalink}`
            };
        } catch (error) {
            this.handleApiError(error);
        }
    }

    async searchPosts(query: string, subreddit: string, count: number, sort: string): Promise<{ posts: RedditPost[], users: RedditUser[] }> {
        try {
            const endpoint = 'posts/search';
            await this.checkRateLimit(endpoint);

            const subredditObj = this.client.getSubreddit(subreddit);
            const searchResults = await (subredditObj as any).search({
                query,
                limit: count,
                sort: sort,
                time: 'all'
            });

            console.error(`Fetched ${searchResults.length} posts for query: "${query}" in r/${subreddit}`);

            const posts = searchResults.map((post: any) => ({
                id: post.id,
                title: post.title,
                author: post.author ? post.author.name : '[deleted]',
                subreddit: post.subreddit ? post.subreddit.display_name : subreddit,
                text: post.selftext || undefined,
                url: post.url !== post.permalink ? post.url : undefined,
                metrics: {
                    upvotes: post.ups || 0,
                    downvotes: post.downs || 0,
                    score: post.score || 0,
                    comments: post.num_comments || 0
                },
                createdAt: new Date((post.created_utc || 0) * 1000).toISOString()
            }));

            const users = searchResults
                .filter((post: any) => post.author && post.author.name)
                .map((post: any) => ({
                    id: post.author.id || post.author.name,
                    name: post.author.name
                }));

            // Remove duplicate users
            const uniqueUsers = users.filter((user: any, index: number, self: any[]) =>
                index === self.findIndex((u: any) => u.name === user.name)
            );

            return { posts, users: uniqueUsers };
        } catch (error) {
            this.handleApiError(error);
        }
    }

    private async checkRateLimit(endpoint: string): Promise<void> {
        const lastRequest = this.rateLimitMap.get(endpoint);
        if (lastRequest) {
            const timeSinceLastRequest = Date.now() - lastRequest;
            if (timeSinceLastRequest < 2000) { // 2 second rate limiting for Reddit
                throw new RedditError(
                    'Rate limit exceeded',
                    'rate_limit_exceeded',
                    429
                );
            }
        }
        this.rateLimitMap.set(endpoint, Date.now());
    }

    private handleApiError(error: unknown): never {
        if (error instanceof RedditError) {
            throw error;
        }

        // Handle snoowrap errors
        const apiError = error as any;
        if (apiError.statusCode) {
            throw new RedditError(
                apiError.message || 'Reddit API error',
                apiError.statusCode.toString(),
                apiError.statusCode
            );
        }

        // Handle unexpected errors
        console.error('Unexpected error in Reddit client:', error);
        throw new RedditError(
            'An unexpected error occurred',
            'internal_error',
            500
        );
    }
}
