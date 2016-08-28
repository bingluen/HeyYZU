module.exports = {
  getCourses: (req, res, next) => {
    res.status(404).json({
      statusCode: 404,
      status: "Not found."
    });
  },
  refreshCourse: (req, res, next) => {
    res.status(404).json({
      statusCode: 404,
      status: "Not found."
    });
  },
  refreshDeviceToken: (req, res, next) => {
    res.status(404).json({
      statusCode: 404,
      status: "Not found."
    });
  },
  getDevices: (req, res, next) => {
    res.status(404).json({
      statusCode: 404,
      status: "Not found."
    });
  }
}
