/* eslint-disable */
"use strict";

function login() {
  document.location.href = "chat.html";
}
/*******************************************************************************
## UI -> Comments -> comment.js
## This will handle audio comments
*******************************************************************************/
/* eslint-disable */

$(document).on("click", ".btn-delete-memo", function () {
  var confirmation = confirm("delete this audio?");
  if (!confirmation) return;
  delete window.current_audio_comment_blob;
  $(".voice-memo-recorder-wrap").removeClass("recorded");
});
$(document).on("click", ".btn-upload-memo", function () {
  var $allAudios = $(".hidden-audio");
  $allAudios.each(function (i) {
    $allAudios[i].pause();
    $allAudios[i].currentTime = 0;
  });
  var url = URL.createObjectURL(window.current_audio_comment_blob);
  getDuration(url, upload_voice_memo);
});

function upload_voice_memo(duration) {
  console.log("uploading");
  delete window.current_audio_comment_blob;
  $(".voice-memo-recorder-wrap").removeClass("recorded");
}

var getDuration = function getDuration(url, next) {
  var _player = new Audio(url);

  _player.addEventListener("durationchange", function (e) {
    if (this.duration != Infinity) {
      var duration = format_time(this.duration);

      _player.remove();

      next(duration);
    }
  }, false);

  _player.load();

  _player.currentTime = 24 * 60 * 60; //fake big time

  _player.volume = 0;
};

function format_time(duration) {
  var time = parseInt(duration); // hours = 3600s, skipping for now
  // minutes calculation

  var minutes = parseInt(time / 60);

  if (minutes > 0) {
    var minutes_time = minutes * 3600;
    time -= minutes_time;

    if (minutes < 10) {
      minutes = "0" + minutes;
    }

    minutes = minutes + ":";
  } else {
    minutes = "00:";
  } // seconds calculation


  var seconds = parseInt(time);

  if (seconds < 10) {
    seconds = "0" + seconds;
  }

  var formatted_time = minutes + seconds;
  return formatted_time;
}
/*******************************************************************************
## UI -> audio_player -> audio-player.js
## This will handle custom audio player events
*******************************************************************************/


$(document).on("click", ".btn-play-audio", function (e) {
  var el = e.target;
  var $this = $(el);
  var $grand_wrap = $this.parents(".comment-voice-memo");
  var $main_wrap = $this.parents(".voice-memo-wrapper");
  var $audio_id = $main_wrap.find(".hidden-audio-id").find("span").attr("id");
  var $audio_container = $main_wrap.find(".hidden-audio-container");
  var $audio_exists = $audio_container.find(".hidden-audio");
  var $otherAudios = $(".hidden-audio");
  $otherAudios.each(function (i) {
    $otherAudios[i].pause();
  }); // in case audio already fetched

  if ($audio_exists.length) {
    $audio_exists[0].play();
    return;
  }

  $grand_wrap.addClass("loading"); // in case audio not fetched till now

  var file = "/private/files/" + $audio_id + ".mp3";
  var audio = new Audio(file);
  var $audio = $(audio);
  $audio.addClass("hidden-audio");
  $audio_container.append($audio); // event bindings to newly fetched audio

  $audio.on("timeupdate", audio_timeupdate);
  $audio.on("play", audio_play);
  $audio.on("pause", audio_pause);
  $audio.on("ended", audio_ended); // load audio completely before play

  audio.addEventListener("durationchange", function (e) {
    if (audio.duration != Infinity) {
      audio.currentTime = 0;
      setTimeout(function () {
        audio.play();
        $grand_wrap.removeClass("loading");
      }, 500);
      return;
    }
  });
  audio.load();
  audio.currentTime = 24 * 60 * 60;
});
$(document).on("click", ".btn-pause-audio", function (e) {
  var el = e.target;
  var $this = $(el);
  var $main_wrap = $this.parents(".voice-memo-wrapper");
  var $audio = $main_wrap.find(".hidden-audio");
  $audio[0].pause();
});
$(document).on("change", ".player-progress-bar", function (e) {
  e.preventDefault();
  console.log("in progress");
  return;
  var el = e.target;
  var $this = $(el);
  var val = $this.val();
  var $main_wrap = $this.parents(".voice-memo-wrapper");
  var $audio = $main_wrap.find(".hidden-audio");
  var audio = $audio[0];
  var unit_per = audio.duration / 100;
  var new_cur_time = parseInt(val * unit_per);
  audio.currentTime = new_cur_time;
}); // Audio Functions

function audio_play(e) {
  var audio = e.target;
  var $this = $(audio);
  var $main_wrap = $this.parents(".voice-memo-wrapper");
  var $player_controls = $main_wrap.find(".player-controls");
  $player_controls.addClass("playing");
}

function audio_timeupdate(e) {
  var audio = e.target;
  var $this = $(audio);
  var $main_wrap = $this.parents(".voice-memo-wrapper");
  var $cur_time = $main_wrap.find(".cur-time");
  var current_time = audio.currentTime;
  var duration = audio.duration;
  var unit_per = duration / 100;
  var $slide_progress = $main_wrap.find(".player-progress-bar");
  $cur_time.html(format_time(current_time));
  var current_val = current_time / unit_per;
  current_val = parseInt(current_val);
  $slide_progress.val(current_val);
  var $bg = "linear-gradient(to right, #1a5594 0%, #1a5594 " + current_val + "%, #d3d3d3 " + current_val + "%, #d3d3d3 100%)";
  $slide_progress.css("background", $bg);
}

function audio_pause(e) {
  var audio = e.target;
  var $this = $(audio);
  var $main_wrap = $this.parents(".voice-memo-wrapper");
  var $player_controls = $main_wrap.find(".player-controls");
  $player_controls.removeClass("playing");
}

function audio_ended(e) {
  var audio = e.target;
  audio.currentTime = 0;
  var $this = $(audio);
  var $main_wrap = $this.parents(".voice-memo-wrapper");
  var $player_controls = $main_wrap.find(".player-controls");
  $player_controls.removeClass("playing");
}
/*******************************************************************************
## UI -> RecorderJs -> recorder.js
## File for recording audio with interactive layout
##
## https://medium.com/@bryanjenningz/how-to-record-and-play-audio-in-javascript-faa1b2b3e49b
## https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
*******************************************************************************/


URL = window.URL || window.webkitURL;
var mediaRecorder;
$(document).on("click", ".btn-record", startRecording);
$(document).on("click", ".btn-stop", stopRecording); // start recording

function startRecording() {
  navigator.mediaDevices.getUserMedia({
    audio: true
  }).then(function (stream) {
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.start();
    var audioChunks = [];
    mediaRecorder.addEventListener("dataavailable", function (event) {
      audioChunks.push(event.data);
    });
    mediaRecorder.addEventListener("stop", function () {
      var audioBlob = new Blob(audioChunks);
      createAudio(audioBlob);
      clearInterval(window.rec_timer);
      $(".voice-memo-recorder-wrap").removeClass("recording");
      stream.getTracks()[0].stop();
    });
    $(".voice-memo-recorder-wrap").addClass("recording");
    startTimer();
  }).catch(function (err) {
    console.log("Microphone not found/not allowed.");
  });
} // stop recording


function stopRecording() {
  mediaRecorder.stop();
} // make ui element from recorded audio


function createAudio(blob) {
  window.current_audio_comment_blob = blob;
  var url = URL.createObjectURL(blob);
  var $duration = $(".voice-memo-recorder-wrap").find(".duration");
  var $grand_wrap = $(".voice-memo-recorder-wrap").find(".comment-voice-memo");
  var $audio_container = $(".voice-memo-recorder-wrap").find(".hidden-audio-container");
  var audio = new Audio(url);
  $(audio).addClass("hidden-audio");
  $audio_container.html(audio);
  $(".voice-memo-recorder-wrap").addClass("recorded"); // load audio completely before play

  $grand_wrap.addClass("loading");
  audio.addEventListener("durationchange", function (e) {
    if (audio.duration != Infinity) {
      audio.currentTime = 0;
      setTimeout(function () {
        $duration.html(format_time(audio.duration));
        $(".player-progress-bar").val(0);
        $grand_wrap.removeClass("loading");
      }, 500);
      return;
    }
  });
  audio.load();
  audio.currentTime = 24 * 60 * 60;
  var $audio = $(audio);
  $audio.on("timeupdate", audio_timeupdate);
  $audio.on("play", audio_play);
  $audio.on("pause", audio_pause);
  $audio.on("ended", audio_ended);
} // helping function to show how much time recorded for current audio


function startTimer() {
  var seconds = 0;
  var minutes = 0;
  var d_seconds,
      d_minutes = null;
  var time = null;
  $(".recording-timer").html("00:00");
  window.rec_timer = setInterval(function () {
    seconds++;

    if (seconds > 60) {
      minutes++;
      seconds = 0;
    }

    if (seconds < 10) {
      d_seconds = "0" + seconds;
    } else {
      d_seconds = seconds;
    }

    if (minutes < 10) {
      d_minutes = "0" + minutes;
    } else {
      d_minutes = minutes;
    }

    time = d_minutes + ":" + d_seconds;
    $(".recording-timer").html(time);
  }, 1000);
} // Audio Functions