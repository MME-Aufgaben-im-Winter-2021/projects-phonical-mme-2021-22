function login_with_appwrite() {
  const email = document.getElementById("login_email").value;
  const password = document.getElementById("login_password").value;

  login({ email, password });
}

function signup_with_appwrite() {
  const name = document.getElementById("signup_name").value;
  const email = document.getElementById("signup_email").value;
  const password = document.getElementById("signup_password").value;

  signup({ email, password, name });
}

function redirect_to_login() {
  $(".login-form").show();
  $(".signup-form").hide();
}

function redirect_to_signup() {
  $(".login-form").hide();
  $(".signup-form").show();
}
