let map;
let markers = [];
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

function switchView(view) {
  document.getElementById('map').style.display = view === 'map' ? 'block' : 'none';
  document.getElementById('formContainer').style.display = view === 'form' ? 'block' : 'none';
  document.getElementById('listContainer').style.display = view === 'list' ? 'block' : 'none';
  document.getElementById('aboutContainer').style.display = view === 'about' ? 'block' : 'none';
  if (view === 'map') loadMarkers();
  if (view === 'list') loadList();
  if (view === 'about') loadAbout();
}

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 37.5665, lng: 126.9780 },
    zoom: 3,
    gestureHandling: "greedy"
  });
  map.addListener("click", (event) => {
    document.getElementById("lat").value = event.latLng.lat().toFixed(6);
    document.getElementById("lng").value = event.latLng.lng().toFixed(6);
  });
  loadMarkers();
}

async function loadMarkers() {
  markers.forEach(marker => marker.setMap(null));
  markers = [];
  const snapshot = await db.collection("records").get();
  snapshot.forEach(doc => {
    const data = doc.data();
    const marker = new google.maps.Marker({
      position: { lat: data.lat, lng: data.lng },
      map,
      title: data.author
    });
    markers.push(marker);
    const content = `
      <strong>${data.author}</strong><br/>
      ${data.memo.replace(/\n/g, "<br/>")}<br/>
      ${data.photoURL ? '<img src="' + data.photoURL + '" width="150" />' : ''}<br/>
      <a href="#" onclick="adminAction('${doc.id}')">admin</a>
    `;
    const info = new google.maps.InfoWindow({ content });
    marker.addListener("click", () => info.open(map, marker));
  });
}

document.getElementById("recordForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const lat = parseFloat(document.getElementById("lat").value);
  const lng = parseFloat(document.getElementById("lng").value);
  const author = document.getElementById("author").value;
  const memo = document.getElementById("memo").value;
  const password = document.getElementById("password").value;
  const photo = document.getElementById("photo").files[0];

  if (password !== "okayokay") return alert("암호가 틀렸습니다.");
  try {
    let photoURL = "";
    if (photo) {
      const ref = storage.ref("photos/" + Date.now() + "_" + photo.name);
      await ref.put(photo);
      photoURL = await ref.getDownloadURL();
    }
    await db.collection("records").add({ lat, lng, author, memo, photoURL });
    alert("저장 완료!");
    document.getElementById("recordForm").reset();
    loadMarkers();
  } catch (e) { console.error(e); }
});

async function adminAction(id) {
  const pw = prompt("암호?");
  if (pw !== "okayokay") return;
  if (confirm("삭제할까요?")) {
    await db.collection("records").doc(id).delete();
    loadMarkers();
  }
}

async function loadList() {
  const list = document.getElementById("listContainer");
  list.innerHTML = "";
  const snapshot = await db.collection("records").get();
  snapshot.forEach(doc => {
    const d = doc.data();
    list.innerHTML += `<div><strong>${d.author}</strong>: ${d.memo}</div><hr/>`;
  });
}

async function loadAbout() {
  const doc = await db.collection("about").doc("info").get();
  document.getElementById("aboutContent").innerText = doc.exists ? doc.data().text : "설명 없음";
}

function editAbout() {
  const pw = prompt("암호?");
  if (pw !== "okayokay") return;
  const content = prompt("내용?");
  db.collection("about").doc("info").set({ text: content });
  loadAbout();
}