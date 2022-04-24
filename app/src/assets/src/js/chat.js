/* eslint-disable */
async function update_settings_panel() {
  console.log("fetching profiles")
  const account = await api.getAccount()
  const profiles = await api.listDocuments(Server.profileCollectionId, [
    Query.equal("user_id", account.$id),
  ])

  let profile_image = null

  for (const row of profiles.documents) {
    if (row.user_id == account.$id) {
      profile_image = row.profile_image
    }
  }

  $("#settings_panel_name").val(account.name)

  if (profile_image) {
    let url = api.provider().storage.getFileDownload(profile_image)
    $("#settings_panel_image").attr("src", url)
  }
}

async function updateAccount() {
  console.log("updating account")

  const name = document.getElementById("settings_panel_name").value
  const profile_image = document.getElementById("settings_panel_image_upload")
    .files[0]

  api.provider().account.updateName(name)
  const user_id = await api.fetch_user()

  const profiles = await api.listDocuments(Server.profileCollectionId, [
    Query.equal("user_id", user_id),
  ])

  const profile =
    profiles.documents.filter((profile) => profile.user_id == user_id)[0] ||
    null

  if (profile) {
    // deleting old image for storage friendly code
    let old_profile_image = profile.profile_image


    let data = {
      user_name: name,
    }

    if (old_profile_image && profile_image) {
      api.provider().storage.deleteFile(old_profile_image)

      // updating new image
      let file = await api
        .provider()
        .storage.createFile("unique()", profile_image, ["role:all"], [])

      data["profile_image"] = file ? file.$id : null
    }

    api.updateDocument(Server.profileCollectionId, profile.$id, data)
  }

  update_settings_panel()
}

async function changePassword() {
  console.log("updating password")

  const old_pass = document.getElementById("old_password").value
  const new_pass = document.getElementById("new_password").value

  try {
    await api.provider().account.updatePassword(new_pass, old_pass)
    $(".main-screen").removeClass("change-password-on-board")
  } catch (error) {
    alert("password not changed")
  }
}

$("#search_user_input").on("keypress", function(event) {
  if ($("#search_user_input").val() && event.keyCode == "13") {
    search_user()
  }
})

$("#search_user_input").on("input", function(event) {
  if ($("#search_user_input").val() == "") {
    $(".contacts-section").html("")
    list_contacts(window.contacts)
  }
})

// need enhancement
async function search_user() {
  console.log("searching user")
  const cur_user = await api.fetch_user()
  $(".contacts-section").html("")

  const search_txt = document.getElementById("search_user_input").value
  if (!search_txt) return

  const profiles = await api.listDocuments(Server.profileCollectionId)
  let flag = true

  let already_available_rooms = window.contacts.map((r) => r.$id)

  let available_users = await api.listDocuments(Server.roomUsersCollectionId,
    [
      Query.equal("room_id", already_available_rooms),
    ])

  available_users = available_users.documents.map((r) => r.user_id)

  for (const row of profiles.documents) {
    if (row.user_email && search_txt && row.user_email.includes(search_txt) &&
      row.user_id != cur_user) {
      if (available_users.includes(row.user_id)) {

        const room_users = await api.listDocuments(Server
          .roomUsersCollectionId, [
            Query.equal("user_id", [row.user_id]),
          ])

        for (const room of room_users.documents) {
          const rooms_matched_with_search = window.contacts.filter((r) => r
            .$id == room.room_id)
          for (const iterator of rooms_matched_with_search) {
            append_contact(iterator)
          }
        }
      } else {
        flag = false
        append_contact(row, true)
      }
      break
    }
  }

  if (flag) {
    $(".contacts-section").prepend(
      "<p class='contact-not-found'>User Not Found</p>"
    )
  }
}

async function get_rooms() {
  $(".contacts-section").html("")
  console.log("getting rooms")

  const cur_user = await api.fetch_user()
  let r = await api.listDocuments(Server.roomUsersCollectionId)

  let contacts = []
  window.room_users = r.documents

  for (const row of r.documents) {
    if (row.user_id == cur_user) {
      contacts.push(row.room_id)
    }
  }

  let rooms = await api.listDocuments(Server.roomCollectionId)

  contacts = rooms.documents.filter((r) => {
    return contacts.includes(r.$id)
  })

  list_contacts(contacts)
  window.contacts = contacts
}
get_rooms()

function list_contacts(params) {
  for (const row of params) {
    append_contact(row)
  }
}

async function append_contact(row, is_new_contact = false) {
  let profile_image = "./src/assets/dist/images/dummy.jpeg"
  const cur_user = await api.fetch_user()

  if (row.profile_image && is_new_contact) {
    profile_image = api.provider().storage.getFileDownload(row.profile_image)
  }

  if (row.room_image && row.is_group && !is_new_contact) {
    profile_image = api.provider().storage.getFileDownload(row.room_image)
  }

  let room_user_name = row.title

  if (!row.is_group && !is_new_contact) {
    let room_user = window.room_users.filter(
      (r) => r.room_id == row.$id && r.user_id != cur_user
    )[0]

    if (room_user) {
      room_user = await api.get_user_profile(room_user.user_id)

      profile_image = api
        .provider()
        .storage.getFileDownload(room_user.profile_image)

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
    <h5 class="chat-title">${
	is_new_contact ? row.user_name : room_user_name
}</h5>
    </div>`
  )
}

async function fetch_messages(room_id) {
  console.log("fetching messages")

  $(".communication-section").html("")

  let r = await api
    .listDocuments(Server.messageCollectionId, [
      Query.equal("room_id", room_id),
    ])

  $(".communication-section").html("")

  for (const row of r.documents) {
    await append_message(row)
  }
}

async function append_message(row) {
  // getting uploaded audio link
  let url = api.provider().storage.getFileDownload(row.audio_link)
  let cls = row.user_id == (await api.fetch_user()) ? "audio me" : "audio"
  let msg_user = await api.get_user_profile(row.user_id)

  let reply_to = ""
  if (row.reply_to) {
    let cur_audio_time = format_time(row.reply_time)

    let user = $("#" + row.reply_to).find(".message_user").html()

    if (user && user.includes("replied to")) {
      user = user.split("replied to")[0]
    }
    reply_to = `
    replied to <a href="#${row.reply_to}">${user}</a> on time <span class="timetoreply">${cur_audio_time}</span>
    `
  }

  $(".communication-section")
    .append(
      `<div class="${cls}" data-message_id="${row.$id}" id="${row.$id}" >
	  <h5 class="message_user">${msg_user.user_name} ${reply_to} </h5>

    <div class="flex">
      <audio controls>
      <source src="${url.href}" type="audio/mpeg">
      Your browser does not support the audio tag.
      </audio>
      <a href="#" class="btn btn-icon add-reply" onclick="replytomessage('${row.$id}')"><i class="fa fa-reply"></i></a>
    </div>
</div>`
    )
    .scrollTop($(".communication-section")[0].scrollHeight)
}

function replytomessage(current_audio_id) {
  $("#reply-to").html("")

  let audio_time = $("#" + current_audio_id).find("audio")[0].currentTime
  let cur_audio_time = format_time(audio_time)

  let user = $("#" + current_audio_id)
    .find(".message_user")
    .html()

  if (user.includes("replied to")) {
    user = user.split("replied to")[0]
  }

  $(".chat-footer-section").addClass("replying-to")

  $("#reply-to").append(
    `<h5>replying to <a href="#${current_audio_id}">${user}</a> on time <span class="timetoreply">${cur_audio_time}</span></h5>`
  )

  window.current_audio_time = audio_time
  window.current_audio_id = current_audio_id
}

function reply_to_completed() {
  $(".chat-footer-section").removeClass("replying-to")
  $("#reply-to").html("")
}

$(document).on("click", ".media-card", (e) => {
  const contact_id = $(e.target).data("contact_id")
  const new_room = $(e.target).data("new-contact")

  $(e.target).find("img").removeClass("message_not_readed")

  if (new_room) {
    create_new_room(contact_id)
    $("#search_user_input").val("")
    return
  }

  open_chat(contact_id)
})

async function open_chat(contact_id) {
  if (window.cur_blob) {
    $(".btn-delete-memo").trigger("click")
  }

  const room = window.contacts.filter((r) => r.$id == contact_id)[0] || null
  const cur_user = await api.fetch_user()
  let profile_image = "/app/src/assets/dist/images/dummy.jpeg"
  let room_user_name = room.title

  if (room.is_group) {
    profile_image = api.provider().storage.getFileDownload(room.room_image)
  }

  if (!room.is_group) {
    let room_user = window.room_users.filter((r) => {
      return r.room_id == room.$id && r.user_id != cur_user
    })[0]

    if (room_user) {
      room_user = await api.get_user_profile(room_user.user_id)

      profile_image = await api
        .provider()
        .storage.getFileDownload(room_user.profile_image)

      room_user_name = room_user.user_name
    }
  }

  if (room) {
    $(".header-bar").find("img").attr("src", profile_image).show()

    $(".header-bar").find(".chat-title").html(room_user_name)

    $(".chat-info-panel").addClass("hide")

    $(".chat-footer-section").removeClass("hidden")

    $(".btn-toggle-screen").removeClass("hidden")

    window.current_room = contact_id
    fetch_messages(contact_id)
  }
}

async function create_new_room(user) {
  const cur_user = await api.fetch_user()
  const profile = await api.getDocument(Server.profileCollectionId, user)

  if (!profile) return

  const room = await api.createDocument(
    Server.roomCollectionId, { title: profile.user_name },
    ["role:all"]
  )

  await api.createDocument(
    Server.roomUsersCollectionId, { room_id: room.$id, user_id: cur_user },
    ["role:all"]
  )

  await api.createDocument(
    Server.roomUsersCollectionId, {
      room_id: room.$id,
      user_id: profile
        .user_id
    },
    ["role:all"]
  )

  document.location.reload()

  window.contacts.push(room)
}

async function toggle_chat_screen() {
  $(".chat-info-panel").toggleClass("hide")

  const contact_id = window.current_room

  for (const row of window.contacts) {
    if (contact_id == row.$id) {
      $(".chat-info-panel > img").attr("src", $(".header-bar img").attr(
        "src"))

      $(".chat-info-panel").find(".chat-title").html(row.title)
      $(".chat-info-panel").find(".description").html(row.description)

      row.is_group ?
        $(".add-members").removeClass("hidden") :
        $(".add-members").addClass("hidden")
      break
    }
  }

  await show_added_members(contact_id)
}

async function show_added_members(contact_id) {
  console.log("showing added members")

  $(".chat-info-panel").find(".added-members").html("")

  const room_users = await api.listDocuments(Server.roomUsersCollectionId, [
    Query.equal("room_id", contact_id),
  ])

  const cur_user = await api.fetch_user()
  const room = window.contacts.filter(r => r.$id == contact_id)[0]

  for (const room_user of room_users.documents) {
    if (room_user.room_id == contact_id) {
      const user_profile = await api.get_user_profile(room_user.user_id)
      let user_image = "./src/assets/dist/images/dummy.jpeg"

      if (user_profile.profile_image) {
        user_image = api
          .provider()
          .storage.getFileDownload(user_profile.profile_image)
      }

      let delete_action = ""

      if (room.room_owner_id == cur_user && room_user.user_id != cur_user) {
        delete_action =
          `<a class="btn btn-icon" onclick="delete_chat('${room_user.user_id}')"><i class="fa fa-trash"></i></a>`
      }

      $(".chat-info-panel").find(".added-members").append(`
            <div class="media-card">
              <img
                src="${user_image}"
                alt=""
                class="img img-dp"
              />
              <h5 class="chat-title">${user_profile.user_name}</h5>
			  ${delete_action}
            </div>
          `)
    }
  }
}

async function create_group() {
  const group_image = document.getElementById("create-group-image").files[0]
  const group_name = document.getElementById("create-group-name").value
  const cur_user = await api.fetch_user()

  let data = {
    title: group_name,
    is_group: true,
    room_owner_id: cur_user
  }

  if (group_image) {
    const file = await api
      .provider()
      .storage.createFile("unique()", group_image, ["role:all"], [])

    data["room_image"] = file.$id
  }

  const room = await api.createDocument(
    Server.roomCollectionId,
    data,
    ["role:all"]
  )

  await api.createDocument(
    Server.roomUsersCollectionId, {
      room_id: room.$id,
      user_id: cur_user,
    },
    ["role:all"]
  )
  document.location.reload()
}

$(".btn-create-group").on("click", (e) => {
  create_group()
})

async function add_users_to_group() {
  console.log("getting users that can be added into this group")

  $(".main-screen").addClass("add-user-on-board")
  const contact_id = window.current_room
  const available_profiles = await api.listDocuments(
    Server.profileCollectionId
  )

  let user_image = "./src/assets/dist/images/dummy.jpeg"

  let room_users = await api.listDocuments(Server.roomUsersCollectionId, [
    Query.equal("room_id", contact_id),
  ])

  added_users = []

  for (const row of room_users.documents) {
    if (row.room_id == contact_id) {
      added_users.push(row.user_id)
    }
  }

  $(".available-users").html("")

  for (const profile of available_profiles.documents) {
    if (profile.profile_image) {
      user_image = api
        .provider()
        .storage.getFileDownload(profile.profile_image)
    }

    if (!added_users.includes(profile.user_id)) {
      $(".available-users").append(
        `<div class="users-to-add">
        <div class="media-card">
            <img
              src="${user_image}"
              alt=""
              class="img img-dp"
            />
            <h5 class="chat-title">${profile.user_name}</h5>
          </div>
          <a class="btn btn-icon btn-add-user-to-group" onclick="add_member('${profile.user_id}')">
            <i class="fa fa-plus"></i>
          </a>
          </div>
          `
      )
    }
  }
}

async function add_member(user_id, room_id = window.current_room) {
  await api.createDocument(
    Server.roomUsersCollectionId, { room_id: room_id, user_id: user_id },
    ["role:all"]
  )

  await add_users_to_group()
  await show_added_members(room_id)
}

async function delete_chat(user_id = null) {
  console.log("deleting chat")
  try {
    if (!user_id) {
      user_id = await api.fetch_user()
    }

    let room_id = window.current_room

    const room_users = await api.listDocuments(Server.roomUsersCollectionId, [
      Query.equal("room_id", room_id),
    ])

    for (const row of room_users.documents) {
      if (row.user_id == user_id && row.room_id == room_id) {
        await api.deleteDocument(Server.roomUsersCollectionId, row.$id)
        break
      }
    }

    // deleting room if we all users leave this
    const all_room_users = await api.listDocuments(
      Server.roomUsersCollectionId,
      [Query.equal("room_id", room_id)]
    )

    if (all_room_users.documents.length == 0) {
      await api.deleteDocument(Server.roomCollectionId, room_id)

      // deleting all room messages
      const room_messages = await api.listDocuments(
        Server.messageCollectionId,
        [Query.equal("room_id", room_id)]
      )

      for (const row of room_messages.documents) {
        await api.provider().storage.deleteFile(row.audio_link)
        await api.deleteDocument(Server.roomUsersCollectionId, row.$id)
      }
    }

    window.location.reload()
  } catch (error) {
    window.location.reload()
  }
}
//
//

async function delete_docs(collectionId) {
  let r = await api.listDocuments(collectionId)
  for (const row of r.documents) {
    row.$id
    await api.deleteDocument(collectionId, row.$id)
  }
}

async function delete_files() {
  let r = await api.provider().storage.listFiles()
  for (const row of r.files) {
    await api.provider().storage.deleteFile(row.$id)
  }
}

function delete_db() {
  delete_files()
  delete_docs(Server.messageCollectionId)
  delete_docs(Server.roomUsersCollectionId)
  delete_docs(Server.roomCollectionId)
  delete_docs(Server.profileCollectionId)
}

// this function will wipe database
// delete_db()

/******************************************************
 * send and receive message
 ******************************************************/

$(document).on("click", ".btn-upload-memo", () => {
  // getting audio blob for the conversion of file
  var fileOfBlob = new File([window.cur_blob], Math.random() + ".mp3")

  // uploading it to server
  let promise = api
    .provider()
    .storage.createFile("unique()", fileOfBlob, ["role:all"], ["role:all"])

  promise.then(
    async function(response) {
        // getting current user
        let user = await api.fetch_user()

        // creating message
        let data = {
          room_id: window.current_room,
          user_id: user,
          audio_link: response.$id,
        }

        if (window.current_audio_id) {
          data["reply_to"] = window.current_audio_id
          data["reply_time"] = window.current_audio_time
        }

        let promise = api.createDocument(Server.messageCollectionId, data,
          [
            "role:all",
          ])

        promise.then(
          function(response) {
            window.current_audio_id ? delete window.current_audio_id :
              ""
            window.current_audio_id ? delete window.current_audio_time :
              ""
            reply_to_completed()
          },
          function(error) {
            console.log(error)
          }
        )
      },
      function(error) {
        console.log(error)
      }
  )

  // del blob
  delete window.cur_blob
  $(".voice-memo-recorder-wrap").removeClass("recorded")
})

$(document).on("click", ".btn-delete-memo", function() {
  let confirmation = confirm("delete this audio?")
  if (!confirmation) return

  delete window.cur_blob
  $(".voice-memo-recorder-wrap").removeClass("recorded")

  window.current_audio_id ? delete window.current_audio_id : ""
  window.current_audio_id ? delete window.current_audio_time : ""
  reply_to_completed()
})

/******************************************************
 * audio player
 ******************************************************/

$(document).on("click", ".btn-play-audio", (e) => {
  const el = e.target
  const $this = $(el)
  const $grand_wrap = $this.parents(".comment-voice-memo")
  const $main_wrap = $this.parents(".voice-memo-wrapper")
  const $audio_id = $main_wrap.find(".hidden-audio-id").find("span").attr(
    "id")
  const $audio_container = $main_wrap.find(".hidden-audio-container")
  const $audio_exists = $audio_container.find(".hidden-audio")
  const $otherAudios = $(".hidden-audio")

  $otherAudios.each((i) => {
    $otherAudios[i].pause()
  })

  // in case audio already fetched
  if ($audio_exists.length) {
    $audio_exists[0].play()
    return
  }

  $grand_wrap.addClass("loading")

  // in case audio not fetched till now
  const file = "/private/files/" + $audio_id + ".mp3"
  let audio = new Audio(file)
  const $audio = $(audio)
  $audio.addClass("hidden-audio")
  $audio_container.append($audio)

  // event bindings to newly fetched audio
  $audio.on("timeupdate", audio_timeupdate)
  $audio.on("play", audio_play)
  $audio.on("pause", audio_pause)
  $audio.on("ended", audio_ended)

  // load audio completely before play
  audio.addEventListener("durationchange", (e) => {
    if (audio.duration != Infinity) {
      audio.currentTime = 0
      setTimeout(() => {
        audio.play()
        $grand_wrap.removeClass("loading")
      }, 500)
      return
    }
  })

  audio.load()
  audio.currentTime = 24 * 60 * 60
})

$(document).on("click", ".btn-pause-audio", (e) => {
  const el = e.target
  const $this = $(el)
  const $main_wrap = $this.parents(".voice-memo-wrapper")
  const $audio = $main_wrap.find(".hidden-audio")

  $audio[0].pause()
})
/******************************************************
 * helping function
 ******************************************************/

function format_time(duration) {
  let time = parseInt(duration)
  // hours = 3600s, skipping for now

  // minutes calculation
  let minutes = parseInt(time / 60)

  if (minutes > 0) {
    let minutes_time = minutes * 3600
    time -= minutes_time

    if (minutes < 10) {
      minutes = "0" + minutes
    }

    minutes = minutes + ":"
  } else {
    minutes = "00:"
  }

  // seconds calculation
  let seconds = parseInt(time)
  if (seconds < 10) {
    seconds = "0" + seconds
  }

  let formatted_time = minutes + seconds

  return formatted_time
}

// Audio Functions
function audio_play(e) {
  const audio = e.target
  const $this = $(audio)
  const $main_wrap = $this.parents(".voice-memo-wrapper")
  const $player_controls = $main_wrap.find(".player-controls")
  $player_controls.addClass("playing")
}

function audio_timeupdate(e) {
  const audio = e.target
  const $this = $(audio)
  const $main_wrap = $this.parents(".voice-memo-wrapper")
  const $cur_time = $main_wrap.find(".cur-time")
  const current_time = audio.currentTime
  const duration = audio.duration
  const unit_per = duration / 100
  const $slide_progress = $main_wrap.find(".player-progress-bar")

  $cur_time.html(format_time(current_time))

  let current_val = current_time / unit_per

  current_val = parseInt(current_val)

  $slide_progress.val(current_val)
  let $bg =
    "linear-gradient(to right, #1a5594 0%, #1a5594 " +
    current_val +
    "%, #d3d3d3 " +
    current_val +
    "%, #d3d3d3 100%)"

  $slide_progress.css("background", $bg)
}

function audio_pause(e) {
  const audio = e.target
  const $this = $(audio)
  const $main_wrap = $this.parents(".voice-memo-wrapper")
  const $player_controls = $main_wrap.find(".player-controls")
  $player_controls.removeClass("playing")
}

function audio_ended(e) {
  const audio = e.target
  audio.currentTime = 0
  const $this = $(audio)
  const $main_wrap = $this.parents(".voice-memo-wrapper")
  const $player_controls = $main_wrap.find(".player-controls")
  $player_controls.removeClass("playing")
}

// DRIVER
$(".btn-close-settings").on("click", () => {
  $(".main-screen").removeClass("settings-on-board")
})

$(".open-settings").on("click", () => {
  update_settings_panel()
  $(".main-screen").addClass("settings-on-board")
})

$(".open-change-psssword").on("click", () => {
  $(".main-screen").addClass("change-password-on-board")
})

$(".btn-close-change-password").on("click", () => {
  $(".main-screen").removeClass("change-password-on-board")
})

$(".btn-close-group").on("click", () => {
  $(".main-screen").removeClass("create-group-on-board")
})

$(".btn-close-add-user").on("click", () => {
  $(".main-screen").removeClass("add-user-on-board")
})

$(".btn-open-group").on("click", () => {
  $(".main-screen").addClass("create-group-on-board")
})

api
  .provider()
  .subscribe(`collections.${Server.messageCollectionId}.documents`, (r) => {
    if (r.event == "database.documents.create") {
      const data = r.payload
      if (data.room_id == window.current_room) {
        append_message(data)
      } else {
        $(`[data-contact_id=${data.room_id}]`)
          .find("img")
          .addClass("message_not_readed")
      }
    }
  })


api
  .provider()
  .subscribe(`collections.${Server.roomUsersCollectionId}.documents`, async (
    r) => {
    const cur_user = await api.fetch_user()
    const data = r.payload
    if (data.user_id == cur_user) {
      get_rooms(data)

      if (window.current_room == data.room_id) {
        document.location.reload()
      }
    }
  })