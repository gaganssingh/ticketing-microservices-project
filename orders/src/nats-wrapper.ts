import nats, { Stan } from "node-nats-streaming";

class NatsWrapper {
  private _client?: Stan; // the "?" tells typescript that _client might be undefined for sometime

  get client() {
    if (!this._client) {
      throw new Error("🛑 Can't access NATS client before connecting");
    }

    return this._client;
  }

  connect(clusterId: string, clientId: string, url: string) {
    this._client = nats.connect(clusterId, clientId, { url });

    return new Promise<void>((resolve, reject) => {
      this.client.on("connect", () => {
        console.log("🟢 Connected to NATS");
        resolve();
      });

      this.client.on("err", (err) => {
        reject(err);
      });
    });
  }
}

export const natsWrapper = new NatsWrapper();
