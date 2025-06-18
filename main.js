// guide: https://apis.map.kakao.com/web/sample/addMarkerClickEvent/

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

const mainMarkerOnSrc = "https://i.ibb.co/6c7DbZSp/main-marker-on.png";
const mainMarkerOffSrc = "https://i.ibb.co/PGLrxysb/main-marker-off.png";

const subMarkerOnSrc = "https://i.ibb.co/GQP8tgVB/sub-marker-on.png";
const subMarkerOffSrc = "https://i.ibb.co/8gdYHvcB/sub-marker-off.png";

let selectedStoreId = storeId;
let mainCustomOverlay;
let subCustomOverlay = [];

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
   <div id="${storeId}" class="storeId" style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
    <div
      class="storeName"
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
      <img
        src="${markerSrc}"
        class="storeImg"
        style="width: ${isMain ? "48px" : "20px"}; height: ${
    isMain ? "56px" : "20px"
  }; object-fit: contain;"
      />
   </div>
  `;
}

function renderOverlay({ storeName, storeId, isOn, isMain, position }) {
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

  setTimeout(() => {
    const el = document.getElementById(storeId);
    if (el) {
      el.addEventListener("click", function () {
        // customOverlay.setMap(null); // 오버레이 닫기
        // // 상태값만 변경
        // selectedStoreId = storeId;
        // console.log("changed selectedStoreId", selectedStoreId);
        // // 전체 오버레이를 상태에 맞게 다시 그리기
        // renderOverlay({
        //   storeName,
        //   isOn: selectedStoreId === storeId,
        //   isMain,
        //   storeId,
        //   position,
        // });

        selectedStoreId = storeId;
        const findStoreEls = document.getElementsByClassName("storeId");

        for (let i = 0; i < findStoreEls.length; i++) {
          const storeEl = findStoreEls[i];
          // [MEMO] storeEl.id가 string이고 storeId가 number일 수 있음
          const isMain = storeEl.id == storeId;
          console.log(
            ">>>>>> isMain",
            isMain,
            "storeId",
            storeId,
            "storeEl.id",
            storeEl.id,
            "typeof storeEl.id",
            typeof storeEl.id,

            "typeof storeId",
            typeof storeId
          );

          const storeNameEl = storeEl.querySelector(".storeName");
          const storeImgEl = storeEl.querySelector(".storeImg");

          /// storeNameEl이 존재하는지 확인
          if (storeEl.id === selectedStoreId) {
            storeNameEl.style.backgroundColor = "#d2ff53";
            storeImgEl.src = isMain ? mainMarkerOnSrc : subMarkerOnSrc;
          } else {
            storeNameEl.style.backgroundColor = "#E3E3E3";
            storeImgEl.src = isMain ? mainMarkerOffSrc : subMarkerOffSrc;
          }
        }
      });
    }
  }, 0);
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
