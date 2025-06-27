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
window.initMap = async function () {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 37.5665, lng: 126.9780 },
    zoom: 3,
    gestureHandling: "greedy",
  });

  map.addListener("click", (event) => {
    document.getElementById("lat").value = event.latLng.lat().toFixed(6);
    document.getElementById("lng").value = event.latLng.lng().toFixed(6);
  });

  await loadMarkers();
};

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
      const storageRef = storage.ref().child(`photos/${Date.now()}_${photo.name}`);
      await storageRef.put(photo);
      photoURL = await storageRef.getDownloadURL();
    }

    await db.collection("records").add({
      lat, lng, author, memo, photoURL,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert("기록이 저장되었습니다!");
    document.getElementById("recordForm").reset();
    await loadMarkers();
  } catch (err) {
    console.error("저장 실패:", err);
    alert("에러가 발생했습니다. 콘솔을 확인해주세요.");
  }
});

async function loadMarkers() {
  const snapshot = await db.collection("records").orderBy("timestamp", "desc").get();
  document.getElementById("recordList").innerHTML = "";
  snapshot.forEach((doc) => {
    const data = doc.data();
    const marker = new google.maps.Marker({
      position: { lat: data.lat, lng: data.lng },
      map: map,
      title: data.author
    });

    const content = `
      <strong>${data.author}</strong><br/>
      ${data.memo.replace(/\n/g, "<br/>")}<br/>
      ${data.photoURL ? `<img src="${data.photoURL}" width="150"/>` : ""}<br/>
      <button onclick="deleteRecord('${doc.id}')">admin</button>
    `;
    const info = new google.maps.InfoWindow({ content });
    marker.addListener("click", () => info.open(map, marker));

    const li = document.createElement("li");
    li.innerHTML = `${data.author}: ${data.memo}`;
    document.getElementById("recordList").appendChild(li);
  });
}

async function deleteRecord(id) {
  const pw = prompt("관리자 암호를 입력하세요:");
  if (pw !== "okayokay") return;
  await db.collection("records").doc(id).delete();
  await loadMarkers();
}

function showPage(id) {
  ["map", "form", "list", "about"].forEach(p => {
    document.getElementById(p).style.display = (p === id ? "block" : "none");
  });
  if (id === "map") {
    setTimeout(() => google.maps.event.trigger(map, "resize"), 100);
  }
}

document.getElementById("aboutForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const pw = document.getElementById("aboutPassword").value;
  if (pw !== "okayokay") {
    alert("암호가 틀렸습니다.");
    return;
  }
  const text = document.getElementById("aboutText").value;
  await db.collection("about").doc("info").set({ text });
  alert("저장되었습니다!");
  loadAbout();
});

async function loadAbout() {
  const doc = await db.collection("about").doc("info").get();
  if (doc.exists) {
    document.getElementById("aboutContent").innerText = doc.data().text;
  }
}
loadAbout();
