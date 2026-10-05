import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://blog.islishude.xyz/",
    title: "Lishude's Web Note",
    description: "关于 Node.js、Go 与区块链的技术笔记，记录实践中的问题与解法。",
    author: "islishude",
    profile: "https://github.com/islishude",
    ogImage: "og.svg",
    lang: "zh-CN",
    timezone: "UTC",
    dir: "ltr",
  },
  posts: { perPage: 10, perIndex: 10, scheduledPostMargin: 0 },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: false,
    showArchives: true,
    showBackButton: true,
    editPost: { enabled: false },
    search: "pagefind",
  },
  socials: [{ name: "github", url: "https://github.com/islishude" }],
  shareLinks: [],
});
