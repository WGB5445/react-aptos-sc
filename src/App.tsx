import { Account, Aptos, AptosConfig, CallArgument, Ed25519PrivateKey, Network } from "@aptos-labs/ts-sdk";
import { useState } from 'react'
import './App.css'
import styles from './app.module.css';
function App() {
  const aptos =  new Aptos(new AptosConfig({network: Network.TESTNET}));
  const account = Account.fromPrivateKey({privateKey: new Ed25519PrivateKey("0x39d229ea55f199139ec54adbb2e58240d8c41df35685113364b998a361259eed")})
  const [ hash,  setHash] = useState<string | undefined>(undefined);
  return (
    <div>
      <button className={styles.customButton} onClick={ async ()=>{
        const transaction = await aptos.transaction.build.scriptComposer({
          sender: account.accountAddress,
          // The builder expects a closure to build up the move call sequence.
          builder: async (builder) => {
              // invoke 0x1::coin::withdraw. This function would return a value of a `coin` type.
              const coin = await builder.addBatchedCalls({
                  function: "0x1::coin::withdraw",
                  functionArguments: [CallArgument.new_signer(0), 1],
                  typeArguments: ["0x1::aptos_coin::AptosCoin"],
              });
       
              // Passing the coin value to the 0x1::coin::coin_to_fungible_asset to convert a coin
              // into fungible asset.
              const fungibleAsset = await builder.addBatchedCalls({
                  function: "0x1::coin::coin_to_fungible_asset",
                  // coin[0] represents the first return value from the first call you added.
                  functionArguments: [coin[0]],
                  typeArguments: ["0x1::aptos_coin::AptosCoin"],
              });
       
              // Deposit the fungibleAsset converted from second call.
              await builder.addBatchedCalls({
                  function: "0x1::primary_fungible_store::deposit",
                  functionArguments: ["0x1", fungibleAsset[0]],
                  typeArguments: [],
              });
              return builder;
          },
      });

      const pending_txn  = await aptos.transaction.signAndSubmitTransaction({transaction: transaction, signer: account});
      const txn = await aptos.waitForTransaction({transactionHash: pending_txn.hash});
      console.log("Transaction: ", txn);
      setHash(pending_txn.hash);
      }}> Execute Transaction </button>

      <>
        { hash && <p> Transaction Hash: {hash} </p> }
      </>
    </div>
  );
}

export default App
