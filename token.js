const jwt = require('jsonwebtoken');

const secretToken = process.env.SECRET_TOKEN;

function generateToken(id) {
    const token = jwt.sign({ id }, secretToken, { expiresIn: 99999999 })
    return token;
}

function validateToken(req, res, next) {
    const authToken = req.headers.authorization;
    if (!authToken) {
        return res.status(401).json({ error: "Token não fornecido" });
    }
    const [bearer, token] = authToken.split(" ");
    jwt.verify(token, secretToken, (err, tokenDecoded) => {
        if (err) {
            return res.status(401).json({ error: "Token inválido" });
        }
        req.id = tokenDecoded.id
        next();
    })
}

module.exports = { generateToken, validateToken }