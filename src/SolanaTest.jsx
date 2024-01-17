import {useEffect, useState} from 'react';
import './App.css';
import {clusterApiUrl, Connection, LAMPORTS_PER_SOL, PublicKey, SYSVAR_INSTRUCTIONS_PUBKEY} from '@solana/web3.js';
import {AnchorProvider, BN, Program, setProvider, web3} from '@coral-xyz/anchor';
import idl from './assets/doCrossToken.json';
import replex_idl from './assets/libreplex.json'
import {Buffer} from "buffer";
import {Metaplex} from "@metaplex-foundation/js";
import {PROGRAM_ADDRESS} from "@metaplex-foundation/mpl-token-metadata/dist/src/generated/index.js";
import {TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID} from "@solana/spl-token/src/constants.js";
import {getAssociatedTokenAddressSync} from "@solana/spl-token/src/state/mint.js";


const AIRDROP_AMOUNT = 5 * LAMPORTS_PER_SOL;

function SolanaTest() {
    const [account, setAccount] = useState('');
    const [txHash, setTxHash] = useState('');
    const [balance, setBalance] = useState('');
    const [token1Balance, setToken1Balance] = useState('');
    const [phantomProvider, setPhantomProvider] = useState('');
    const [isConnected, setIsConnected] = useState(false);

    const connection = new Connection(clusterApiUrl("devnet"));
    const getProvider = () => {
        if ('phantom' in window) {
            const provider = window.phantom?.solana;
            if (provider?.isPhantom) {
                setPhantomProvider(provider);
                setProvider(provider);
            }
        }
    };

    const initLibreplex = async () => {
        setTxHash('');
        const provider = new AnchorProvider(connection, window.solana, AnchorProvider.defaultOptions());
        let programPublicKey = new PublicKey("8bvPnYE5Pvz2Z9dE6RAqWr1rzLknTndZ9hwvRE6kPDXP");
        const program = new Program(replex_idl, programPublicKey, provider);
        // const program = new PublicKey('8bvPnYE5Pvz2Z9dE6RAqWr1rzLknTndZ9hwvRE6kPDXP');
        // const idl = await Program.fetchIdl(program, provider);
        // const str = JSON.stringify(idl, null, 2);
        // console.log(`the idl is: ${str}`)
        const ticker = `arf`
        const initParam = {
            ticker: ticker,
            deploymentTemplate: `{"p":"spl-20","op":"deploy","tick":"${ticker}","max":"21000000", "limit":"1000"}`,
            limitPerMint: new BN(1000),
            decimals: 9,
            maxNumberOfTokens: new BN(Math.floor(21000000 / 1000)),
            mintTemplate: `{"p":"spl-20","op":"mint","tick":"${ticker}","amt":"1000"}`,
            offchainUrl: `https://nftstorage.link/ipfs/bafkreie66ucbmj27myovs4jqqikpn2lvbr43qcrisu5yxaah3usfmopgwi`,
        }
        const txHash = await program.methods.initialise(initParam).accounts({
            systemProgram: web3.SystemProgram.programId,
            payer: new PublicKey(account),
            deployment: PublicKey.findProgramAddressSync([Buffer.from("deployment"), Buffer.from(ticker)], programPublicKey)
        }).rpc({
            skipPreflight: true,
        });
        console.log(`Tx Complete: https://explorer.solana.com/tx/${txHash}?cluster=devnet`)
        if (txHash) {
            setTxHash(txHash);
        }
    };

    const deployLibreplex = async () => {
        setTxHash('');
        const ticker = `arf`
        const metaplexInstance = Metaplex.make(connection);
        const provider = new AnchorProvider(connection, window.solana, AnchorProvider.defaultOptions());
        const nonFungibleMintKey = web3.Keypair.generate();
        const fungibleMintKey = web3.Keypair.generate();
        const nonFungibleMintAccount = nonFungibleMintKey.publicKey;
        const fungibleMintAccount = fungibleMintKey.publicKey;
        const programPublicKey = new PublicKey("8bvPnYE5Pvz2Z9dE6RAqWr1rzLknTndZ9hwvRE6kPDXP");
        const INSCRIPTIONS_PROGRAM_ADDRESS = new PublicKey(`inscokhJarcjaEs59QbQ7hYjrKz25LEPRfCbP8EmdUp`);
        const deployment = PublicKey.findProgramAddressSync([Buffer.from("deployment"), Buffer.from(ticker)], programPublicKey)[0]
        const program = new Program(replex_idl, programPublicKey, provider);

        const run = program.methods.deployLegacy().accounts({
            systemProgram: web3.SystemProgram.programId,
            deployment: deployment,
            payer: new PublicKey(account),
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            nonFungibleMint: nonFungibleMintAccount,
            nonFungibleMetadata: metaplexInstance.nfts().pdas().metadata({
                mint: nonFungibleMintAccount
            }),
            nonFungibleMasterEdition: metaplexInstance.nfts().pdas().masterEdition({
                mint: nonFungibleMintAccount
            }),
            nonFungibleTokenAccount: getAssociatedTokenAddressSync(nonFungibleMintAccount, deployment, true),
            inscriptionsProgram: INSCRIPTIONS_PROGRAM_ADDRESS,
            metadataProgram: PROGRAM_ADDRESS,
            inscriptionData: PublicKey.findProgramAddressSync([Buffer.from("inscription_data"), nonFungibleMintAccount.toBuffer()], INSCRIPTIONS_PROGRAM_ADDRESS)[0],
            inscriptionSummary: PublicKey.findProgramAddressSync([Buffer.from("inscription_summary")], INSCRIPTIONS_PROGRAM_ADDRESS)[0],
            inscriptionV3: PublicKey.findProgramAddressSync([Buffer.from("inscription_v3")], INSCRIPTIONS_PROGRAM_ADDRESS)[0],
            inscription: PublicKey.findProgramAddressSync([Buffer.from("inscription"), nonFungibleMintAccount.toBuffer()], INSCRIPTIONS_PROGRAM_ADDRESS)[0],
            sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
            fungibleMint: fungibleMintAccount,
            fungibleMetadata: metaplexInstance.nfts().pdas().metadata({
                mint: fungibleMintAccount
            }),
            fungibleEscrowTokenAccount: getAssociatedTokenAddressSync(fungibleMintAccount, deployment, true),
            hashlist: PublicKey.findProgramAddressSync([Buffer.from("hashlist"), deployment.toBuffer()], deployment)[0]
        }).signers([fungibleMintKey, nonFungibleMintKey]).preInstructions([web3.ComputeBudgetProgram.setComputeUnitLimit({units: 1000000})]);

        const txHash = await run.rpc({
            skipPreflight: true
        });

        console.log(`Tx Complete: https://explorer.solana.com/tx/${txHash}?cluster=devnet`);
        if (txHash) {
            setTxHash(txHash);
        }
    };

    const airdrop = async () => {
        setTxHash('');
        const provider = new AnchorProvider(connection, window.solana, AnchorProvider.defaultOptions());
        const signature = await provider.connection.requestAirdrop(new PublicKey(account), AIRDROP_AMOUNT);

        const {blockhash, lastValidBlockHeight} = await provider.connection.getLatestBlockhash();
        await provider.connection.confirmTransaction({
            blockhash, lastValidBlockHeight, signature
        }, 'finalized');
        console.log(`Tx Complete: https://explorer.solana.com/tx/${signature}?cluster=devnet`)
        if (signature) {
            setTxHash(signature);
        }
    };

    //交易操作
    const transFn = async () => {
        setTxHash('');
        const provider1 = new AnchorProvider(connection, window.solana, AnchorProvider.defaultOptions());
        const program = new Program(idl, new PublicKey('qPYTd6p7koudU6d5KnvRyThrrcANqyb9sCBbPXuVj8i'), provider1);
        const txHash = await program.methods
            .doCrossToken('0x71d9CFd1b7AdB1E8eb4c193CE6FFbe19B4aeE0dB', new BN(9527), '0x9951146d4FDbD0903D450b315725880a90383F38', new BN(2), new BN(1890000000))
            .accounts({
                state: new PublicKey('5mzyBFhKS2q7B6iKT3ZejEuT3Fde6nqc6jWNK9uHB7gk'),
                authority: new PublicKey(account),
                feeAccount: new PublicKey('Gdq7L12geEk4PUhby4zcVCunU8TyjaH5vyPxcRsyyyJp'),
                userVault: new PublicKey('AKq3wbFdSuDoK3LW1DCKtto1HjBdcYWj1xhCFoueyekB'),
                stateVault: new PublicKey('HYsmr2bLAmSc6bDiD8q5QL92FMmYJRrMQ9W917wAfSLR'),
                tokenAccount: new PublicKey('2edm8qF7mwge6sc3K8nEHCmZGz9Qcxb8r4YvJiFZaVVZ'),
                tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
                systemProgram: web3.SystemProgram.programId
            })
            .rpc();
        console.log('txHash---:', txHash);
        if (txHash) {
            setTxHash(txHash);
        }
    };

    //获取账户其他token 余额
    const getOtherTokenBalance = () => {
        const tokenMintPublicKey = new web3.PublicKey('2edm8qF7mwge6sc3K8nEHCmZGz9Qcxb8r4YvJiFZaVVZ');
        connection.getParsedTokenAccountsByOwner(new PublicKey(account), {mint: tokenMintPublicKey}).then(({value}) => {
            value.forEach(account => {
                const tokenBalance = account.account.data.parsed.info.tokenAmount.amount;

                const formatBal = balanceFormat(tokenBalance);
                setToken1Balance(formatBal);
            });
        });
    };
    //获取账户其他token 余额
    const getCurTokenBalance = () => {
        connection.getBalance(new PublicKey(account)).then(balance => {
            const curBal = balanceFormat(balance);
            setBalance(curBal);
        });
    };

    //格式化余额
    const balanceFormat = balance => {
        const bal = new BN(balance).divmod(new BN(web3.LAMPORTS_PER_SOL));

        return `${bal.div.toString()}.${bal.mod.toString()}`;
    };
    //连接钱包
    const connect = async () => {
        try {
            const resp = await window.phantom?.solana.connect();
            setAccount(resp.publicKey.toString());
            setIsConnected(phantomProvider.isConnected);
        } catch (err) {
            // { code: 4001, message: 'User rejected the request.' }
        }
    };
    //断开钱包
    const disConnect = async () => {
        await phantomProvider.disconnect();
        setIsConnected(phantomProvider.isConnected);
    };
    useEffect(() => {
        setTxHash('');
        getProvider();
    }, []);
    useEffect(() => {
        if (isConnected) {
            getCurTokenBalance();
            getOtherTokenBalance();
        }
    }, [isConnected]);
    return (<>
        <div>Solana Test</div>

        {isConnected ? (<>
            <button onClick={disConnect}>断开连接</button>
            <div>用户名 : {account}</div>
            <div>本币余额 : {balance}</div>
            <div>其他币余额 : {token1Balance}</div>
            <div>{`交易哈希：${txHash || ''}`}</div>
        </>) : (<button onClick={connect}>连接Phantom钱包</button>)}
        {isConnected && <button onClick={transFn}>交易操作(doCrossToken)</button>}
        {isConnected && <button onClick={initLibreplex}>libreplex(initLibreplex)</button>}
    </>);
}

export default SolanaTest;
