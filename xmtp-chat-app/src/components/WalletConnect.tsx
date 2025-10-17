import React from 'react';
import './WalletConnect.css';

interface WalletConnectProps {
  onConnect: () => void;
  isLoading: boolean;
  error: string | null;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({
  onConnect,
  isLoading,
  error,
}) => {
  return (
    <div className="wallet-connect">
      <div className="wallet-connect-card">
        <h1>XMTP Chat</h1>
        <p>Connect your wallet to start messaging</p>
        <button onClick={onConnect} disabled={isLoading}>
          {isLoading ? 'Connecting...' : 'Connect Wallet'}
        </button>
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
};
