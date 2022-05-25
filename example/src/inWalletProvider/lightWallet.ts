import lightwallet from "eth-lightwallet";

/* keyStore.createVault({password: password,
    seedPhrase: '(opt)seed',entropy: '(opt)additional entropy',salt: '(opt)'}, function (err, ks) {}); */
export function createVaultKeystore(param: any) {
  return new Promise((resolve, reject) => {
    lightwallet.keystore.createVault(param, (err, data) => {
      if (err !== null) return reject(err);
      return resolve(data);
    });
  });
}

export const createSeedPhrase = () => {
  const mnemonic = lightwallet.keystore.generateRandomSeed();
  console.log('MNEMONIC: ', mnemonic);
  return mnemonic;
};
