import type { UIStrings } from "../types";

export default {
  nav: {
    home: "首页",
    posts: "文章",
    tags: "标签",
    about: "关于",
    archives: "归档",
    search: "搜索",
  },
  post: {
    publishedAt: "发布于",
    updatedAt: "更新于",
    sharePostIntro: "分享文章：",
    sharePostOn: "Share this post on {{platform}}",
    sharePostViaEmail: "Share this post via email",
    tagLabel: "标签",
    backToTop: "回到顶部",
    goBack: "返回",
    editPage: "编辑文章",
    previousPost: "上一篇",
    nextPost: "下一篇",
  },
  pagination: {
    prev: "上一页",
    next: "下一页",
    page: "页",
  },
  home: {
    socialLinks: "找到我",
    featured: "精选文章",
    recentPosts: "最新文章",
    allPosts: "全部文章",
  },
  footer: {
    copyright: "版权",
    allRightsReserved: "署名—非商业性使用 4.0",
  },
  pages: {
    tagTitle: "标签",
    tagDesc: "包含此标签的文章",

    tagsTitle: "标签",
    tagsDesc: "按标签浏览技术笔记。",

    postsTitle: "文章",
    postsDesc: "全部技术笔记，按发布时间排序。",

    archivesTitle: "归档",
    archivesDesc: "按年份和月份浏览文章。",

    searchTitle: "搜索",
    searchDesc: "搜索技术笔记……",
  },
  a11y: {
    skipToContent: "跳转到正文",
    openMenu: "打开菜单",
    closeMenu: "关闭菜单",
    toggleTheme: "切换明暗主题",
    searchPlaceholder: "搜索文章……",
    noResults: "没有找到相关结果",
    goToPreviousPage: "前往上一页",
    goToNextPage: "前往下一页",
  },
  notFound: {
    title: "404 页面不存在",
    message: "未找到页面",
    goHome: "返回首页",
  },
} satisfies UIStrings;
