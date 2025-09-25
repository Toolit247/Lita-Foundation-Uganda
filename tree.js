// tree.js — small helpers if you want to call from multiple pages

// Render a tree data structure (node {name, memberId, photoURL, children})
function renderTreeToElement(rootNode, element) {
  element.innerHTML = "";
  const ul = document.createElement("ul");
  (function renderNode(node, parentUl){
    const li = document.createElement("li");
    const img = node.photoURL || ("https://ui-avatars.com/api/?background=E5E7EB&color=111&name=" + encodeURIComponent(node.name||"LITA"));
    li.innerHTML = `<div style="display:flex;align-items:center;gap:8px">
      <img src="${img}" style="width:30px;height:30px;border-radius:50%;object-fit:cover">
      <strong>${node.name}</strong> <small style="color:#1d4ed8;margin-left:6px">${node.memberId || ''}</small>
    </div>`;
    parentUl.appendChild(li);
    if (node.children && node.children.length) {
      const newUl = document.createElement("ul");
      node.children.forEach(ch => renderNode(ch, newUl));
      li.appendChild(newUl);
    }
  })(rootNode, ul);
  element.appendChild(ul);
}

// export global
window.renderTreeToElement = renderTreeToElement;
