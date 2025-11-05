const { request, response } = require('express');

class AuthController {
    static async login(req = request, res = response) {
        const { email, password } = req.body;
        res.status(200).json({
            body: {
                email,
                password
            }
        });
    }
}

module.exports = AuthController;