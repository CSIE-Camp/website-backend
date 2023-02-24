const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient;

async function CreateAccount(Email, HashedPassword) {
	let UserRecord = await prisma.accounts.create({
		data: {
			Email: Email,
			Password: HashedPassword,
		},
	});

	await prisma.profiles.create({
		data: {
			AccountId: UserRecord.id,
		},
	});
	return UserRecord;
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
	delete (Profile.AccountId);
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

async function DeleteProfile(AccountId) {

}


module.exports = {
	CreateAccount: CreateAccount,
	UpdateAccountEmail: UpdateAccountEmail,
	UpdateAccountPassword: UpdateAccountPassword,
	FindAccountByEmail: FindAccountByEmail,
	FindAccountById: FindAccountById,
	GetAccountId: GetAccountId,
	GetEmergencyInfo: GetEmergencyInfo,
	FindProfile: FindProfile,
	UpdateProfile: UpdateProfile,
};
