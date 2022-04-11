/*******************************************************************************
## UI -> RecorderJs -> recorder.js
## File for recording audio with interactive layout
##
## https://medium.com/@bryanjenningz/how-to-record-and-play-audio-in-javascript-faa1b2b3e49b
## https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
*******************************************************************************/
/* eslint-disable */

URL = window.URL || window.webkitURL;

let mediaRecorder;

$(document).on("click", ".btn-record", startRecording);
$(document).on("click", ".btn-stop", stopRecording);

// start recording
function startRecording() {
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.start();

      const audioChunks = [];
      mediaRecorder.addEventListener("dataavailable", (event) => {
        audioChunks.push(event.data);
      });

      mediaRecorder.addEventListener("stop", () => {
        const audioBlob = new Blob(audioChunks);
        createAudio(audioBlob);
        clearInterval(window.rec_timer);
        $(".voice-memo-recorder-wrap").removeClass("recording");
        stream.getTracks()[0].stop();
      });

      $(".voice-memo-recorder-wrap").addClass("recording");
      startTimer();
    })
    .catch(function (err) {
      console.log("Microphone not found/not allowed.");
    });
}

// stop recording
function stopRecording() {
  mediaRecorder.stop();
}

// make ui element from recorded audio
function createAudio(blob) {
  window.cur_blob = blob;
  let url = URL.createObjectURL(blob);

  const $duration = $(".voice-memo-recorder-wrap").find(".duration");
  const $grand_wrap = $(".voice-memo-recorder-wrap").find(
    ".comment-voice-memo"
  );
  const $audio_container = $(".voice-memo-recorder-wrap").find(
    ".hidden-audio-container"
  );
  const audio = new Audio(url);

  $(audio).addClass("hidden-audio");
  $audio_container.html(audio);
  $(".voice-memo-recorder-wrap").addClass("recorded");

  // load audio completely before play
  $grand_wrap.addClass("loading");
  audio.addEventListener("durationchange", (e) => {
    if (audio.duration != Infinity) {
      audio.currentTime = 0;
      setTimeout(() => {
        $duration.html(format_time(audio.duration));
        $(".player-progress-bar").val(0);
        $grand_wrap.removeClass("loading");
      }, 500);
      return;
    }
  });

  audio.load();
  audio.currentTime = 24 * 60 * 60;

  const $audio = $(audio);
  $audio.on("timeupdate", audio_timeupdate);
  $audio.on("play", audio_play);
  $audio.on("pause", audio_pause);
  $audio.on("ended", audio_ended);
}

// helping function to show how much time recorded for current audio
function startTimer() {
  let seconds = 0;
  let minutes = 0;
  let d_seconds,
    d_minutes = null;
  let time = null;
  $(".recording-timer").html("00:00");

  window.rec_timer = setInterval(() => {
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
}

// Audio Functions
