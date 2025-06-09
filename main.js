const params = new URLSearchParams(window.location.search);
const appKey = params.get("appKey");
const lat = params.get("lat");
const lng = params.get("lng");

const script = document.createElement("script");
script.type = "text/javascript";
script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=clusterer,services`;
document.head.appendChild(script);

let map;
let bounds;

script.onload = () => {
  kakao.maps.load(() => {
    /** 지도 */
    const mapContainer = document.getElementById("map");

    const mapOption = {
      center: new kakao.maps.LatLng(lat, lng),
      level: 3,
    };

    map = new kakao.maps.Map(mapContainer, mapOption);
    bounds = new kakao.maps.LatLngBounds();
    // 예시: 좌표 추가
    bounds.extend(new kakao.maps.LatLng(lat, lng));
    console.log(">>>>>> bounds", bounds);
  });
};

function setBounds() {
  try {
    // LatLngBounds 객체에 추가된 좌표들을 기준으로 지도의 범위를 재설정합니다
    // 이때 지도의 중심좌표와 레벨이 변경될 수 있습니다
    map.setBounds(bounds);
  } catch (error) {
    console.log(">>>>> error", error);
    // 에러 발생 시 Flutter에 전송
    window.mapError.postMessage(`${error.message} \n bounds: ${bounds}`);
  }
}

window.setBounds = setBounds;
