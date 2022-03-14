/*******************************************************************************
## UI -> Comments -> comment.js
## This will handle audio comments
*******************************************************************************/
/* eslint-disable */
$(document).on("click", ".btn-delete-memo", function () {
    let confirmation = confirm("delete this audio?");
    if (!confirmation) return;
  
    delete window.current_audio_comment_blob;
    $(".voice-memo-recorder-wrap").removeClass("recorded");
});
  
$(document).on("click", ".btn-upload-memo", () => {
    const $allAudios = $(".hidden-audio");
  
    $allAudios.each((i) => {
      $allAudios[i].pause();
      $allAudios[i].currentTime = 0;
    });
  
    let url = URL.createObjectURL(window.current_audio_comment_blob);
    getDuration(url, upload_voice_memo);
});
  
function upload_voice_memo(duration) {
  console.log("uploading");
  delete window.current_audio_comment_blob;
  $(".voice-memo-recorder-wrap").removeClass("recorded");
}
  
var getDuration = function (url, next) {
    let _player = new Audio(url);
    _player.addEventListener(
      "durationchange",
      function (e) {
        if (this.duration != Infinity) {
          const duration = format_time(this.duration);
          _player.remove();
          next(duration);
        }
      },
      false
    );
    _player.load();
    _player.currentTime = 24 * 60 * 60; //fake big time
    _player.volume = 0;
};
  
function format_time(duration) {
    let time = parseInt(duration);
    // hours = 3600s, skipping for now
  
    // minutes calculation
    let minutes = parseInt(time / 60);
  
    if (minutes > 0) {
      let minutes_time = minutes * 3600;
      time -= minutes_time;
  
      if (minutes < 10) {
        minutes = "0" + minutes;
      }
  
      minutes = minutes + ":";
    } else {
      minutes = "00:";
    }
  
    // seconds calculation
    let seconds = parseInt(time);
    if (seconds < 10) {
      seconds = "0" + seconds;
    }
  
    let formatted_time = minutes + seconds;
  
    return formatted_time;
}