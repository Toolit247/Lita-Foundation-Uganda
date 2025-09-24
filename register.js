// register.js (module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAMnu2djtDKXMrTVKnppeCfKXRCy1KkEYk",
  authDomain: "lita-platform-bffdc.firebaseapp.com",
  projectId: "lita-platform-bffdc",
  storageBucket: "lita-platform-bffdc.appspot.com",
  messagingSenderId: "387943226211",
  appId: "1:387943226211:web:0127c409e0f880df391156"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

document.getElementById("registrationForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = document.getElementById("registrationMessage");
  msg.textContent = "";

  const fullName = document.getElementById("fullName").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const phone = document.getElementById("phone").value.trim();
  const memberId = document.getElementById("memberId").value.trim();
  const upline = document.getElementById("upline").value.trim();
  const gender = document.getElementById("gender").value.trim();
  const location = document.getElementById("location").value.trim();
  const photoFile = document.getElementById("photoFile").files[0];

  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;

    let photoURL = "";
    if(photoFile){
      const photoRef = ref(storage, `member_photos/${uid}/${Date.now()}.jpg`);
      await uploadBytes(photoRef, photoFile);
      photoURL = await getDownloadURL(photoRef);
    }

    await setDoc(doc(db, "members", uid), {
      fullName,
      email,
      phone,
      memberId,
      upline,
      gender,
      location,
      photoURL,
      createdAt: serverTimestamp(),
      businessProgress: ""
    });

    await sendEmailVerification(userCred.user);

    msg.textContent = "✅ Member registered successfully. Verification email sent!";
    msg.style.color = "green";
    e.target.reset();
  } catch(err){
    msg.textContent = "❌ " + err.message;
    msg.style.color = "red";
  }
});
