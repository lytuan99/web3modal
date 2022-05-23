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
    let params;
    if (cachedProvider && cachedProvider.includes(IN_WALLET_NAME)) {
      // const gasPrice = (await apiGetGasPrices()).fast.price;
      const gasPrice = await web3.eth.getGasPrice();
      const gasEstimate = await dai.methods
        .transfer(to, value)
        .estimateGas({ from: address });
      const nonce = await web3.eth.getTransactionCount(address);

      params = {
        from: address,
        value: "0x0",
        gasPrice,
        gas: gasEstimate,
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
  });
}
