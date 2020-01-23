# Eth-erc-protocol-library
NodeJS library for Ethereum, ERC20, and ERC721 integration 


Technology Stack: 

    • Node (10.15.1)
    • MongoDb

Prerequisites:

    • Infura :
        Use for interaction with mainnet ethereum channel using web3.js.

NPM Dependencies:

These dependencies will be installed by default using *npm i* command by navigating inside project directory

    • Web3.js :
        Web3.js is used for the interaction with mainnet ethereum channel and make all the transaction related to blockchain.

    • Swagger :
        Swagger is used to the API documentation for users, teams, and enterprises.

    • ethereumjs-tx :
        This is used to sign transaction offline.

    • abi-decoder :
        abi-decoder is used to decode encrypted input data from the blockchain transaction.

    • Ethers :
        Ethers are used to create a new wallet and import wallet using the private key and mnemonic phrases (12-word backup phrases).

Deployment instructions:

    • Upload code on the server and run command npm i for install all node module and then run below command to run application.
    • npm run start - For running application in development mode. You can refer .ENV file to setup a new environment as per your requirement.
    • pm2 start npm -- run start To run service on PM2 production.

API Path:

Once you have successfully installed node modules and deployed the app on server, you can navigate to below path to view all API documentation using Swagger. 

http://localhost:5000/api-calls/

Please note: 

- If you have setup the project on cloud, replace localhost with the IP address of your host. 
- Store all you contract address and contract ABI in token_info collection with the name for the transfer.
- When call transfer token API, then get the token address and ABI from the collection and use it.
- Make sure you use Infura API key and make necessary changes in the code. 
- Use your JWT token Key in the development.env file. 

Functionality

    • **File** : functions.js

        **webSocketImplement** : This function is used to subscribe to a data event from the blockchain.
        Receive data(block hash) on every 15 seconds.
        
        **getBlockDataByHash** : Get block details using block hash received in the above function.

        **getTransactionByHash** : Get all transaction details using the transaction hash received in the above function.

        **tx_confirmation** : Update executed user wallet transaction confirmation in database after received new block.

    • **File** : wallet.js

        Function File : AccountFunc.js
            - “In all API JWT token authentication required”
            - “All the singing, send signed transaction and blockchain interaction code is in AccountFunc.Js”

        For the Sign trasaction : 
            - wallet address : User Wallet address, 
            - private key(Convert into hex) : User private Key,
            - destination wallet address, 
            - nonce(Nonce is total transaction in account, Get using web3.eth.getTransactionCount),
            - Amount(Convert into Hex : web3.utild.toHex()), 
            -Gas Price : Gas refers to the fee, or pricing value, required to successfully conduct a transaction or execute a contract on the Ethereum blockchain platform.
            - Gas Limit : Gas limit refers to the maximum amount of gas you're willing to spend on a particular transaction.

        For the Transfer Token : 
            - For the transfer token from user address to destination address first get contract address and contract ABI from token_info tabel.

API End-Point

    • /createNewWallet
        - Create a new wallet for the user and send public address, private key and mnemonic phrases to user.
        - Params : User id(Get from token).

    • /importFromSeedPhraseConfirm
        - It is used for the confirmation that the imported account is not assigned to other users.
        - Params : Mnemonic phares

    • /importFromSeedPhrase
        - It is used to import wallet using mnemonic phares.
        - Params : Mnemonic phares

    • /importFromPrivateKeyConfirm
        - It is used for the confirmation that the imported account is not assigned to other users.
        - Params : Private Key

    • /importFromPrivateKey
        - It is used to import wallet using the private key.
        - Params : Private Key

    • /transferBalanceFromWallet
        - It is used to transfer ether from user wallet to destination wallet using blockchain. In this function first get all required details for the sign transaction. Then sign the transaction using the user’s wallet private key. And then send the signed transaction to blockchain mainnet to execute that transaction using “web.eth.sendSignedTransaction”.
        - Params : Wallet Address, Dest Address, Amount, Private Key.

    •  /sendERC20Token
        - It is used to transfer ERC20Token from user wallet to destination wallet using blockchain.
        - For this we have to first get contract using contract address and contract ABI. Then create a variable and call transafer() method of the contract and pass the required parameter in call(dest address, amount) and store in varible.
        - Now sign the transaction and pass method variable in the data field in sign transaction and send the transaction to the blockchain.
        - Params:  Private Key, Amount, Dest Address, Token Name

    • /sendERC721Token
        - It is used to transfer ERC721Token from user wallet to destination wallet using blockchain.
        - For this, we have first to get contract using contract address and contract ABI. Then get index of the token using contract method(contract.methods.tokenOfOwnerIndex()).
        - Then call safetransaferfrom() method of the contract and pass the required parameter in call(user address, dest address, tokenId) and store in the variable.
        - Now sign the transaction and pass method variable in the data field in sign transaction and send the transaction to the blockchain.
        - Params : Private Key, Amount, Dest Address, Token name

    • /getAllUserTransaction
        - It is used to get all transaction of the user from the database.
        - Params : No Params(Get user id from token)

    • /getTransacrtionReceipt
        - It is used to get transaction receipt from blockchain and display all details in the response.
        - Params : txHash

Example

    • Call /createNewWallet API and pass token in headers.
    • Response : {
        "status": 1,
        "message": "Success",
        "data": {
            "address": "0x89beE0618cD27d39bB4BBf4ac32f8Fa282e1fa9D",
            "mnemonic_word": "wealth razor chief keep spring crop caution maximum cover room slush dance",
            "private_key": "0x6f1bdb759cb2b2bde3d33bf01eb33033db367cb93932a1f950d530ef9099bda6"
        }
    • If error then response :
        {
            "status": "0",
            "message": "Print error",
            "data": "Response data if require"
        }
}
