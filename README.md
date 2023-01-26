# Definitely Not The API Document You're Looking For

This document describes how to send data to the backend and what responses to expect under different circumstances.

Feel free to ask us if you have any uncertainties regarding the usage of the APIs.

<br/><br/>
## **Before we start** ##
We should ensure that our users' data and our server is as safe as possible.

- If you are using npm, run ``npm -audit`` and check for vulnerabilities.
- Use the latest available packages if possible.
- Trust no body, not even your parents. **All** users's input should be validated and sanitized regardless of the user's role.
- We will not be the safest thing on the internet but let's at least be safer than 阿莫's order form. 🤧

<br/>

### API Docs
Using `https://localhost:${process.env.PORT}/api/docs/` to see the api docments. API referenced from [Unicourse API Spec](https://github.com/UniCourse-TW/API-Spec/blob/main/spec.yaml).

### **Signing up** ###

In order to successfully create an account for the user, you must collect the following data from the user.
- Email
- Password
- Confirm Password

**Please ensure both the password and confirm password are the hex digest of a SHA512 hash.**
The data should be in a JSON format while being sent as a POST request. Here is an example of how the request should look like.

```rest
POST http://server.com/signup
Content-Type: application/json
{
    "email": "emotional@damagel.com",
    "password": "bed4efa1d4fdbd954bd3705d6a2a78270ec9a52ecfbfb010c61862af5c76af1761ffeb1aef6aca1bf5d02b3781aa854fabd2b69c790de74e17ecfec3cb6ac4bf"
    "conf_password": "bed4efa1d4fdbd954bd3705d6a2a78270ec9a52ecfbfb010c61862af5c76af1761ffeb1aef6aca1bf5d02b3781aa854fabd2b69c790de74e17ecfec3cb6ac4bf"
}
```
### What will the server return? ####
Upon successful authentication, the server will return
- Message
The message will provide a hint on the status of the request.

- This is temporary and is subjected to changes in the future.

<br/>
<br/>

### **Login** ###
Before you send any login requests, please ensure that you have collected the following data from the user

- Email
- Password

**Please ensure that the password is sent a SHA512 hex digested hash.**

The data should be in a JSON format while being sent as a POST request. Here is an example of how the request should look like.

```rest
POST http://server.com/login
Content-Type: application/json
{
    "email": "example@gmail.com",
    "password": "bed4efa1d4fdbd954bd3705d6a2a78270ec9a52ecfbfb010c61862af5c76af1761ffeb1aef6aca1bf5d02b3781aa854fabd2b69c790de74e17ecfec3cb6ac4bf"
}
```
### What will the server return? ###
Upon successful authentication, the server will return
- Message
- Token
The message will provide a hint on the status of the request.
The token is a **JWT token** composed of the **email** and the **account id**. This token will **expire** in **1 hour**. Please remember to include this in the header for future requests.

<br/><br/>









### Further Notes ###
- Please remember to serialize all inputs provided by the user.
- Please remember to include the token into the Auth header (eg: bearer \<token>)
- [This should be invisible on github...right?](https://www.youtube.com/watch?v=fujCdB93fpw&t=0s) 