module.exports = {
    student: (req, res, next) => {
      res.status(404).json({
        statusCode: 404,
        status: "Not found."
      });
    }
}
