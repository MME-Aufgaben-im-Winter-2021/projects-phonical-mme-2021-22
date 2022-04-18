/* eslint-disable */
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

$("#search_user_input").on("keypress", function (event) {
  if ($("#search_user_input").val() && event.keyCode == "13") {
    $(".contacts-section").html("");
    search_user();
  }
});

$("#search_user_input").on("input", function (event) {
  if ($("#search_user_input").val() == "") {
    $(".contacts-section").html("");
    list_contacts(window.contacts);
  }else{
    $(".contacts-section").html("");
    search_user();
  }
});

async function search_user() {
  const search_txt = document.getElementById("search_user_input").value;

  const profiles = await api.listDocuments(Server.profileCollectionId);

  let flag = true;

  for (const row of profiles.documents) {
    if (row.user_email && search_txt && row.user_email.includes(search_txt)) {
      flag = false;
      append_contact(row, true);
      break;
      
    }
  }

  if (flag) {
    $(".contacts-section").html(
      "<p class='contact-not-found'>User Not Found</p>"
    );
  }
}

async function get_rooms() {
  let r = await api.listDocuments(Server.roomUsersCollectionId);
  let contacts = [];
  window.room_users = r.documents;

  const cur_user = await api.fetch_user();
  for (const row of r.documents) {
    if (row.user_id == cur_user) {
      contacts.push(row.room_id);
    }
  }

  let rooms = await api.listDocuments(Server.roomCollectionId);
  contacts = rooms.documents.filter((r) => contacts.includes(r.$id));

  list_contacts(contacts);
  window.contacts = contacts;
}
get_rooms();

function list_contacts(params) {
  for (const row of params) {
    append_contact(row);
  }
}

async function append_contact(row, is_new_contact = false) {
  let profile_image = "./src/assets/dist/images/dummy.jpeg";
  const cur_user = await api.fetch_user();

  if (row.profile_image && is_new_contact) {
    profile_image = api.provider().storage.getFileDownload(row.profile_image);
  }

  if (row.room_image && row.is_group && !is_new_contact) {
    profile_image = api.provider().storage.getFileDownload(row.room_image);
  }

  let room_user_name = row.title

  if (!row.is_group && !is_new_contact) {
    let room_user = window.room_users.filter(
      (r) => r.room_id == row.$id && r.user_id != cur_user
    )[0];

    if (room_user) {
      room_user = await api.get_user_profile(room_user.user_id);
      console.log(room_user);

      profile_image = api
        .provider()
        .storage.getFileDownload(room_user.profile_image);

    room_user_name = room_user.user_name
    }
  }
  $(".contacts-section").append(
    `<div class="media-card" data-contact_id="${
      row.$id
    }" data-new-contact="${is_new_contact}">
    <img
    src="${profile_image}"
    alt="Room Image"
    class="img img-dp"
    />
    <h5 class="chat-title">${is_new_contact ? row.user_name : room_user_name}</h5>
    </div>`
  );
}

function fetch_messages(room_id) {
  $(".communication-section").html("");

  api.listDocuments(Server.messageCollectionId).then((r) => {
    for (const row of r.documents) {
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
  const new_room = $(e.target).data("new-contact");

  if(new_room){
    create_new_room(contact_id);
    return;
  }

  const room = window.contacts.filter((r) => r.$id == contact_id)[0] || null;

  if (room) {
    $(".header-bar")
      .find("img")
      .attr("src", "/app/src/assets/dist/images/dummy.jpeg");

    $(".header-bar").find(".chat-title").html(room.title);

    $(".chat-info-panel").addClass("hide");
    window.current_room = contact_id;
    fetch_messages(contact_id);
  }
});

async function create_new_room(user) {
  const cur_user = await api.fetch_user();
  const profile = await api.getDocument(Server.profileCollectionId, user);

  if (!profile) return;

  const room = await api.createDocument(
    Server.roomCollectionId,
    { title: profile.user_name },
    ["role:all"]
  );

  await api.createDocument(
    Server.roomUsersCollectionId,
    { room_id: room.$id, user_id: cur_user },
    ["role:all"]
  );

  await api.createDocument(
    Server.roomUsersCollectionId,
    { room_id: room.$id, user_id: profile.user_id },
    ["role:all"]
  );
}

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

//
//

function delete_docs() {
  let collectionId = Server.roomCollectionId;
  api.listDocuments(collectionId).then((r) => {
    for (const row of r.documents) {
      api.deleteDocument(collectionId, row.$id);
    }
  });
}

// delete_docs();
//
//

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