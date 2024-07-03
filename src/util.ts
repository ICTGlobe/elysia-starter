const randomString = (length: number = 16) => {
  let result = "";
  let characters = "abcdefghijklmnopqrstuvwxyz";
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const humanFileSize = (size: number) => {
  const i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
  const a = parseFloat((size / Math.pow(1024, i)).toFixed(2));
  return a * 1 + " " + ["B", "kB", "MB", "GB", "TB"][i];
};

export { randomString, humanFileSize };
