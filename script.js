const firebaseConfig = {
  apiKey: "AIzaSyDra5G2BsIKm3UdP4uLO0mq46UY5fGKAPU",
  authDomain: "rolling-records-90b45.firebaseapp.com",
  projectId: "rolling-records-90b45",
  storageBucket: "rolling-records-90b45.appspot.com",
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
    zoom: 3,
    gestureHandling: "greedy",
  });

  // 테스트 마커
  const marker = new google.maps.Marker({
    position: { lat: 37.5665, lng: 126.9780 },
    map: map,
    title: "서울"
  });
}
