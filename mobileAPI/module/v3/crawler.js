const loginPortal = require(__mobileAPIBase + 'module/v3/crawler/loginPortal');

module.exports = {
  verifyPortalAccount: (username, password) => {
    return loginPortal(username, password);
  }
}
