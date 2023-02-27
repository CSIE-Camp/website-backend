const {DEV_MODE} = require("./../config");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient;

async function Log(AccountId, AccountType, Details){
	await prisma.logs.create({
		data: {
			AccountId: AccountId,
			AccountType: AccountType,
			Details: Details,
		},
	});
	return;
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
	let Account = await FindAccountById(AccountId);
	if (!Account.Accepted){
		return false;
	}
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


const AvailableApplicationStatus = ["STAFF", "ACCEPTED", "WAITLIST_ACCEPTED", "WAITLIST", "GAVE_UP", "NOT_STARTED"];

async function ChangeApplicationStatus(StaffId, StaffRole, AccountId, Status, ip){
	if (AvailableApplicationStatus.indexOf(Status) < 0){
		await Log(StaffId, StaffRole, `Attempted to give non-existent roles from [${ip}]`);
		return [false, "Status not allowed"];
	}
	let Account = await FindAccountById(AccountId);
	if (!Account){
		return [false, "Account not found"];
	}
	await prisma.accounts.update({
		where: {
			id: AccountId,
		},
		data: {
			Status: Status,
		},
	});
	if (Status == "ACCEPTED" || Status == "WAITLIST_ACCEPTED"){
		await prisma.paymentDetails.create({
			data: {
				AccountId: AccountId,
			},
		});
	}
	return [true, "success!"];
}

async function RefundParticipant(StaffId, StaffRole, AccountId, ip){
	let Account = await FindAccountById(AccountId);
	if (!Account.Status === "GAVE_UP"){
		return [false, "Unable to confirm refund status. Participant has not given up"];
	}
	await prisma.paymentDetails.update({
		where: {
			AccountId: AccountId,
		},
		data: {
			PaymentConfirmed: "REFUNDED",
			LastEditedBy: StaffId,
		},
	});
	await Log(StaffId, StaffRole, `Has changed ${AccountId} payment status to REFUNDED from [${ip}]`);
	return [true, "Success!"];
}

async function ConfirmPaymentStatus(StaffId, StaffRole, AccountId, ip){
	let Account = await FindAccountById(AccountId);
	if (!Account){
		console.log(AccountId);
		return [false, "Account not found"];
	}
	if (Account.Status !== "ACCEPTED" && Account.Status !== "WAITLIST_ACCEPTED"){
		return [false, "Not accepted"];
	}
	if (Account.Status == "GAVE_UP"){
		return [false, "Participant has given up their slot"];
	}
	let PaymentDetails = await prisma.paymentDetails.findUnique({
		where: {
			AccountId: AccountId,
		},
	});
	
	if (!PaymentDetails || PaymentDetails.TransferDate == null){
		await Log(StaffId, StaffRole, `Attempted to confirm null payment status for ${AccountId} from [${ip}]`);
		return [false, "Account has not update payment data"];
	}
	if (PaymentDetails.PaymentConfirmed == "REFUNDED"){
		return [false, "Payment has been refunded"];
	}
	await prisma.paymentDetails.update({
		where: {
			AccountId: AccountId,
		},
		data: {
			LastEditedBy: StaffId,
			PaymentConfirmed: "PAID",
		},
	});
	return [true, "success"];
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
	if (!Account){
		return {message: "Account does not exist!"};
	}
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
				Status:  Account.Status,
			},
			Profile: await FindProfile(Account.id),
		};
		if (Account.Status === "ACCEPTED" || Account.Status === "WAITLIST_ACCEPTED"){
			ReturnData.PaymentDetails = await GetPaymentDetails(Account.id);
		}
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

async function UpdateAccountRoles(AccountId, AccountRole, TargetAccount, NewRole){
	let Account = await FindAccountById(TargetAccount);
	if (!Account){
		return "Account not found!";
	}
	let OldRole = Account.Role;
	await prisma.accounts.update({
		where: {
			id: TargetAccount,
		},
		data: {
			Role: NewRole,
		},
	});
	await Log(AccountId, AccountRole, `Updated ${TargetAccount}'s role from ${OldRole} to ${NewRole}`);
	return "Success!";
}

async function GetLogs(AccountId, AccountRole, TargetAccount, ip){
	if (TargetAccount === "null"){
		await Log(AccountId, AccountRole, `has accessed all logs from [${ip}]`);
		return await prisma.logs.findMany();
	}
	let Account = await FindAccountById(TargetAccount);
	if (!Account){
		await Log(AccountId, AccountRole, `attempted to access logs from non-existing account from [${ip}]`);
		return {message: "Target account not found!"};
	}
	await Log(AccountId, AccountRole, `accessed logs from account ${TargetAccount} from [${ip}]`);
	let Logs = await prisma.logs.findMany({
		where: {
			AccountId: TargetAccount,
		},
	});
	return Logs;
}

module.exports = {
	Log: Log,

	CreateAccount: CreateAccount,
	UpdateAccountEmail: UpdateAccountEmail,
	UpdateAccountPassword: UpdateAccountPassword,

	UpdatePaymentData: UpdatePaymentData,
	ChangeApplicationStatus: ChangeApplicationStatus,
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

	UpdateAccountRoles: UpdateAccountRoles,
	GetLogs: GetLogs,
};
