"use client";

import { createContext, useContext, ReactNode, useCallback, useMemo, useState } from "react";
import {
  AptosWalletAdapterProvider,
  useWallet as useAptosWallet,
} from "@aptos-labs/wallet-adapter-react";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const CONTRACT_ADDRESS = "0x1a3539dd3832bd0cec0a4e311a343282916684c140828b2a7b7f3c2365e06268";
const APTOS_FULLNODE = "https://fullnode.testnet.aptoslabs.com/v1";

const aptosConfig = new AptosConfig({
  network: Network.TESTNET,
  fullnode: APTOS_FULLNODE,
});
const aptos = new Aptos(aptosConfig);

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  publicKey: string | null;
  account: { address: string } | null;
  isConnecting: boolean;

  connect: () => Promise<boolean>;
  disconnect: () => void;
  signMessage: (message: string) => Promise<{ signature: string; fullMessage: string } | null>;

  taoKyQuy: (cid: string, contractHash: string, soTien: number, hanUngTuyen: number, thoiGianLam: number, thoiGianDuyet: number) => Promise<{ txHash: string; escrowId: number } | null>;
  capNhatEscrow: (escrowId: number, contractHash: string, soTien: number, hanUngTuyen: number, thoiGianLam: number, thoiGianDuyet: number) => Promise<string | null>;
  ganNguoiLam: (escrowId: number, nguoiLamAddr: string) => Promise<string | null>;
  kyHopDong: (escrowId: number, contractHash: string) => Promise<string | null>;
  nopSanPham: (escrowId: number, evidenceCid: string) => Promise<string | null>;
  traTienNguoiLam: (escrowId: number) => Promise<string | null>;
  yeuCauChinhSua: (escrowId: number) => Promise<string | null>;
  freelancerRut: (escrowId: number) => Promise<string | null>;
  moTranhChap: (escrowId: number) => Promise<{ txHash: string; disputeId: number } | null>;
  huyEscrow: (escrowId: number) => Promise<string | null>;
  kyXacNhan: (escrowId: number) => Promise<string | null>;
  giaiQuyetTranhChap: (escrowId: number, nguoiThangAddr: string) => Promise<string | null>;
  tuChoiHopDong: (escrowId: number) => Promise<string | null>;
  huyTruocKy: (escrowId: number) => Promise<string | null>;
  
  // Dispute claim functions
  claimTimeoutWin: (disputeId: number) => Promise<string | null>;
  claimDisputeRefund: (disputeId: number) => Promise<string | null>;
  adminVote: (disputeId: number, voteForEmployer: boolean) => Promise<string | null>;
  startVoting: (disputeId: number) => Promise<string | null>;
  
  getWithdrawalPenalty: (escrowId: number) => Promise<number | null>;
  getAptosExplorerUrl: (txHash: string) => string;
}

const WalletContext = createContext<WalletContextType | null>(null);

function WalletContextProvider({ children }: { children: ReactNode }) {
  const {
    connect: aptosConnect,
    disconnect: aptosDisconnect,
    account,
    connected,
    signAndSubmitTransaction,
    signMessage: aptosSignMessage,
  } = useAptosWallet();

  const [isConnecting, setIsConnecting] = useState(false);

  const isConnected = connected;
  const address = account?.address?.toString() || null;
  const publicKey = account?.publicKey?.toString() || null;

  const connect = useCallback(async (): Promise<boolean> => {
    setIsConnecting(true);
    try {
      await aptosConnect("Petra");
      return true;
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [aptosConnect]);

  const disconnect = useCallback(async () => {
    try {
      await aptosDisconnect();
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
  }, [aptosDisconnect]);

  const signMessage = useCallback(async (message: string): Promise<{ signature: string; fullMessage: string } | null> => {
    if (!connected || !aptosSignMessage) {
      return null;
    }
    try {
      const response = await aptosSignMessage({
        message,
        nonce: Date.now().toString(),
      });
      return {
        signature: String(response.signature),
        fullMessage: String(response.fullMessage),
      };
    } catch (error) {
      console.error("Failed to sign message:", error);
      return null;
    }
  }, [connected, aptosSignMessage]);

  const submitTransaction = useCallback(async (payload: any): Promise<string | null> => {
    if (!connected) {
      throw new Error("Wallet not connected");
    }

    try {
      const response = await signAndSubmitTransaction({
        data: {
          function: payload.function,
          typeArguments: payload.type_arguments || [],
          functionArguments: payload.arguments || [],
        },
      });
      return response.hash;
    } catch (error) {
      console.error("Transaction failed:", error);
      throw error;
    }
  }, [connected, signAndSubmitTransaction]);

  const getEscrowIdFromTx = useCallback(async (txHash: string): Promise<number | null> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const response = await fetch(
        `${APTOS_FULLNODE}/transactions/by_hash/${txHash}`
      );
      const txData = await response.json();
      
      if (txData.events) {
        const createEvent = txData.events.find((e: any) => 
          e.type.includes("EscrowCreatedEvent")
        );
        if (createEvent?.data?.escrow_id) {
          return parseInt(createEvent.data.escrow_id);
        }
      }
      return null;
    } catch (error) {
      console.error("Failed to get escrow_id from tx:", error);
      return null;
    }
  }, []);

  const hexStringToBytes = useCallback((hex: string): number[] => {
    const bytes: number[] = [];
    for (let i = 0; i < hex.length; i += 2) {
      bytes.push(parseInt(hex.substring(i, i + 2), 16));
    }
    return bytes;
  }, []);

  const taoKyQuy = useCallback(async (
    cid: string,
    contractHash: string,
    soTien: number,
    hanUngTuyen: number,
    thoiGianLam: number,
    thoiGianDuyet: number
  ): Promise<{ txHash: string; escrowId: number } | null> => {
    const contractHashBytes = hexStringToBytes(contractHash);
    const payload = {
      function: `${CONTRACT_ADDRESS}::escrow::tao_ky_quy`,
      type_arguments: [],
      arguments: [cid, contractHashBytes, soTien.toString(), hanUngTuyen.toString(), thoiGianLam.toString(), thoiGianDuyet.toString()],
    };
    const txHash = await submitTransaction(payload);
    if (!txHash) return null;
    
    const escrowId = await getEscrowIdFromTx(txHash);
    if (!escrowId) return null;
    
    return { txHash, escrowId };
  }, [submitTransaction, getEscrowIdFromTx, hexStringToBytes]);

  const capNhatEscrow = useCallback(async (
    escrowId: number,
    contractHash: string,
    soTien: number,
    hanUngTuyen: number,
    thoiGianLam: number,
    thoiGianDuyet: number
  ): Promise<string | null> => {
    const contractHashBytes = hexStringToBytes(contractHash);
    const payload = {
      function: `${CONTRACT_ADDRESS}::escrow::cap_nhat_escrow`,
      type_arguments: [],
      arguments: [escrowId.toString(), contractHashBytes, soTien.toString(), hanUngTuyen.toString(), thoiGianLam.toString(), thoiGianDuyet.toString()],
    };
    return submitTransaction(payload);
  }, [submitTransaction, hexStringToBytes]);

  const ganNguoiLam = useCallback(async (escrowId: number, nguoiLamAddr: string): Promise<string | null> => {
    const payload = {
      function: `${CONTRACT_ADDRESS}::escrow::gan_nguoi_lam`,
      type_arguments: [],
      arguments: [escrowId.toString(), nguoiLamAddr],
    };
    return submitTransaction(payload);
  }, [submitTransaction]);

  const kyHopDong = useCallback(async (escrowId: number, contractHash: string): Promise<string | null> => {
    const contractHashBytes = hexStringToBytes(contractHash);
    const payload = {
      function: `${CONTRACT_ADDRESS}::escrow::ky_hop_dong`,
      type_arguments: [],
      arguments: [escrowId.toString(), contractHashBytes],
    };
    return submitTransaction(payload);
  }, [submitTransaction, hexStringToBytes]);

  const nopSanPham = useCallback(async (escrowId: number, evidenceCid: string): Promise<string | null> => {
    const payload = {
      function: `${CONTRACT_ADDRESS}::escrow::nop_san_pham`,
      type_arguments: [],
      arguments: [escrowId.toString(), evidenceCid],
    };
    return submitTransaction(payload);
  }, [submitTransaction]);

  const traTienNguoiLam = useCallback(async (escrowId: number): Promise<string | null> => {
    const payload = {
      function: `${CONTRACT_ADDRESS}::escrow::tra_tien_nguoi_lam`,
      type_arguments: [],
      arguments: [escrowId.toString()],
    };
    return submitTransaction(payload);
  }, [submitTransaction]);

  const yeuCauChinhSua = useCallback(async (escrowId: number): Promise<string | null> => {
    const payload = {
      function: `${CONTRACT_ADDRESS}::escrow::yeu_cau_chinh_sua`,
      type_arguments: [],
      arguments: [escrowId.toString()],
    };
    return submitTransaction(payload);
  }, [submitTransaction]);

  const freelancerRut = useCallback(async (escrowId: number): Promise<string | null> => {
    const payload = {
      function: `${CONTRACT_ADDRESS}::escrow::freelancer_rut`,
      type_arguments: [],
      arguments: [escrowId.toString()],
    };
    return submitTransaction(payload);
  }, [submitTransaction]);

  const moTranhChap = useCallback(async (escrowId: number): Promise<{ txHash: string; disputeId: number } | null> => {
    const payload = {
      function: `${CONTRACT_ADDRESS}::dispute::tao_tranh_chap`,
      type_arguments: [],
      arguments: [escrowId.toString()],
    };
    const txHash = await submitTransaction(payload);
    if (!txHash) return null;

    // Wait and parse event to get dispute_id
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const response = await fetch(
        `${APTOS_FULLNODE}/transactions/by_hash/${txHash}`
      );
      const txData = await response.json();
      
      if (txData.events) {
        const disputeEvent = txData.events.find((e: any) => 
          e.type.includes("DisputeCreatedEvent")
        );
        if (disputeEvent?.data?.dispute_id) {
          const disputeId = parseInt(disputeEvent.data.dispute_id);
          return { txHash, disputeId };
        }
      }
    } catch (error) {
      console.error("Failed to parse dispute event:", error);
    }

    return { txHash, disputeId: 0 };
  }, [submitTransaction]);

  const huyEscrow = useCallback(async (escrowId: number): Promise<string | null> => {
    const payload = {
      function: `${CONTRACT_ADDRESS}::escrow::huy_escrow`,
      type_arguments: [],
      arguments: [escrowId.toString()],
    };
    return submitTransaction(payload);
  }, [submitTransaction]);

  const kyXacNhan = useCallback(async (escrowId: number): Promise<string | null> => {
    const payload = {
      function: `${CONTRACT_ADDRESS}::dispute::ky_xac_nhan`,
      type_arguments: [],
      arguments: [escrowId.toString()],
    };
    return submitTransaction(payload);
  }, [submitTransaction]);

  const giaiQuyetTranhChap = useCallback(async (escrowId: number, nguoiThangAddr: string): Promise<string | null> => {
    const payload = {
      function: `${CONTRACT_ADDRESS}::dispute::giai_quyet_tranh_chap`,
      type_arguments: [],
      arguments: [escrowId.toString(), nguoiThangAddr],
    };
    return submitTransaction(payload);
  }, [submitTransaction]);

  const tuChoiHopDong = useCallback(async (escrowId: number): Promise<string | null> => {
    const payload = {
      function: `${CONTRACT_ADDRESS}::escrow::tu_choi_hop_dong`,
      type_arguments: [],
      arguments: [escrowId.toString()],
    };
    return submitTransaction(payload);
  }, [submitTransaction]);

  const huyTruocKy = useCallback(async (escrowId: number): Promise<string | null> => {
    const payload = {
      function: `${CONTRACT_ADDRESS}::escrow::huy_truoc_ky`,
      type_arguments: [],
      arguments: [escrowId.toString()],
    };
    return submitTransaction(payload);
  }, [submitTransaction]);

  // Claim timeout win (employer calls when freelancer doesn't respond)
  const claimTimeoutWin = useCallback(async (disputeId: number): Promise<string | null> => {
    const payload = {
      function: `${CONTRACT_ADDRESS}::dispute::claim_timeout_win`,
      type_arguments: [],
      arguments: [disputeId.toString()],
    };
    return submitTransaction(payload);
  }, [submitTransaction]);

  // Claim refund after winning dispute
  const claimDisputeRefund = useCallback(async (disputeId: number): Promise<string | null> => {
    const payload = {
      function: `${CONTRACT_ADDRESS}::dispute::nhan_hoan_tien`,
      type_arguments: [],
      arguments: [disputeId.toString()],
    };
    return submitTransaction(payload);
  }, [submitTransaction]);

  // Admin casts vote (true = vote for employer, false = vote for freelancer)
  const adminVote = useCallback(async (disputeId: number, voteForEmployer: boolean): Promise<string | null> => {
    const payload = {
      function: `${CONTRACT_ADDRESS}::dispute::admin_vote`,
      type_arguments: [],
      arguments: [disputeId.toString(), voteForEmployer],
    };
    return submitTransaction(payload);
  }, [submitTransaction]);

  // Start voting phase (after evidence deadline)
  const startVoting = useCallback(async (disputeId: number): Promise<string | null> => {
    const payload = {
      function: `${CONTRACT_ADDRESS}::dispute::start_voting`,
      type_arguments: [],
      arguments: [disputeId.toString()],
    };
    return submitTransaction(payload);
  }, [submitTransaction]);

  const getWithdrawalPenalty = useCallback(async (escrowId: number): Promise<number | null> => {
    try {
      const result = await aptos.view({
        payload: {
          function: `${CONTRACT_ADDRESS}::escrow::get_freelancer_withdrawal_penalty`,
          typeArguments: [],
          functionArguments: [escrowId.toString()],
        },
      });
      return Number(result[0]) / 100_000_000; // Convert from octas to APT
    } catch (error) {
      console.error("Error getting withdrawal penalty:", error);
      return null;
    }
  }, []);

  const getAptosExplorerUrl = useCallback((txHash: string) => {
    return `https://explorer.aptoslabs.com/txn/${txHash}?network=testnet`;
  }, []);

  // Create account object for context
  const accountObj = useMemo(() => 
    address ? { address } : null, 
    [address]
  );

  const value = useMemo(() => ({
    isConnected,
    address,
    publicKey,
    account: accountObj,
    isConnecting,
    connect,
    disconnect,
    signMessage,
    taoKyQuy,
    capNhatEscrow,
    ganNguoiLam,
    kyHopDong,
    nopSanPham,
    traTienNguoiLam,
    yeuCauChinhSua,
    freelancerRut,
    moTranhChap,
    huyEscrow,
    kyXacNhan,
    giaiQuyetTranhChap,
    tuChoiHopDong,
    huyTruocKy,
    claimTimeoutWin,
    claimDisputeRefund,
    adminVote,
    startVoting,
    getWithdrawalPenalty,
    getAptosExplorerUrl,
  }), [
    isConnected,
    address,
    publicKey,
    accountObj,
    isConnecting,
    connect,
    disconnect,
    signMessage,
    taoKyQuy,
    capNhatEscrow,
    ganNguoiLam,
    kyHopDong,
    nopSanPham,
    traTienNguoiLam,
    yeuCauChinhSua,
    freelancerRut,
    moTranhChap,
    huyEscrow,
    kyXacNhan,
    giaiQuyetTranhChap,
    tuChoiHopDong,
    huyTruocKy,
    claimTimeoutWin,
    claimDisputeRefund,
    adminVote,
    startVoting,
    getWithdrawalPenalty,
    getAptosExplorerUrl,
  ]);

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      dappConfig={{ 
        network: Network.TESTNET,
        aptosConnectDappId: undefined,
      }}
      optInWallets={["Petra"]}
      onError={() => {}}
    >
      <WalletContextProvider>{children}</WalletContextProvider>
    </AptosWalletAdapterProvider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
