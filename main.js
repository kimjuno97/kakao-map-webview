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

      window.mapTilesloaded.postMessage(
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

async function getAroundEscapeRooms({ storeId, distance }) {
  try {
    // 1. 쿼리 파라미터 처리
    const queryParams = new URLSearchParams();
    if (distance !== undefined) queryParams.append("meter", distance);

    // 2. 요청 URL 생성
    const url = `/v1/stores/${storeId}/around?${queryParams.toString()}`;

    // 3. fetch API로 GET 요청
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    });

    // 4. 응답이 정상이 아닌 경우 에러 처리
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    // 5. 응답 데이터 파싱
    const data = await res.json();

    // 6. BaseModel 구조 맞춰서 반환 (예시, 실제 구조에 맞게 수정 필요)
    // 여기서는 간단히 data 반환 (실제로는 BaseModel과 StoreModel 변환 필요)
    // 만약 BaseModel 구조가 { data: [...], isSuccess: boolean, error: ... } 라면 아래처럼
    const resModel = {
      data: data, // 또는 data.list 등 실제 데이터 위치에 따라 수정
      isSuccess: () => true, // 실제로는 data.isSuccess 또는 조건에 따라 반환
    };

    if (!resModel.isSuccess()) {
      // BaseModel.defaultError() 대응
      return { data: null, isSuccess: () => false };
    }

    return resModel;
  } catch (error) {
    console.error("Error fetching around escape rooms:", error);
    // 에러 발생 시 BaseModel.defaultError() 대응
    return { data: null, isSuccess: () => false };
  }
}

/// [TODO] 주변수로부터 storeId를 가져오는 로직을 추가해야 합니다.
function fetchNearbyEscapeRooms(distance) {
  const url = `https://dapi.zamfit.kr/v1/stores/${storeId}/around`;

  fetch(url)
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
      window.mapError.postMessage(error.message);
    });
}

window.fetchNearbyEscapeRooms = fetchNearbyEscapeRooms;
