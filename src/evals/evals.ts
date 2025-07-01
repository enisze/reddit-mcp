//evals.ts

import { EvalConfig } from 'mcp-evals';
import { openai } from "@ai-sdk/openai";
import { grade, EvalFunction } from "mcp-evals";

const post_commentEval: EvalFunction = {
    name: "post_comment Evaluation",
    description: "Evaluates the functionality of posting a new comment to Reddit",
    run: async () => {
        const result = await grade(openai("gpt-4"), "Please post a comment saying: 'Great discussion! Thanks for sharing.' to the programming subreddit");
        return JSON.parse(result);
    }
};

const search_postsEval: EvalFunction = {
    name: 'search_posts Tool Evaluation',
    description: 'Evaluates the search_posts tool functionality',
    run: async () => {
        const result = await grade(openai("gpt-4"), "Please search for posts about 'artificial intelligence' in the MachineLearning subreddit with 10 results.");
        return JSON.parse(result);
    }
};

const config: EvalConfig = {
    model: openai("gpt-4"),
    evals: [post_commentEval, search_postsEval]
};
  
export default config;
  
export const evals = [post_commentEval, search_postsEval];
