module.exports = {
  status: (req, res, next) => {
    res.status(200).json({
      statusCode: 200,
      status: "Successful.",
      APIStatus: "Good.",
      HTTPStatus: "Good."
    });
  },
  iOS: (req, res, next) => {
    res.status(200).json({
      statusCode: 200,
      status: "Successful.",
      lastVer: "1.0.0",
      minVer: "1.0.0",
    });
  },
  android: (req, res, next) => {
    res.status(200).json({
      statusCode: 200,
      status: "Successful.",
      lastVer: 1,
      minVer: 1
    });
  }
}
