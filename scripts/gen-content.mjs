// Standalone entry for the content pipeline (`npm run gen`); the Vite
// plugin in vite.config.ts calls generatePosts() directly.
import { generatePosts } from './content-pipeline.mjs';

const count = await generatePosts();
console.log(`gen-content: rendered ${count} posts -> src/generated/posts.json`);
