package com.workhub.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.bouncycastle.crypto.params.Ed25519PrivateKeyParameters;
import org.bouncycastle.crypto.signers.Ed25519Signer;
import org.bouncycastle.util.encoders.Hex;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import jakarta.annotation.PostConstruct;
import java.security.MessageDigest;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class BlockchainService {

    @Value("${aptos.node.url:https://fullnode.testnet.aptoslabs.com}")
    private String nodeUrl;

    @Value("${aptos.api.key:}")
    private String apiKey;

    @Value("${aptos.contract.address}")
    private String contractAddress;

    @Value("${aptos.admin.private-key:}")
    private String adminPrivateKey;

    private RestTemplate restTemplate;
    private ObjectMapper objectMapper;
    private Ed25519PrivateKeyParameters privateKeyParams;
    private String publicKeyHex;
    private String adminAddress;
    private boolean initialized = false;

    @PostConstruct
    public void init() {
        if (adminPrivateKey == null || adminPrivateKey.isEmpty()) {
            log.warn("APTOS_ADMIN_PRIVATE_KEY not configured");
            return;
        }

        try {
            restTemplate = new RestTemplate();
            objectMapper = new ObjectMapper();

            String cleanKey = adminPrivateKey.startsWith("0x") ? adminPrivateKey.substring(2) : adminPrivateKey;
            byte[] privateKeyBytes = Hex.decode(cleanKey);
            privateKeyParams = new Ed25519PrivateKeyParameters(privateKeyBytes, 0);
            
            byte[] publicKeyBytes = privateKeyParams.generatePublicKey().getEncoded();
            publicKeyHex = "0x" + Hex.toHexString(publicKeyBytes);
            
            adminAddress = deriveAddress(publicKeyBytes);
            
            initialized = true;
            log.info("BlockchainService initialized - Admin: {}, NodeURL: {}, HasApiKey: {}", 
                    adminAddress, nodeUrl, (apiKey != null && !apiKey.isEmpty()));
        } catch (Exception e) {
            log.error("Failed to initialize BlockchainService: {}", e.getMessage());
        }
    }

    private String deriveAddress(byte[] publicKeyBytes) throws Exception {
        byte[] authKeyInput = new byte[publicKeyBytes.length + 1];
        System.arraycopy(publicKeyBytes, 0, authKeyInput, 0, publicKeyBytes.length);
        authKeyInput[publicKeyBytes.length] = 0x00;
        
        MessageDigest sha3 = MessageDigest.getInstance("SHA3-256");
        byte[] hash = sha3.digest(authKeyInput);
        return "0x" + Hex.toHexString(hash);
    }

    public boolean isInitialized() {
        return initialized;
    }

    public String getContractAddress() {
        return contractAddress;
    }

    /**
     * Sign: Remove freelancer who didn't sign contract in time
     * Calls: escrow::xoa_nguoi_lam_qua_han_ky(escrow_id)
     */
    public String signRemoveFreelancerSigningTimeout(Long escrowId) {
        return submitTransaction(
            contractAddress + "::escrow::xoa_nguoi_lam_qua_han_ky",
            new String[]{escrowId.toString()}
        );
    }

    /**
     * Sign: Remove freelancer who didn't submit work in time
     * Calls: escrow::xoa_nguoi_lam(escrow_id)
     */
    public String signRemoveFreelancerSubmissionTimeout(Long escrowId) {
        return submitTransaction(
            contractAddress + "::escrow::xoa_nguoi_lam",
            new String[]{escrowId.toString()}
        );
    }

    /**
     * Sign: Auto-approve and pay freelancer when employer didn't review in time
     * Calls: escrow::tra_tien_nguoi_lam(escrow_id)
     */
    public String signAutoApproveReviewTimeout(Long escrowId) {
        return submitTransaction(
            contractAddress + "::escrow::tra_tien_nguoi_lam",
            new String[]{escrowId.toString()}
        );
    }

    /**
     * Sign: Resolve dispute timeout and claim for employer
     * Calls: dispute::admin_resolve_timeout_and_claim(dispute_id)
     */
    public String signResolveDisputeTimeout(Long blockchainDisputeId) {
        return submitTransaction(
            contractAddress + "::dispute::admin_resolve_timeout_and_claim",
            new String[]{blockchainDisputeId.toString()}
        );
    }

    /**
     * Sign: Refund poster when application deadline expired and no freelancer assigned
     * Calls: escrow::admin_refund_expired(escrow_id)
     */
    public String signRefundExpiredJob(Long escrowId) {
        return submitTransaction(
            contractAddress + "::escrow::admin_refund_expired",
            new String[]{escrowId.toString()}
        );
    }

    /**
     * Sign: Cancel escrow immediately (for DB failure recovery)
     * Calls: escrow::admin_cancel_escrow(escrow_id)
     */
    public String signCancelEscrow(Long escrowId) {
        return submitTransaction(
            contractAddress + "::escrow::admin_cancel_escrow",
            new String[]{escrowId.toString()}
        );
    }

    private String submitTransaction(String function, String[] arguments) {
        if (!initialized) {
            throw new IllegalStateException("BlockchainService not initialized");
        }

        try {
            long seqNum = getSequenceNumber();
            long expiration = System.currentTimeMillis() / 1000 + 600;
            
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "entry_function_payload");
            payload.put("function", function);
            payload.put("type_arguments", new String[]{});
            payload.put("arguments", arguments);

            Map<String, Object> txRequest = new HashMap<>();
            txRequest.put("sender", adminAddress);
            txRequest.put("sequence_number", String.valueOf(seqNum));
            txRequest.put("max_gas_amount", "200000");
            txRequest.put("gas_unit_price", "100");
            txRequest.put("expiration_timestamp_secs", String.valueOf(expiration));
            txRequest.put("payload", payload);

            String signingMessage = getSigningMessage(txRequest);
            String signature = signMessage(signingMessage);

            Map<String, Object> signatureObj = new HashMap<>();
            signatureObj.put("type", "ed25519_signature");
            signatureObj.put("public_key", publicKeyHex);
            signatureObj.put("signature", signature);
            txRequest.put("signature", signatureObj);

            HttpEntity<String> request = new HttpEntity<>(objectMapper.writeValueAsString(txRequest), createHeaders());

            ResponseEntity<String> response = restTemplate.postForEntity(
                    getApiUrl() + "/transactions", request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                JsonNode result = objectMapper.readTree(response.getBody());
                String txHash = result.get("hash").asText();
                
                waitForTransaction(txHash);
                log.info("TX Success: {} - Hash: {}", function, txHash);
                return txHash;
            } else {
                throw new RuntimeException("Submit failed: " + response.getBody());
            }
        } catch (Exception e) {
            log.error("TX Failed: {} - Error: {}", function, e.getMessage());
            throw new RuntimeException("Blockchain sign failed: " + e.getMessage(), e);
        }
    }

    private String getApiUrl() {
        String url = nodeUrl;
        // Remove any query parameters (in case API key was mistakenly added to URL)
        if (url.contains("?")) {
            url = url.substring(0, url.indexOf("?"));
        }
        return url.endsWith("/v1") ? url : url + "/v1";
    }

    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        // Geomi API requires Origin header
        headers.set("Origin", "http://localhost:8080");
        if (apiKey != null && !apiKey.isEmpty()) {
            headers.set("Authorization", "Bearer " + apiKey);
        }
        return headers;
    }

    private long getSequenceNumber() throws Exception {
        HttpEntity<String> entity = new HttpEntity<>(createHeaders());
        ResponseEntity<String> response = restTemplate.exchange(
                getApiUrl() + "/accounts/" + adminAddress,
                HttpMethod.GET,
                entity,
                String.class);
        JsonNode account = objectMapper.readTree(response.getBody());
        
        if (account == null) {
            throw new RuntimeException("Failed to get account info: null response");
        }
        
        JsonNode seqNode = account.get("sequence_number");
        if (seqNode == null) {
            // Log full response for debugging
            log.error("Unexpected account response: {}", response.getBody());
            throw new RuntimeException("Account response missing sequence_number. Response: " + response.getBody());
        }
        
        return seqNode.asLong();
    }

    private String getSigningMessage(Map<String, Object> txRequest) throws Exception {
        String jsonBody = objectMapper.writeValueAsString(txRequest);
        HttpEntity<String> request = new HttpEntity<>(jsonBody, createHeaders());
        
        try {
            ResponseEntity<String> response = restTemplate.postForEntity(
                    getApiUrl() + "/transactions/encode_submission", request, String.class);
            
            String body = response.getBody();
            if (body.startsWith("\"") && body.endsWith("\"")) {
                return body.substring(1, body.length() - 1);
            }
            if (body.startsWith("{")) {
                JsonNode result = objectMapper.readTree(body);
                if (result.has("encoded")) {
                    return result.get("encoded").asText();
                }
                if (result.has("message")) {
                    throw new RuntimeException(result.get("message").asText());
                }
            }
            return body;
        } catch (HttpClientErrorException e) {
            log.error("encode_submission error - Status: {}, Body: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("encode_submission failed: " + e.getResponseBodyAsString(), e);
        }
    }

    private String signMessage(String messageHex) {
        byte[] message = Hex.decode(messageHex.startsWith("0x") ? messageHex.substring(2) : messageHex);
        
        Ed25519Signer signer = new Ed25519Signer();
        signer.init(true, privateKeyParams);
        signer.update(message, 0, message.length);
        byte[] signature = signer.generateSignature();
        
        return "0x" + Hex.toHexString(signature);
    }

    private void waitForTransaction(String txHash) throws Exception {
        int maxAttempts = 30;
        HttpEntity<String> entity = new HttpEntity<>(createHeaders());
        for (int i = 0; i < maxAttempts; i++) {
            try {
                ResponseEntity<String> response = restTemplate.exchange(
                        getApiUrl() + "/transactions/by_hash/" + txHash,
                        HttpMethod.GET,
                        entity,
                        String.class);
                JsonNode tx = objectMapper.readTree(response.getBody());
                
                if (tx.has("success")) {
                    if (tx.get("success").asBoolean()) {
                        return;
                    } else {
                        throw new RuntimeException("TX failed: " + tx.get("vm_status").asText());
                    }
                }
            } catch (Exception e) {
                if (i == maxAttempts - 1) throw e;
            }
            Thread.sleep(1000);
        }
        throw new RuntimeException("Transaction timeout");
    }
}
