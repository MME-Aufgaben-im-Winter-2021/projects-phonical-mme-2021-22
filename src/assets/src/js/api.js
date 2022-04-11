/* eslint-disable */
const Server = {
  endpoint: "https://appwrite.software-engineering.education/v1",
  project: "62066441987f0d2d4aa8",
  profileCollectionId: "62423c047b6cc775bd24",
};

let api = {
  sdk: null,
  user: null,

  provider: () => {
    if (api.sdk) return api.sdk;
    let appwrite = new Appwrite();
    appwrite.setEndpoint(Server.endpoint).setProject(Server.project);
    api.sdk = appwrite;
    return appwrite;
  },

  fetch_user: async () => {
    if (api.user) return api.user;
    let user = await api.getAccount();
    api.user = user.$id;
    return user.$id;
  },

  get_user_name: async () => {
    if (api.user) return api.user;
    let user = await api.getAccount();
    api.user = user.$id;
    return user.$id;
  },

  createAccount: (email, password, name) => {
    return api.provider().account.create("unique()", email, password, name);
  },

  getAccount: () => {
    return api.provider().account.get();
  },

  createSession: (email, password) => {
    return api.provider().account.createSession(email, password);
  },

  deleteCurrentSession: () => {
    return api.provider().account.deleteSession("current");
  },

  createDocument: (collectionId, data) => {
    return api
      .provider()
      .database.createDocument(collectionId, "unique()", data);
  },

  listDocuments: (collectionId) => {
    return api.provider().database.listDocuments(collectionId);
  },

  updateDocument: (collectionId, documentId, data, read, write) => {
    return api
      .provider()
      .database.updateDocument(collectionId, documentId, data, read, write);
  },

  deleteDocument: (collectionId, documentId) => {
    return api.provider().database.deleteDocument(collectionId, documentId);
  },
};
