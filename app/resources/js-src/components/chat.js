function toggle_chat_screen() {
  $(".chat-info-panel").toggleClass("hide");
}

$(".media-card").on("click", (e) => {
  const img_src = $(e.target).find("img").attr("src");
  const chat_title = $(e.target).find(".chat-title").html();

  $(".header-bar").find(".media-card > img").attr("src", img_src);
  $(".header-bar").find(".chat-title").html(chat_title);
});

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

  $("#settings_panel_name").val(account.name);
  $("#settings_panel_email").val(account.email);
}