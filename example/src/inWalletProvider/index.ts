import { JsonRpcPayload, JsonRpcResponse } from "web3-core-helpers";
import eth_rpc_errors_1 from "eth-rpc-errors";
import { JSONRPCMethod, JSONRPCRequest } from "./JSONRPC";
import Web3 from "web3";

const DEFAULT_CHAIN_ID_KEY = "defaultChainId";
interface InWalletProviderOptions {
  infuraId: string;
}

interface RequestArguments {
  method: string;
  params?: any;
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

class InWalletProvider implements AbstractProvider {
  private infuraId: string;
  connected?: boolean | undefined;

  constructor(options: InWalletProviderOptions) {
    this.infuraId = options.infuraId;
  }

  sendAsync(
    payload: JsonRpcPayload,
    callback: (error: Error | null, result?: JsonRpcResponse) => void
  ): void {
    throw new Error("Method not implemented.");
  }

  enable() {
    console.log("Connecting in wallet....");
  }

  disconnect() {
    console.log("Dis connect in wallet....");
  }

  async request(args: any): Promise<any> {
    if (!args || typeof args !== "object" || Array.isArray(args)) {
      throw eth_rpc_errors_1.ethErrors.rpc.invalidRequest({
        message: "Expected a single, non-array, object argument.",
        data: args
      });
    }
    const { method, params } = args;
    if (typeof method !== "string" || method.length === 0) {
      throw eth_rpc_errors_1.ethErrors.rpc.invalidRequest({
        message: "'args.method' must be a non-empty string.",
        data: args
      });
    }
    if (
      params !== undefined &&
      !Array.isArray(params) &&
      (typeof params !== "object" || params === null)
    ) {
      throw eth_rpc_errors_1.ethErrors.rpc.invalidRequest({
        message: "'args.params' must be an object or array if provided.",
        data: args
      });
    }

    const newParams = params === undefined ? [] : params;

    console.log("Requesting: ", newParams, args);
    // const id = this._relayEventManager.makeRequestId();
    const result = await this._handleSynchronousMethods({
      method,
      params: newParams,
      jsonrpc: "2.0",
      // id
    });
    return result;
  }

  _eth_accounts() {
    return ["0x36bca92DADA49a5973661815499cF415950139f7"];
  }

  _net_version() {
    return this.getChainId();
  }

  _eth_chainId() {
    return this.getChainId();
  }

  getChainId(): number {
    const chainIdStr = localStorage.getItem(DEFAULT_CHAIN_ID_KEY) || "1";
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

  async send(payload: any, callback?: any): Promise<any> {
    console.log("sending ....: ", { payload, callback });
  }
}

export default InWalletProvider;
