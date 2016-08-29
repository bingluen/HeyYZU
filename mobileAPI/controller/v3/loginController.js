var rsaModule = require(__mobileAPIBase + 'module/v3/rsa');

module.exports = {
    student: (req, res, next) => {
        // check request body
        if (!req.body.messages) {
            res.ststus(400).json({
                statusCode: 1101,
                status: "Params illegal."
            });
            return;
        }

        // try to decrypt messages
        var messages;
        try {
            messages = rsaModule.priDecrypt(req.body.messages)
        } catch (e) {
            res.ststus(400).json(JSON.stringify(e));
            return;
        }

        // try parse JSON string
        try {
            messages = JSON.parse(messages)
        } catch (e) {
            res.status(400).json(JSON.stringify(e));
            return;
        }
    }
}
