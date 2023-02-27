const {DEV_MODE} = require("./../config");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient;

async function Log(AccountId, AccountType, Details){
	if (DEV_MODE) {return;};
	await prisma.logs.create({
		data: {
			AccountId: AccountId,
			AccountType: AccountType,
			Details: Details,
		},
	});
}

async function CreateAccount(Email, HashedPassword) {
	let Account = await prisma.accounts.create({
		data: {
			Email: Email,
			Password: HashedPassword,
		},
	});

	await prisma.profiles.create({
		data: {
			AccountId: Account.id,
		},
	});
	await prisma.paymentDetails.create({
		data: {
			AccountId: Account.id,
		},
	});
	return Account;
}


async function UpdateAccountEmail(Email) {
	let UserRecord = await prisma.accounts.update({
		where: {
			Email: Email,
		},
		data: {
			Email: Email,
		},
	});
	return UserRecord;
}

async function UpdateAccountPassword(userid, password) {
	let UserRecord = await prisma.accounts.update({
		where: {
			id: userid,
		},
		data: {
			Password: password,
		},
	});
}

async function GetAccountId(Email){
	let Account = await prisma.accounts.findUnique({
		where: {
			Email: Email,
		},
	});
	if (!Account){
		return null;
	}
	return Account.id;
}

async function FindAccountByEmail(Email) {
	let Account = await prisma.accounts.findUnique({
		where: {
			Email: Email,
		},
	});
	return Account;
}

async function FindAccountById(AccountId) {
	let Account = await prisma.accounts.findUnique({
		where: {
			id: AccountId,
		},
	});
	return Account;
}

async function RemoveAccountByEmail(Email) {
	let DeletedAccount = await prisma.accounts.delete({
		where: {
			Email: Email,
		},
	});
	return DeletedAccount;
}

async function RemoveAccountById(AccountId) {
	let DeletedAccount = await prisma.accounts.delete({
		where: {
			id: AccountId,
		},
	});
	return DeletedAccount;
}

async function GetEmergencyInfo(AccountId) {
	let EmergencyData = await prisma.profiles.findMany({
		where: {
			id: AccountId,

		},
		select: {
			Emergency_BloodType: true,
			Emergency_Number: true,
			Emergency_Relationship: true,
			Emergency_ContactName: true,
		},
	});
	return EmergencyData;
}

async function FindProfile(id) {
	let Profile = await prisma.profiles.findUnique({
		where: {
			AccountId: id,
		},
	});
	if (Profile.Validated_ID == null && Profile.Unvalidate_ID == null){
		delete(Profile.Validated_ID);
		delete(Profile.Unvalidate_ID);
		Profile["ID_Documents"] = "";
	}
	if (Profile.Validated_ID && Profile.Unvalidate_ID == null){
		delete(Profile.Unvalidate_ID);
		Profile["ID_Documents"] = Profile.Validated_ID;
	}
	if (Profile.Validated_ID == null && Profile.Unvalidate_ID){
		delete(Profile.Validated_ID);
		Profile["ID_Documents"] = Profile.Unvalidate_ID;
	}
	delete (Profile.id);
	delete(Profile.AccountId);
	return Profile;
}

async function UpdateProfile(AccountId, data) {
	let Profile = await FindProfile(AccountId);
	let Remove = [];
	for (let key in Profile) {
		if (!Profile[key] && !data[key]) {
			Remove.push(key);
			continue;
		}
		if (Profile[key] && data[key]) {
			if (Profile[key] === data[key]) {
				Remove.push(key);
				continue;
			}
			Profile[key] = data[key];
		}
		Profile[key] = data[key];
	}
	for (let i = 0; i < Remove.length; i++){
		delete(Profile[Remove[i]]);
	}
	let NewProfile = await prisma.profiles.update({
		where: {
			AccountId: AccountId,
		},
		data: Profile,
	});
	delete (Profile.id);
	delete(Profile.Validated_ID);
	delete(Profile.Unvalidate_ID);
	delete (Profile.AccountId);
	return NewProfile;
}

async function GetPaymentDetails(AccountId){
	let PaymentDetails = await prisma.paymentDetails.findUnique({
		where: {
			AccountId: AccountId,
		},
	});
	delete(PaymentDetails.id);
	delete(PaymentDetails.AccountId);
	return PaymentDetails;
}

async function UpdatePaymentData(AccountId, TransferDate, AccountName, Last5Digits){
	let PaymentData = await prisma.paymentDetails.update({
		where: {
			AccountId: AccountId,
		},
		data: {
			TransferDate: TransferDate,
			AccountName: AccountName,
			Account_Last5Digits: Last5Digits,
		},
	});
	return PaymentData;
}

async function ConfirmPaymentStatus(Staff, ip, AccountId){
	let PaymentDetails = await prisma.findUnqiue({
		where: {
			AccountId: TargetId,
		},
	});
	if (!PaymentDetails || PaymentDetails.TransferDate == null){
		await Log(Staff.id, Staff.Role, `Attempted to confirm null payment status for ${AccountId} from [${ip}]`);
		return false;
	}
	await prisma.paymentDetails.update({
		where: {
			AccountId: AccountId,
		},
		data: {
			PaymentConfirmed: true,
		},
	});
	return true;
}

async function AdminViewProfile(TargetId, {AccountId, AccountRole}){
	let ReturnData = {
		Account: {},
	};
	let Account = await prisma.accounts.findUnique({
		where: {
			id: TargetId,
		},
	});
	ReturnData.Account.Email = Account.Email;
	ReturnData.Account.CreatedAt = Account.CreatedAt;
	ReturnData.Account.Role = Account.Role;
	Account = null;
	ReturnData.Profile = await prisma.profiles.findUnique({
		where: {
			AccountId: TargetId,
		},
	});
	ReturnData.PaymentDetails = await GetPaymentDetails(TargetId);
	
	await Log(AccountId, AccountRole, `Has queried profile data for account ${TargetId}`);
	return ReturnData;
}

async function AdminViewAllProfile(AccountId, AccountRole){
	let ReturnData = {};
	let Accounts = await prisma.accounts.findMany();
	for (let i = 0; i < Accounts.length; i++){
		let Account = Accounts[i];
		ReturnData[Account.id] = {
			Account: {
				Email: Account.Email,
				CreatedAt: Account.CreatedAt,
				Role: Account.Role,
			},
			Profile: await FindProfile(Account.id),
			PaymentDetails: await GetPaymentDetails(Account.id),
		};
	};
	await Log(AccountId, AccountRole, "User has queried for ALL profile data");
	return ReturnData;
}

async function GetStoredRefreshTokens(AccountId){
	let Tokens = await prisma.refreshTokens.findMany({
		where: {
			AccountId: AccountId,
		},
	});
	let ReturnData = {};
	for (let i = 0; i < Tokens.length; i++){
		let Token = Tokens[i];
		ReturnData[Token.id] = {
			Token: Token.Token,
			CreatedAt: Token.CreatedAt,
		};
	}
	return ReturnData;
}

async function AddStoredRefreshTokens(AccountId, TokenId, Token, CreatedAt){
	await prisma.refreshTokens.create({
		data: {
			id: TokenId,
			Token: Token,
			CreatedAt: CreatedAt,
			AccountId: AccountId,
		},
	});
	return;
}

async function RevokeStoredRefreshToken(AccountId, TokenId){
	await prisma.refreshTokens.delete({
		where: {
			id: TokenId,
		},
	});
	return;
}

async function RevokeAllStoredRefreshTokens(AccountId){
	await prisma.refreshTokens.deleteMany({
		where: {
			AccountId: AccountId,
		},
	});
	return;
}

async function UpdateAccountStatus(AccountId, TargetId, Status){

}

module.exports = {
	Log: Log,

	CreateAccount: CreateAccount,
	UpdateAccountEmail: UpdateAccountEmail,
	UpdateAccountPassword: UpdateAccountPassword,

	UpdatePaymentData: UpdatePaymentData,
	ConfirmPaymentStatus: ConfirmPaymentStatus,

	FindAccountByEmail: FindAccountByEmail,
	FindAccountById: FindAccountById,

	GetAccountId: GetAccountId,
	GetEmergencyInfo: GetEmergencyInfo,

	FindProfile: FindProfile,
	UpdateProfile: UpdateProfile,

	AdminViewProfile: AdminViewProfile,
	AdminViewAllProfile: AdminViewAllProfile,

	GetStoredRefreshTokens: GetStoredRefreshTokens,
	AddStoredRefreshTokens: AddStoredRefreshTokens,
	RevokeStoredRefreshToken: RevokeStoredRefreshToken,
	RevokeAllStoredRefreshTokens: RevokeAllStoredRefreshTokens,

	UpdateAccountStatus: UpdateAccountStatus,
};
