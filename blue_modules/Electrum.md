batch versions of api is same as single call but with array of params. For example batch get balance looks like

```json
[
  {"jsonrpc":"2.0","id":1,"method":"blockchain.scripthash.get_balance","params":["<scripthash_1>"]},
  {"jsonrpc":"2.0","id":2,"method":"blockchain.scripthash.get_balance","params":["<scripthash_2>"]},
  {"jsonrpc":"2.0","id":3,"method":"blockchain.scripthash.get_balance","params":["<scripthash_3>"]}
]
```


| Action                             | BlueElectrum                                                                                                                                                                   |
|------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| get balance on address             | blockchainScripthash_getBalance(addressHex)<br> https://electrum-protocol.readthedocs.io/en/latest/protocol-methods.html#blockchain.scripthash.get_balance <br>                | 
| get list of tx by address(history) | blockchainScripthash_getHistory(reversedHash.toString('hex')) <br> https://electrum-protocol.readthedocs.io/en/latest/protocol-methods.html#blockchain-scripthash-get-history  |
| get mempool                        | blockchainScripthash_getMempool(reversedHash.toString('hex')); <br> https://electrum-protocol.readthedocs.io/en/latest/protocol-methods.html#blockchain-scripthash-get-mempool |
| ping server                        | await mainClient.server_ping();                                                                                                                                                |
| get tx by hash                     | blockchainTransaction_get <br> https://electrum-protocol.readthedocs.io/en/latest/protocol-methods.html#blockchain-transaction-get                                             |
| multiGetBalanceByAddress ???       | blockchainTransaction_get <br> blockchainScripthash_getBalanceBatch                                                                                                            |
| multiGetUtxoByAddress ???          | blockchainScripthash_listunspentBatch <br> https://electrum-protocol.readthedocs.io/en/latest/protocol-methods.html#blockchain.scripthash.listunspent                          |
| multiGetHistoryByAddress           | blockchainScripthash_getHistory <br>blockchainScripthash_getHistoryBatch                                                                                                       |
| multiGetTransactionByTxid          | blockchainTransaction_get <br> blockchainTransaction_getBatch                                                                                                                  |
| estimateFee                        | blockchainEstimatefee  <br> https://electrum-protocol.readthedocs.io/en/latest/protocol-methods.html#blockchain.estimatefee                                                    |
| broadcastTx                        | blockchainTransaction_broadcast <br> https://electrum-protocol.readthedocs.io/en/latest/protocol-methods.html#blockchain.transaction.broadcast                                                                                                                                    |     |


# Mapping to Qecurrency
All QECurrency calls are listed here
https://github.com/ecurrency-project/ecurrency-pos/blob/master/lib/QBitcoin/RPC/Commands.pm
## blockchain.scripthash.get_balance(scripthash)

### Result

A dictionary with keys confirmed and unconfirmed. The value of each is the appropriate balance in minimum coin units (satoshis). The confirmed balance is the sum of UTXO values at the current chaintip. The value for unconfirmed is the mempool delta (compared to confirmed), so note that it can also be negative.

Result Example
```
{
"confirmed": 103873966,
"unconfirmed": 23684400
}
```
### equivalent in Qecurrency
The closest equivalent is getaddressbalance, it returns confirmed balance only. The uconfirmed might be returned always with second call of getaddressbalance with min_conf=0
The nuance of a Electrum, that is uses reversed scripthash, and the Qecurrency uses address directly.
```
{
```

## blockchain.scripthash.get_history(scripthash)
### Result
```
[
{
"height": 200004,
"tx_hash": "acc3758bd2a26f869fcc67d48ff30b96464d476bca82c1cd6656e7d506816412"
},
{
"height": 215008,
"tx_hash": "f3e1bf48975b8d6060a9de8884296abb80be618dc00ae3cb2f6cee3085e09403"
}
# also might be unconfirmed txs with height 0
{
  "fee": 20000,
  "height": 0,
  "tx_hash": "9fbed79a1e970343fcd39f4a2d830a6bde6de0754ed2da70f489d0303ed558ec"
}
]
```
### equivalent in Qecurrency
Looks like nothing similar in Qecurrency

## blockchain.scripthash.get_mempool(scripthash)
Same as get history but returns only unconfirmed txs
### Result
```
[
{
"tx_hash": "45381031132c57b2ff1cbe8d8d3920cf9ed25efd9a0beb764bdb2f24c7d1c7e3",
"height": 0,
"fee": 24310
}
]

```
### equivalent in Qecurrency
TBD

## blockchain.transaction.get(tx_hash, verbose=Bool)
### Result
A hex-encoded raw transaction.
if verbose is True, returns a JSON object with information about the transaction.
```
{
  "blockhash": "0000000000000000015a4f37ece911e5e3549f988e855548ce7494a0a08b2ad6",
  "blocktime": 1520074861,
  "confirmations": 679,
  "hash": "36a3692a41a8ac60b73f7f41ee23f5c917413e5b2fad9e44b34865bd0d601a3d",
  "hex": "01000000015bb9142c960a838329694d3fe9ba08c2a6421c5158d8f7044cb7c48006c1b484000000006a4730440220229ea5359a63c2b83a713fcc20d8c41b20d48fe639a639d2a8246a137f29d0fc02201de12de9c056912a4e581a62d12fb5f43ee6c08ed0238c32a1ee769213ca8b8b412103bcf9a004f1f7a9a8d8acce7b51c983233d107329ff7c4fb53e44c855dbe1f6a4feffffff02c6b68200000000001976a9141041fb024bd7a1338ef1959026bbba860064fe5f88ac50a8cf00000000001976a91445dac110239a7a3814535c15858b939211f8529888ac61ee0700",
  "locktime": 519777,
  "size": 225,
  "time": 1520074861,
  "txid": "36a3692a41a8ac60b73f7f41ee23f5c917413e5b2fad9e44b34865bd0d601a3d",
  "version": 1,
  "vin": [ {
    "scriptSig": {
      "asm": "30440220229ea5359a63c2b83a713fcc20d8c41b20d48fe639a639d2a8246a137f29d0fc02201de12de9c056912a4e581a62d12fb5f43ee6c08ed0238c32a1ee769213ca8b8b[ALL|FORKID] 03bcf9a004f1f7a9a8d8acce7b51c983233d107329ff7c4fb53e44c855dbe1f6a4",
      "hex": "4730440220229ea5359a63c2b83a713fcc20d8c41b20d48fe639a639d2a8246a137f29d0fc02201de12de9c056912a4e581a62d12fb5f43ee6c08ed0238c32a1ee769213ca8b8b412103bcf9a004f1f7a9a8d8acce7b51c983233d107329ff7c4fb53e44c855dbe1f6a4"
    },
    "sequence": 4294967294,
    "txid": "84b4c10680c4b74c04f7d858511c42a6c208bae93f4d692983830a962c14b95b",
    "vout": 0}],
  "vout": [ { "n": 0,
             "scriptPubKey": { "addresses": [ "12UxrUZ6tyTLoR1rT1N4nuCgS9DDURTJgP"],
                               "asm": "OP_DUP OP_HASH160 1041fb024bd7a1338ef1959026bbba860064fe5f OP_EQUALVERIFY OP_CHECKSIG",
                               "hex": "76a9141041fb024bd7a1338ef1959026bbba860064fe5f88ac",
                               "reqSigs": 1,
                               "type": "pubkeyhash"},
             "value": 0.0856647},
           { "n": 1,
             "scriptPubKey": { "addresses": [ "17NMgYPrguizvpJmB1Sz62ZHeeFydBYbZJ"],
                               "asm": "OP_DUP OP_HASH160 45dac110239a7a3814535c15858b939211f85298 OP_EQUALVERIFY OP_CHECKSIG",
                               "hex": "76a91445dac110239a7a3814535c15858b939211f8529888ac",
                               "reqSigs": 1,
                               "type": "pubkeyhash"},
             "value": 0.1360904}]}
```
### equivalent in Qecurrency
getrawtransaction \<txid\> 1
This returns exactly the same info as Electrum verbose=true

## blockchain.scripthash.listunspent(scripthash)
### Result
```
[
{
"tx_pos": 0,
"value": 45318048,
"tx_hash": "9f2c45a12db0144909b5db269415f7319179105982ac70ed80d76ea79d923ebf",
"height": 437146
},
{
"tx_pos": 0,
"value": 919195,
"tx_hash": "3d2290c93436a3e964cfc2f0950174d8847b1fbe3946432c4784e168da0f019f",
"height": 441696
}
]
```

### equivalent in Qecurrency
listunspent \<address\>

This returns exactly the same info as Electrum but with address instead of scripthash

## blockchain.estimatefee(nblocks)
The estimated transaction fee in whole coin units per kilobyte, as a floating point number.
If the daemon does not have enough information to make an estimate, the integer -1 is returned.
### Result
```
0.00001000
```
### equivalent in Qecurrency
estimatesmartfee 

Returns fee rate in ECR/kB

## blockchain.transaction.broadcast(tx)
Broadcasts a raw transaction to the network.
### Result
```
"txid"
```
### equivalent in Qecurrency
sendrawtransaction "hexstring" ( allowhighfees )