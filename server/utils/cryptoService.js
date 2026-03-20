import { getDb } from '../config/db.js';
import crypto from 'crypto';
import walletService from './walletService.js';

/**
 * Service to manage stablecoins and EVM/Cardano integrations.
 */
const cryptoService = {
    // Supported Networks & Tokens
    supportedNetworks: ['polygon', 'scroll', 'base', 'arbitrum', 'celo', 'cardano'],
    
    // Generate/Get Deposit Address for a user
    async getDepositAddress(userId, network) {
        if (!this.supportedNetworks.includes(network)) {
            throw new Error(`Network ${network} is not supported.`);
        }
        
        const db = getDb();
        let currency = 'USDC'; // Default for EVM
        if (network === 'cardano') currency = 'USDA';
        
        // This relies on getBalance auto-creating a wallet if it doesn't exist
        let wallet = await walletService.getBalance(userId, currency, network);
        
        if (!wallet.address) {
            // Generate a distinct address per user per network using a secure pattern
            // In production, this would use a hierarchical deterministic (HD) wallet SDK (ethers.js / cardano-cli)
            const mockAddress = network === 'cardano' 
                ? `addr1_${crypto.randomBytes(20).toString('hex')}`
                : `0x${crypto.randomBytes(20).toString('hex')}`;
                
            await db.run(
                `UPDATE wallets SET address = ? WHERE id = ?`,
                [mockAddress, wallet.id]
            );
            wallet.address = mockAddress;
        }
        
        return {
            network,
            currency,
            address: wallet.address
        };
    },
    
    // Simulates an on-chain deposit detected by a blockchain indexer
    async processOnChainDeposit(address, network, currency, amount, txHash) {
        const db = getDb();
        const wallet = await db.get(
            `SELECT * FROM wallets WHERE address = ? AND network = ? AND currency_code = ?`,
            [address, network, currency]
        );
        
        if (!wallet) throw new Error("Wallet not found for this address");
        
        await walletService.deposit(wallet.userId, currency, network, amount, txHash, 'crypto');
        return true;
    }
};

export default cryptoService;
