#!/usr/bin/env node
import { ResponseFormatter } from './formatter.js';
import { RedditPost, RedditUser } from './types.js';

/**
 * Simple test file to test the formatter and basic functionality
 * without requiring Reddit API credentials
 */

function testFormatter() {
    console.log('🧪 Testing Reddit MCP Formatter...\n');

    // Mock data for testing
    const mockPosts: RedditPost[] = [
        {
            id: 'abc123',
            title: 'How to learn JavaScript in 2024',
            author: 'testuser1',
            subreddit: 'programming',
            text: 'Here are some great resources for learning JavaScript...',
            url: 'https://example.com/js-guide',
            metrics: {
                upvotes: 150,
                downvotes: 10,
                score: 140,
                comments: 25
            },
            createdAt: new Date().toISOString()
        },
        {
            id: 'def456',
            title: 'Best practices for React development',
            author: 'reactdev',
            subreddit: 'programming',
            text: undefined,
            url: 'https://example.com/react-guide',
            metrics: {
                upvotes: 89,
                downvotes: 5,
                score: 84,
                comments: 12
            },
            createdAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
        }
    ];

    const mockUsers: RedditUser[] = [
        { id: 'user1', name: 'testuser1' },
        { id: 'user2', name: 'reactdev' }
    ];

    console.log('📝 Test 1: Format individual post...');
    try {
        const formattedPost = ResponseFormatter.formatPost(mockPosts[0], mockUsers[0], 1);
        console.log('✅ Post formatted successfully:');
        console.log(`   Position: ${formattedPost.position}`);
        console.log(`   Title: ${formattedPost.title}`);
        console.log(`   Author: ${formattedPost.author}`);
        console.log(`   Score: ${formattedPost.metrics.score}`);
        console.log(`   Reddit URL: ${formattedPost.redditUrl}`);
    } catch (error) {
        console.error('❌ Post formatting failed:', error);
    }

    console.log('\n📄 Test 2: Format search response...');
    try {
        const searchResponse = ResponseFormatter.formatSearchResponse(
            'JavaScript',
            'programming',
            mockPosts,
            mockUsers
        );
        
        console.log('✅ Search response formatted successfully:');
        console.log(`   Query: ${searchResponse.query}`);
        console.log(`   Subreddit: ${searchResponse.subreddit}`);
        console.log(`   Count: ${searchResponse.count}`);
        console.log(`   Posts: ${searchResponse.posts.length}`);
    } catch (error) {
        console.error('❌ Search response formatting failed:', error);
    }

    console.log('\n🎨 Test 3: Generate MCP response text...');
    try {
        const searchResponse = ResponseFormatter.formatSearchResponse(
            'JavaScript',
            'programming',
            mockPosts,
            mockUsers
        );
        
        const mcpResponse = ResponseFormatter.toMcpResponse(searchResponse);
        console.log('✅ MCP response generated successfully:');
        console.log('\n' + '='.repeat(60));
        console.log(mcpResponse);
        console.log('='.repeat(60));
    } catch (error) {
        console.error('❌ MCP response generation failed:', error);
    }

    console.log('\n📭 Test 4: Empty search results...');
    try {
        const emptyResponse = ResponseFormatter.formatSearchResponse(
            'nonexistentquery',
            'programming',
            [],
            []
        );
        
        const mcpResponse = ResponseFormatter.toMcpResponse(emptyResponse);
        console.log('✅ Empty response handled correctly:');
        console.log('\n' + '-'.repeat(40));
        console.log(mcpResponse);
        console.log('-'.repeat(40));
    } catch (error) {
        console.error('❌ Empty response handling failed:', error);
    }

    console.log('\n🎉 Formatter testing completed!');
}

function testTypes() {
    console.log('\n🔍 Testing type definitions...');
    
    try {
        // Test that we can import and use the types
        const mockPost: RedditPost = {
            id: 'test',
            title: 'Test Post',
            author: 'testuser',
            subreddit: 'test',
            metrics: {
                upvotes: 1,
                downvotes: 0,
                score: 1,
                comments: 0
            },
            createdAt: new Date().toISOString()
        };
        
        console.log('✅ Type definitions working correctly');
        console.log(`   Created mock post: ${mockPost.title}`);
    } catch (error) {
        console.error('❌ Type definition test failed:', error);
    }
}

// Run the tests
console.log('🚀 Starting Reddit MCP Unit Tests\n');
testFormatter();
testTypes();
console.log('\n✨ All unit tests completed!');
console.log('\nTo test the actual Reddit API, run: npm run test:api');
console.log('(Make sure to set up your Reddit API credentials first)');
