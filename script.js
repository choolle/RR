// 🔧 본인의 firebaseConfig 값으로 교체
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "xxxxxxx",
  appId: "xxxxxxxxxxxxxxxx"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

let map; // 지도 전역 변수

// 지도 초기화 함수
function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 37.5665, lng: 126.9780 }, // 서울 중심
    zoom: 2,
    gestureHandling: "greedy",
  });

  // 지도 클릭 시 폼에 위도/경도 입력
  map.addListener("click", (event) => {
    document.getElementById("lat").value = event.latLng.lat().toFixed(6);
    document.getElementById("lng").value = event.latLng.lng().toFixed(6);
  });

  // 저장된 기록 불러오기
  loadMarkers();
}

// 기록 폼 전송 처리
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
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });

    alert("기록이 저장되었습니다!");
    document.getElementById("recordForm").reset();
    loadMarkers(); // 마커 다시 불러오기
  } catch (err) {
    console.error("저장 실패:", err);
    alert("에러 발생! 콘솔 확인");
  }
});

// 저장된 기록 마커로 불러오기
async function loadMarkers() {
  const snapshot = await db.collection("records").orderBy("timestamp", "desc").get();
  snapshot.forEach((doc) => {
    const data = doc.data();
    const marker = new google.maps.Marker({
      position: { lat: data.lat, lng: data.lng },
      map: map,
      title: data.author,
    });

    const content = `
      <strong>${data.author}</strong><br/>
      ${data.memo.replace(/\n/g, "<br/>")}<br/>
      ${data.photoURL ? `<img src="${data.photoURL}" width="150"/>` : ""}
    `;
    const infowindow = new google.maps.InfoWindow({ content });

    marker.addListener("click", () => {
      infowindow.open(map, marker);
    });
  });
}
