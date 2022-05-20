import { JsonRpcPayload, JsonRpcResponse } from "web3-core-helpers";

interface IProvider {
  sendAsync(payload: any, callback: any): void;
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

  async sendAsync(payload: Object, callback: (error: any, result: any) => any) {
    const request = new XMLHttpRequest();
    request.timeout = this.timeout;
    request.open("POST", this.host, true);
    request.setRequestHeader("Content-Type", "application/json");

    request.onreadystatechange = () => {
      if (request.readyState === 4 && request.timeout !== 1) {
        var result = request.responseText; // eslint-disable-line
        var error = null; // eslint-disable-line

        try {
          result = JSON.parse(result);
        } catch (jsonError) {
          error = this.invalidResponseError(request.responseText, this.host);
        }

        callback(error, result);
      }
    };

    request.ontimeout = () => {
      callback(
        "[ethjs-provider-http] CONNECTION TIMEOUT: http request timeout after " +
          this.timeout +
          " ms. (i.e. your connect has timed out for whatever reason, check your provider).",
        null
      );
    };

    try {
      request.send(JSON.stringify(payload));
    } catch (error) {
      callback(
        "[ethjs-provider-http] CONNECTION ERROR: Couldn't connect to node '" +
          this.host +
          "': " +
          JSON.stringify(error, null, 2),
        null
      );
    }
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

  sendAsync(
    payload: JsonRpcPayload,
    callback: (error: Error | null, result: JsonRpcResponse | null) => void
  ) {
    this.idCounter = this.idCounter % 99999999;
    this.currentProvider.sendAsync(
      createPayload(payload, this.idCounter++),
      (err: Error, response: JsonRpcResponse) => {
        var responseObject = response || {};

        if (err || responseObject.error) {
          var payloadErrorMessage =
            "[ethjs-rpc] " +
            ((responseObject.error && "rpc") || "") +
            " error with payload " +
            JSON.stringify(payload, null, this.options.jsonSpace) +
            " " +
            (err ||
              JSON.stringify(
                responseObject.error,
                null,
                this.options.jsonSpace
              ));
          return callback(new Error(payloadErrorMessage), null);
        }

        return callback(null, responseObject.result);
      }
    );
  }
}

type SignProviderOptions = {
  signTransaction: () => {};
  accounts?: (error: any, result: []) => {};
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

  sendAsync(
    payload: JsonRpcPayload,
    callback: (error: Error | null, result?: JsonRpcResponse) => void
  ) {
    if (payload.method === "eth_accounts" && this.options.accounts) {
      this.options.accounts((accountsError: any, accounts: []) => {
        // create new output payload
        var inputPayload: JsonRpcResponse = {
          id: payload.id ? parseInt(payload.id.toString(), 10) : 0,
          jsonrpc: payload.jsonrpc,
          result: accounts
        };

        callback(accountsError, inputPayload);
      });
    } else if (
      payload.method === "eth_sendTransaction" &&
      payload &&
      payload.params
    ) {
      // get the nonce, if any
      this.rpc.sendAsync(
        {
          method: "eth_getTransactionCount",
          params: [payload.params[0].from, "latest"],
          jsonrpc: payload.jsonrpc
        },
        (nonceError: any, nonce: any) => {
          // eslint-disable-line
          if (nonceError) {
            return callback(
              new Error(
                "[ethjs-provider-signer] while getting nonce: " + nonceError
              )
            );
          }

          // get the gas price, if any
          this.rpc.sendAsync(
            {
              method: "eth_gasPrice",
              params: [],
              jsonrpc: ""
            },
            (gasPriceError: any, gasPrice: any) => {
              // eslint-disable-line
              if (gasPriceError) {
                return callback(
                  new Error(
                    "[ethjs-provider-signer] while getting gasPrice: " +
                      gasPriceError
                  )
                );
              }

              var rawTxPayload;
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

              // sign transaction with raw tx payload
              this.options.signTransaction(
                rawTxPayload,
                (keyError: any, signedHexPayload: any) => {
                  // eslint-disable-line
                  if (!keyError) {
                    // create new output payload
                    var outputPayload = Object.assign(
                      {},
                      {
                        id: payload.id,
                        jsonrpc: payload.jsonrpc,
                        method: "eth_sendRawTransaction",
                        params: [signedHexPayload]
                      }
                    );

                    // send payload
                    this.provider.sendAsync(outputPayload, callback);
                  } else {
                    //callback(new Error('[ethjs-provider-signer] while signing your transaction payload: ' + JSON.stringify(keyError)), null);
                    console.error(
                      "[ethjs-provider-signer] while signing your transaction payload:",
                      keyError
                    );
                    callback(keyError);
                  }
                }
              );
            }
          );
        }
      );
    } else {
      this.provider.sendAsync(payload, callback);
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
