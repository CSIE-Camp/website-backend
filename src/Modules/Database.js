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

async function CreateCampStatus(){
	let Records = await prisma.campStatus.findMany();
	let Keys = Object.keys(Records).length;
	if (Keys == 1){
		return Records;
	}
	if (Keys > 1){
		await prisma.campStatus.deleteMany();
	}
	let NewRecord = await prisma.campStatus.create({
		data: {
			id: 1,
		},
	});
	return NewRecord;
}

async function GetCampStatus(){
	let Status = await prisma.campStatus.findUnique({
		where: {
			id: 1,
		},
	});
	if (!Status){
		let Status = CreateCampStatus();
		delete(Status.id);
		return Status;
	}
	delete(Status.id);
	return Status;
}
async function UpdateCampStatus(StaffId, StaffRole, Status, ip){
	await CreateCampStatus();
	await prisma.campStatus.update({
		where: {
			id: 1,
		},
		data: Status,
	});
	await Log(StaffId, StaffRole,`Updated camp status from [${ip}]`);
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

async function UpdateAccountPassword(Email, password) {
	let Account = await FindAccountByEmail(Email);
	if (!Account){
		return false;
	}
	await prisma.accounts.update({
		where: {
			id: Account.id,
		},
		data: {
			Password: password,
		},
	});
	return Account.id;
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

const NewProfileTranslate = {
	"Name" : "name",
	"Gender" : "gender",
	"School" : "school",
	"BirthDate" : "birthDate",
	"ID_Document" : "personalId",
	"PhoneNumber" : "phoneNumber",
	"Emergency_BloodType" : "bloodType",
	"Facebook" : "fbLink",
	"Emergency_ContactName" : "parentName",
	"Emergency_ContactRelationship" : "relation",
	"Emergency_ContactNumber" : "parentPhoneNumber",
	"TravelHistory" : "travelHistory",
	"FoodType" : "foodType",
	"AllergySource" : "allergySource",
	"Diseases" : "disease",
	"ClothesSize" : "clothesSize",
	"SelfIntro" : "selfIntro",
	"Motivation" : "motivation",
	"PicturePath" : "selfPicture",
	"Lang_Leanred" : "lanlearned",
	"Lang_Mastered" : "lanMaster",
};

async function UpdateProfile(AccountId, NewProfileData){
	let ExistingProfile = await FindProfile(AccountId);
	let ExistingKeys = Object.keys(ExistingProfile);
	let ToUpdate = {};
	let Missing = {};
	let PersonalId = NewProfileData["personalId"];
	if (PersonalId){
		ToUpdate.ID_Validated = PersonalId.split("|")[0] !== "Unknown" ? true : false;
	}
	
	for (let i = 0; i < ExistingKeys.length; i++){
		let Key = ExistingKeys[i];
		if (Key == "ConsentFormPath"){
			continue;
		}
		if (NewProfileData[NewProfileTranslate[Key]]){
			let Existing = ExistingProfile[Key];
			let New = NewProfileData[NewProfileTranslate[Key]];
			if (New && Existing !== New){
				ToUpdate[Key] = New;
			}
			if (!New){
				Missing[NewProfileTranslate[Key]] = "Missing data";
			}
		}
	}
	let NewProfile = await prisma.profiles.update({
		where: {
			AccountId: AccountId,
		},
		data: ToUpdate,
	});
	delete(NewProfile.id);
	delete(NewProfile.AccountId);
	return {NewProfile, Missing};
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


async function UpdatePaymentData(AccountId, {TransferDate, AccountName, Account_Last5Digits}){
	let Account = await FindAccountById(AccountId);
	if (!(Account.StatusStatus == "ACCEPTED" || Account.Status == "WAITLIST_ACCEPTED")){
		return false;
	}
	let PaymentData = await prisma.paymentDetails.update({
		where: {
			AccountId: AccountId,
		},
		data: {
			TransferDate: TransferDate,
			AccountName: AccountName,
			Account_Last5Digits: Account_Last5Digits,
		},
	});
	return true;
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

async function AdminViewProfile(TargetId, AccountId, AccountRole){
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

async function GetAccountStatus(AccountId){
	let Profile = FindProfile(AccountId);
	let Account = FindAccountById(AccountId);
	let Keys = Object.keys(Profile);
	let ReturnData = {
		Applied: Account.Applied,
		Profile: true,
		PassedTest: Account.PassedTest,
		GitHub: Account.GitHub ? true : false,
	};
	for (let i = 0; i < Keys.length; i++){
		let Key = Keys[i];
		if (!Profile[Key]){
			ReturnData.Profile = false;
		}
	}
	return ReturnData;
}

async function ApplyToCamp(AccountId, Status){
	await prisma.accounts.update({
		where: {
			id: AccountId,
		},
		data: {
			Applied: Status,
		},
	});
	return;
}

async function UploadConsentForm(AccountId, Path){
	await prisma.profiles.update({
		where: {
			AccountId: AccountId,
		},
		data: {
			ConsentFormPath: Path,
		},
	});
	return;
}

async function CompleteTest(AccountId){
	await prisma.accounts.update({
		where: {
			id: AccountId,
		},
		data: {
			PassedTest: true,
		},
	});
	return;
}

async function EditPoints(AccountId, Points){
	let Account = await FindAccountById(AccountId);
	let CurrentPoints = Account.Points;
	let NewPoints = CurrentPoints += Points;
	let NewRecord = await prisma.accounts.update({
		where: {
			id: AccountId,
		},
		data: {
			Points: NewPoints,
		},
	});
	return NewRecord.Points;
}

async function FindDataByName(Name){
	let Records = await prisma.profiles.findMany({
		where: {
			Name: Name,
		},
	});
	if (Object.keys(Records).length == 0){
		return "Not found";
	}
	let ReturnData = {};
	for (let i = 0; i < Object.keys(Records).length; i++){
		let Profile = Records[i];
		let Account = await FindAccountById(Profile.AccountId);
		let PaymentData = await GetPaymentDetails(Profile.AccountId);
		ReturnData[Profile.AccountId] = {
			Profile: Profile,
			Account: Account,
			PaymentData: PaymentData,
		};
	}
	return ReturnData;
}

module.exports = {
	Log: Log,

	GetCampStatus: GetCampStatus,
	UpdateCampStatus: UpdateCampStatus,

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

	GetAccountStatus: GetAccountStatus,
	ApplyToCamp: ApplyToCamp,
	UploadConsentForm: UploadConsentForm,
	CompleteTest: CompleteTest,
	FindDataByName: FindDataByName,
};
