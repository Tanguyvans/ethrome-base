import { useState, useCallback } from 'react';
import { Client, type Signer } from '@xmtp/browser-sdk';
import { BrowserProvider, Eip1193Provider, getBytes } from 'ethers';

export const useXmtp = () => {
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const connectWallet = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error('Please install MetaMask to use this app');
      }

      // Request account access
      const provider = new BrowserProvider(window.ethereum as Eip1193Provider);
      const ethersSigner = await provider.getSigner();
      const address = await ethersSigner.getAddress();

      setWalletAddress(address);

      // Create XMTP-compatible signer
      const xmtpSigner: Signer = {
        type: 'EOA',
        getIdentifier: () => ({
          identifier: address, // Keep original case from wallet
          identifierKind: 'Ethereum',
        }),
        signMessage: async (message: string) => {
          const signature = await ethersSigner.signMessage(message);
          // Convert hex signature to Uint8Array using ethers
          return getBytes(signature);
        },
      };

      const env = 'dev'; // Use 'dev' for testing, 'production' for prod

      // Initialize XMTP client with a consistent database name
      // Using the address in the DB name ensures each wallet has its own DB
      let xmtpClient: Client;

      try {
        xmtpClient = await Client.create(xmtpSigner, {
          env,
          dbPath: `xmtp-${address.toLowerCase()}`, // Consistent DB path per wallet
        });
      } catch (createErr: any) {
        // If we hit the installation limit, try static revocation
        if (createErr?.message?.includes('already registered') ||
            createErr?.message?.includes('installations')) {
          console.log('Installation limit reached. Attempting to revoke old installations...');

          try {
            // Get inbox states to find installations to revoke
            const inboxStates = await Client.inboxStateFromInboxIds(
              [address], // Try using address as inbox ID for lookup
              env
            );

            if (inboxStates && inboxStates.length > 0) {
              const toRevokeInstallationBytes = inboxStates[0].installations.map((i: any) => i.bytes);

              console.log(`Revoking ${toRevokeInstallationBytes.length} installations...`);

              // Revoke all installations using static method
              await Client.revokeInstallations(
                xmtpSigner,
                inboxStates[0].inboxId,
                toRevokeInstallationBytes,
                env
              );

              console.log('Successfully revoked installations. Retrying client creation...');

              // Retry creating the client
              xmtpClient = await Client.create(xmtpSigner, {
                env,
                dbPath: `xmtp-${address.toLowerCase()}`,
              });
            } else {
              throw new Error('Could not find inbox state to revoke installations');
            }
          } catch (revokeErr) {
            console.error('Failed to revoke installations:', revokeErr);
            throw new Error('Installation limit reached and auto-revocation failed. Please use production network or clear browser data.');
          }
        } else {
          throw createErr;
        }
      }

      setClient(xmtpClient);
      console.log('XMTP client initialized for:', address);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(errorMessage);
      console.error('Error connecting wallet:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setClient(null);
    setWalletAddress(null);
    setError(null);
  }, []);

  return {
    client,
    walletAddress,
    isLoading,
    error,
    connectWallet,
    disconnect,
  };
};
