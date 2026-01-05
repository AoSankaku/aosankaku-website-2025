// src/plugins/remark-youtube.mjs
import { visit } from 'unist-util-visit';
import { toString } from 'mdast-util-to-string';

export function remarkYoutube() {
  return (tree, file) => {
    visit(tree, 'paragraph', (node, index, parent) => {
      if (!parent || typeof index !== 'number') return;

      const fullText = toString(node).trim();

      // allow "youtube:VIDEOID", "youtube: https://..." or "youtube: https://youtu.be/ID"
      const regex = /youtube:\s*(?:https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)?([\w-]{11})|([\w-]{11}))/i;
      const match = fullText.match(regex);

      if (!match) return;

      const videoId = match[1] || match[2];
      if (!videoId) return;

      const iframeHtml = `<div class="video-container" style="margin:2rem 0; width:100%;">
  <iframe src="https://www.youtube.com/embed/${videoId}" title="YouTube video player" frameborder="0" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="width:100%; aspect-ratio:16/9; border-radius:8px; border:none;"></iframe>
</div>`;

      parent.children.splice(index, 1, { type: 'html', value: iframeHtml });
    });
  };
}
