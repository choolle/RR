const firebaseConfig = {
  apiKey: "AIzaSyDra5G2BsIKm3UdP4uLO0mq46UY5fGKAPU",
  authDomain: "rolling-records-90b45.firebaseapp.com",
  projectId: "rolling-records-90b45",
  storageBucket: "rolling-records-90b45.firebasestorage.app",
  messagingSenderId: "693337006685",
  appId: "1:693337006685:web:ce13aac3dedf5a7f56a3b4",
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
    zoomControl: true
  });

  map.addListener("click", (event) => {
    document.getElementById("lat").value = event.latLng.lat().toFixed(6);
    document.getElementById("lng").value = event.latLng.lng().toFixed(6);
  });

  loadMarkers();
}

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
    loadMarkers();
  } catch (err) {
    console.error("저장 실패:", err);
    alert("에러가 발생했습니다. 콘솔을 확인해주세요.");
  }
});

async function loadMarkers() {
  const snapshot = await db.collection("records")
    .where("lat", "!=", null)
    .get();

  const bounds = new google.maps.LatLngBounds();

  snapshot.forEach((doc) => {
    const data = doc.data();
    if (typeof data.lat === "number" && typeof data.lng === "number") {
      const position = { lat: data.lat, lng: data.lng };

      const marker = new google.maps.Marker({
        position,
        map: map,
        title: data.author
      });

      const content = `
        <strong>${data.author}</strong><br/>
        ${data.memo.replace(/\n/g, "<br/>")}<br/>
        ${data.photoURL ? `<img src="${data.photoURL}" width="150"/>` : ""}
      `;
      const info = new google.maps.InfoWindow({ content });

      marker.addListener("click", () => {
        info.open(map, marker);
      });

      bounds.extend(position); // 마커 위치를 범위에 포함
    }
  });

  if (!snapshot.empty) {
    map.fitBounds(bounds); // 마커들을 모두 포함하는 중심과 줌 레벨로 자동 조정
  }
}
