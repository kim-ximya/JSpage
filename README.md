# JSmaked

Windows 98 스타일의 개인용 바탕화면 웹 페이지입니다. HTML, CSS, JavaScript로 구성되어 별도의 빌드 과정 없이 실행할 수 있습니다.

## 주요 기능

- 바로가기 추가·수정·삭제, 아이콘 선택 및 드래그 정렬
- Notepad 창 열기·이동과 상태 저장
- Start 메뉴에서 랜덤 배경화면 켜기·끄기
- 사용자 이름과 할 일 저장
- 현재 시각 및 위치 기반 날씨 표시

## 실행 방법

`index.html`을 브라우저에서 열거나 정적 파일 서버로 실행합니다. 위치 기반 날씨를 사용하려면 브라우저의 위치 권한이 필요하며, `localhost` 또는 HTTPS 환경을 권장합니다.

날씨는 API 키가 필요 없는 [Open-Meteo](https://open-meteo.com/)를 사용하며, 위치 이름은 [BigDataCloud](https://www.bigdatacloud.com/)에서 가져옵니다. 바로가기, 아이콘 정렬, 창 상태와 할 일은 브라우저의 `localStorage`에 저장됩니다.
