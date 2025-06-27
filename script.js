
const firebaseConfig = {
  apiKey: "AIzaSyDra5G2BsIKm3UdP4uLO0mq46UY5fGKAPU",
  authDomain: "rolling-records-90b45.firebaseapp.com",
  projectId: "rolling-records-90b45",
  storageBucket: "rolling-records-90b45.appspot.com",
  messagingSenderId: "693337006685",
  appId: "1:693337006685:web:ce13aac3dedf5a7f56a3b4"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

let map;
function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 37.5665, lng: 126.9780 },
    zoom: 2,
    gestureHandling: "greedy",
    zoomControl: true,
    scrollwheel: true
  });

  map.addListener("click", (event) => {
    document.getElementById("lat").value = event.latLng.lat().toFixed(6);
    document.getElementById("lng").value = event.latLng.lng().toFixed(6);
  });

  loadMarkers();
}

async function loadMarkers() {
  const snapshot = await db.collection("records").orderBy("timestamp", "desc").get();
  snapshot.forEach((doc) => {
    const data = doc.data();
    const marker = new google.maps.Marker({
      position: { lat: data.lat, lng: data.lng },
      map: map,
      title: data.author
    });

    const content = document.createElement("div");
    content.innerHTML = `
      <strong>${data.author}</strong><br/>
      ${data.memo.replace(/\n/g, "<br/>")}<br/>
      ${data.photoURL ? `<img src="${data.photoURL}" width="150"/><br/>` : ""}
      <button onclick="adminPrompt('${doc.id}')">admin</button>
    `;
    const info = new google.maps.InfoWindow({ content });
    marker.addListener("click", () => info.open(map, marker));
  });
}

async function adminPrompt(docId) {
  const pw = prompt("암호를 입력하세요:");
  if (pw === "okayokay") {
    if (confirm("정말 삭제할까요?")) {
      await db.collection("records").doc(docId).delete();
      alert("삭제되었습니다.");
      location.reload();
    }
  } else {
    alert("암호가 틀렸습니다.");
  }
}

document.querySelectorAll("nav button").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("main section").forEach((sec) => sec.classList.remove("active"));
    document.getElementById(btn.dataset.target).classList.add("active");
    if (btn.dataset.target === "mapSection") location.reload();
    if (btn.dataset.target === "listSection") loadList();
    if (btn.dataset.target === "aboutSection") loadAbout();
  });
});

document.getElementById("recordForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const lat = parseFloat(document.getElementById("lat").value);
  const lng = parseFloat(document.getElementById("lng").value);
  const author = document.getElementById("author").value;
  const memo = document.getElementById("memo").value;
  const password = document.getElementById("password").value;
  const photo = document.getElementById("photo").files[0];

  if (password !== "okayokay") {
    alert("관리자 암호가 틀렸습니다.");
    return;
  }

  try {
    let photoURL = "";
    if (photo) {
      const storageRef = storage.ref().child(\`photos/\${Date.now()}_\${photo.name}\`);
      await storageRef.put(photo);
      photoURL = await storageRef.getDownloadURL();
    }

    await db.collection("records").add({
      lat, lng, author, memo, photoURL,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert("기록이 저장되었습니다!");
    document.getElementById("recordForm").reset();
    location.reload();
  } catch (err) {
    console.error("저장 실패:", err);
    alert("에러가 발생했습니다.");
  }
});

async function loadList() {
  const list = document.getElementById("recordList");
  list.innerHTML = "";
  const snapshot = await db.collection("records").orderBy("timestamp", "desc").get();
  snapshot.forEach((doc) => {
    const data = doc.data();
    const item = document.createElement("li");
    item.innerHTML = \`
      <strong>\${data.author}</strong> - (\${data.lat}, \${data.lng})<br/>
      \${data.memo.replace(/\n/g, "<br/>")}
      \${data.photoURL ? \`<br/><img src="\${data.photoURL}" width="100"/>\` : ""}
      <hr/>
    \`;
    list.appendChild(item);
  });
}

async function loadAbout() {
  const doc = await db.collection("about").doc("main").get();
  const content = doc.exists ? doc.data().text : "작성된 설명이 없습니다.";
  document.getElementById("aboutContent").innerHTML = content.replace(/\n/g, "<br/>");
}

document.getElementById("aboutForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = document.getElementById("aboutText").value;
  const pw = document.getElementById("aboutPassword").value;
  if (pw !== "okayokay") {
    alert("암호가 틀렸습니다.");
    return;
  }
  await db.collection("about").doc("main").set({ text });
  alert("저장되었습니다.");
  loadAbout();
});
