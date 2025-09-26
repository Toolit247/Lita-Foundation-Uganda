import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const auth = getAuth();
const db = getFirestore();

document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const manualId = document.getElementById("manualId").value;
  const uplineId = document.getElementById("uplineId").value;
  const side = document.getElementById("side").value; // left or right
  const tempPassword = Math.random().toString(36).slice(-8); // temp password

  try {
    // 1. Create Firebase Auth user
    const userCred = await createUserWithEmailAndPassword(auth, email, tempPassword);
    const uid = userCred.user.uid;

    // 2. Save to Firestore
    await setDoc(doc(db, "members", uid), {
      name,
      email,
      manualId,
      uplineId,
      side,
      createdAt: new Date().toISOString(),
      photoURL: "",
    });

    // 3. Send Email via EmailJS
    emailjs.send("service_mrqs34o", "template_svacje4", {
      to_email: email,
      to_name: name,
      temp_password: tempPassword,
      member_id: manualId,
    });

    alert(`✅ Member ${name} registered and email sent!`);
    document.getElementById("registerForm").reset();
  } catch (error) {
    console.error("❌ Error registering member:", error);
    alert("❌ " + error.message);
  }
});
