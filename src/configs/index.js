const {REACT_APP_ENV: env = 'dev'} = process.env;
const config = require(`./${env}_configs`).default;

if (env === "dev") {
  console.log(process.env);
  console.log("Config....................");
  console.log(config)
}

export default {
  ...config
}
