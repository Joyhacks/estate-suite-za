// el — a tiny hyperscript helper so modules build DOM without a framework.
// el('div', {class:'x', onClick:fn}, child, child). Props: class, text, html,
// dataset, style(object), on<Event> handlers, any other key -> attribute.

export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class' || k === 'className') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
    else if (k.startsWith('on') && typeof v === 'function') {
      node.addEventListener(k.slice(2).toLowerCase(), v);
    } else {
      node.setAttribute(k, v === true ? '' : v);
    }
  }
  append(node, children);
  return node;
}

/** Append a (possibly nested) list of nodes/strings, skipping null/false. */
export function append(node, children) {
  for (const child of children.flat(Infinity)) {
    if (child == null || child === false) continue;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return node;
}

/** Remove all children of a node. */
export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

/** Build a document fragment from children. */
export function frag(...children) {
  const f = document.createDocumentFragment();
  append(f, children);
  return f;
}
