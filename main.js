const params = new URLSearchParams(window.location.search);
const appKey = params.get("appKey");
const lat = params.get("lat");
const lng = params.get("lng");
const levelStr = params.get("level");
const level = levelStr ? parseInt(levelStr, 10) : 3;

// const width = params.get("width");
// const height = params.get("height");
// const elem = document.getElementById("map");
// elem.style.width = `${width}px`;
// elem.style.height = `${height}px`;

const script = document.createElement("script");
script.type = "text/javascript";
script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=clusterer,services`;
document.head.appendChild(script);

let map;
let bounds;
let marker;

script.onload = () => {
  kakao.maps.load(() => {
    /** 지도 */
    const mapContainer = document.getElementById("map");
    const center = new kakao.maps.LatLng(lat, lng);

    const mapOption = {
      center: center,
      level,
    };

    map = new kakao.maps.Map(mapContainer, mapOption);
    bounds = new kakao.maps.LatLngBounds();

    marker = new kakao.maps.Marker({
      position: center,
    });
    marker.setMap(map);
    setZoomable(true);
    bounds.extend(center);

    // 지도 중심 좌표가 바뀔 때마다 실행되는 콜백
    kakao.maps.event.addListener(map, "center_changed", function () {
      console.log("지도 중심이 바뀌었습니다!", map.getCenter());

      const center = map.getCenter();

      window.postMessage(
        JSON.stringify({
          type: "mapCenterChanged",
          lat: center.getLat(),
          lng: center.getLng(),
        })
      );
    });

    // 지도 줌 레벨이 바뀔 때마다 실행되는 콜백
    kakao.maps.event.addListener(map, "zoom_changed", function () {
      console.log("지도 줌이 바뀌었습니다!", map.getLevel());
      // 원하는 로직 추가

      const center = map.getCenter();

      window.postMessage(
        JSON.stringify({
          type: "zoomChanged",
          lat: center.getLat(),
          lng: center.getLng(),
        })
      );
    });

    // 지도 영역이 바뀔 때마다 실행되는 콜백
    kakao.maps.event.addListener(map, "bounds_changed", function () {
      console.log("지도 영역이 바뀌었습니다!", map.getBounds());
      // 원하는 로직 추가

      const center = map.getCenter();

      window.postMessage(
        JSON.stringify({
          type: "boundsChanged",
          lat: center.getLat(),
          lng: center.getLng(),
        })
      );
    });
  });
};

function setBounds() {
  try {
    // LatLngBounds 객체에 추가된 좌표들을 기준으로 지도의 범위를 재설정합니다
    // 이때 지도의 중심좌표와 레벨이 변경될 수 있습니다
    map.setBounds(bounds);
    map.setLevel(3); // 필요하다면 사용
  } catch (error) {
    console.log("Error setBounds", error);
    window.mapError.postMessage(`${error.message} \n bounds: ${bounds}`);
  }
}

window.setBounds = setBounds;

function setZoomable(zoomable) {
  map.setZoomable(zoomable);
}

window.setZoomable = setZoomable;
