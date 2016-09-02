var exception = {
  LoginFailed: {
    statusCode: 1103,
    status: "Login failed."
  }
}

function CrawlerException(statusCode, status) {
  if (Number.isInteger(statusCode) && (typeof(status) === "string" || status instanceof String)) {
    this.statusCode = statusCode;
    this.status = status;
  } else if (Object.keys(exception).indexOf(statusCode) > -1) {
    this.statusCode = exception[statusCode].statusCode;
    this.status = exception[statusCode].status;
  } else {
    this.error = statusCode;
  }
}

module.exports = (statusCode, status) => {
  return new CrawlerException(statusCode, status);
}
