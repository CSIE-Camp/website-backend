const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient


async function CreatePendingAccount(Email, Password) {
    let UserRecord = await prisma.pendingAccounts.create({
        data: {
            Email: Email,
            Password: Password
        }
    })
    return UserRecord
}

async function CreateAccount(Email, Password, CreatedAt) {
    let UserRecord = await prisma.accounts.create({
        data: {
            Email: Email,
            Password: Password,
            CreatedAt: CreatedAt
        }
    })

    await prisma.profiles.create({
        data: {
            AccountId: UserRecord.id
        }
    })
    return UserRecord
}

async function VerifyPendingAccount(PendingId) {
    let PendingRecord = await prisma.pendingAccounts.findUnique({
        where: {
            id: PendingId
        }
    })
    if (!PendingRecord) {
        return console.log("Account not found")
    }
    console.log("Account found!")
    await CreateAccount(PendingRecord.Email, PendingRecord.Password, PendingRecord.CreatedAt)
    await prisma.pendingAccounts.delete({
        where: {
            id: PendingId
        }
    }).then(() => {
        console.log(`Deleted pending account with id ${PendingId}`)
    })
}

async function UpdateAccountEmail(Email) {
    let UserRecord = await prisma.accounts.update({
        where: {
            Email: Email
        },
        data: {
            Email: Email
        }
    })
    return UserRecord
}

async function UpdateAccountPassword(userid, password) {
    let UserRecord = await prisma.accounts.update({
        where: {
            id: userid
        },
        data: {
            Password: password
        }
    })
}

async function FindAccountByEmail(Email) {
	let Account = await prisma.accounts.findUnique({
		where: {
			Email: Email
		}
	})
	return Account
}

async function FindPendingAccountByEmail(Email) {
    let Account = await prisma.pendingAccounts.findUnique({
        where: {
            Email: Email
        }
    })
    return (Account ? true : false)
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

async function FindProfile(id) {
    let Profile = await prisma.profiles.findUnique({
        where: {
            AccountId: id
        }
    })
    if (Profile.Validated_ID == null && Profile.Unvalidate_ID == null){
        delete(Profile.Validated_ID)
        delete(Profile.Unvalidate_ID)
        Profile["ID_Documents"] = ""
    }
    if (Profile.Validated_ID && Profile.Unvalidate_ID == null){
        delete(Profile.Unvalidate_ID)
        Profile["ID_Documents"] = Profile.Validated_ID
    }
    if (Profile.Validated_ID == null && Profile.Unvalidate_ID){
        delete(Profile.Validated_ID)
        Profile["ID_Documents"] = Profile.Unvalidate_ID
    }
    delete (Profile.id)
    delete (Profile.AccountId)
    return Profile
}

async function UpdateProfile(AccountId, data) {
    let Profile = await FindProfile(AccountId)
    let Remove = []
    for (let key in Profile) {
        if (!Profile[key] && !data[key]) {
            Remove.push(key)
            continue
        }
        if (Profile[key] && data[key]) {
            if (Profile[key] === data[key]) {
                Remove.push(key)
                continue
            }
            Profile[key] = data[key]
        }
        Profile[key] = data[key]
    }
    for (let i = 0; i < Remove.length; i++){
        delete(Profile[Remove[i]])
    }
    console.log(Profile)
    let NewProfile = await prisma.profiles.update({
        where: {
            AccountId: AccountId
        },
        data: Profile
    })
    console.log("New Profile")
    console.log(NewProfile)
    delete (Profile.id)
    delete(Profile.Validated_ID)
    delete(Profile.Unvalidate_ID)
    delete (Profile.AccountId)
    return NewProfile
}

async function DeleteProfile(AccountId) {

}


module.exports = {
    CreateAccount: CreateAccount,
    CreatePendingAccount: CreatePendingAccount,
    UpdateAccountEmail: UpdateAccountEmail,
    UpdateAccountPassword: UpdateAccountPassword,
    VerifyPendingAccount: VerifyPendingAccount,
    FindAccountByEmail: FindAccountByEmail,
    FindPendingAccountByEmail: FindPendingAccountByEmail,
    FindAccountById: FindAccountById,
    GetEmergencyInfo: GetEmergencyInfo,
    FindProfile: FindProfile,
    UpdateProfile: UpdateProfile
}
