const {PrismaClient} = require("@prisma/client")

const prisma = new PrismaClient


async function CreateAccount(Email, Password){
    const UserRecord = await prisma.accounts.create({
        data: {
            Email: Email,
            Password: Password
        }
    })
    return UserRecord
}

async function FindAccount(Email){
    const UserRecord = await prisma.accounts.findUnique({
        where: {
            Email: Email
        }
    })
    return UserRecord
}

module.exports = {
    CreateAccount: CreateAccount,
    FindAccount: FindAccount
}