module.exports = {
    getCourseInfo: (req, res, next) => {
      res.status(404).json({
        statusCode: 404,
        status: "Not found."
      });
    },
    getHomeworks: (req, res, next) => {
      res.status(404).json({
        statusCode: 404,
        status: "Not found."
      });
    },
    getNotices: (req, res, next) => {
      res.status(404).json({
        statusCode: 404,
        status: "Not found."
      });
    },
    getMaterials: (req, res, next) => {
      res.status(404).json({
        statusCode: 404,
        status: "Not found."
      });
    },
    getAttachment: (req, res, next) => {
      res.status(404).json({
        statusCode: 404,
        status: "Not found."
      });
    }
}
