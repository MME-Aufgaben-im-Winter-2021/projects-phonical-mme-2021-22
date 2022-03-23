/* eslint-disable */
import api from "./api";

const signup = async ({ email, password, name }) => {
  try {
    const account = await api.createAccount(email, password, name);
    await api.createSession(email, password);
  } catch (e) {
    console.log("Error creating Account");
  }
};

const fetchAccount = async () => {
  try {
    const account = await api.getAccount();
  } catch (e) {
    console.log("Error getting Account");
  }
};

const login = async ({ email, password }) => {
  try {
    console.log(email, password);
    await api.createSession(email, password);
    const account = await api.getAccount();
  } catch (e) {
    console.log("Error creating Session", e);
  }
};

const logout = async () => {
  try {
    await api.deleteCurrentSession();
  } catch (e) {
    console.log("Error deleting session");
  }
};