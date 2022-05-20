import { DAI_CONTRACT, IN_WALLET_NAME } from "../constants";
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

    const value = 1;
    const cachedProvider = localStorage.getItem("WEB3_CONNECT_CACHED_PROVIDER");
    console.log("ahihi: ", { cachedProvider, IN_WALLET_NAME });
    let params;
    if (cachedProvider === IN_WALLET_NAME) {
      const gasPrice = (await apiGetGasPrices()).fast.price;
      const nonce = await web3.eth.getTransactionCount(address);
      const maxGasForTokenSend = 60000;

      params = {
        from: address,
        value: "0x0",
        gasPrice,
        gas: maxGasForTokenSend,
        nonce
      };
    } else {
      params = { from: address };
    }

    console.log("PARAMS: ", params);

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
      })
      .on("error", (error: any, receipt: any) => {
        // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
        console.log("ON ERROR: ", { error, receipt });
      })
      .on("sending", (payload: any) => {
        console.log("ON SENDING: ", payload);
      })
      .on("sent", (payload: any) => {
        console.log("ON SENT ", payload);
      });

    // await dai.methods
    //   .transfer(to, value)
    //   .send(params, (err: any, data: any) => {
    //     if (err) {
    //       reject(err);
    //     }
    //     resolve(data);
    //   })
    //   .on("transactionHash", (hash: any) => {
    //     console.log("TRANSACTION HASH: ", hash);
    //   })
    //   .on("receipt", (receipt: any) => {
    //     console.log("ON RECEIPT: ", receipt);
    //   })
    //   .on("confirmation", (confirmationNumber: any, receipt: any) => {
    //     console.log("ON CONFIRMATION: ", { confirmationNumber, receipt });
    //   })
    //   .on("error", (error: any, receipt: any) => {
    //     // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
    //     console.log("ON ERROR: ", { error, receipt });
    //   })
    //   .on("sending", (payload: any) => {
    //     console.log("ON SENDING: ", payload);
    //   })
    //   .on("sent", (payload: any) => {
    //     console.log("ON SENT ", payload);
    //   });

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

    // const privateKey =
    //   "af259c668c598ae7d68a157bd8d6b5bf2afdd119c6e5ccdc0d0e0fdbbc30555c";

    // const tx = dai.methods.transfer(to, value);
    // const data = tx.encodeABI();
    // const gas = await tx.estimateGas({ from: address });
    // const signedTx = await web3.eth.accounts.signTransaction(
    //   {
    //     to: DAI_CONTRACT[chainId].address,
    //     data,
    //     gas,
    //     gasPrice,
    //     nonce,
    //     chainId
    //   },
    //   privateKey
    // );
    // const receipt = await web3.eth
    //   .sendSignedTransaction(signedTx.rawTransaction)
    //   .on("receipt", (receipt: any) => {
    //     console.log("ON RECEIPT: ", receipt);
    //   })
    //   .on("confirmation", (confirmationNumber: any, receipt: any) => {
    //     console.log("ON CONFIRMATION: ", { confirmationNumber, receipt });
    //   })
    //   .on("error", (error: any, receipt: any) => {
    //     // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
    //     console.log("ON ERROR: ", { error, receipt });
    //   });

    // console.log({ receipt });
  });
}
