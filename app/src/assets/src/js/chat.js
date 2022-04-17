/* eslint-disable */
async function updateAccount() {
  const name = document.getElementById("settings_panel_name").value;
  const profile_image = document.getElementById("settings_panel_image_upload")
    .files[0];

  api.provider().account.updateName(name);
  const user_id = await api.fetch_user();

  const profiles = await api.listDocuments(Server.profileCollectionId);

  const profile =
    profiles.documents.filter((profile) => profile.user_id == user_id)[0] ||
    null;

  if (profile) {
    // deleting old image for storage friendly code
    let old_profile_image = profile.profile_image;

    if (old_profile_image && profile_image) {
      api.provider().storage.deleteFile(old_profile_image);
    }

    // updating new image
    let file = await api
      .provider()
      .storage.createFile("unique()", profile_image, [], []);

    api.updateDocument(Server.profileCollectionId, profile.$id, {
      user_name: name,
      profile_image: file.$id,
    });
  }

  update_settings_panel();
}

async function search_user() {
  const search_txt = document.getElementById("search_user_input").value;

  const profiles = await api.listDocuments(Server.profileCollectionId);

  for(const row in profiles.documents){
    if(search_txt.row.user_name){
      
    }
  }
}

api.listDocuments("625386922d06f1c7786f").then((r) => {
  list_contacts(r.documents);
  window.contacts = r.documents;
});

function list_contacts(params) {
  for (const row of params) {
    $(".contacts-section").append(
      `<div class="media-card" data-contact_id="${row.$id}">
      <img
      src="./assets/dist/images/dummy.jpeg"
      alt="Room Image"
      class="img img-dp"
      />
      <h5 class="chat-title">${row.title}</h5>
      </div>`
    );
  }
}

function fetch_messages(room_id) {
  $(".communication-section").html("");

  api.listDocuments("625174ac6a2388c76fca").then((r) => {
    for (const row of r.documents) {
      //   temp code to delete messages
      //   api.deleteDocument("625174ac6a2388c76fca", row.$id)
      //   api.provider().storage.deleteFile(row.audio_link)

      if (row.room_id == room_id) {
        append_message(row);
      }
    }
  });
}

function append_message(row) {
  // getting uploaded audio link
  let url = api.provider().storage.getFileDownload(row.audio_link);

  $(".communication-section").append(
    `<div ${
      row.user_id == api.fetch_user() ? 'class="audio me"' : 'class="audio"'
    }" data-message_id="${row.$id}">
	  <h5 class="message_user">${api.get_user_name(row.user_id)}</h5>

	  <audio controls>
		<source src="${url.href}" type="audio/mpeg">
		Your browser does not support the audio tag.
	  </audio>
</div>`
  );
}

$(document).on("click", ".media-card", (e) => {
  const contact_id = $(e.target).data("contact_id");
  console.log(contact_id);
  const room = window.contacts.filter((r) => r.$id == contact_id)[0] || null;
  console.log(room);

  if (room) {
    console.log("test");
    $(".header-bar")
      .find("img")
      .attr("src", "/app/assets/dist/images/dummy.jpeg");

    $(".header-bar").find(".chat-title").html(room.title);

    $(".chat-info-panel").addClass("hide");
    window.current_room = contact_id;
    fetch_messages(contact_id);
  }
});

function toggle_chat_screen() {
  $(".chat-info-panel").toggleClass("hide");

  const contact_id = window.current_room;

  for (const row of window.contacts) {
    if (contact_id == row.$id) {
      $(".chat-info-panel > img").attr(
        "src",
        "/app/assets/dist/images/dummy.jpeg"
      );

      $(".chat-info-panel").find(".chat-title").html(row.title);
      $(".chat-info-panel").find(".description").html(row.description);
    }
  }
}

/******************************************************
 * send and receive message
 ******************************************************/

$(document).on("click", ".btn-upload-memo", () => {
  // getting audio blob for the conversion of file
  var fileOfBlob = new File([window.cur_blob], Math.random() + ".mp3");

  // uploading it to server
  let promise = api
    .provider()
    .storage.createFile("unique()", fileOfBlob, [], []);

  promise.then(
    async function (response) {
      // getting current user
      let user = await api.fetch_user();

      // creating message
      let promise = api.createDocument("625174ac6a2388c76fca", {
        room_id: window.current_room,
        user_id: user,
        audio_link: response.$id,
      });

      promise.then(
        function (response) {},
        function (error) {
          console.log(error);
        }
      );
    },
    function (error) {
      console.log(error);
    }
  );

  // del blob
  delete window.cur_blob;
  $(".voice-memo-recorder-wrap").removeClass("recorded");
}),

$(document).on("click", ".btn-delete-memo", function () {
  let confirmation = confirm("delete this audio?");
  if (!confirmation) return;

  delete window.cur_blob;
  $(".voice-memo-recorder-wrap").removeClass("recorded");
});

/******************************************************
 * audio player
 ******************************************************/

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

/******************************************************
 * helping function
 ******************************************************/

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

// DRIVER
$(".btn-close-settings").on("click", () => {
  $(".main-screen").removeClass("settings-on-board");
});

$(".open-settings").on("click", () => {
  update_settings_panel();
  $(".main-screen").addClass("settings-on-board");
});

$(".btn-close-group").on("click", () => {
  $(".main-screen").removeClass("create-group-on-board");
});

$(".btn-open-group").on("click", () => {
  $(".main-screen").addClass("create-group-on-board");
});

async function update_settings_panel() {
  const account = await api.getAccount();
  const profiles = await api.listDocuments(Server.profileCollectionId);
  let profile_image = null;

  for (const row of profiles.documents) {
    if (row.user_id == account.$id) {
      profile_image = row.profile_image;
    }
  }

  $("#settings_panel_name").val(account.name);
  
  if (profile_image) {
    let url = api.provider().storage.getFileDownload(profile_image);
    $("#settings_panel_image").attr("src", url);
  }
}
