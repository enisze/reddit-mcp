import { Config, PostedComment, RedditError, RedditPost, RedditUser } from './types.js';

interface OAuth2Token {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
}

export class RedditClient {
    private accessToken: string | null = null;
    private tokenExpiry: number = 0;
    private rateLimitMap = new Map<string, number>();
    private config: Config;

    constructor(config: Config) {
        this.config = config;
        console.error('Reddit OAuth2 client initialized');
    }

    private async getAccessToken(): Promise<string> {
        // Check if we have a valid token
        if (this.accessToken && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        // Get new token using client credentials flow
        const auth = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');
        
        const response = await fetch('https://www.reddit.com/api/v1/access_token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': this.config.userAgent
            },
            body: 'grant_type=client_credentials'
        });

        if (!response.ok) {
            throw new RedditError(
                `OAuth2 authentication failed: ${response.statusText}`,
                'oauth_failed',
                response.status
            );
        }

        const tokenData: OAuth2Token = await response.json();
        this.accessToken = tokenData.access_token;
        // Set expiry to 5 minutes before actual expiry for safety
        this.tokenExpiry = Date.now() + (tokenData.expires_in - 300) * 1000;
        
        console.error('OAuth2 token obtained successfully');
        return this.accessToken;
    }

    private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
        const token = await this.getAccessToken();
        
        const response = await fetch(`https://oauth.reddit.com${endpoint}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${token}`,
                'User-Agent': this.config.userAgent,
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        // Check for rate limiting from Reddit API
        if (response.status === 429) {
            const retryAfter = response.headers.get('retry-after');
            const resetTime = response.headers.get('x-ratelimit-reset');
            const remaining = response.headers.get('x-ratelimit-remaining');
            
            console.error('Reddit API rate limit hit:', {
                retryAfter,
                resetTime,
                remaining,
                endpoint
            });
            
            throw new RedditError(
                `Reddit API rate limit exceeded. ${retryAfter ? `Retry after ${retryAfter} seconds.` : 'Please wait before making more requests.'}`,
                'reddit_rate_limit_exceeded',
                429
            );
        }

        if (!response.ok) {
            // Log the full response for debugging
            let errorBody = '';
            try {
                errorBody = await response.text();
                console.error('Reddit API error response:', {
                    status: response.status,
                    statusText: response.statusText,
                    headers: Object.fromEntries(response.headers.entries()),
                    body: errorBody
                });
            } catch (e) {
                console.error('Could not read error response body');
            }

            throw new RedditError(
                `Reddit API error: ${response.statusText}${errorBody ? ` - ${errorBody}` : ''}`,
                `api_error_${response.status}`,
                response.status
            );
        }

        return response.json();
    }

    async postComment({ 
        subreddit,
        text,
        parentId = ''
    }:{ text: string, subreddit: string, parentId?: string}): Promise<PostedComment> {
        try {
            const endpoint = 'comment/post';
            await this.checkRateLimit(endpoint);

            // Prepare the form data for the comment
            const formData = new URLSearchParams();
            formData.append('api_type', 'json');
            formData.append('text', text);
            
            // Parent can be either a link (post) or another comment
            // If no parentId provided, we can't post a comment (need something to reply to)
            // if (!parentId) {
            //     throw new RedditError(
            //         'Parent ID is required for posting comments. Provide either a post fullname (t3_xxx) or comment fullname (t1_xxx).',
            //         'missing_parent',
            //         400
            //     );
            // }
            
            formData.append('parent', parentId);

            console.error(`Posting comment to parent ${parentId} in r/${subreddit}`);

            const response = await fetch('https://oauth.reddit.com/api/submit', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${await this.getAccessToken()}`,
                    'User-Agent': this.config.userAgent,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: formData.toString()
            });

            // Check for rate limiting from Reddit API
            if (response.status === 429) {
                const retryAfter = response.headers.get('retry-after');
                console.error('Reddit API rate limit hit:', {
                    retryAfter,
                    endpoint: '/api/comment'
                });
                
                throw new RedditError(
                    `Reddit API rate limit exceeded. ${retryAfter ? `Retry after ${retryAfter} seconds.` : 'Please wait before making more requests.'}`,
                    'reddit_rate_limit_exceeded',
                    429
                );
            }

            if (!response.ok) {
                let errorBody = '';
                try {
                    errorBody = await response.text();
                    console.error('Reddit comment API error response:', {
                        status: response.status,
                        statusText: response.statusText,
                        headers: Object.fromEntries(response.headers.entries()),
                        body: errorBody
                    });
                } catch (e) {
                    console.error('Could not read error response body');
                }

                throw new RedditError(
                    `Reddit comment API error: ${response.statusText}${errorBody ? ` - ${errorBody}` : ''}`,
                    `api_error_${response.status}`,
                    response.status
                );
            }

            const responseData = await response.json();
            console.error('Reddit comment API response:', responseData);

            // Handle Reddit's API response format
            if (responseData.json && responseData.json.errors && responseData.json.errors.length > 0) {
                const error = responseData.json.errors[0];
                throw new RedditError(
                    `Reddit comment error: ${error.join(' ')}`,
                    'reddit_comment_error',
                    400
                );
            }

            if (responseData.json && responseData.json.data && responseData.json.data.things && responseData.json.data.things.length > 0) {
                const commentData = responseData.json.data.things[0].data;
                
                return {
                    id: commentData.id,
                    text: commentData.body || text,
                    author: commentData.author || '[unknown]',
                    subreddit: commentData.subreddit || subreddit,
                    parentId: commentData.parent_id || parentId,
                    url: `https://reddit.com${commentData.permalink}`,
                    createdAt: new Date((commentData.created_utc || Date.now() / 1000) * 1000).toISOString()
                };
            }

            // Fallback if the response structure is unexpected
            throw new RedditError(
                'Unexpected response format from Reddit comment API',
                'unexpected_response',
                500
            );

        } catch (error) {
            this.handleApiError(error);
        }
    }

    async searchPosts(query: string, subreddit: string, count: number, sort: string): Promise<{ posts: RedditPost[], users: RedditUser[] }> {
        try {
            const endpoint = 'posts/search';
            await this.checkRateLimit(endpoint);

            // Map sort parameter to Reddit's API format
            const sortMap: { [key: string]: string } = {
                'relevance': 'relevance',
                'hot': 'hot',
                'top': 'top',
                'new': 'new',
                'comments': 'comments'
            };

            const redditSort = sortMap[sort] || 'relevance';
            
            // Build search URL
            const searchUrl = `/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&sort=${redditSort}&limit=${count}&restrict_sr=1&t=all`;
            
            const response = await this.makeRequest(searchUrl);

            if (!response.data || !response.data.children) {
                return { posts: [], users: [] };
            }

            const searchResults = response.data.children;
            console.error(`Fetched ${searchResults.length} posts for query: "${query}" in r/${subreddit}`);

            const posts = searchResults.map((item: any) => {
                const post = item.data;
                return {
                    id: post.id,
                    title: post.title,
                    author: post.author || '[deleted]',
                    subreddit: post.subreddit || subreddit,
                    text: post.selftext || undefined,
                    url: post.url !== `https://www.reddit.com${post.permalink}` ? post.url : undefined,
                    metrics: {
                        upvotes: post.ups || 0,
                        downvotes: post.downs || 0,
                        score: post.score || 0,
                        comments: post.num_comments || 0
                    },
                    createdAt: new Date((post.created_utc || 0) * 1000).toISOString()
                };
            });

            const users = searchResults
                .filter((item: any) => item.data.author && item.data.author !== '[deleted]')
                .map((item: any) => ({
                    id: item.data.author_fullname || item.data.author,
                    name: item.data.author
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
            const minInterval = 1000; // 1 second between requests (less aggressive)
            
            if (timeSinceLastRequest < minInterval) {
                const waitTime = minInterval - timeSinceLastRequest;
                console.error(`Client-side rate limiting: waiting ${waitTime}ms before next request to ${endpoint}`);
                
                // Instead of throwing an error, wait for the required time
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
        this.rateLimitMap.set(endpoint, Date.now());
    }

    private handleApiError(error: unknown): never {
        if (error instanceof RedditError) {
            throw error;
        }

        // Handle fetch errors
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new RedditError(
                'Network error: Unable to connect to Reddit API',
                'network_error',
                0
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
