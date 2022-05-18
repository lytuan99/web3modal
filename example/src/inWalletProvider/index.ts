import {
  JsonRpcPayload,
  JsonRpcResponse
} from 'web3-core-helpers';

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
  sendAsync(payload: JsonRpcPayload, callback: (error: Error | null, result?: JsonRpcResponse) => void): void;
  send?(payload: JsonRpcPayload, callback: (error: Error | null, result?: JsonRpcResponse) => void): void;
  request?(args: RequestArguments): Promise<any>;
}

class InWalletProvider implements AbstractProvider {
  private infuraId: string;
  connected?: boolean | undefined;

  constructor(options: InWalletProviderOptions) {
    this.infuraId = options.infuraId;
  }

  sendAsync(payload: JsonRpcPayload, callback: (error: Error | null, result?: JsonRpcResponse) => void): void {
    throw new Error('Method not implemented.');
  }

  enable() {
    console.log("Connecting in wallet....");
  }

  disconnect() {
    console.log("Dis connect in wallet....");
  }

  async request(payload: any): Promise<any> {
    console.log("requesting: ", payload);
  }

  async send(payload: any, callback?: any): Promise<any> {
    console.log("sending ....: ", { payload, callback });
  }
}

export default InWalletProvider;
