const params = new URLSearchParams(window.location.search);
const appKey = params.get("appKey");
const lat = params.get("lat");
const lng = params.get("lng");
const storeId = params.get("storeId");
const accessToken = params.get("accessToken");

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

        if (typeof mapTilesloaded !== "undefined") {
          // Flutter WebView용
          mapTilesloaded.postMessage("mapTilesloaded");
        }
      } catch (error) {
        console.log("Error tilesloaded", error);

        if (typeof mapError !== "undefined") {
          // Flutter WebView용
          mapError.postMessage(error.message);
        }
      }
    });

    kakao.maps.event.addListener(map, "dragend", function () {
      try {
        console.log("드래그가 끝날 때 발생한다.", map.getCenter());
        const center = map.getCenter();
        if (typeof dragend !== "undefined") {
          // Flutter WebView용
          dragend.postMessage("dragend");
        }
      } catch (error) {
        console.log("Error dragend", error);
        if (typeof mapError !== "undefined") {
          // Flutter WebView용
          mapError.postMessage(error.message);
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
    if (typeof mapError !== "undefined") {
      mapError.postMessage(error.message);
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
    .then((data) => {
      data.forEach((room) => {
        const position = new kakao.maps.LatLng(room.lat, room.lng);
        const marker = new kakao.maps.Marker({
          position: position,
        });
        marker.setMap(map);
        bounds.extend(position);

        const infoWindow = new kakao.maps.InfoWindow({
          content: `<div style="padding:5px;">${room.name}</div>`,
        });

        kakao.maps.event.addListener(marker, "mouseover", () => {
          infoWindow.open(map, marker);
        });

        kakao.maps.event.addListener(marker, "mouseout", () => {
          infoWindow.close();
        });
      });

      map.setBounds(bounds);
    })
    .catch((error) => {
      console.error("Error fetching escape rooms:", error);
      if (typeof mapError !== "undefined") {
        // Flutter WebView용
        mapError.postMessage(error.message);
      }
    });
}

window.fetchNearbyEscapeRooms = fetchNearbyEscapeRooms;
