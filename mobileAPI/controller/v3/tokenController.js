module.exports = {
    verify: (req, res, next) => {
      res.status(404).json({
        statusCode: 404,
        status: "Not found."
      });
    },
    refresh: (req, res, next) => {
      res.status(404).json({
        statusCode: 404,
        status: "Not found."
      });
    }
}
