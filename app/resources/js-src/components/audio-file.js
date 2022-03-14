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
    voice_uploader(duration)
      .then((r) => {
        frappe.show_alert(
          {
            message: __("Voice memo uploaded successfully."),
            indicator: "green",
          },
          5
        );
  
        delete window.current_audio_comment_blob;
        cur_frm.reload_doc();
        $(".voice-memo-recorder-wrap").removeClass("recorded");
      })
      .catch(() => {
        frappe.show_alert(
          {
            message: __(
              "Unable to upload voice memo, please try again or use text comment."
            ),
            indicator: "red",
          },
          5
        );
      });
}
  
function voice_uploader(duration) {
    return new Promise((resolve, reject) => {
      let xhr = new XMLHttpRequest();
  
      xhr.onreadystatechange = () => {
        if (xhr.readyState == XMLHttpRequest.DONE) {
          if (xhr.status === 200) {
            let response = JSON.parse(xhr.response);
            let args = {
              file_name: response.message.name,
              file_url: response.message.file_url,
              file_duration: duration,
              doc_type: cur_frm.doctype,
              doc_name: cur_frm.docname,
            };
  
            frappe.call({
              method: "qarobar.api.comment.audio_comment.insert_comment",
              args: args,
              btn: $(".btn-upload-memo"),
              freeze: true,
              callback: (r) => {
                resolve(r);
              },
              error: (r) => {
                reject();
              },
            });
          } else {
            frappe.request.cleanup({}, error);
            reject();
          }
        }
      };
  
      xhr.open("POST", "/api/method/upload_file", true);
      xhr.setRequestHeader("Accept", "application/json");
      xhr.setRequestHeader("X-Frappe-CSRF-Token", frappe.csrf_token);
  
      let file_name = Math.random().toString(36).substring(7) + ".mp3";
      let form_data = new FormData();
      form_data.append("file", window.current_audio_comment_blob, file_name);
      form_data.append("is_private", 1);
      form_data.append("folder", "Home/Audio Comments");
      xhr.send(form_data);
    });
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