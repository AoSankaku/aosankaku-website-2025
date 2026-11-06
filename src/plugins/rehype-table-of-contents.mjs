import { visit } from 'unist-util-visit';

const element = (tagName, properties, children) => ({
  type: 'element', tagName, properties, children,
});

// Keep heading formatting and emoji without nested links or duplicate IDs.
function cloneHeadingContent(children) {
  return children.flatMap((node) => {
    if (node.type !== 'element') return [structuredClone(node)];
    if (node.properties.className?.includes('anchor-link')) return [];

    const content = cloneHeadingContent(node.children);
    if (node.tagName === 'a') return content;

    const { id, ...properties } = node.properties;
    return [element(node.tagName, { ...properties }, content)];
  });
}

export function rehypeTableOfContents() {
  return (tree) => {
    const headings = [];
    const containers = [];

    visit(tree, 'element', (node) => {
      if (node.properties.id === 'article-toc-trigger') containers.push(node);
      if ((node.tagName === 'h2' || node.tagName === 'h3') &&
          typeof node.properties.id === 'string') {
        headings.push(node);
      }
    });

    if (headings.length === 0) return;

    for (const container of containers) {
      container.children = [
        element('h2', {}, [{ type: 'text', value: 'Table of Contents' }]),
        element('ul', {}, headings.map((heading) =>
          element('li', { style: `margin-left:${heading.tagName === 'h3' ? 20 : 0}px` }, [
            element('a', { href: `#${heading.properties.id}` },
              cloneHeadingContent(heading.children)),
          ]),
        )),
      ];
    }
  };
}
