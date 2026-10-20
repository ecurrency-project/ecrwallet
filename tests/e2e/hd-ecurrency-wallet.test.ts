import assert from 'assert';

import * as BlueElectrum from '../../blue_modules/BlueElectrum';
import { HDECurrencyWallet } from '../../class';

jest.setTimeout(300 * 1000);
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const HD_MNEMONIC =
  process.env.HD_MNEMONIC_ECURRENCY ?? 'organ spawn dentist violin great ridge discover layer census barrel include nature';

afterAll(async () => {
  BlueElectrum.forceDisconnect();
  await sleep(20);
});

beforeAll(async () => {
  await BlueElectrum.connectMain();
});

describe('HDECurrencyWallet', () => {
  describe('unit', () => {
    it('has correct type identifiers', () => {
      const wallet = new HDECurrencyWallet();
      assert.strictEqual(wallet.type, 'HDECurrency');
      assert.strictEqual(wallet.typeReadable, 'HD ECurrency');
    });

    it('has correct capability flags', () => {
      const wallet = new HDECurrencyWallet();
      assert.strictEqual(wallet.allowSend(), true);
      assert.strictEqual(wallet.allowCosignPsbt(), true);
      assert.strictEqual(wallet.allowMasterFingerprint(), true);
      assert.strictEqual(wallet.allowXpub(), true);
      assert.strictEqual(wallet.allowSignVerifyMessage(), false);
      assert.strictEqual(wallet.allowBIP47(), false);
    });

    it("derivation path is m/44'/8128'/0'", () => {
      const wallet = new HDECurrencyWallet();
      assert.strictEqual(wallet.getDerivationPath(), "m/44'/8128'/0'");
    });

    it('getXpub() is deterministic for the same mnemonic', () => {
      const w1 = new HDECurrencyWallet();
      const w2 = new HDECurrencyWallet();
      w1.setSecret(HD_MNEMONIC);
      w2.setSecret(HD_MNEMONIC);
      assert.strictEqual(w1.getXpub(), w2.getXpub());
    });

    it('getXpub() differs for different mnemonics', () => {
      const w1 = new HDECurrencyWallet();
      const w2 = new HDECurrencyWallet();
      w1.setSecret(HD_MNEMONIC);
      w2.setSecret('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
      assert.notStrictEqual(w1.getXpub(), w2.getXpub());
    });

    it('external and internal addresses at index 0 differ', () => {
      const wallet = new HDECurrencyWallet();
      wallet.setSecret(HD_MNEMONIC);
      assert.notStrictEqual(wallet._getExternalAddressByIndex(0), wallet._getInternalAddressByIndex(0));
    });

    it('successive external addresses are all unique', () => {
      const wallet = new HDECurrencyWallet();
      wallet.setSecret(HD_MNEMONIC);
      const addresses = Array.from({ length: 5 }, (_, i) => wallet._getExternalAddressByIndex(i));
      assert.strictEqual(new Set(addresses).size, 5, 'each address index must produce a unique address');
    });

    it('isAddressValid() accepts a derived ECurrency address', () => {
      const wallet = new HDECurrencyWallet();
      wallet.setSecret(HD_MNEMONIC);
      const address = wallet._getExternalAddressByIndex(0);
      assert.strictEqual(wallet.isAddressValid(address), true);
    });

    it('isAddressValid() rejects Bitcoin addresses', () => {
      const wallet = new HDECurrencyWallet();
      assert.strictEqual(wallet.isAddressValid('1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf'), false);
      assert.strictEqual(wallet.isAddressValid('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'), false);
      assert.strictEqual(wallet.isAddressValid(''), false);
    });

    it('createTransaction() throws when no targets provided', () => {
      const wallet = new HDECurrencyWallet();
      wallet.setSecret(HD_MNEMONIC);
      assert.throws(() => wallet.createTransaction([], [], 1, wallet._getInternalAddressByIndex(0), 0xffffffff), /No destination provided/);
    });

    it('createTransaction(skipSigning=true) returns inputs, outputs, and fee', () => {
      const wallet = new HDECurrencyWallet();
      wallet.setSecret(HD_MNEMONIC);
      const address = wallet._getExternalAddressByIndex(0);
      const changeAddress = wallet._getInternalAddressByIndex(0);
      const utxos = [
        {
          txid: '0000000000000000000000000000000000000000000000000000000000000001',
          vout: 0,
          value: 100000,
          address,
          confirmations: 1,
        },
      ];
      const { inputs, outputs, fee } = wallet.createTransaction(
        utxos,
        [{ address: wallet._getExternalAddressByIndex(1), value: 50000 }],
        1,
        changeAddress,
        0xffffffff,
        true,
      );
      assert.ok(inputs.length > 0, 'coinselect must pick at least one input');
      assert.ok(outputs.length > 0);
      assert.ok(fee > 0);
    });
  });

  describe('integration', () => {
    it('can fetch balance', async () => {
      const wallet = new HDECurrencyWallet();
      wallet.setSecret(HD_MNEMONIC);
      await wallet.fetchBalance();
      assert.ok(typeof wallet.getBalance() === 'number');
    });

    it('can fetch UTXOs with txhex pre-fetched for P2PK inputs', async () => {
      const wallet = new HDECurrencyWallet();
      wallet.setSecret(HD_MNEMONIC);
      await wallet.fetchUtxo();
      for (const utxo of wallet.getUtxo()) {
        assert.ok(utxo.txid, 'utxo must have txid');
        assert.ok(typeof utxo.vout !== 'undefined', 'utxo must have vout');
        assert.ok(utxo.value, 'utxo must have value');
        assert.ok(utxo.txhex, 'txhex must be pre-fetched for P2PK non-segwit inputs');
      }
    });

    it('wasEverUsed() returns a boolean', async () => {
      const wallet = new HDECurrencyWallet();
      wallet.setSecret(HD_MNEMONIC);
      const result = await wallet.wasEverUsed();
      assert.ok(typeof result === 'boolean');
    });

    it('fetchTransactions() populates transactions with inputs and outputs', async () => {
      const wallet = new HDECurrencyWallet();
      wallet.setSecret(HD_MNEMONIC);
      await wallet.fetchBalance();
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

    it('can create and sign a transaction with live UTXOs', async () => {
      const wallet = new HDECurrencyWallet();
      wallet.setSecret(HD_MNEMONIC);
      await wallet.fetchBalance();
      await wallet.fetchUtxo();
      const utxos = wallet.getUtxo();
      if (utxos.length === 0) {
        console.warn('No UTXOs available for signing test, skipped');
        return;
      }
      const changeAddress = wallet._getInternalAddressByIndex(wallet.next_free_change_address_index);
      const destAddress = wallet._getExternalAddressByIndex(0);
      const { tx } = wallet.createTransaction(utxos, [{ address: destAddress }], 1, changeAddress, 0xffffffff, false);
      assert.ok(tx, 'signed tx must be returned');
      assert.ok(tx.toHex(), 'tx.toHex() must produce a non-empty hex string');
      assert.ok(tx.getId(), 'tx.getId() must return a txid');
    });
  });
});
