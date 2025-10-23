const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({
    jwksUri: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_USER_POOL_ID}/.well-known/jwks.json`,
});

function getKey(header, callback) {
    client.getSigningKey(header.kid, (err, key) => {
        const signingKey = key.publicKey || key.rsaPublicKey;
        callback(null, signingKey);
    });
}

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ err: 'Authorization header not found' });
    }

    const token = authHeader.split(' ')[1];

    if (token) {
        jwt.verify(token, getKey, {}, (err, user) => {
            if (err) {
                return res.status(403).json({ err: 'Invalid token' });
            }

            req.user = user;
            next();
        });
    } else {
        res.status(401).json({ err: 'Token not found' });
    }
};

module.exports = authenticateJWT;