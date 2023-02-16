const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient

async function CreatePendingAccount(Email, Password){
	let UserRecord = await prisma.pendingAccounts.create({
		data: {
			Email: Email,
			Password: Password
		}
	})
	return UserRecord
}

async function VerifyPendingAccount(PendingId){
	let PendingRecord = await prisma.pendingAccounts.findUnique({
		where: {
			id: PendingId
		}
	})
	if (!PendingRecord){
		return false
	}
	let UserRecord = await prisma.accounts.create({
		data: {
			Email: PendingRecord.Email,
			Password: PendingRecord.Password,
			CreatedAt: PendingRecord.CreatedAt
		}
	})
	await prisma.pendingAccounts.delete({
		where: {id: PendingId}
	})
	return UserRecord
}


async function CreateAccount(Email, Password) {
	let UserRecord = await prisma.accounts.create({
		data: {
			Email: Email,
			Password: Password
		}
	})
	return UserRecord
}

async function UpdateAccount(Email, Password) {
	let UserRecord = await prisma.accounts.update({
		data: {
			Emaill: Email,
			Password: Password
		}
	})
	return UserRecord
}

async function FindAccountByEmail(Email) {
	let Account = await prisma.accounts.findUnique({
		where: {
			Email: Email
		}
	})
	return Account
}


async function FindAccountById(AccountId) {
	let Account = await prisma.accounts.findUnique({
		where: {
			id: AccountId
		}
	})
	return Account
}

async function RemoveAccountByEmail(Email) {
	let DeletedAccount = await prisma.accounts.delete({
		where: {
			Email: Email
		}
	})
	return DeletedAccount
}

async function RemoveAccountById(AccountId) {
	let DeletedAccount = await prisma.accounts.delete({
		where: {
			id: AccountId
		}
	})
	return DeletedAccount
}

async function GetEmergencyInfo(AccountId) {
	let EmergencyData = await prisma.profiles.findMany({
		where: {
			id: AccountId
		},
		select: {
			Emergency_BloodType: true,
			Emergency_Number: true,
			Emergency_Relationship: true,
			Emergency_ContactName: true
		}
	})
	return EmergencyData
}

module.exports = {
	CreateAccount: CreateAccount,
	CreatePendingAccount: CreatePendingAccount,
	VerifyPendingAccount: VerifyPendingAccount,
	FindAccountByEmail: FindAccountByEmail,
	FindAccountById: FindAccountById,
	GetEmergencyInfo: GetEmergencyInfo,
}