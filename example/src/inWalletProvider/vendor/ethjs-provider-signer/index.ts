import { JsonRpcPayload, JsonRpcResponse } from "web3-core-helpers";
import axios from "axios";

interface IProvider {
  sendAsync(payload: any, callback?: any): Promise<any>;
}

class HTTPProvider {
  host: string;
  timeout: number;

  constructor(host: string, timeout: number) {
    this.host = host;
    this.timeout = timeout || 0;
  }

  private invalidResponseError(result: any, host: string) {
    var message =
      !!result && !!result.error && !!result.error.message
        ? "[ethjs-provider-http] " + result.error.message
        : "[ethjs-provider-http] Invalid JSON RPC response from host provider " +
          host +
          ": " +
          JSON.stringify(result, null, 2);
    return new Error(message);
  }

  async sendAsync(
    payload: Object,
    callback?: (error: any, result: any) => any
  ) {
    try {
      const response = await axios({
        url: this.host,
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        timeout: this.timeout,
        data: payload
      });
      return response.data;
    } catch (error) {
      console.log("CALL AXIOS ERROR: ", error);
      // TODO: custom error message
      throw error;
    }

    // const request = new XMLHttpRequest();
    // request.timeout = this.timeout;
    // request.open("POST", this.host, true);
    // request.setRequestHeader("Content-Type", "application/json");

    // request.onreadystatechange = () => {
    //   if (request.readyState === 4 && request.timeout !== 1) {
    //     var result = request.responseText; // eslint-disable-line
    //     var error = null; // eslint-disable-line

    //     try {
    //       result = JSON.parse(result);
    //     } catch (jsonError) {
    //       error = this.invalidResponseError(request.responseText, this.host);
    //     }

    //     callback(error, result);
    //   }
    // };

    // request.ontimeout = () => {
    //   callback(
    //     "[ethjs-provider-http] CONNECTION TIMEOUT: http request timeout after " +
    //       this.timeout +
    //       " ms. (i.e. your connect has timed out for whatever reason, check your provider).",
    //     null
    //   );
    // };

    // try {
    //   request.send(JSON.stringify(payload));
    // } catch (error) {
    //   callback(
    //     "[ethjs-provider-http] CONNECTION ERROR: Couldn't connect to node '" +
    //       this.host +
    //       "': " +
    //       JSON.stringify(error, null, 2),
    //     null
    //   );
    // }
  }
}

class EthRPC {
  currentProvider: IProvider;
  idCounter: number;
  options: { jsonSpace?: number; max?: number } = {};

  constructor(cProvider: IProvider, _options?: any) {
    this.currentProvider = cProvider;
    const tempOptions = {
      jsonSpace: _options.jsonSpace || 0,
      max: _options.max || 9999999999999
    };
    this.idCounter = Math.floor(Math.random() * tempOptions.max);
    this.options = tempOptions || {};
  }

  async sendAsync(
    payload: JsonRpcPayload,
    callback?: (error: Error | null, result: JsonRpcResponse | null) => void
  ) {
    this.idCounter = this.idCounter % 99999999;
    const transferPayload = createPayload(payload, this.idCounter++);
    const response: JsonRpcResponse = await this.currentProvider.sendAsync(
      transferPayload
    );

    return response?.result;

    // this.currentProvider.sendAsync(
    //   createPayload(payload, this.idCounter++),
    //   (err: Error, response: JsonRpcResponse) => {
    //     var responseObject = response || {};

    //     if (err || responseObject.error) {
    //       var payloadErrorMessage =
    //         "[ethjs-rpc] " +
    //         ((responseObject.error && "rpc") || "") +
    //         " error with payload " +
    //         JSON.stringify(payload, null, this.options.jsonSpace) +
    //         " " +
    //         (err ||
    //           JSON.stringify(
    //             responseObject.error,
    //             null,
    //             this.options.jsonSpace
    //           ));
    //       return callback(new Error(payloadErrorMessage), null);
    //     }

    //     return callback(null, responseObject.result);
    //   }
    // );
  }
}

type SignProviderOptions = {
  signTransaction: () => {};
  getAccounts?: () => [];
  [key: string]: any;
};

class SignerProvider {
  provider: HTTPProvider;
  rpc: EthRPC;
  options: any;

  constructor(path: string, options: SignProviderOptions) {
    console.log("signer provider: ", options);
    this.provider = new HTTPProvider(path, options.timeout || 0);
    this.rpc = new EthRPC(this.provider, {});
  }

  async send(payload: JsonRpcPayload) {
    if (payload.method === "eth_accounts" && this.options.getAccounts) {
      let accounts;
      this.options.getAccounts((accountsError: any, result: []) => {
        accounts = result;
      });

      const inputPayload: JsonRpcResponse = {
        id: payload.id ? parseInt(payload.id.toString(), 10) : 0,
        jsonrpc: payload.jsonrpc,
        result: accounts
      };
      return inputPayload;
    } else if (
      payload.method === "eth_sendTransaction" &&
      payload &&
      payload.params
    ) {
      const getNoncePayload = {
        method: "eth_getTransactionCount",
        params: [payload.params[0].from, "latest"],
        jsonrpc: payload.jsonrpc
      };
      const nonce = await this.rpc.sendAsync(getNoncePayload);

      const getGasPricePayload = {
        method: "eth_gasPrice",
        params: [],
        jsonrpc: ""
      };

      const gasPrice = await this.rpc.sendAsync(getGasPricePayload);

      var rawTxPayload: any;
      if (payload && payload.params)
        // build raw tx payload with nonce and gasprice as defaults to be overriden
        rawTxPayload = Object.assign(
          {
            nonce: nonce,
            gasPrice: gasPrice
          },
          payload?.params[0]
        );
      else
        rawTxPayload = Object.assign({
          nonce: nonce,
          gasPrice: gasPrice
        });

      const executeSignTransaction = () =>
        new Promise((resolve, reject) => {
          this.options.signTransaction(
            rawTxPayload,
            (error: any, signedTx: any) => {
              if (error) reject(error);
              else resolve(signedTx);
            }
          );
        });

      const signedTx = await executeSignTransaction();
      console.log("SIGNED TX async await: ", signedTx);

      const reqPayload = {
        id: payload.id,
        jsonrpc: payload.jsonrpc,
        method: "eth_sendRawTransaction",
        params: [signedTx]
      };
      console.log("Payload last one: ", reqPayload);

      const result = await this.provider.sendAsync(reqPayload);

      return result;
    } else {
      const result = await this.provider.sendAsync(payload);
      return result;
    }
  }
}

/**
 * A simple create payload method
 *
 * @method createPayload
 * @param {Object} data the rpc payload data
 * @param {String} id the rpc data payload ID
 * @returns {Object} payload the completed payload object
 */
function createPayload(data: JsonRpcPayload, id: number) {
  return Object.assign(
    {
      id: id,
      jsonrpc: "2.0",
      params: []
    },
    data
  );
}

export default SignerProvider;
