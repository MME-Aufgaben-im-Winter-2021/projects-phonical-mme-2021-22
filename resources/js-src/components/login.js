function login() {
  document.location.href = "chat.html";
}

function signup() {
  document.location.href = "chat.html";
}

function redirect_to_login() {
  $(".login-form").show();
  $(".signup-form").hide();
}

function redirect_to_signup() {
  $(".login-form").hide();
  $(".signup-form").show();
}