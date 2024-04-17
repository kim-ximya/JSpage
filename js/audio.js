const changeBtn = document.querySelectorAll("#audio-change button");
const playBtn = document.querySelector("#audio-controller button:first-child");
const pausedBtn = document.querySelector("#audio-controller button:last-child");
const musicTitle = document.querySelector("#title");

var tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName("script")[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player;
function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    height: "50",
    width: "320",
    videoId: "uDqvO3Lb_As",
    host: "http://www.youtube-nocookie.com",
    playerVars: { autoplay: 1, controls: 0 },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
    },
  });
}

function onPlayerReady(event) {
  event.target.setVolume(5);
  player.getPlaybackQuality("small");
  goToStart(event);
}
function onPlayerStateChange(event) {
  var tm = player.getCurrentTime();
  if (event.data == YT.PlayerState.ENDED) {
    goToStart(event);
  }
}
function goToStart(event) {
  event.target.seekTo(0, 1);
  player.playVideo();
}

// 음악 변경 파트
function onPlayBtnClick() {
  player.playVideo();
}
function onPausedBtnClick() {
  player.pauseVideo();
}

function changeVideo(videoId) {
  player.loadVideoById(videoId);
}
function chooseMusic(event) {
  const musicNum = event.target.dataset.music;
  let videoId = "";
  console.log(musicNum);
  if (musicNum === "1") {
    videoId = "uDqvO3Lb_As";
    changeVideo(videoId);
  } else if (musicNum === "2") {
    videoId = "6tI-0LBamGg";
    changeVideo(videoId);
  } else if (musicNum === "3") {
    videoId = "qIz-9CHVQUc";
    changeVideo(videoId);
  } else if (musicNum === "4") {
    videoId = "1O9kPoVJVB0";
    changeVideo(videoId);
  } else if (musicNum === "5") {
    videoId = "v7Srbp8WPMY";
    changeVideo(videoId);
  }
}

playBtn.addEventListener("click", onPlayBtnClick);
pausedBtn.addEventListener("click", onPausedBtnClick);

changeBtn.forEach((Button) => {
  Button.addEventListener("click", chooseMusic);
});
