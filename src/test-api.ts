#!/usr/bin/env node
import dotenv from 'dotenv';
import { RedditClient } from './reddit-api.js';
import { ConfigSchema } from './types.js';

// Load environment variables
dotenv.config();

async function testRedditAPI() {
    console.log('🧪 Testing Reddit API calls directly...\n');

    // Validate configuration
    const config = {
        clientId: process.env.REDDIT_CLIENT_ID!,
        clientSecret: process.env.REDDIT_CLIENT_SECRET!,
        username: process.env.REDDIT_USERNAME!,
        password: process.env.REDDIT_PASSWORD!,
        userAgent: process.env.REDDIT_USER_AGENT || 'reddit-mcp-test/1.0.0'
    };

    const result = ConfigSchema.safeParse(config);
    if (!result.success) {
        console.error('❌ Configuration validation failed:');
        console.error(result.error.message);
        process.exit(1);
    }

    const client = new RedditClient(config);

    // Test 1: Search for posts
    console.log('🔍 Test 1: Search posts in r/programming...');
    try {
        const { posts, users } = await client.searchPosts(
            'javascript',
            'programming',
            5,
            'hot'
        );

        console.log(`✅ Found ${posts.length} posts and ${users.length} unique users`);
        
        if (posts.length > 0) {
            console.log(`   First post: "${posts[0].title}" by ${posts[0].author}`);
        }
    } catch (error) {
        console.error('❌ Search test failed:', error);
        if (error instanceof Error) {
            console.error('   Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack?.split('\n').slice(0, 3).join('\n')
            });
        }
    }

    // Add delay between tests
    console.log('\n⏳ Waiting 2 seconds before next test...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Different subreddit search
    console.log('\n🔍 Test 2: Search posts in r/MachineLearning...');
    try {
        const { posts } = await client.searchPosts(
            'AI',
            'MachineLearning',
            3,
            'top'
        );

        console.log(`✅ Found ${posts.length} posts in r/MachineLearning`);
    } catch (error) {
        console.error('❌ MachineLearning search failed:', error);
        if (error instanceof Error) {
            console.error('   Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack?.split('\n').slice(0, 3).join('\n')
            });
        }
    }

    // Test 3: Comment posting (optional)
    const shouldTestComments = process.env.TEST_COMMENTS === 'true';
    
    if (shouldTestComments) {
        console.log('\n💬 Test 3: Post comment to r/test...');
        try {
            const comment = await client.postComment({
                text:
                'Test comment from reddit-mcp API test',
                subreddit:
                'test'
            }
            );

            console.log(`✅ Comment posted successfully: ${comment.id}`);
        } catch (error) {
            console.error('❌ Comment posting failed:', error);
        }
    } else {
        console.log('\n💬 Test 3: Comment posting skipped (set TEST_COMMENTS=true to enable)');
    }

    console.log('\n🎉 API testing completed!');
}

// Run the tests
testRedditAPI().catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
});
