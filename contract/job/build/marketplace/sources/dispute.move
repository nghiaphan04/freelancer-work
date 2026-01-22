module job_work_board::dispute {
    use std::option::{Self, Option};
    use std::string::String;
    use std::signer;
    use aptos_framework::timestamp;
    use aptos_framework::account;
    use aptos_framework::event;
    use aptos_std::table::{Self, Table};
    use job_work_board::escrow;

    // Status constants
    const TRANG_THAI_CHO_EVIDENCE: u8 = 0;      // Waiting for both parties to submit evidence
    const TRANG_THAI_VOTING: u8 = 1;             // Admin voting in progress
    const TRANG_THAI_RESOLVED: u8 = 2;           // Dispute resolved, winner determined
    const TRANG_THAI_CLAIMED: u8 = 3;            // Winner has claimed refund
    
    // Error codes
    const E_KHONG_CO_QUYEN: u64 = 1;
    const E_TRANG_THAI_KHONG_HOP_LE: u64 = 2;
    const E_KHONG_TIM_THAY: u64 = 3;
    const E_DA_CO_WINNER: u64 = 6;
    const E_CHUA_RESOLVE: u64 = 7;
    const E_KHONG_PHAI_WINNER: u64 = 8;
    const E_DA_CLAIMED: u64 = 9;

    struct TranhChap has store {
        id: u64,
        escrow_id: u64, 
        nguoi_thue: address,        // Employer address
        nguoi_lam: address,         // Freelancer address
        
        // Evidence
        bang_chung_nguoi_thue: Option<String>,
        bang_chung_nguoi_lam: Option<String>, 
        
        // Vote counts (simpler than storing each round winner)
        employer_votes: u8,         // Number of votes for employer
        freelancer_votes: u8,       // Number of votes for freelancer
        total_votes: u8,            // Total votes cast (max 3)
        
        // Result
        final_winner: Option<address>,
        
        trang_thai: u8,
        tao_luc: u64,
        hoan_thanh_luc: Option<u64>,
    }

    struct DisputeStore has key {
        disputes: Table<u64, TranhChap>,
        next_id: u64,
        
        dispute_created_events: event::EventHandle<DisputeCreatedEvent>,
        evidence_submitted_events: event::EventHandle<EvidenceSubmittedEvent>,
        vote_cast_events: event::EventHandle<VoteCastEvent>,
        dispute_resolved_events: event::EventHandle<DisputeResolvedEvent>,
        refund_claimed_events: event::EventHandle<RefundClaimedEvent>,
    }

    // Events
    struct DisputeCreatedEvent has drop, store {
        dispute_id: u64,
        escrow_id: u64,
        nguoi_thue: address,
        nguoi_lam: address,
        created_at: u64,
    }

    struct EvidenceSubmittedEvent has drop, store {
        dispute_id: u64,
        submitted_by: address,
        evidence_cid: String,
        submitted_at: u64,
    }

    struct VoteCastEvent has drop, store {
        dispute_id: u64,
        admin: address,
        vote_for_employer: bool,    // true = vote for employer, false = vote for freelancer
        employer_votes: u8,
        freelancer_votes: u8,
        total_votes: u8,
        voted_at: u64,
    }

    struct DisputeResolvedEvent has drop, store {
        dispute_id: u64,
        escrow_id: u64,
        final_winner: address,
        employer_votes: u8,
        freelancer_votes: u8,
        resolve_type: u8,           // 0 = by voting, 1 = by timeout
        resolved_at: u64,
    }

    struct RefundClaimedEvent has drop, store {
        dispute_id: u64,
        escrow_id: u64,
        winner: address,
        claimed_at: u64,
    }

    fun init_module(admin: &signer) {
        move_to(admin, DisputeStore {
            disputes: table::new(),
            next_id: 1,
            dispute_created_events: account::new_event_handle<DisputeCreatedEvent>(admin),
            evidence_submitted_events: account::new_event_handle<EvidenceSubmittedEvent>(admin),
            vote_cast_events: account::new_event_handle<VoteCastEvent>(admin),
            dispute_resolved_events: account::new_event_handle<DisputeResolvedEvent>(admin),
            refund_claimed_events: account::new_event_handle<RefundClaimedEvent>(admin),
        });
    }

    /// Employer creates a dispute (employer signs this transaction)
    public entry fun tao_tranh_chap(
        caller: &signer, 
        escrow_id: u64,
    ) acquires DisputeStore {
        let caller_addr = signer::address_of(caller);
        let (nguoi_thue, nguoi_lam_opt, _, _, _) = escrow::get_escrow_info(escrow_id);
        
        // Only employer can create dispute
        assert!(caller_addr == nguoi_thue, E_KHONG_CO_QUYEN);
        
        let nguoi_lam = *option::borrow(&nguoi_lam_opt);
        
        let store = borrow_global_mut<DisputeStore>(@job_work_board);
        let dispute_id = store.next_id;
        store.next_id = store.next_id + 1;
        
        let now = timestamp::now_seconds();
        
        table::add(&mut store.disputes, dispute_id, TranhChap {
            id: dispute_id,
            escrow_id,
            nguoi_thue,
            nguoi_lam,
            bang_chung_nguoi_thue: option::none(),
            bang_chung_nguoi_lam: option::none(),
            employer_votes: 0,
            freelancer_votes: 0,
            total_votes: 0,
            final_winner: option::none(),
            trang_thai: TRANG_THAI_CHO_EVIDENCE,
            tao_luc: now,
            hoan_thanh_luc: option::none(),
        });
        
        escrow::set_dispute_id(escrow_id, dispute_id);
        escrow::set_trang_thai_tranh_chap(escrow_id);
        
        event::emit_event(
            &mut store.dispute_created_events,
            DisputeCreatedEvent {
                dispute_id,
                escrow_id,
                nguoi_thue,
                nguoi_lam,
                created_at: now,
            }
        );
    }

    /// Submit evidence (both parties can call)
    public entry fun nop_bang_chung(
        caller: &signer,
        dispute_id: u64,
        evidence_cid: String,
    ) acquires DisputeStore {
        let caller_addr = signer::address_of(caller);
        let store = borrow_global_mut<DisputeStore>(@job_work_board);
        let dispute = table::borrow_mut(&mut store.disputes, dispute_id);
        
        assert!(dispute.trang_thai == TRANG_THAI_CHO_EVIDENCE, E_TRANG_THAI_KHONG_HOP_LE);
        
        let now = timestamp::now_seconds();
        
        if (caller_addr == dispute.nguoi_thue) {
            dispute.bang_chung_nguoi_thue = option::some(evidence_cid);
        } else if (caller_addr == dispute.nguoi_lam) {
            dispute.bang_chung_nguoi_lam = option::some(evidence_cid);
        } else {
            abort E_KHONG_CO_QUYEN
        };
        
        event::emit_event(
            &mut store.evidence_submitted_events,
            EvidenceSubmittedEvent {
                dispute_id,
                submitted_by: caller_addr,
                evidence_cid,
                submitted_at: now,
            }
        );
    }

    /// Start voting phase (called by backend after evidence deadline)
    public entry fun start_voting(
        _caller: &signer,
        dispute_id: u64,
    ) acquires DisputeStore {
        let store = borrow_global_mut<DisputeStore>(@job_work_board);
        let dispute = table::borrow_mut(&mut store.disputes, dispute_id);
        
        assert!(dispute.trang_thai == TRANG_THAI_CHO_EVIDENCE, E_TRANG_THAI_KHONG_HOP_LE);
        
        dispute.trang_thai = TRANG_THAI_VOTING;
    }

    /// Admin casts vote (admin signs this transaction)
    /// On 3rd vote, automatically resolves dispute and unlocks escrow
    public entry fun admin_vote(
        admin: &signer,
        dispute_id: u64,
        vote_for_employer: bool,    // true = vote for employer, false = vote for freelancer
    ) acquires DisputeStore {
        let admin_addr = signer::address_of(admin);
        let store = borrow_global_mut<DisputeStore>(@job_work_board);
        let dispute = table::borrow_mut(&mut store.disputes, dispute_id);
        
        assert!(dispute.trang_thai == TRANG_THAI_VOTING, E_TRANG_THAI_KHONG_HOP_LE);
        assert!(option::is_none(&dispute.final_winner), E_DA_CO_WINNER);
        assert!(dispute.total_votes < 3, E_DA_CO_WINNER);
        
        let now = timestamp::now_seconds();
        
        // Record vote
        if (vote_for_employer) {
            dispute.employer_votes = dispute.employer_votes + 1;
        } else {
            dispute.freelancer_votes = dispute.freelancer_votes + 1;
        };
        dispute.total_votes = dispute.total_votes + 1;
        
        event::emit_event(
            &mut store.vote_cast_events,
            VoteCastEvent {
                dispute_id,
                admin: admin_addr,
                vote_for_employer,
                employer_votes: dispute.employer_votes,
                freelancer_votes: dispute.freelancer_votes,
                total_votes: dispute.total_votes,
                voted_at: now,
            }
        );
        
        // Check if we have a winner (2/3 majority)
        let winner_opt: Option<address> = option::none();
        
        if (dispute.employer_votes >= 2) {
            winner_opt = option::some(dispute.nguoi_thue);
        } else if (dispute.freelancer_votes >= 2) {
            winner_opt = option::some(dispute.nguoi_lam);
        };
        
        // If we have a winner, resolve the dispute AND transfer funds immediately
        if (option::is_some(&winner_opt)) {
            let winner = *option::borrow(&winner_opt);
            let escrow_id = dispute.escrow_id;
            
            dispute.final_winner = option::some(winner);
            dispute.trang_thai = TRANG_THAI_CLAIMED; // Directly mark as claimed
            dispute.hoan_thanh_luc = option::some(now);
            
            // Unlock escrow for winner AND transfer funds immediately
            escrow::unlock_for_winner(escrow_id, winner);
            escrow::giai_quyet_tranh_chap(escrow_id, winner);
            
            event::emit_event(
                &mut store.dispute_resolved_events,
                DisputeResolvedEvent {
                    dispute_id,
                    escrow_id,
                    final_winner: winner,
                    employer_votes: dispute.employer_votes,
                    freelancer_votes: dispute.freelancer_votes,
                    resolve_type: 0, // by voting
                    resolved_at: now,
                }
            );
            
            // Emit refund claimed event since we auto-paid
            event::emit_event(
                &mut store.refund_claimed_events,
                RefundClaimedEvent {
                    dispute_id,
                    escrow_id,
                    winner,
                    claimed_at: now,
                }
            );
        };
    }

    /// Legacy function - kept for backward compatibility
    public entry fun admin_resolve_timeout(
        admin: &signer,
        dispute_id: u64,
    ) acquires DisputeStore {
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == @job_work_board, E_KHONG_CO_QUYEN);
        
        let store = borrow_global_mut<DisputeStore>(@job_work_board);
        let dispute = table::borrow_mut(&mut store.disputes, dispute_id);
        
        assert!(dispute.trang_thai == TRANG_THAI_CHO_EVIDENCE, E_TRANG_THAI_KHONG_HOP_LE);
        assert!(option::is_none(&dispute.final_winner), E_DA_CO_WINNER);
        assert!(option::is_none(&dispute.bang_chung_nguoi_lam), E_TRANG_THAI_KHONG_HOP_LE);
        
        let now = timestamp::now_seconds();
        let winner = dispute.nguoi_thue;
        let escrow_id = dispute.escrow_id;
        
        dispute.final_winner = option::some(winner);
        dispute.trang_thai = TRANG_THAI_RESOLVED;
        dispute.hoan_thanh_luc = option::some(now);
        
        escrow::unlock_for_winner(escrow_id, winner);
        
        event::emit_event(
            &mut store.dispute_resolved_events,
            DisputeResolvedEvent {
                dispute_id,
                escrow_id,
                final_winner: winner,
                employer_votes: 0,
                freelancer_votes: 0,
                resolve_type: 1,
                resolved_at: now,
            }
        );
    }

    /// New function - resolve timeout AND claim in one transaction (full automation)
    public entry fun admin_resolve_timeout_and_claim(
        admin: &signer,
        dispute_id: u64,
    ) acquires DisputeStore {
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == @job_work_board, E_KHONG_CO_QUYEN);
        
        let store = borrow_global_mut<DisputeStore>(@job_work_board);
        let dispute = table::borrow_mut(&mut store.disputes, dispute_id);
        
        assert!(dispute.trang_thai == TRANG_THAI_CHO_EVIDENCE, E_TRANG_THAI_KHONG_HOP_LE);
        assert!(option::is_none(&dispute.final_winner), E_DA_CO_WINNER);
        assert!(option::is_none(&dispute.bang_chung_nguoi_lam), E_TRANG_THAI_KHONG_HOP_LE);
        
        let now = timestamp::now_seconds();
        let winner = dispute.nguoi_thue;
        let escrow_id = dispute.escrow_id;
        
        dispute.final_winner = option::some(winner);
        dispute.trang_thai = TRANG_THAI_CLAIMED;
        dispute.hoan_thanh_luc = option::some(now);
        
        escrow::unlock_for_winner(escrow_id, winner);
        escrow::giai_quyet_tranh_chap(escrow_id, winner);
        
        event::emit_event(
            &mut store.dispute_resolved_events,
            DisputeResolvedEvent {
                dispute_id,
                escrow_id,
                final_winner: winner,
                employer_votes: 0,
                freelancer_votes: 0,
                resolve_type: 1,
                resolved_at: now,
            }
        );
        
        event::emit_event(
            &mut store.refund_claimed_events,
            RefundClaimedEvent {
                dispute_id,
                escrow_id,
                winner,
                claimed_at: now,
            }
        );
    }

    /// Winner claims auto-win due to other party timeout
    /// Called by the winning party (employer if freelancer timeout, vice versa)
    public entry fun claim_timeout_win(
        caller: &signer,
        dispute_id: u64,
    ) acquires DisputeStore {
        let caller_addr = signer::address_of(caller);
        let store = borrow_global_mut<DisputeStore>(@job_work_board);
        let dispute = table::borrow_mut(&mut store.disputes, dispute_id);
        
        // Can only claim during evidence phase
        assert!(dispute.trang_thai == TRANG_THAI_CHO_EVIDENCE, E_TRANG_THAI_KHONG_HOP_LE);
        assert!(option::is_none(&dispute.final_winner), E_DA_CO_WINNER);
        
        // Determine winner based on who submitted evidence
        // If caller submitted evidence and opponent didn't, caller wins
        let is_employer = caller_addr == dispute.nguoi_thue;
        let is_freelancer = caller_addr == dispute.nguoi_lam;
        
        assert!(is_employer || is_freelancer, E_KHONG_CO_QUYEN);
        
        let caller_has_evidence = if (is_employer) {
            option::is_some(&dispute.bang_chung_nguoi_thue)
        } else {
            option::is_some(&dispute.bang_chung_nguoi_lam)
        };
        
        let opponent_has_evidence = if (is_employer) {
            option::is_some(&dispute.bang_chung_nguoi_lam)
        } else {
            option::is_some(&dispute.bang_chung_nguoi_thue)
        };
        
        // Caller must have evidence, opponent must NOT have evidence
        assert!(caller_has_evidence, E_KHONG_CO_QUYEN);
        assert!(!opponent_has_evidence, E_TRANG_THAI_KHONG_HOP_LE);
        
        let now = timestamp::now_seconds();
        let escrow_id = dispute.escrow_id;
        
        dispute.final_winner = option::some(caller_addr);
        dispute.trang_thai = TRANG_THAI_RESOLVED;
        dispute.hoan_thanh_luc = option::some(now);
        
        // Unlock escrow for winner
        escrow::unlock_for_winner(escrow_id, caller_addr);
        
        event::emit_event(
            &mut store.dispute_resolved_events,
            DisputeResolvedEvent {
                dispute_id,
                escrow_id,
                final_winner: caller_addr,
                employer_votes: 0,
                freelancer_votes: 0,
                resolve_type: 1, // by timeout
                resolved_at: now,
            }
        );
    }

    /// Winner claims refund after dispute is resolved
    public entry fun nhan_hoan_tien(
        caller: &signer,
        dispute_id: u64,
    ) acquires DisputeStore {
        let caller_addr = signer::address_of(caller);
        let store = borrow_global_mut<DisputeStore>(@job_work_board);
        let dispute = table::borrow_mut(&mut store.disputes, dispute_id);
        
        assert!(dispute.trang_thai == TRANG_THAI_RESOLVED, E_CHUA_RESOLVE);
        assert!(option::is_some(&dispute.final_winner), E_CHUA_RESOLVE);
        
        let winner = *option::borrow(&dispute.final_winner);
        assert!(caller_addr == winner, E_KHONG_PHAI_WINNER);
        
        let now = timestamp::now_seconds();
        let escrow_id = dispute.escrow_id;
        
        // Transfer funds to winner
        escrow::giai_quyet_tranh_chap(escrow_id, winner);
        
        dispute.trang_thai = TRANG_THAI_CLAIMED;
        
        event::emit_event(
            &mut store.refund_claimed_events,
            RefundClaimedEvent {
                dispute_id,
                escrow_id,
                winner,
                claimed_at: now,
            }
        );
    }

    // ============ VIEW FUNCTIONS ============

    #[view]
    public fun get_dispute_info(dispute_id: u64): (u64, address, address, u8) acquires DisputeStore {
        let store = borrow_global<DisputeStore>(@job_work_board);
        let dispute = table::borrow(&store.disputes, dispute_id);
        (dispute.escrow_id, dispute.nguoi_thue, dispute.nguoi_lam, dispute.trang_thai)
    }

    #[view]
    public fun get_vote_counts(dispute_id: u64): (u8, u8, u8) acquires DisputeStore {
        let store = borrow_global<DisputeStore>(@job_work_board);
        let dispute = table::borrow(&store.disputes, dispute_id);
        (dispute.employer_votes, dispute.freelancer_votes, dispute.total_votes)
    }

    #[view]
    public fun get_evidence(dispute_id: u64): (Option<String>, Option<String>) acquires DisputeStore {
        let store = borrow_global<DisputeStore>(@job_work_board);
        let dispute = table::borrow(&store.disputes, dispute_id);
        (dispute.bang_chung_nguoi_thue, dispute.bang_chung_nguoi_lam)
    }

    #[view]
    public fun get_final_winner(dispute_id: u64): Option<address> acquires DisputeStore {
        let store = borrow_global<DisputeStore>(@job_work_board);
        let dispute = table::borrow(&store.disputes, dispute_id);
        dispute.final_winner
    }

    #[view]
    public fun is_resolved(dispute_id: u64): bool acquires DisputeStore {
        let store = borrow_global<DisputeStore>(@job_work_board);
        let dispute = table::borrow(&store.disputes, dispute_id);
        dispute.trang_thai >= TRANG_THAI_RESOLVED
    }

    #[view]
    public fun is_claimed(dispute_id: u64): bool acquires DisputeStore {
        let store = borrow_global<DisputeStore>(@job_work_board);
        let dispute = table::borrow(&store.disputes, dispute_id);
        dispute.trang_thai == TRANG_THAI_CLAIMED
    }

    #[view]
    public fun can_claim_timeout(dispute_id: u64, caller: address): bool acquires DisputeStore {
        let store = borrow_global<DisputeStore>(@job_work_board);
        let dispute = table::borrow(&store.disputes, dispute_id);
        
        if (dispute.trang_thai != TRANG_THAI_CHO_EVIDENCE) {
            return false
        };
        
        if (option::is_some(&dispute.final_winner)) {
            return false
        };
        
        let is_employer = caller == dispute.nguoi_thue;
        let is_freelancer = caller == dispute.nguoi_lam;
        
        if (!is_employer && !is_freelancer) {
            return false
        };
        
        let caller_has_evidence = if (is_employer) {
            option::is_some(&dispute.bang_chung_nguoi_thue)
        } else {
            option::is_some(&dispute.bang_chung_nguoi_lam)
        };
        
        let opponent_has_evidence = if (is_employer) {
            option::is_some(&dispute.bang_chung_nguoi_lam)
        } else {
            option::is_some(&dispute.bang_chung_nguoi_thue)
        };
        
        caller_has_evidence && !opponent_has_evidence
    }
}
