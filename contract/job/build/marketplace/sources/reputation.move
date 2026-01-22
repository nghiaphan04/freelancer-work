module job_work_board::reputation {
    use aptos_framework::account;
    use aptos_framework::event;
    use aptos_std::table::{Self, Table};

    friend job_work_board::escrow;

    const UT_HOAN_THANH_JOB: u64 = 10;
    const UT_DUYET_DUNG_HAN: u64 = 5;
    const UT_THANG_TRANH_CHAP: u64 = 5;
    
    const KUT_THUA_TRANH_CHAP: u64 = 20;
    const KUT_QUA_HAN_NOP: u64 = 10;
    const KUT_QUA_HAN_DUYET: u64 = 10;
    
    const UT_TRU_THUA_TRANH_CHAP: u64 = 10;
    const UT_TRU_QUA_HAN: u64 = 5;

    const E_KHONG_CO_QUYEN: u64 = 1;

    struct UserReputation has store, copy, drop {
        trust_score: u64,
        untrust_score: u64,
        jobs_completed: u64,
        jobs_as_employer: u64,
        disputes_won: u64,
        disputes_lost: u64,
    }

    struct ReputationStore has key {
        reputations: Table<address, UserReputation>,
        authorized_contracts: Table<address, bool>,
        
        reputation_updated_events: event::EventHandle<ReputationUpdatedEvent>,
    }

    struct ReputationUpdatedEvent has drop, store {
        user: address,
        action: vector<u8>,
        trust_change: u64,
        untrust_change: u64,
        new_trust_score: u64,
        new_untrust_score: u64,
        updated_at: u64,
    }

    fun init_module(admin: &signer) {
        let store = ReputationStore {
            reputations: table::new(),
            authorized_contracts: table::new(),
            reputation_updated_events: account::new_event_handle<ReputationUpdatedEvent>(admin),
        };
        table::add(&mut store.authorized_contracts, @job_work_board, true);
        move_to(admin, store);
    }

    fun ensure_reputation_exists(store: &mut ReputationStore, user: address) {
        if (!table::contains(&store.reputations, user)) {
            table::add(&mut store.reputations, user, UserReputation {
                trust_score: 0,
                untrust_score: 0,
                jobs_completed: 0,
                jobs_as_employer: 0,
                disputes_won: 0,
                disputes_lost: 0,
            });
        };
    }

    public(friend) fun on_job_completed(
        _caller: &signer,
        freelancer: address,
        employer: address,
        on_time: bool,
    ) acquires ReputationStore {
        let store = borrow_global_mut<ReputationStore>(@job_work_board);
        let now = aptos_framework::timestamp::now_seconds();
        
        ensure_reputation_exists(store, freelancer);
        {
            let freelancer_rep = table::borrow_mut(&mut store.reputations, freelancer);
            freelancer_rep.trust_score = freelancer_rep.trust_score + UT_HOAN_THANH_JOB;
            freelancer_rep.jobs_completed = freelancer_rep.jobs_completed + 1;
        };
        let freelancer_rep_copy = *table::borrow(&store.reputations, freelancer);
        
        event::emit_event(
            &mut store.reputation_updated_events,
            ReputationUpdatedEvent {
                user: freelancer,
                action: b"JOB_COMPLETED",
                trust_change: UT_HOAN_THANH_JOB,
                untrust_change: 0,
                new_trust_score: freelancer_rep_copy.trust_score,
                new_untrust_score: freelancer_rep_copy.untrust_score,
                updated_at: now,
            }
        );

        ensure_reputation_exists(store, employer);
        {
            let employer_rep = table::borrow_mut(&mut store.reputations, employer);
            if (on_time) {
                employer_rep.trust_score = employer_rep.trust_score + UT_DUYET_DUNG_HAN;
            };
            employer_rep.jobs_as_employer = employer_rep.jobs_as_employer + 1;
        };
        
        if (on_time) {
            let employer_rep_copy = *table::borrow(&store.reputations, employer);
            event::emit_event(
                &mut store.reputation_updated_events,
                ReputationUpdatedEvent {
                    user: employer,
                    action: b"APPROVED_ON_TIME",
                    trust_change: UT_DUYET_DUNG_HAN,
                    untrust_change: 0,
                    new_trust_score: employer_rep_copy.trust_score,
                    new_untrust_score: employer_rep_copy.untrust_score,
                    updated_at: now,
                }
            );
        };
    }

    public(friend) fun on_dispute_resolved_internal(
        winner: address,
        loser: address,
    ) acquires ReputationStore {
        let store = borrow_global_mut<ReputationStore>(@job_work_board);
        let now = aptos_framework::timestamp::now_seconds();

        ensure_reputation_exists(store, winner);
        {
            let winner_rep = table::borrow_mut(&mut store.reputations, winner);
            winner_rep.trust_score = winner_rep.trust_score + UT_THANG_TRANH_CHAP;
            winner_rep.disputes_won = winner_rep.disputes_won + 1;
        };
        let winner_rep_copy = *table::borrow(&store.reputations, winner);
        
        event::emit_event(
            &mut store.reputation_updated_events,
            ReputationUpdatedEvent {
                user: winner,
                action: b"DISPUTE_WON",
                trust_change: UT_THANG_TRANH_CHAP,
                untrust_change: 0,
                new_trust_score: winner_rep_copy.trust_score,
                new_untrust_score: winner_rep_copy.untrust_score,
                updated_at: now,
            }
        );

        ensure_reputation_exists(store, loser);
        {
            let loser_rep = table::borrow_mut(&mut store.reputations, loser);
            loser_rep.untrust_score = loser_rep.untrust_score + KUT_THUA_TRANH_CHAP;
            if (loser_rep.trust_score >= UT_TRU_THUA_TRANH_CHAP) {
                loser_rep.trust_score = loser_rep.trust_score - UT_TRU_THUA_TRANH_CHAP;
            } else {
                loser_rep.trust_score = 0;
            };
            loser_rep.disputes_lost = loser_rep.disputes_lost + 1;
        };
        let loser_rep_copy = *table::borrow(&store.reputations, loser);
        
        event::emit_event(
            &mut store.reputation_updated_events,
            ReputationUpdatedEvent {
                user: loser,
                action: b"DISPUTE_LOST",
                trust_change: UT_TRU_THUA_TRANH_CHAP,
                untrust_change: KUT_THUA_TRANH_CHAP,
                new_trust_score: loser_rep_copy.trust_score,
                new_untrust_score: loser_rep_copy.untrust_score,
                updated_at: now,
            }
        );
    }

    public entry fun on_dispute_resolved(
        _caller: &signer,
        winner: address,
        loser: address,
    ) acquires ReputationStore {
        on_dispute_resolved_internal(winner, loser);
    }

    public(friend) fun on_freelancer_timeout_internal(
        freelancer: address,
    ) acquires ReputationStore {
        let store = borrow_global_mut<ReputationStore>(@job_work_board);
        let now = aptos_framework::timestamp::now_seconds();

        ensure_reputation_exists(store, freelancer);
        {
            let rep = table::borrow_mut(&mut store.reputations, freelancer);
            rep.untrust_score = rep.untrust_score + KUT_QUA_HAN_NOP;
            if (rep.trust_score >= UT_TRU_QUA_HAN) {
                rep.trust_score = rep.trust_score - UT_TRU_QUA_HAN;
            } else {
                rep.trust_score = 0;
            };
        };
        let rep_copy = *table::borrow(&store.reputations, freelancer);
        
        event::emit_event(
            &mut store.reputation_updated_events,
            ReputationUpdatedEvent {
                user: freelancer,
                action: b"SUBMISSION_TIMEOUT",
                trust_change: UT_TRU_QUA_HAN,
                untrust_change: KUT_QUA_HAN_NOP,
                new_trust_score: rep_copy.trust_score,
                new_untrust_score: rep_copy.untrust_score,
                updated_at: now,
            }
        );
    }

    public entry fun on_freelancer_timeout(
        _caller: &signer,
        freelancer: address,
    ) acquires ReputationStore {
        on_freelancer_timeout_internal(freelancer);
    }

    public(friend) fun on_employer_timeout_internal(
        employer: address,
    ) acquires ReputationStore {
        let store = borrow_global_mut<ReputationStore>(@job_work_board);
        let now = aptos_framework::timestamp::now_seconds();

        ensure_reputation_exists(store, employer);
        {
            let rep = table::borrow_mut(&mut store.reputations, employer);
            rep.untrust_score = rep.untrust_score + KUT_QUA_HAN_DUYET;
            if (rep.trust_score >= UT_TRU_QUA_HAN) {
                rep.trust_score = rep.trust_score - UT_TRU_QUA_HAN;
            } else {
                rep.trust_score = 0;
            };
        };
        let rep_copy = *table::borrow(&store.reputations, employer);
        
        event::emit_event(
            &mut store.reputation_updated_events,
            ReputationUpdatedEvent {
                user: employer,
                action: b"REVIEW_TIMEOUT",
                trust_change: UT_TRU_QUA_HAN,
                untrust_change: KUT_QUA_HAN_DUYET,
                new_trust_score: rep_copy.trust_score,
                new_untrust_score: rep_copy.untrust_score,
                updated_at: now,
            }
        );
    }

    public entry fun on_employer_timeout(
        _caller: &signer,
        employer: address,
    ) acquires ReputationStore {
        on_employer_timeout_internal(employer);
    }

    #[view]
    public fun get_reputation(user: address): (u64, u64, u64, u64, u64, u64) acquires ReputationStore {
        let store = borrow_global<ReputationStore>(@job_work_board);
        if (table::contains(&store.reputations, user)) {
            let rep = table::borrow(&store.reputations, user);
            (rep.trust_score, rep.untrust_score, rep.jobs_completed, rep.jobs_as_employer, rep.disputes_won, rep.disputes_lost)
        } else {
            (0, 0, 0, 0, 0, 0)
        }
    }

    #[view]
    public fun get_trust_score(user: address): u64 acquires ReputationStore {
        let store = borrow_global<ReputationStore>(@job_work_board);
        if (table::contains(&store.reputations, user)) {
            table::borrow(&store.reputations, user).trust_score
        } else {
            0
        }
    }

    #[view]
    public fun get_untrust_score(user: address): u64 acquires ReputationStore {
        let store = borrow_global<ReputationStore>(@job_work_board);
        if (table::contains(&store.reputations, user)) {
            table::borrow(&store.reputations, user).untrust_score
        } else {
            0
        }
    }
}
