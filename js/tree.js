import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const db = getFirestore();

async function buildTree() {
  const querySnap = await getDocs(collection(db, "members"));
  const members = {};
  querySnap.forEach((doc) => {
    members[doc.id] = { id: doc.id, ...doc.data(), children: [] };
  });

  // Build hierarchy
  Object.values(members).forEach((m) => {
    if (m.uplineId && members[m.uplineId]) {
      members[m.uplineId].children.push(m);
    }
  });

  // Render
  const treeRoot = document.getElementById("tree");
  treeRoot.innerHTML = renderTree(Object.values(members).filter((m) => !m.uplineId));
}

function renderTree(nodes) {
  return `<ul>${nodes
    .map(
      (node) => `
    <li>
      ${node.name} (${node.manualId})
      ${node.children.length ? renderTree(node.children) : ""}
    </li>`
    )
    .join("")}</ul>`;
}

document.addEventListener("DOMContentLoaded", buildTree);
