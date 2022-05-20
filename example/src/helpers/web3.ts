import { DAI_CONTRACT } from "../constants";
import { apiGetGasPrices } from "./api";

export function getDaiContract(chainId: number, web3: any) {
  const dai = new web3.eth.Contract(
    DAI_CONTRACT[chainId].abi,
    DAI_CONTRACT[chainId].address
  );
  return dai;
}

export async function callBalanceOf(
  address: string,
  chainId: number,
  web3: any
) {
  const dai = await getDaiContract(chainId, web3);

  const balance = await dai.methods.balanceOf(address).call();
  console.log("Dai balance: ", balance);
  return balance;
}

export function callTransfer(address: string, chainId: number, web3: any) {
  return new Promise(async (resolve, reject) => {
    const dai = getDaiContract(chainId, web3);
    const to = "0x46f3fb4BEda36829DfaeC37948859a162A1d0f14";

    const gasPrice = (await apiGetGasPrices()).fast.price;
    const nonce = await web3.eth.getTransactionCount(address);

    const maxGasForTokenSend = 60000;
    const value = 1;
    const params = {
      from: address,
      value: "0x0",
      gasPrice,
      gas: maxGasForTokenSend,
      nonce,
    };

    await dai.methods
      .transfer(to, value)
      .send(params, (err: any, data: any) => {
        if (err) {
          reject(err);
        }
        resolve(data);
      })
      .on("transactionHash", (hash: any) => {
        console.log("TRANSACTION HASH: ", hash);
      })
      .on("receipt", (receipt: any) => {
        console.log("ON RECEIPT: ", receipt);
      })
      .on("confirmation", (confirmationNumber: any, receipt: any) => {
        console.log("ON CONFIRMATION: ", { confirmationNumber, receipt });
      }).on('error', function(error: any, receipt: any) { // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
        console.log('ON ERROR: ', { error, receipt });
    });

    // const transfer = dai.methods.transfer(to, value);
    // const encodeABI = transfer.encodeABI();
    // params.data = encodeABI;

    // function keyFromPasswordPromise(param: any) {
    //   // eslint-disable-line no-inner-declarations
    //   return new Promise((resolve, reject) => {
    //     keystore.keyFromPassword(param, (err: any, data: any) => {
    //       if (err !== null) return reject(err);
    //       return resolve(data);
    //     });
    //   });
    // }

    // TODO: maybe get private key here
    // const privateKey =
    //   "af259c668c598ae7d68a157bd8d6b5bf2afdd119c6e5ccdc0d0e0fdbbc30555c";

    // web3.eth.accounts
    //   .signTransaction(params, privateKey)
    //   .then((signed: any) => {
    //     var tran = web3.eth.sendSignedTransaction(signed.rawTransaction);

    //     tran.on("confirmation", (confirmationNumber: any, receipt: any) => {
    //       console.log("confirmation:--------------- " + confirmationNumber);
    //     });

    //     tran.on("transactionHash", (hash: any) => {
    //       console.log("hash------------ ", hash);
    //     });

    //     tran.on("receipt", (receipt: any) => {
    //       console.log("reciept--------", receipt);
    //     });

    //     tran.on("error", console.error);
    //   });
  });
}
