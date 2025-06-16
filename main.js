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

    // [지도 이벤트 리스너 설정](https://apis.map.kakao.com/web/documentation/#Map_Events)
    // 지도 중심 좌표가 바뀔 때마다 실행되는 콜백
    kakao.maps.event.addListener(map, "tilesloaded", function () {
      console.log(
        "확대수준이 변경되거나 지도가 이동했을때 타일 이미지 로드가 모두 완료되면 발생한다.",
        map.getCenter()
      );

      const center = map.getCenter();

      window.mapTilesloaded.postMessage(
        JSON.stringify({
          type: "mapTilesloaded",
          lat: center.getLat(),
          lng: center.getLng(),
        })
      );
    });

    kakao.maps.event.addListener(map, "dragend", function () {
      console.log("드래그가 끝날 때 발생한다.", map.getCenter());

      const center = map.getCenter();

      window.mapDragend.postMessage(
        JSON.stringify({
          type: "mapDragend",
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
