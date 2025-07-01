import { FormattedPost, RedditPost, RedditUser, SearchResponse } from './types.js';

export class ResponseFormatter {
    static formatPost(post: RedditPost, user: RedditUser, position: number): FormattedPost {
        return {
            position,
            title: post.title,
            author: user.name,
            subreddit: post.subreddit,
            content: post.text,
            url: post.url,
            metrics: post.metrics,
            redditUrl: `https://reddit.com/r/${post.subreddit}/comments/${post.id}`,
            createdAt: post.createdAt
        };
    }

    static formatSearchResponse(
        query: string,
        subreddit: string,
        posts: RedditPost[],
        users: RedditUser[]
    ): SearchResponse {
        const userMap = new Map(users.map(user => [user.name, user]));
        
        const formattedPosts = posts
            .map((post, index) => {
                const user = userMap.get(post.author);
                if (!user) return null;
                
                return this.formatPost(post, user, index + 1);
            })
            .filter((post): post is FormattedPost => post !== null);

        return {
            query,
            subreddit,
            count: formattedPosts.length,
            posts: formattedPosts
        };
    }

    static toMcpResponse(response: SearchResponse): string {
        const header = [
            'REDDIT SEARCH RESULTS',
            `Query: "${response.query}" in r/${response.subreddit}`,
            `Found ${response.count} posts`,
            '='.repeat(50)
        ].join('\n');

        if (response.count === 0) {
            return header + '\nNo posts found matching your query.';
        }

        const postBlocks = response.posts.map(post => [
            `Post #${post.position}`,
            `Title: ${post.title}`,
            `Author: u/${post.author}`,
            `Subreddit: r/${post.subreddit}`,
            post.content ? `Content: ${post.content.substring(0, 200)}${post.content.length > 200 ? '...' : ''}` : '',
            post.url ? `Link: ${post.url}` : '',
            `Score: ${post.metrics.score} (${post.metrics.upvotes} upvotes, ${post.metrics.downvotes} downvotes)`,
            `Comments: ${post.metrics.comments}`,
            `Posted: ${new Date(post.createdAt).toLocaleString()}`,
            `Reddit URL: ${post.redditUrl}`,
            '='.repeat(50)
        ].filter(line => line.length > 0).join('\n'));

        return [header, ...postBlocks].join('\n\n');
    }
}
