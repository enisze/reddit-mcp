import { z } from 'zod';

// Configuration schema with validation
export const ConfigSchema = z.object({
    clientId: z.string().min(1, 'Client ID is required'),
    clientSecret: z.string().min(1, 'Client Secret is required'),
    userAgent: z.string().min(1, 'User Agent is required'),
});

export type Config = z.infer<typeof ConfigSchema>;

// Tool input schemas
export const SearchPostsSchema = z.object({
    query: z.string().min(1, 'Search query cannot be empty'),
    subreddit: z.string()
        .min(1, 'Subreddit name is required')
        .regex(/^[A-Za-z0-9_]+$/, 'Subreddit name contains invalid characters'),
    count: z.number()
        .int('Count must be an integer')
        .min(1, 'Minimum count is 1')
        .max(100, 'Maximum count is 100')
        .default(25),
    sort: z.enum(['relevance', 'hot', 'top', 'new', 'comments'])
        .default('relevance')
});

export type SearchPostsArgs = z.infer<typeof SearchPostsSchema>;

// API Response types
export interface PostMetrics {
    upvotes: number;
    downvotes: number;
    score: number;
    comments: number;
}

export interface PostedComment {
    id: string;
    text: string;
    author: string;
    subreddit: string;
    parentId?: string;
    url: string;
    createdAt: string;
}

export interface RedditPost {
    id: string;
    title: string;
    author: string;
    subreddit: string;
    text?: string;
    url?: string;
    metrics: PostMetrics;
    createdAt: string;
}

export interface RedditUser {
    name: string;
    id: string;
}

// Error types
export class RedditError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly status?: number
    ) {
        super(message);
        this.name = 'RedditError';
    }

    static isRateLimit(error: unknown): error is RedditError {
        return error instanceof RedditError && error.code === 'rate_limit_exceeded';
    }
}

// Response formatter types
export interface FormattedPost {
    position: number;
    title: string;
    author: string;
    subreddit: string;
    content?: string;
    url?: string;
    metrics: PostMetrics;
    redditUrl: string;
    createdAt: string;
}

export interface SearchResponse {
    query: string;
    subreddit: string;
    count: number;
    posts: FormattedPost[];
}
