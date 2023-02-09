const { ACCESS_TOKEN_EXPIRE, ACCESS_TOKEN_SECRET, REFRESH_TOKEN_EXPIRE, REFRESH_TOKEN_SECRET, EMAIL_TOKEN_SECRET, EMAIL_TOKEN_EXPIRE, MAX_REFRESH_TOKENS, RESET_PASSWORD_SECRET, RESET_PASSWORD_EXPIRE } = require("./../config")

const { randomBytes, randomUUID } = require("crypto")
const jwt = require("jsonwebtoken")
const redis = require("redis")


const RedisClient = redis.createClient()

async function CheckRedisConnection(){
    if (!RedisClient.isOpen){
        return RedisClient.connect()
    }
}

async function GenerateAccessToken(userid, ip) {
    let token = jwt.sign(
        {
            UserId: userid,
            CreatedByIp: ip,
            CreatedAt: Date.now(),
            Expires: ACCESS_TOKEN_EXPIRE
        },
        ACCESS_TOKEN_SECRET,
        {
            algorithm: "HS512",
            expiresIn: ACCESS_TOKEN_EXPIRE
        }
    )
    return token
}

async function GenerateEmailToken(id) {
    let token = jwt.sign(
        {
            UserId: id
        },
        EMAIL_TOKEN_SECRET,
        {
            algorithm: "HS512",
            expiresIn: EMAIL_TOKEN_EXPIRE
        }
    )
    return token
}

async function GeneratePasswordResetToken(userid) {
    let token = jwt.sign(
        {
            _id: userid
        },
        RESET_PASSWORD_SECRET,
        {
            algorithm: "HS512",
            expiresIn: RESET_PASSWORD_EXPIRE
        }
    )
    return token
}

async function GetRefreshTokens(userid) {
    await CheckRedisConnection()
    let tokens = await RedisClient.hGet("refresh_tokens", userid)
    if (tokens) {
        return JSON.parse(tokens)
    }
    return {}
}

async function GetOldestToken(tokens) {
    let OldestTime = [Date.now(), null]
    for (let id in tokens) {
        let CreationTime = tokens[id].CreatedAt
        if (CreationTime <= OldestTime[0]) {
            OldestTime = [CreationTime, id]
        }
    }
    let id = (OldestTime[1])
    return id
}

async function GenerateRefreshToken(userid, ip) {
    await CheckRedisConnection()
    let tokens = await GetRefreshTokens(userid)
    if (Object.keys(tokens).length >= MAX_REFRESH_TOKENS) {
        delete (tokens[await GetOldestToken(tokens)])
    }
    let TokenId = randomUUID()

    let token = jwt.sign(
        {
            _id: TokenId,
            UserId: userid,
            Value: randomBytes(64).toString("hex"),
            Expires: REFRESH_TOKEN_EXPIRE,
            CreatedByIp: ip,
            CreatedAt: Date.now()
        },
        REFRESH_TOKEN_SECRET,
        {
            algorithm: "HS512",
            expiresIn: REFRESH_TOKEN_EXPIRE
        }
    )
    tokens[TokenId] = {
        Token: token,
        CreatedAt: Date.now(),
        Ip: ip
    }
    await RedisClient.hSet("refresh_tokens", userid, JSON.stringify(tokens))
    return token
}

async function RevokeRefreshToken(UserId, uuid) {
    await CheckRedisConnection()
    let tokens = await GetRefreshTokens(UserId)
    if (tokens[uuid]) {
        delete (tokens[uuid])
        await RedisClient.hSet("refresh_tokens", UserId, JSON.stringify(tokens))
        return { status: true, message: "Token revoked" }
    }
    return { staus: false, message: "token not found" }
}




module.exports = {
    GenerateAccessToken: GenerateAccessToken,
    GenerateEmailToken: GenerateEmailToken,
    GenerateRefreshToken: GenerateRefreshToken,
    GeneratePasswordResetToken: GeneratePasswordResetToken,
    RevokeRefreshToken: RevokeRefreshToken
}