function renderTree(members) {
  const container = document.getElementById("treeContainer");
  if (!container) return;

  function buildNode(memberId, all) {
    const children = all.filter(m => m.uplineId === memberId);
    return {
      id: memberId,
      children: children.map(c => buildNode(c.memberId, all))
    };
  }

  const rootNodes = members.filter(m => !m.uplineId);
  container.innerHTML = "";

  rootNodes.forEach(root => {
    const ul = document.createElement("ul");
    function render(node) {
      const li = document.createElement("li");
      li.textContent = node.id;
      if (node.children.length > 0) {
        const ulChild = document.createElement("ul");
        node.children.forEach(c => ulChild.appendChild(render(c)));
        li.appendChild(ulChild);
      }
      return li;
    }
    ul.appendChild(render(buildNode(root.memberId, members)));
    container.appendChild(ul);
  });
}
