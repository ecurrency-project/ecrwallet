import assert from 'assert';

import * as BlueElectrum from '../../blue_modules/BlueElectrum';
import { ECurrencyWallet } from '../../class';

jest.setTimeout(300 * 1000);
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const ECR_WIF = process.env.ECR_WIF ?? '5HrQ4wqTTMccKcgqWYaiveeEj9eXuxDFLcj15iGRLHqo3m7qqZn';

afterAll(async () => {
  BlueElectrum.forceDisconnect();
  await sleep(20);
});

beforeAll(async () => {
  await BlueElectrum.connectMain();
});

describe('ECurrencyWallet', () => {
  describe('unit', () => {
    it('has correct type identifiers', () => {
      const wallet = new ECurrencyWallet();
      assert.strictEqual(wallet.type, 'ecurrency');
      assert.strictEqual(wallet.typeReadable, 'ECurrency');
    });

    it('allowSignVerifyMessage returns false', () => {
      const wallet = new ECurrencyWallet();
      assert.strictEqual(wallet.allowSignVerifyMessage(), false);
    });

    it('generate() produces a wallet with a valid address', async () => {
      const wallet = new ECurrencyWallet();
      await wallet.generate();
      assert.ok(wallet.secret, 'secret (WIF) must be set after generate()');
      const address = wallet.getAddress();
      assert.ok(address, 'address must be derivable from generated WIF');
      assert.ok(wallet.isAddressValid(address as string), 'generated address must be a valid ECurrency address');
    });

    it('generateFromEntropy() is deterministic', async () => {
      const entropy = Buffer.alloc(32, 0xab);
      const w1 = new ECurrencyWallet();
      const w2 = new ECurrencyWallet();
      await w1.generateFromEntropy(entropy);
      await w2.generateFromEntropy(entropy);
      assert.strictEqual(w1.secret, w2.secret);
      assert.strictEqual(w1.getAddress(), w2.getAddress());
    });

    it('generateFromEntropy() throws on wrong entropy length', async () => {
      const wallet = new ECurrencyWallet();
      await assert.rejects(() => wallet.generateFromEntropy(Buffer.alloc(16)), /Entropy should be 32 bytes/);
    });

    it('isAddressValid() rejects Bitcoin and empty addresses', async () => {
      const wallet = new ECurrencyWallet();
      await wallet.generate();
      assert.strictEqual(wallet.isAddressValid('1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf'), false);
      assert.strictEqual(wallet.isAddressValid('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'), false);
      assert.strictEqual(wallet.isAddressValid(''), false);
    });

    it('getAllExternalAddresses() returns exactly the wallet address', async () => {
      const wallet = new ECurrencyWallet();
      await wallet.generate();
      const address = wallet.getAddress() as string;
      const all = wallet.getAllExternalAddresses();
      assert.strictEqual(all.length, 1);
      assert.strictEqual(all[0], address);
    });

    it('weOwnAddress() returns true for own address, false for another', async () => {
      const w1 = new ECurrencyWallet();
      const w2 = new ECurrencyWallet();
      await w1.generate();
      await w2.generate();
      assert.strictEqual(w1.weOwnAddress(w1.getAddress() as string), true);
      assert.strictEqual(w1.weOwnAddress(w2.getAddress() as string), false);
    });

    it('_getWIFbyAddress() returns WIF for own address, false otherwise', async () => {
      const w1 = new ECurrencyWallet();
      const w2 = new ECurrencyWallet();
      await w1.generate();
      await w2.generate();
      assert.strictEqual(w1._getWIFbyAddress(w1.getAddress() as string), w1.secret);
      assert.strictEqual(w1._getWIFbyAddress(w2.getAddress() as string), false);
    });

    it('createTransaction(skipSigning=true) returns inputs, outputs, and fee', async () => {
      const wallet = new ECurrencyWallet();
      wallet.setSecret(ECR_WIF);
      const address = wallet.getAddress() as string;
      const utxos = [
        {
          txid: '0000000000000000000000000000000000000000000000000000000000000001',
          vout: 0,
          value: 100000,
          address,
          confirmations: 1,
        },
      ];
      const { inputs, outputs, fee } = wallet.createTransaction(utxos, [{ address, value: 50000 }], 1, address, 0xffffffff, true);
      assert.ok(inputs.length > 0, 'coinselect must pick at least one input');
      assert.ok(outputs.length > 0);
      assert.ok(fee > 0);
    });

    it('createTransaction() throws when no targets provided', async () => {
      const wallet = new ECurrencyWallet();
      await wallet.generate();
      assert.throws(() => wallet.createTransaction([], [], 1, wallet.getAddress() as string, 0xffffffff), /No destination provided/);
    });
  });

  describe('integration', () => {
    it('can fetch balance', async () => {
      const wallet = new ECurrencyWallet();
      wallet.setSecret(ECR_WIF);
      await wallet.fetchBalance();
      assert.ok(typeof wallet.getBalance() === 'number');
    });

    it('can fetch UTXOs with txhex pre-fetched', async () => {
      const wallet = new ECurrencyWallet();
      wallet.setSecret(ECR_WIF);
      await wallet.fetchUtxo();
      for (const utxo of wallet.getUtxo()) {
        assert.ok(utxo.txid, 'utxo must have txid');
        assert.ok(typeof utxo.vout !== 'undefined', 'utxo must have vout');
        assert.ok(utxo.value, 'utxo must have value');
        assert.ok(utxo.txhex, 'txhex must be pre-fetched for P2PK non-segwit inputs');
      }
    });

    it('wasEverUsed() returns a boolean', async () => {
      const wallet = new ECurrencyWallet();
      wallet.setSecret(ECR_WIF);
      const result = await wallet.wasEverUsed();
      assert.ok(typeof result === 'boolean');
    });

    it('fetchTransactions() populates transactions with inputs and outputs', async () => {
      const wallet = new ECurrencyWallet();
      wallet.setSecret(ECR_WIF);
      await wallet.fetchTransactions();
      const txs = wallet.getTransactions();
      assert.ok(Array.isArray(txs));
      if (txs.length > 0) {
        const tx = txs[0];
        assert.ok(tx.txid, 'tx must have txid');
        assert.ok(Array.isArray(tx.inputs), 'tx must have inputs array');
        assert.ok(Array.isArray(tx.outputs), 'tx must have outputs array');
        assert.ok(tx.timestamp, 'tx must have timestamp');
      }
    });

    it('can create and sign a transaction', async () => {
      const wallet = new ECurrencyWallet();
      wallet.setSecret(ECR_WIF);
      await wallet.fetchBalance();
      await wallet.fetchUtxo();
      const utxos = wallet.getUtxo().map(u => ({ ...u, wif: u.wif || undefined }));
      if (utxos.length === 0) {
        console.warn('No UTXOs available for signing test, skipped');
        return;
      }
      const address = wallet.getAddress() as string;
      const { tx } = wallet.createTransaction(utxos, [{ address }], 1, address, 0xffffffff, false);
      assert.ok(tx, 'signed tx must be returned');
      assert.ok(tx.toHex(), 'tx.toHex() must produce a non-empty hex string');
      assert.ok(tx.getId(), 'tx.getId() must return a txid');
    });
  });
});
