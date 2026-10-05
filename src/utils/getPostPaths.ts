/** Collection IDs are the complete, case-sensitive historical path, without slashes at either end. */
export function getPostSlug(id: string, _filePath?: string): string {
  return id;
}

export function getPostUrl(id: string, _filePath?: string, _locale?: string): string {
  return `/${id.split("/").map(encodeURIComponent).join("/")}/`;
}
