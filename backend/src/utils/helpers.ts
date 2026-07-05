export const slugify = (text: string): string =>
  text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");

export const estimateReadingTime = (content: string): number => {
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / 200);
};
