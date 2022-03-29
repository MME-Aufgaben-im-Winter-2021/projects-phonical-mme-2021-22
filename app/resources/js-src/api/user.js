const signup = async ({ email, password, name }) => {
  try {
    const account = await api.createAccount(email, password, name);
    await api.createSession(email, password);
    document.location.href = "chat.html";
  } catch (e) {
    alert(e);
  }
};

const fetchAccount = async () => {
  try {
    const account = await api.getAccount();
  } catch (e) {
    alert(e);
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
