import { JsonRpcPayload, JsonRpcResponse } from "web3-core-helpers";
import eth_rpc_errors_1 from "eth-rpc-errors";
import { JSONRPCMethod, JSONRPCRequest } from "./JSONRPC";
import SignerProvider from "./vendor/ethjs-provider-signer";
import { createVaultKeystore } from "./lightWallet";

const DEFAULT_CHAIN_ID_KEY = "defaultChainId";
interface InWalletProviderOptions {
  infuraId: string;
  signTransaction: () => {};
  accounts?: (error: any, result: []) => {};
  [key: string]: any;
}

interface RequestArguments {
  method: string;
  params?: any[];
  [key: string]: any;
}

interface AbstractProvider {
  connected?: boolean;
  sendAsync(
    payload: JsonRpcPayload,
    callback: (error: Error | null, result?: JsonRpcResponse) => void
  ): void;
  send?(
    payload: JsonRpcPayload,
    callback: (error: Error | null, result?: JsonRpcResponse) => void
  ): void;
  request?(args: RequestArguments): Promise<any>;
}

class InWalletProvider extends SignerProvider {
  private infuraId: string;
  private rpcPath: string;
  private addresses: string[] = [];
  connected?: boolean | undefined;

  constructor(options: InWalletProviderOptions) {
    super(
      `https://${options.network || "rinkeBy"}.infura.io/v3/${
        options.infuraId
      }`,
      options
    );
    const path = `https://${options.network || "rinkeBy"}.infura.io/v3/${
      options.infuraId
    }`;
    this.infuraId = options.infuraId;
    this.rpcPath = path;
  }

  sendAsync(
    payload: JsonRpcPayload,
    callback: (error: Error | null, result?: JsonRpcResponse) => void
  ): void {
    console.log("payload send async: ", payload);
    super.sendAsync(payload, callback);
  }

  async enable(dialog: any) {
    // TODO: check xem đã có keystore trong localStorage chưa,
    // Nếu chưa có thì yêu cầu tạo hoặc import
    // Nếu có rồi thì thực hiện tạo
    console.log("Connecting in wallet....");

    const inputParams = {
      password: "111111",
      seedPhrase:
        "illegal practice attend twenty excess credit canyon loyal return giggle fiber syrup",
      hdPathString: `m/44'/60'/0'/0`
    };
    try {
      const keystore: any = await createVaultKeystore(inputParams);

      keystore.passwordProvider = async (callback: any) => {
        // const password = yield select(makeSelectPassword());
        const password = await dialog.prompt("Enter your password").done;
        console.log("PASSWORD: ", password);
        // const pw = prompt("Please enter your wallet password", "Password"); // eslint-disable-line
        callback(null, password);
      };

      // let pwDerivedKey;
      // keystore.keyFromPassword(inputParams.password, (err: any, data: any) => {
      //   if (err !== null) throw new Error(err);
      //   pwDerivedKey = data;
      // });

      // Đoạn này lấy từ bên hot wallet
      const keyFromPasswordPromise = (param: any) => {
        // eslint-disable-line no-inner-declarations
        return new Promise((resolve, reject) => {
          keystore.keyFromPassword(param, (err: any, data: any) => {
            if (err !== null) return reject(err);
            return resolve(data);
          });
        });
      };

      const pwDerivedKey = await keyFromPasswordPromise(inputParams.password);

      keystore.generateNewAddress(pwDerivedKey, 1);

      console.log("Keystore vault: ", keystore);
      // TODO: save keystore to redux or something in global
      this.addresses = keystore.addresses;

      this.options = {
        signTransaction: keystore.signTransaction.bind(keystore),
        accounts: (cb: any) => cb(null, keystore.getAddresses())
      };
    } catch (error) {
      console.error("Create keystore vault error", error);
    }
  }

  disconnect() {
    console.log("DIS CONNECT in-app wallet....");
  }

  // async request(payload: any): Promise<any> {
  //   console.log("Request: ", payload);
  //   let res;
  //   super.sendAsync(payload, (error, result) => {
  //     console.log('callback request: ', { error, result });
  //     if (!error && result) res = result.result;
  //     else res = error;
  //   });
  //   return res;
  // }

  // Khi web3.eth.xxx được gọi, callback sẽ chạy vào hàm request này, nếu ẩn đi thì mới chạy vào hàm sendAsync
  // async request(args: any): Promise<any> {
  //   console.log('REQUEST: ', args);
  //   if (!args || typeof args !== "object" || Array.isArray(args)) {
  //     throw eth_rpc_errors_1.ethErrors.rpc.invalidRequest({
  //       message: "Expected a single, non-array, object argument.",
  //       data: args
  //     });
  //   }
  //   const { method, params } = args;
  //   if (typeof method !== "string" || method.length === 0) {
  //     throw eth_rpc_errors_1.ethErrors.rpc.invalidRequest({
  //       message: "'args.method' must be a non-empty string.",
  //       data: args
  //     });
  //   }
  //   if (
  //     params !== undefined &&
  //     !Array.isArray(params) &&
  //     (typeof params !== "object" || params === null)
  //   ) {
  //     throw eth_rpc_errors_1.ethErrors.rpc.invalidRequest({
  //       message: "'args.params' must be an object or array if provided.",
  //       data: args
  //     });
  //   }

  //   const newParams = params === undefined ? [] : params;

  //   console.log("Requesting: ", { newParams, args });
  //   // const id = this._relayEventManager.makeRequestId();
  //   const result = await this._handleSynchronousMethods({
  //     method,
  //     params: newParams,
  //     jsonrpc: "2.0"
  //     // id
  //   });
  //   return result;
  // }

  _eth_accounts() {
    return this.addresses;
  }

  _net_version() {
    return this.getChainId();
  }

  _eth_chainId() {
    return this.getChainId();
  }

  getChainId(): number {
    const chainIdStr = localStorage.getItem(DEFAULT_CHAIN_ID_KEY) || "4";
    return parseInt(chainIdStr, 10);
  }

  private _handleSynchronousMethods(request: JSONRPCRequest) {
    const { method } = request;
    // const params = request.params || [];
    switch (method) {
      case JSONRPCMethod.eth_accounts:
        return this._eth_accounts();
      case JSONRPCMethod.net_version:
        return this._net_version();
      case JSONRPCMethod.eth_chainId:
        return this._eth_chainId();
      default:
        return undefined;
    }
  }

  // Không có cũng được
  // async send(payload: any, callback?: any): Promise<any> {
  //   console.log("sending ....: ", { payload, callback });
  // }
}

export default InWalletProvider;
