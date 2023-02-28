const { ACCESS_TOKEN_EXPIRE, ACCESS_TOKEN_SECRET, REFRESH_TOKEN_EXPIRE, REFRESH_TOKEN_SECRET, EMAIL_TOKEN_SECRET, EMAIL_TOKEN_EXPIRE, MAX_REFRESH_TOKENS, RESET_PASSWORD_SECRET, RESET_PASSWORD_EXPIRE, TEMP_ACCESS_SECRET, TEMP_ACCESS_EXPIRE, CLIENT_URL } = require("./../config");

const { GetStoredRefreshTokens, AddStoredRefreshTokens, RevokeStoredRefreshToken, RevokeAllStoredRefreshTokens, FindAccountById} = require("./Database");
const { randomBytes, randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");
const redis = require("redis");

const REDIS_REFRESH_TOKEN_FIELD = "refresh_tokens";

const RedisClient = redis.createClient();

async function CheckRedisConnection(){
	if (!RedisClient.isOpen){
		return RedisClient.connect();
	}
}
async function GenerateAccessToken(userid, Role,  ip) {
	let token = jwt.sign(
		{
			UserId: userid,
			CreatedByIp: ip,
			Role: Role,
			CreatedAt: Date.now(),
			Expires: ACCESS_TOKEN_EXPIRE,
		},
		ACCESS_TOKEN_SECRET,
		{
			algorithm: "HS512",
			expiresIn: ACCESS_TOKEN_EXPIRE,
		},
	);
	return token;
}

async function CompareRoles(AccountId, CurrentRole, ip){
	let Account = await FindAccountById(AccountId);
	if (Account.Role === CurrentRole){
		return;
	}
	let NewToken = GenerateAccessToken(AccountId, Account.Role, ip);
	return NewToken;
}

async function GenerateEmailToken(email) {
	let token = jwt.sign(
		{
			Email: email,
			TimeStamp: Date.now(),
		},
		EMAIL_TOKEN_SECRET,
		{
			algorithm: "HS512",
			expiresIn: EMAIL_TOKEN_EXPIRE,
		},
	);
	return `${CLIENT_URL}/verification/email/${token}`;
}

async function GeneratePasswordResetToken(email, userid) {
	let token = jwt.sign(
		{
			TimeStamp: Date.now(),
			UserId: userid,
			Email: email,
		},
		RESET_PASSWORD_SECRET,
		{
			algorithm: "HS512",
			expiresIn: RESET_PASSWORD_EXPIRE,
		},
	);
	return `${CLIENT_URL}/login/password/reset/${token}`;
}

async function GetRefreshTokens(AccountId){
	await CheckRedisConnection();
	let RedisTokens = await RedisClient.hGet(REDIS_REFRESH_TOKEN_FIELD, AccountId);
	if (RedisTokens && JSON.parse(RedisTokens).length > 0){
		return JSON.parse(RedisTokens);
	}
	let StoredTokens = await GetStoredRefreshTokens(AccountId);
	await RedisClient.hSet(REDIS_REFRESH_TOKEN_FIELD, AccountId, JSON.stringify(StoredTokens));
	return StoredTokens;
}

async function FindRefreshToken(AccountId, TokenId){
	let Tokens = await GetRefreshTokens(AccountId);
	let Keys = Object.keys(Tokens);
	if (Keys.indexOf(TokenId) > -1){
		return true;
	}
	return false;
}

async function RevokeOldestRefreshToken(AccountId, Tokens){
	let Keys = Object.keys(Tokens);
	let Oldest = Date.now();
	let TokenId = null;
	for (let i = 0; i < Keys.length; i++){
		let Key = Keys[i];
		let Token = Tokens[Key];
		let CreationTime = Number(Token.CreatedAt);
		if (CreationTime < Oldest){
			Oldest = CreationTime;
			TokenId = Key;
		}
	}
	delete(Tokens[TokenId]);
	await RedisClient.hDel(REDIS_REFRESH_TOKEN_FIELD, AccountId);
	await RedisClient.hSet(REDIS_REFRESH_TOKEN_FIELD, AccountId, JSON.stringify(Tokens), async (err) => {
		console.error(err);
	});
	await RevokeStoredRefreshToken(AccountId, TokenId);
	return Tokens;
}

async function RevokeAllRefreshTokens(AccountId){
	await RedisClient.hDel(REDIS_REFRESH_TOKEN_FIELD, AccountId);
	await RevokeAllStoredRefreshTokens(AccountId);
	return;
}

async function UpdateRefreshTokens(AccountId, Tokens, TokenId, Token, TimeStamp){
	await CheckRedisConnection();
	await RedisClient.hSet(REDIS_REFRESH_TOKEN_FIELD, AccountId, JSON.stringify(Tokens), async (err) => {
		console.error(err);
	});
	await AddStoredRefreshTokens(AccountId, TokenId, Token, TimeStamp);
	return;
}

async function GenerateRefreshToken(AccountId, ip) {
	let Tokens = await GetRefreshTokens(AccountId);
	if (Object.keys(Tokens).length == MAX_REFRESH_TOKENS){
		Tokens = RevokeOldestRefreshToken(AccountId, Tokens);
	}
	let TokenId = randomUUID();
	let TimeStamp = Date.now().toString();
	let Token = jwt.sign(
		{
			_id: TokenId,
			UserId: AccountId,
			Gibberish: randomBytes(64).toString("hex"),
			Expires: REFRESH_TOKEN_EXPIRE,
			CreatedByIp: ip,
			CreatedAt: TimeStamp,
		},
		REFRESH_TOKEN_SECRET,
		{
			algorithm: "HS512",
			expiresIn: REFRESH_TOKEN_EXPIRE,
		},
	);
	Tokens[TokenId] = {
		Token: Token,
		CreatedAt: TimeStamp,
	};
	await UpdateRefreshTokens(AccountId, Tokens, TokenId, Token, TimeStamp);
	return Token;
}

async function GenerateTempAccessToken(Email){
	let token = jwt.sign(
		{
			Email: Email,
			CreatedAt: Date.now(),
		},
		TEMP_ACCESS_SECRET,
		{
			algorithm: "HS512",
			expiresIn: TEMP_ACCESS_EXPIRE,
		},
	);
	return token;
}


module.exports = {
	GenerateAccessToken: GenerateAccessToken,
	GenerateEmailToken: GenerateEmailToken,
	GenerateRefreshToken: GenerateRefreshToken,
	GeneratePasswordResetToken: GeneratePasswordResetToken,
	GenerateTempAccessToken: GenerateTempAccessToken,
	FindRefreshToken: FindRefreshToken,
	RevokeAllRefreshTokens: RevokeAllRefreshTokens,
	CompareRoles: CompareRoles,
};