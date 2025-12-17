import { visit } from 'unist-util-visit';

export function remarkTocTrigger() {
  return (tree) => {
    visit(tree, 'code', (node, index, parent) => {
      // Look specifically for ```toc
      if (node.lang === 'toc') {
        // Replace the code block with a custom HTML div
        const tocPlaceholder = {
          type: 'html',
          value: '<div id="article-toc-trigger"></div>',
        };
        parent.children.splice(index, 1, tocPlaceholder);
      }
    });
  };
}