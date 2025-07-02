#!/usr/bin/env node
import dotenv from 'dotenv';
import { RedditClient } from './reddit-api.js';
import { ConfigSchema } from './types.js';

// Load environment variables
dotenv.config();

async function testCommentPosting() {
    console.log('🧪 Testing Reddit Comment Posting...\n');

    // Validate configuration
    const config = {
        clientId: process.env.REDDIT_CLIENT_ID!,
        clientSecret: process.env.REDDIT_CLIENT_SECRET!,
        userAgent: process.env.REDDIT_USER_AGENT || 'reddit-mcp-comment-test/1.0.0'
    };

    const result = ConfigSchema.safeParse(config);
    if (!result.success) {
        console.error('❌ Configuration validation failed:');
        console.error(result.error.message);
        process.exit(1);
    }

    const client = new RedditClient(config);



    try {
        const commentText = `Test comment from reddit-mcp at ${new Date().toISOString()}`;
        
        console.log(`   Comment text: "${commentText}"`);
        console.log('   Posting...');

        const comment = await client.postComment({
            subreddit: 'test', // subreddit to post in
            text:commentText
        }
        );

        console.log('✅ Comment posted successfully!');
        console.log(`   Comment ID: ${comment.id}`);
        console.log(`   Author: ${comment.author}`);
        console.log(`   URL: ${comment.url}`);
        console.log(`   Posted at: ${comment.createdAt}`);

    } catch (error) {
        console.error('❌ Comment posting failed:');
        
        if (error instanceof Error) {
            console.error('   Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack?.split('\n').slice(0, 5).join('\n')
            });
        } else {
            console.error('   Unknown error:', error);
        }

        // Provide helpful guidance for common errors
        if (error instanceof Error) {
            if (error.message.includes('Parent ID is required')) {
                console.error('\n💡 Missing Parent ID:');
                console.error('   - Comments need a parent post or comment to reply to');
                console.error('   - Set TEST_POST_ID=t3_xxxxx in your .env file');
                console.error('   - You can find post IDs by searching posts first');
            }
            
            if (error.message.includes('403') || error.message.includes('Forbidden')) {
                console.error('\n💡 Possible issues:');
                console.error('   - The OAuth2 client credentials flow may not have submit permissions');
                console.error('   - This may require a user authentication flow instead of client credentials');
                console.error('   - Check if your Reddit app has the correct permissions');
            }
            
            if (error.message.includes('404') || error.message.includes('Not Found')) {
                console.error('\n💡 Possible issues:');
                console.error('   - The post ID may not exist or may be incorrectly formatted');
                console.error('   - Make sure TEST_POST_ID starts with "t3_" for posts');
            }
            
            if (error.message.includes('rate limit')) {
                console.error('\n💡 Rate limiting:');
                console.error('   - Wait a few minutes before trying again');
                console.error('   - Reddit has strict rate limits for posting');
            }
        }
    }

    console.log('\n🎉 Comment testing completed!');
}

// Run the test
testCommentPosting().catch(error => {
    console.error('💥 Comment test failed:', error);
    process.exit(1);
});
