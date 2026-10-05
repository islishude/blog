import { readPosts } from './content.mjs';
console.log(`Validated ${readPosts().length} article dates and unique explicit URLs.`);
