# Backend of the Official Website of the NTNU CSIE Camp

## How to Setup

### Prerequisites

- [Node.js](https://nodejs.org/en/) (use the LTS version)
- A PostgreSQL database (optional if you don't need to interact with the database)

### Setup

1. [Download Docker](https://www.docker.com)
2. Download the [Docker Extension on VSCode](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-docker) or the equivalent on your favourite text editor
3. Clone this repository `git clone https://github.com/CSIE-Camp/website-backend.git`
4. Change directory to the cloned repository (e.g. `cd website-backend`)
5. Install dependencies `npm install`
6. Run the command `docker compose up`

### Run the development server

Run `npm run dev` to start the development server, which will automatically restart when you make changes to the code.

After the server is started, you can access the server at `http://localhost:8080/`, you can also change the port by setting the `PORT` environment variable.

## Notes and Recommendations from [@Maxxxxxx-x](https://github.com/Maxxxxxx-x)

**We should ensure that our users' data and our server is as safe as possible.**

- If you are using npm, run `npm audit` and check for vulnerabilities.
- Use the latest available packages if possible.
- Trust no body, not even your parents. **All** users's input should be validated and sanitized regardless of the user's role.
- We will not be the safest thing on the internet but let's at least be safer than 阿莫's order form. 🤧
- Please remember to serialize all inputs provided by the user.
- Please remember to include the token into the Auth header (eg: bearer \<token>)
- [SECRET](https://www.youtube.com/watch?v=fujCdB93fpw&t=0s) 
