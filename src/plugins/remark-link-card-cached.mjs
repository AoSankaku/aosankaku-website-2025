import { createHash } from 'node:crypto';
import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileTypeFromBuffer } from 'file-type';
import client from 'open-graph-scraper';
import sanitizeHtml from 'sanitize-html';
import { visit } from 'unist-util-visit';

const defaultSaveDirectory = 'public';
const defaultOutputDirectory = '/remark-link-card-plus/';
const defaultOgCacheFilename = 'og-cache.json';
const defaultOgCacheTtlMs = 1000 * 60 * 60 * 24 * 30;

const defaultOptions = {
  cache: false,
  ogCacheTtlMs: defaultOgCacheTtlMs,
  shortenUrl: true,
  thumbnailPosition: 'right',
  noThumbnail: false,
  noFavicon: false,
  ignoreExtensions: [],
};

let openGraphCachePromise;
let openGraphCacheWriteQueue = Promise.resolve();

export const remarkLinkCardCached = (userOptions) => async (tree) => {
  const options = { ...defaultOptions, ...userOptions };
  const transformers = [];

  const shouldIgnoreUrl = (url) => {
    if (!options.ignoreExtensions?.length) return false;
    try {
      const { pathname } = new URL(url);
      return options.ignoreExtensions.some((ext) => pathname.toLowerCase().endsWith(ext.toLowerCase()));
    } catch {
      return false;
    }
  };

  const addTransformer = (url, index) => {
    transformers.push(async () => {
      const data = await getLinkCardData(new URL(url), options);
      const linkCardNode = createLinkCardNode(data, options);
      if (index !== undefined) {
        tree.children.splice(index, 1, linkCardNode);
      }
    });
  };

  const isValidUrl = (value) => {
    if (!URL.canParse(value)) return false;
    return /^(https?:\/\/[^\s/$.?#].[^\s]*)$/i.test(value);
  };

  visit(tree, 'paragraph', (paragraph, index, parent) => {
    if (parent?.type !== 'root' || paragraph.children.length !== 1) return;

    let unmatchedLink;
    let processedUrl;

    visit(paragraph, 'link', (linkNode) => {
      const hasOneChildText = linkNode.children.length === 1 && linkNode.children[0].type === 'text';
      if (!hasOneChildText) return;

      const childText = linkNode.children[0];
      if (!isSameUrlValue(linkNode.url, childText.value)) {
        unmatchedLink = linkNode;
        return;
      }

      if (index !== undefined) {
        processedUrl = linkNode.url;
        if (!shouldIgnoreUrl(linkNode.url)) {
          addTransformer(linkNode.url, index);
        }
      }
    });

    visit(paragraph, 'text', (textNode) => {
      if (!isValidUrl(textNode.value)) return;
      if (processedUrl === textNode.value) return;

      if (
        unmatchedLink &&
        textNode.value === unmatchedLink.children[0].value &&
        textNode.position?.start.line === unmatchedLink.position?.start.line
      ) {
        return;
      }

      if (index !== undefined && !shouldIgnoreUrl(textNode.value)) {
        addTransformer(textNode.value, index);
      }
    });
  });

  try {
    await Promise.all(transformers.map((transform) => transform()));
  } catch (error) {
    console.error(`[remark-link-card-plus] Error: ${error}`);
  }

  return tree;
};

const isSameUrlValue = (a, b) => {
  try {
    return new URL(a).toString() === new URL(b).toString();
  } catch {
    return false;
  }
};

const getOpenGraphCachePath = () => (
  path.join(process.cwd(), defaultSaveDirectory, defaultOutputDirectory, defaultOgCacheFilename)
);

const readOpenGraphCache = async () => {
  if (!openGraphCachePromise) {
    openGraphCachePromise = (async () => {
      try {
        const raw = await readFile(getOpenGraphCachePath(), 'utf8');
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
      } catch {
        return {};
      }
    })();
  }

  return openGraphCachePromise;
};

const writeOpenGraphCache = async (cache) => {
  const cachePath = getOpenGraphCachePath();
  openGraphCachePromise = Promise.resolve(cache);
  openGraphCacheWriteQueue = openGraphCacheWriteQueue.then(async () => {
    try {
      await mkdir(path.dirname(cachePath), { recursive: true });
      await writeFile(cachePath, JSON.stringify(cache, null, 2));
    } catch (error) {
      console.error(`[remark-link-card-plus] Error: Failed to write Open Graph cache\n ${error}`);
    }
  });
  await openGraphCacheWriteQueue;
};

const getOpenGraphCacheEntry = async (targetUrl, options) => {
  if (!options.cache) return undefined;

  const cache = await readOpenGraphCache();
  const entry = cache[targetUrl.toString()];
  const ttlMs = options.ogCacheTtlMs ?? defaultOgCacheTtlMs;
  const isFresh = entry && typeof entry.timestamp === 'number' && (ttlMs === 0 || Date.now() - entry.timestamp < ttlMs);

  if (!isFresh) return undefined;
  return { hit: true, result: entry.result || undefined };
};

const setOpenGraphCacheEntry = async (targetUrl, result, options) => {
  if (!options.cache) return;

  const cache = await readOpenGraphCache();
  cache[targetUrl.toString()] = {
    timestamp: Date.now(),
    result: result || null,
  };
  await writeOpenGraphCache(cache);
};

const getOpenGraph = async (targetUrl, options) => {
  const cached = await getOpenGraphCacheEntry(targetUrl, options);
  if (cached?.hit) return cached.result;

  try {
    const { result } = await client({
      url: targetUrl.toString(),
      timeout: 10000,
    });
    await setOpenGraphCacheEntry(targetUrl, result, options);
    return result;
  } catch (error) {
    const ogError = error;
    console.error(`[remark-link-card-plus] Error: Failed to get the Open Graph data of ${ogError?.result?.requestUrl} due to ${ogError?.result?.error}.`);
    await setOpenGraphCacheEntry(targetUrl, undefined, options);
    return undefined;
  }
};

const getFaviconImageSrc = async (url) => {
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${url.hostname}`;
  const res = await fetch(faviconUrl, {
    method: 'HEAD',
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) return '';
  return faviconUrl;
};

const getLinkCardData = async (url, options) => {
  const ogRawResult = await getOpenGraph(url, options);
  let ogData = {
    title: ogRawResult?.ogTitle || '',
    description: ogRawResult?.ogDescription || '',
    faviconUrl: ogRawResult?.favicon,
    imageUrl: extractOgImageUrl(ogRawResult),
  };

  if (options.ogTransformer) {
    ogData = options.ogTransformer(ogData, url);
  }

  const title = ogData?.title || url.hostname;
  const description = ogData?.description || '';
  const faviconUrl = await getFaviconUrl(url, ogData?.faviconUrl, options);
  const ogImageUrl = await getOgImageUrl(ogData.imageUrl, options);
  let displayUrl = options.shortenUrl ? url.hostname : url.toString();

  try {
    displayUrl = decodeURI(displayUrl);
  } catch (error) {
    console.error(`[remark-link-card-plus] Error: Cannot decode url: "${url}"\n ${error}`);
  }

  return {
    title,
    description,
    faviconUrl,
    ogImageUrl,
    displayUrl,
    url,
  };
};

const getFaviconUrl = async (url, ogFavicon, options) => {
  if (options.noFavicon) return '';

  let faviconUrl = ogFavicon;
  if (faviconUrl && !URL.canParse(faviconUrl)) {
    try {
      faviconUrl = new URL(faviconUrl, url.origin).toString();
    } catch (error) {
      console.error(`[remark-link-card-plus] Error: Failed to resolve favicon URL ${faviconUrl} relative to ${url}\n${error}`);
      faviconUrl = undefined;
    }
  }

  if (!faviconUrl) {
    faviconUrl = await getFaviconImageSrc(url);
  }

  if (faviconUrl && options.cache) {
    try {
      const faviconFilename = await getCachedImageFilename(
        new URL(faviconUrl),
        path.join(process.cwd(), defaultSaveDirectory, defaultOutputDirectory),
      );
      faviconUrl = faviconFilename ? path.join(defaultOutputDirectory, faviconFilename) : faviconUrl;
    } catch (error) {
      console.error(`[remark-link-card-plus] Error: Failed to download favicon from ${faviconUrl}\n ${error}`);
    }
  }

  return faviconUrl;
};

const getOgImageUrl = async (imageUrl, options) => {
  if (options.noThumbnail) return '';

  const isValidUrl = imageUrl && imageUrl.length > 0 && URL.canParse(imageUrl);
  if (!isValidUrl) return '';

  let ogImageUrl = imageUrl;
  if (ogImageUrl && options.cache) {
    const imageFilename = await getCachedImageFilename(
      new URL(ogImageUrl),
      path.join(process.cwd(), defaultSaveDirectory, defaultOutputDirectory),
    );
    ogImageUrl = imageFilename ? path.join(defaultOutputDirectory, imageFilename) : ogImageUrl;
  }

  return ogImageUrl;
};

const extractOgImageUrl = (ogResult) => (
  ogResult?.ogImage && ogResult.ogImage.length > 0 ? ogResult.ogImage[0].url : undefined
);

const getCachedImageFilename = async (url, saveDirectory) => {
  let cacheKey = url.href;
  try {
    cacheKey = decodeURI(url.href);
  } catch {
    // Some legacy article URLs contain malformed escapes. Use the raw href as a stable cache key.
  }
  const hash = createHash('sha256').update(cacheKey).digest('hex');

  try {
    const files = await readdir(saveDirectory);
    const cachedFile = files.find((file) => file.startsWith(`${hash}.`));
    if (cachedFile) return cachedFile;
  } catch {
    // Directory is created on first cache write.
  }

  try {
    const response = await fetch(url.href, {
      signal: AbortSignal.timeout(10000),
    });
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('Content-Type');
    let extension = '';

    if (contentType?.startsWith('image/svg+xml')) {
      extension = '.svg';
    } else if (contentType?.startsWith('image/')) {
      const fileType = await fileTypeFromBuffer(buffer);
      extension = fileType ? `.${fileType.ext}` : '.png';
    }

    const filename = `${hash}${extension}`;
    const saveFilePath = path.join(saveDirectory, filename);

    try {
      await access(saveDirectory);
    } catch {
      await mkdir(saveDirectory, { recursive: true });
    }

    await writeFile(saveFilePath, buffer);
    return filename;
  } catch (error) {
    console.error(`[remark-link-card-plus] Error: Failed to download image from ${url.href}\n ${error}`);
    return undefined;
  }
};

const className = (value) => `remark-link-card-plus__${value}`;

const createLinkCardNode = (data, options) => {
  const { title, description, faviconUrl, ogImageUrl, displayUrl, url } = data;
  const isThumbnailLeft = options.thumbnailPosition === 'left';
  const thumbnail = ogImageUrl
    ? `
<div class="${className('thumbnail')}">
  <img src="${ogImageUrl}" class="${className('image')}" alt="">
</div>`.trim()
    : '';
  const mainContent = `
<div class="${className('main')}">
  <div class="${className('content')}">
    <div class="${className('title')}">${sanitizeHtml(title)}</div>
    <div class="${className('description')}">${sanitizeHtml(description)}</div>
  </div>
  <div class="${className('meta')}">
    ${faviconUrl ? `<img src="${faviconUrl}" class="${className('favicon')}" width="14" height="14" alt="">` : ''}
    <span class="${className('url')}">${sanitizeHtml(displayUrl)}</span>
  </div>
</div>
`.replace(/\n\s*\n/g, '\n').trim();

  const content = isThumbnailLeft ? `
${thumbnail}
${mainContent}` : `
${mainContent}
${thumbnail}`;

  return {
    type: 'html',
    value: `
<div class="${className('container')}">
  <a href="${url.toString()}" target="_blank" rel="noreferrer noopener" class="${className('card')}">
    ${content.trim()}
  </a>
</div>`.trim(),
  };
};
