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
    const maxGasForTokenSend = 30000;
    const value = 1;
    const params = {
      from: address,
      value: "0x0",
      gasPrice,
      gas: maxGasForTokenSend
    };

    await dai.methods
      .transfer(to, value)
      .send(params, (err: any, data: any) => {
        if (err) {
          reject(err);
        }

        resolve(data);
      });
  });
}
