/*******************************************************************************
## UI -> audio_player -> audio-player.js
## This will handle custom audio player events
*******************************************************************************/
/* eslint-disable */
$(document).on("click", ".btn-play-audio", (e) => {
    const el = e.target;
    const $this = $(el);
    const $grand_wrap = $this.parents(".comment-voice-memo");
    const $main_wrap = $this.parents(".voice-memo-wrapper");
    const $audio_id = $main_wrap.find(".hidden-audio-id").find("span").attr("id");
    const $audio_container = $main_wrap.find(".hidden-audio-container");
    const $audio_exists = $audio_container.find(".hidden-audio");
    const $otherAudios = $(".hidden-audio");
  
    $otherAudios.each((i) => {
      $otherAudios[i].pause();
    });
  
    // in case audio already fetched
    if ($audio_exists.length) {
      $audio_exists[0].play();
      return;
    }
  
    $grand_wrap.addClass("loading");
  
    // in case audio not fetched till now
    const file = "/private/files/" + $audio_id + ".mp3";
    let audio = new Audio(file);
    const $audio = $(audio);
    $audio.addClass("hidden-audio");
    $audio_container.append($audio);
  
    // event bindings to newly fetched audio
    $audio.on("timeupdate", audio_timeupdate);
    $audio.on("play", audio_play);
    $audio.on("pause", audio_pause);
    $audio.on("ended", audio_ended);
  
    // load audio completely before play
    audio.addEventListener("durationchange", (e) => {
      if (audio.duration != Infinity) {
        audio.currentTime = 0;
        setTimeout(() => {
          audio.play();
          $grand_wrap.removeClass("loading");
        }, 500);
        return;
      }
    });
  
    audio.load();
    audio.currentTime = 24 * 60 * 60;
});
  
$(document).on("click", ".btn-pause-audio", (e) => {
    const el = e.target;
    const $this = $(el);
    const $main_wrap = $this.parents(".voice-memo-wrapper");
    const $audio = $main_wrap.find(".hidden-audio");
  
    $audio[0].pause();
});
  
$(document).on("change", ".player-progress-bar", (e) => {
    e.preventDefault();
    console.log("in progress");
    return;
    const el = e.target;
    const $this = $(el);
    const val = $this.val();
    const $main_wrap = $this.parents(".voice-memo-wrapper");
    const $audio = $main_wrap.find(".hidden-audio");
    let audio = $audio[0];
  
    const unit_per = audio.duration / 100;
    const new_cur_time = parseInt(val * unit_per);
    audio.currentTime = new_cur_time;
});
  
// Audio Functions
function audio_play(e) {
    const audio = e.target;
    const $this = $(audio);
    const $main_wrap = $this.parents(".voice-memo-wrapper");
    const $player_controls = $main_wrap.find(".player-controls");
    $player_controls.addClass("playing");
}
  
function audio_timeupdate(e) {
    const audio = e.target;
    const $this = $(audio);
    const $main_wrap = $this.parents(".voice-memo-wrapper");
    const $cur_time = $main_wrap.find(".cur-time");
    const current_time = audio.currentTime;
    const duration = audio.duration;
    const unit_per = duration / 100;
    const $slide_progress = $main_wrap.find(".player-progress-bar");
  
    $cur_time.html(format_time(current_time));
  
    let current_val = current_time / unit_per;
  
    current_val = parseInt(current_val);
  
    $slide_progress.val(current_val);
    let $bg =
      "linear-gradient(to right, #1a5594 0%, #1a5594 " +
      current_val +
      "%, #d3d3d3 " +
      current_val +
      "%, #d3d3d3 100%)";
  
    $slide_progress.css("background", $bg);
}
  
function audio_pause(e) {
    const audio = e.target;
    const $this = $(audio);
    const $main_wrap = $this.parents(".voice-memo-wrapper");
    const $player_controls = $main_wrap.find(".player-controls");
    $player_controls.removeClass("playing");
}
  
function audio_ended(e) {
    const audio = e.target;
    audio.currentTime = 0;
    const $this = $(audio);
    const $main_wrap = $this.parents(".voice-memo-wrapper");
    const $player_controls = $main_wrap.find(".player-controls");
    $player_controls.removeClass("playing");
}