# Backend of the Official Website of the NTNU CSIE Camp

## Before we start

We should ensure that our users' data and our server is as safe as possible.

- If you are using npm, run ``npm -audit`` and check for vulnerabilities.
- Use the latest available packages if possible.
- Trust no body, not even your parents. **All** users's input should be validated and sanitized regardless of the user's role.
- We will not be the safest thing on the internet but let's at least be safer than 阿莫's order form. 🤧

## Notes

- Please remember to serialize all inputs provided by the user.
- Please remember to include the token into the Auth header (eg: bearer \<token>)
- [This should be invisible on github...right?](https://www.youtube.com/watch?v=fujCdB93fpw&t=0s) 
