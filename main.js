const params = new URLSearchParams(window.location.search);
const appKey = params.get("appKey");
const lat = params.get("lat");
const lng = params.get("lng");
const storeId = params.get("storeId");
const accessToken = params.get("accessToken");
const storeName = params.get("storeName") || "탈출방";

const levelStr = params.get("level");
const level = levelStr ? parseInt(levelStr, 10) : 3;

const script = document.createElement("script");
script.type = "text/javascript";
script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=clusterer,services`;
document.head.appendChild(script);

let bounds;
let map;

const mainMarkerOnSrc = "https://i.ibb.co/0jFbQP9K/main-marker-on.png";
const mainMarkerOffSrc = "https://i.ibb.co/VWMdyQZS/main-marker-off.png";

const subMarkerOnSrc = "https://i.ibb.co/RkXb85kr/sub-marker-off.png";
const subMarkerOffSrc = "https://i.ibb.co/XfZCvHfH/sub-marker-on.png";

function createMainMarkerImage(isOn) {
  const src = isOn ? mainMarkerOnSrc : mainMarkerOffSrc;
  const imageSize = new kakao.maps.Size(48, 56);
  const imageOption = { offset: new kakao.maps.Point(0, 56) };
  return new kakao.maps.MarkerImage(src, imageSize, imageOption);
}

function createSubMarkerImage(isOn) {
  const src = isOn ? subMarkerOnSrc : subMarkerOffSrc;
  const imageSize = new kakao.maps.Size(20, 20);
  const imageOption = { offset: new kakao.maps.Point(0, 20) };
  return new kakao.maps.MarkerImage(src, imageSize, imageOption);
}

function createIwContent({ storeName, isOn }) {
  const bgColor = isOn ? "#d2ff53" : "#E3E3E3";
  return `
    <div
      style="
        padding: 6px;
        background: ${bgColor};
        box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.2);
        border-radius: 4px;
        outline: 1px #7c3fff solid;
        outline-offset: -1px;
        justify-content: center;
        align-items: center;
        gap: 10px;
        display: inline-flex;
      "
    >
      <div
        style="
          max-width: 70px;
          text-align: center;
          color: #353535;
          font-size: 11px;
          font-family: Pretendard, sans-serif;
          font-weight: 500;
          word-wrap: break-word;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        "
      >
        ${storeName}
      </div>
    </div>
  `;
}

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
    const markerImage = createMainMarkerImage(true);

    const marker = new kakao.maps.Marker({
      position: center,
      image: markerImage,
    });

    marker.setMap(map);

    const iwContent = createIwContent({
      storeName: storeName,
      isOn: true,
    });

    const infowindow = new kakao.maps.CustomOverlay({
      position: center,
      content: iwContent,
    });

    infowindow.open(map, marker);
    setZoomable(true);
    bounds.extend(center);

    fetchNearbyEscapeRooms(300);

    // [지도 이벤트 리스너 설정](https://apis.map.kakao.com/web/documentation/#Map_Events)
    // 지도 중심 좌표가 바뀔 때마다 실행되는 콜백
    kakao.maps.event.addListener(map, "tilesloaded", function () {
      try {
        console.log(
          "확대수준이 변경되거나 지도가 이동했을때 타일 이미지 로드가 모두 완료되면 발생한다.",
          map.getCenter()
        );
        const center = map.getCenter();

        if (typeof window.mapTilesloaded !== "undefined") {
          // Flutter WebView용
          window.mapTilesloaded.postMessage("mapTilesloaded");
        }
      } catch (error) {
        console.log("Error tilesloaded", error);

        if (typeof window.mapError !== "undefined") {
          // Flutter WebView용
          window.mapError.postMessage(error.message);
        }
      }
    });

    kakao.maps.event.addListener(map, "dragend", function () {
      try {
        console.log("드래그가 끝날 때 발생한다.", map.getCenter());
        const center = map.getCenter();
        if (typeof window.dragend !== "undefined") {
          // Flutter WebView용
          window.dragend.postMessage("dragend");
        }
      } catch (error) {
        console.log("Error dragend", error);
        if (typeof window.mapError !== "undefined") {
          // Flutter WebView용
          window.mapError.postMessage(error.message);
        }
      }
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
    if (typeof window.mapError !== "undefined") {
      window.mapError.postMessage(error.message);
    }
  }
}

window.setBounds = setBounds;

function setZoomable(zoomable) {
  map.setZoomable(zoomable);
}

window.setZoomable = setZoomable;

function fetchNearbyEscapeRooms(distance) {
  // 1. 쿼리 파라미터 처리
  const queryParams = new URLSearchParams();
  if (distance !== undefined) queryParams.append("meter", distance);

  // 2. 요청 URL 생성
  const url = `https://user-api.zamfit.kr/v1/stores/${storeId}/around?${queryParams.toString()}`;

  fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch nearby escape rooms");
      }
      return response.json();
    })
    .then(({ data }) => {
      if (data && Array.isArray(data)) {
        data.forEach((room) => {
          if (room.storeId == storeId) return;

          const position = new kakao.maps.LatLng(room.y, room.x);

          const markerImage = createSubMarkerImage(false);

          const marker = new kakao.maps.Marker({
            position: position,
            image: markerImage,
          });

          marker.setMap(map);

          const iwContent = createIwContent({
            storeName: storeName,
            isOn: true,
          });

          const infowindow = new kakao.maps.CustomOverlay({
            position: center,
            content: iwContent,
          });

          infowindow.open(map, marker);

          // kakao.maps.event.addListener(marker, "mouseover", () => {});

          // kakao.maps.event.addListener(marker, "mouseout", () => {
          //   infoWindow.close();
          // });
        });

        // map.setBounds(bounds);
      }
    })
    .catch((error) => {
      console.error("Error fetching escape rooms:", error);
      if (typeof window.mapError !== "undefined") {
        // Flutter WebView용
        window.mapError.postMessage(error.message);
      }
    });
}

window.fetchNearbyEscapeRooms = fetchNearbyEscapeRooms;
