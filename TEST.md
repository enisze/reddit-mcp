# Test Configuration for Reddit MCP

This file contains instructions for testing the Reddit MCP server.

## Unit Tests (No API credentials required)

Run basic functionality tests without needing Reddit API access:

```bash
npm test
# or
npm run test:unit
```

These tests verify:
- Response formatting
- Type definitions
- Basic data structures
- Error handling logic

## API Integration Tests (Requires Reddit credentials)

To test actual Reddit API integration, you need to:

1. Set up Reddit API credentials in `.env`:
```bash
cp .env.example .env
# Edit .env with your actual credentials
```

2. Run the API tests:
```bash
npm run test:api
```

### Optional: Comment Posting Test

To test actual comment posting (will post to Reddit):
```bash
TEST_COMMENTS=true npm run test:api
```

**Warning**: This will post an actual comment to r/test subreddit.

## Test Subreddits

The tests use these subreddits:
- `programming` - For search tests
- `MachineLearning` - For alternative search tests  
- `test` - For comment posting tests (if enabled)

## Expected Test Results

### Unit Tests
- ✅ Post formatting
- ✅ Search response formatting
- ✅ MCP response generation
- ✅ Empty results handling
- ✅ Type definitions

### API Tests
- ✅ Search for posts in r/programming
- ✅ Search for posts in r/MachineLearning
- ✅ Error handling for invalid subreddits
- ✅ Rate limiting (2 second delays)
- ✅ Comment posting (if enabled)

## Troubleshooting

### Common Issues

1. **TypeScript compilation errors**
   ```bash
   npm run build
   ```

2. **Missing dependencies**
   ```bash
   npm install
   ```

3. **Reddit API authentication errors**
   - Check your credentials in `.env`
   - Ensure your Reddit app is configured as "script" type
   - Verify your user agent string is unique

4. **Rate limiting errors**
   - Wait between API calls
   - The client has built-in 2-second rate limiting

### Environment Variables

Required for API tests:
- `REDDIT_CLIENT_ID` - Your app's client ID
- `REDDIT_CLIENT_SECRET` - Your app's client secret
- `REDDIT_USERNAME` - Your Reddit username
- `REDDIT_PASSWORD` - Your Reddit password
- `REDDIT_USER_AGENT` - Unique user agent string (optional)

Optional:
- `TEST_COMMENTS=true` - Enable actual comment posting
