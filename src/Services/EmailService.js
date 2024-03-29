const { HERMES_MAIL_TOKEN } = require("../config");
const { GenerateEmailToken, GeneratePasswordResetToken } = require("./../Modules/Tokens");

async function SendMail(Receipient, Data) {
    const res = await fetch("https://hermes.csie.cool/api/send", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${HERMES_MAIL_TOKEN}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from: {
                email: "camp@csie.cool",
                name: "師大資工營",
            },
            to: [Receipient],
            subject: Data.subject,
            content: {
                template: "simple",
                params: {
                    icon: "https://cdn.discordapp.com/attachments/1060253766806409308/1077574327546941531/camp-icon.jpg",
                    greeting: Data.greeting,
                    main: Data.main,
                    body: Data.body,
                    link: Data.link,
                    footer: "網站,https://camp.csie.cool;Discord,https://discord.gg/X5afNNcm",
                },
            },
        }),
    });
    if (res.ok) {
        return true;
    }
    console.error(res.status, await res.text());
    return false;
}

async function SendVerifyEmail(email) {
    const callback_url = await GenerateEmailToken(email);
    const Data = {
        subject: "Email Verification",
        greeting: "你好",
        main: "請驗證你的電子郵件",
        body: `
        請點擊以下按鈕驗證你的大資工營帳號
        ${callback_url}`,
        link: `驗證,${callback_url}`,
    };
    const status = await SendMail(email, Data);
    return status;
}

async function SendPasswordResetEmail(email, UserId, ip) {
    const callback_url = await GeneratePasswordResetToken(email, UserId);
    const Data = {
        subject: "Password Reset",
        greeting: "師大資工營帳戶重設密碼",
        main: "forget password",
        body: `You have requested a password change at ${ip}, please ignore if IP address does not match up with yours`,
        link: `Reset Password,${callback_url}`,
    };
    const Status = await SendMail(email, Data);
    return Status;
}

async function SendLoginNotifEmail(email, ip) {
    const Data = {
        subject: "Login detected!",
        greeting: "Log in detected on a new device",
        main: "We have detected a log in on a new device",
        body: `A new device has logged in from ${ip}`,
        link: `Details,https://whatismyipaddress.com/ip/${ip}`,
    };
    return await SendMail(email, Data);
}

module.exports = {
    SendVerifyEmail: SendVerifyEmail,
    SendPasswordResetEmail: SendPasswordResetEmail,
    SendLoginNotifEmail: SendLoginNotifEmail,
};
