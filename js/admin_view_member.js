// js/admin_view_member.js
const db = firebase.firestore();

firebase.auth().onAuthStateChanged(user => {
  if (!user || user.email !== "toolitambrosehenry@gmail.com") {
    window.location.href = "signin.html";
  } else {
    loadMember();
  }
});

function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

function loadMember() {
  const id = getQueryParam("id");
  if (!id) return;

  const profileCard = document.getElementById("profileCard");
  const historyList = document.getElementById("progressHistory");

  db.collection("members").doc(id).get().then(doc => {
    if (!doc.exists) {
      profileCard.innerHTML = "<p>❌ Member not found</p>";
      return;
    }
    const data = doc.data();
    profileCard.innerHTML = `
      <img src="${data.photoURL || 'icons/icon-192.png'}" alt="Profile" class="profile-photo"/>
      <p><b>Name:</b> ${data.fullName}</p>
      <p><b>Email:</b> ${data.email}</p>
      <p><b>Phone:</b> ${data.phone}</p>
      <p><b>Gender:</b> ${data.gender}</p>
      <p><b>Location:</b> ${data.location}</p>
      <p><b>Upline ID:</b> ${data.upline}</p>
      <p><b>Member ID:</b> ${data.memberID}</p>
      <p><b>Business Progress:</b> ${data.businessProgress || "N/A"}</p>
    `;

    doc.ref.collection("progressHistory").orderBy("timestamp", "desc").get()
      .then(snapshot => {
        historyList.innerHTML = "";
        snapshot.forEach(phDoc => {
          const phData = phDoc.data();
          const li = document.createElement("li");
          li.textContent = `${phData.timestamp?.toDate().toLocaleString() || ''} - ${phData.progress}`;
          historyList.appendChild(li);
        });
      });
  });
}

document.getElementById("logout").addEventListener("click", () => {
  firebase.auth().signOut().then(() => window.location.href = "signin.html");
});
