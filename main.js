// guide: https://apis.map.kakao.com/web/sample/addMarkerClickEvent/

/** 하버사인 공식 함수 구현  */
function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // 지구 반지름(m)
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d); // 미터 단위로 반환
}

/** 선택된 스토어를 변경하는 함수 */
function changeSelectStoreMaker() {
  const findStoreEls = Array.from(document.getElementsByClassName("storeId"));

  findStoreEls.forEach((storeEl) => {
    const currentStoreId = Number(storeEl.getAttribute("data-store-id"));
    const isSelected = currentStoreId === selectedStoreId;

    const storeNameEl = storeEl.querySelector(".storeName");
    const storeImgEl = storeEl.querySelector(".storeImg");

    if (storeNameEl) {
      storeNameEl.style.backgroundColor = isSelected ? "#d2ff53" : "#E3E3E3";
    }

    if (storeImgEl) {
      const isMain = storeEl.getAttribute("data-is-main") === "true";
      if (isMain) {
        storeImgEl.src = isSelected ? mainMarkerOnSrc : mainMarkerOffSrc;
      } else {
        storeImgEl.src = isSelected ? subMarkerOnSrc : subMarkerOffSrc;
      }
    }
  });
}

/** URL 파라미터에서 boolean 값을 가져오는 함수 */
function getBooleanParam(value) {
  if (value === "true" || value === true) return true;
  if (value === "false" || value === false) return false;
  // 기본값 (값이 없거나, "true", "false", true, false가 아닐 때)
  return true; // 또는 원하는 기본값 (false도 가능)
}

const params = new URLSearchParams(window.location.search);
const appKey = params.get("appKey");
const lat = params.get("lat");
const lng = params.get("lng");
const storeId = params.get("storeId");
const accessToken = params.get("accessToken");
const storeName = params.get("storeName") || "탈출방";
const isDraggable = getBooleanParam(params.get("isDraggable"));
const isZoomable = getBooleanParam(params.get("isZoomable"));

const levelStr = params.get("level");
const level = levelStr ? parseInt(levelStr, 10) : 3;
const isOnlyMarker = params.get("isOnlyMarker") === "true";

const script = document.createElement("script");
script.type = "text/javascript";
script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services,clusterer,drawing`;
document.head.appendChild(script);

let bounds;
let map;

const mainMarkerOnSrc = "https://i.ibb.co/6c7DbZSp/main-marker-on.png";
const mainMarkerOffSrc = "https://i.ibb.co/PGLrxysb/main-marker-off.png";

const subMarkerOnSrc = "https://i.ibb.co/GQP8tgVB/sub-marker-on.png";
const subMarkerOffSrc = "https://i.ibb.co/8gdYHvcB/sub-marker-off.png";

let selectedStoreId = storeId;

/** 화면에 보여지는 마커 표시 */
const showMainMarker = new Set([]);

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

function createIwContent({ storeName, isOn, isMain, storeId }) {
  const bgColor = isOn ? "#d2ff53" : "#E3E3E3";
  const markerSrc = isMain
    ? isOn
      ? mainMarkerOnSrc
      : mainMarkerOffSrc
    : isOn
    ? subMarkerOnSrc
    : subMarkerOffSrc;

  return `
<div 
  id="${storeId}" 
  class="my-overlay storeId" 
  data-store-id="${storeId}" 
  data-is-main="${isMain}"
  style="display: flex; 
  flex-direction: column; 
  justify-content: center; 
  align-items: center;
  "> 
 ${
   isOnlyMarker
     ? ""
     : `<div
          class="storeName"
          style="
            padding: 6px;
            background: ${bgColor};
            box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.2);
            border-radius: 4px;
            outline: 1px #7c3fff solid;
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
          ">
            ${storeName}
        </div>`
 }
  <img
    src="${markerSrc}"
    class="storeImg"
    style="width: ${isMain ? "48px" : "20px"}; height: ${
    isMain ? "56px" : "20px"
  }; object-fit: contain;"
      />
  </div>
</div>
  `;
}

function renderOverlay({ storeName, storeId, isOn, isMain, position }) {
  if (showMainMarker.has(storeId)) {
    console.log("이미 표시된 마커입니다:", storeId);
    return;
  }
  showMainMarker.add(storeId);

  const iwContent = createIwContent({
    storeName,
    isOn,
    isMain,
    storeId,
  });

  const customOverlay = new kakao.maps.CustomOverlay({
    map: map,
    position,
    yAnchor: 1,
    content: iwContent,
    clickable: true,
  });
}

script.onload = () => {
  kakao.maps.load(() => {
    /** 지도 */
    const mapContainer = document.getElementById("map");
    const center = new kakao.maps.LatLng(lat, lng);

    const mapOption = {
      center: center,
      draggable: isDraggable,
      zoomable: isZoomable,
      level,
    };

    console.log("## mapOption", mapOption);

    map = new kakao.maps.Map(mapContainer, mapOption);
    bounds = new kakao.maps.LatLngBounds();

    renderOverlay({
      storeId,
      storeName,
      isOn: selectedStoreId === storeId,
      isMain: true,
      position: center,
    });
    const iwContent = createIwContent({
      storeName: storeName,
      isOn: selectedStoreId === storeId,
      isMain: true,
      storeId: storeId,
    });

    mainCustomOverlay = new kakao.maps.CustomOverlay({
      map: map,
      position: center,
      yAnchor: 1,
      content: iwContent,
      clickable: true, // 클릭 가능하게 설정
    });

    // 왜인지 동작안함.
    // setZoomable(isZoomable);
    // setDraggable(isDraggable);

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
        const bounds = map.getBounds();
        const ne = bounds.getNorthEast();

        const distance = getDistanceFromLatLonInMeters(
          center.getLat(),
          center.getLng(),
          ne.getLat(),
          ne.getLng()
        );

        console.log("중심과 북동쪽 경계 간 거리(m):", distance);
        fetchNearbyEscapeRooms(distance);
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
    selectedStoreId = Number(storeId);
    changeSelectStoreMaker();
    // map.setLevel(3); // 필요하다면 사용
  } catch (error) {
    console.log("Error setBounds", error);
    if (typeof window.mapError !== "undefined") {
      window.mapError.postMessage(error.message);
    }
  }
}

window.setBounds = setBounds;

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

          renderOverlay({
            storeId: room.storeId,
            storeName: room.title,
            isOn: selectedStoreId === room.storeId,
            isMain: false,
            position,
          });
        });
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

zIndex = 1;

document.addEventListener("click", (e) => {
  const overlayEl = e.target.closest(".my-overlay");

  console.log("클릭된 overlay element", overlayEl);
  overlayEl.style.zIndex = zIndex;
  zIndex++;
  if (overlayEl) {
    selectedStoreId = Number(overlayEl.getAttribute("data-store-id"));
    if (typeof window.changeSelectStore !== "undefined") {
      window.changeSelectStore.postMessage(selectedStoreId);
    }
    changeSelectStoreMaker();
  }
});

function setZoomable(zoomable) {
  console.log("## setZoomable", zoomable);
  map.setZoomable(zoomable);
}

window.setZoomable = setZoomable;

// 버튼 클릭에 따라 지도 이동 기능을 막거나 풀고 싶은 경우에는 map.setDraggable 함수를 사용합니다
function setDraggable(draggable) {
  console.log("## setDraggable", draggable);
  // 마우스 드래그로 지도 이동 가능여부를 설정합니다
  map.setDraggable(draggable);
}

window.setDraggable = setZoomable;
