/* eslint-disable */
const signup = async ({ email, password, name }) => {
  try {
    const account = await api.createAccount(email, password, name);
    await api.createSession(email, password);
    await api.createDocument(Server.profileCollectionId, {
      user_id: account.$id,
      user_name: name,
      user_email: account.email
    });
    document.location.href = "chat.html";
  } catch (e) {
    alert(e);
  }
};

const fetchAccount = async () => {
  try {
    const account = await api.getAccount();
  } catch (e) {
    console.log(e);
    document.location.href = "login.html";
  }
};

const login = async ({ email, password }) => {
  try {
    await api.createSession(email, password);
    const account = await api.getAccount();
    document.location.href = "chat.html";
  } catch (e) {
    alert(e);
  }
};

const logout = async () => {
  try {
    await api.deleteCurrentSession();
    document.location.href = "login.html";
  } catch (e) {
    alert(e);
  }
};

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
