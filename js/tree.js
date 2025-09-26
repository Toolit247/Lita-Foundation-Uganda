// js/tree.js (module)
// Responsible for rendering a nested downline tree.
// Usage:
//   window.renderTreeInContainer(membersArray, containerEl [, rootMemberId])
// where membersArray is [{ memberId, fullName, upline, photoURL, ... }, ...]
// if rootMemberId given, the tree will be built under that node only; else top-level ROOT nodes shown.

export function buildHierarchy(members) {
  const byId = {};
  members.forEach(m => { byId[m.memberId] = { ...m, children: [] }; });
  const roots = [];
  members.forEach(m => {
    const node = byId[m.memberId];
    if (!node) return;
    const parentId = m.upline || "ROOT";
    if (parentId && byId[parentId]) {
      byId[parentId].children.push(node);
    } else {
      roots.push(node);
    }
  });
  return { byId, roots };
}

export function renderTreeHtml(nodes) {
  if (!nodes || !nodes.length) return "<p>No members yet</p>";
  const build = (arr) => {
    let html = "<ul>";
    arr.forEach(n => {
      const img = n.photoURL || ("https://ui-avatars.com/api/?background=E5E7EB&color=111&name=" + encodeURIComponent(n.fullName || n.name || 'LITA'));
      html += `<li style="margin:6px 0"><div style="display:flex;align-items:center;gap:8px"><img src="${img}" style="width:36px;height:36px;border-radius:50%"/> <strong>${n.fullName || n.name}</strong> <small style="color:#1d4ed8;margin-left:6px">${n.memberId}</small></div>`;
      if (n.children && n.children.length) html += build(n.children);
      html += `</li>`;
    });
    html += "</ul>";
    return html;
  };
  return build(nodes);
}

window.renderTreeInContainer = (membersArray = [], containerEl, rootMemberId = null) => {
  if (!containerEl) return;
  const { byId, roots } = buildHierarchy(membersArray);
  let nodesToRender = roots;
  if (rootMemberId) {
    const root = Object.values(byId).find(n => n.memberId === rootMemberId);
    nodesToRender = root ? [root] : [];
  }
  containerEl.innerHTML = renderTreeHtml(nodesToRender);
};

// Also export default helpers for other modules if needed
export default { buildHierarchy, renderTreeHtml };
