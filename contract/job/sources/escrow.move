module job_work_board::escrow {
    use std::option::{Self, Option};
    use std::string::String;
    use std::signer;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::timestamp;
    use aptos_framework::account;
    use aptos_framework::event;
    use aptos_std::table::{Self, Table};

    friend job_work_board::dispute;
    use job_work_board::reputation;
    const OCTA: u64 = 100_000_000;  // 1 APT = 10^8 octas
    const PLATFORM_FEE_PERCENT: u64 = 5;  // 5% - Employer fee
    const FREELANCER_FEE_PERCENT: u64 = 10;  // 10% - Freelancer fee
    const UPDATE_FEE_PERCENT: u64 = 2;  // 2% - Fee for each update
    const FREELANCER_WITHDRAWAL_PENALTY: u64 = 12;
    const EMPLOYER_WITHDRAWAL_PENALTY: u64 = 40;
    const TRANG_THAI_CHO: u8 = 0;         // Chờ gán người làm
    const TRANG_THAI_CHO_KY: u8 = 1;      // Chờ freelancer ký hợp đồng
    const TRANG_THAI_DANG_LAM: u8 = 2;    // Đang làm việc
    const TRANG_THAI_TRANH_CHAP: u8 = 3;  // Đang tranh chấp
    const TRANG_THAI_HOAN_THANH: u8 = 4;  // Hoàn thành
    const TRANG_THAI_DA_HUY: u8 = 5;      // Đã hủy
    const TRANG_THAI_CHO_CLAIM: u8 = 6;   // Chờ winner claim tiền
    const E_KHONG_CO_QUYEN: u64 = 1;
    const E_TRANG_THAI_KHONG_HOP_LE: u64 = 2;
    const E_SO_TIEN_KHONG_HOP_LE: u64 = 3;
    const E_KHONG_TIM_THAY: u64 = 4;
    const E_DA_CO_NGUOI_LAM: u64 = 5;
    const E_CHUA_CO_NGUOI_LAM: u64 = 6;
    const E_CHUA_QUA_HAN: u64 = 7;
    const E_DA_QUA_HAN: u64 = 8;
    const E_DANG_TRANH_CHAP: u64 = 9;
    const E_HASH_KHONG_KHOP: u64 = 10;
    const E_CHUA_KY_HOP_DONG: u64 = 11;
    const E_DA_KY_ROI: u64 = 12;
    const E_CHUA_QUA_HAN_KY: u64 = 13;
    const E_KHONG_PHAI_ADMIN: u64 = 14;
    const E_CHUA_HET_HAN: u64 = 15;

    // FOR TESTING: 24h (86400s) -> 90 seconds (1p30s)
    const HAN_KY_HOP_DONG: u64 = 90;

    struct Escrow has store {
        id: u64,
        nguoi_thue: address,          
        nguoi_lam: Option<address>,   
        cid: String,                  
        
        so_tien: u64,                 
        phi_nen_tang: u64,            
        tong_ky_quy: u64,             
        
        han_ung_tuyen: u64,           
        han_nop: u64,                 
        han_duyet: u64,               
        thoi_gian_lam: u64,           
        thoi_gian_duyet: u64,         
        
        trang_thai: u8,               
        da_nop_san_pham: bool,        
        evidence_cid: Option<String>, 
        
        dispute_id: Option<u64>,
        dispute_winner: Option<address>,  // Winner of dispute (set when resolved)
        
        contract_hash: vector<u8>,
        employer_signed: bool,
        freelancer_signed: bool,
        
        tien_cong_viec: coin::Coin<AptosCoin>,   
        tien_phi: coin::Coin<AptosCoin>,         
        
        tao_luc: u64,
        bat_dau_luc: Option<u64>,
        gan_nguoi_lam_luc: Option<u64>,  // Thời điểm gán freelancer - để tính hạn ký 24h
    }

    struct EscrowStore has key {
        escrows: Table<u64, Escrow>,
        next_id: u64,
        platform_treasury: coin::Coin<AptosCoin>,  
        
        escrow_created_events: event::EventHandle<EscrowCreatedEvent>,
        escrow_updated_events: event::EventHandle<EscrowUpdatedEvent>,
        worker_assigned_events: event::EventHandle<WorkerAssignedEvent>,
        worker_removed_events: event::EventHandle<WorkerRemovedEvent>,
        work_submitted_events: event::EventHandle<WorkSubmittedEvent>,
        payment_released_events: event::EventHandle<PaymentReleasedEvent>,
        escrow_cancelled_events: event::EventHandle<EscrowCancelledEvent>,
        dispute_opened_events: event::EventHandle<DisputeOpenedEvent>,
        revision_requested_events: event::EventHandle<RevisionRequestedEvent>,
        freelancer_withdrawn_events: event::EventHandle<FreelancerWithdrawnEvent>,
        contract_signed_events: event::EventHandle<ContractSignedEvent>,
        contract_rejected_events: event::EventHandle<ContractRejectedEvent>,
        escrow_cancelled_before_sign_events: event::EventHandle<EscrowCancelledBeforeSignEvent>,
    }

    struct EscrowCreatedEvent has drop, store {
        escrow_id: u64,
        nguoi_thue: address,
        so_tien: u64,
        phi_nen_tang: u64,
        tong_ky_quy: u64,
        han_ung_tuyen: u64,
        thoi_gian_lam: u64,
        thoi_gian_duyet: u64,
        contract_hash: vector<u8>,
        tao_luc: u64,
    }

    struct EscrowUpdatedEvent has drop, store {
        escrow_id: u64,
        nguoi_thue: address,
        so_tien_cu: u64,
        so_tien_moi: u64,
        chenh_lech: u64,
        la_nap_them: bool,
        contract_hash: vector<u8>,
        updated_at: u64,
    }

    struct ContractSignedEvent has drop, store {
        escrow_id: u64,
        nguoi_lam: address,
        contract_hash: vector<u8>,
        signed_at: u64,
    }

    struct WorkerAssignedEvent has drop, store {
        escrow_id: u64,
        nguoi_lam: address,
        han_nop: u64,
        assigned_at: u64,
    }

    struct WorkerRemovedEvent has drop, store {
        escrow_id: u64,
        nguoi_lam: address,
        ly_do: String,  
        removed_at: u64,
    }

    struct WorkSubmittedEvent has drop, store {
        escrow_id: u64,
        nguoi_lam: address,
        evidence_cid: String,
        han_duyet: u64,
        submitted_at: u64,
    }

    struct PaymentReleasedEvent has drop, store {
        escrow_id: u64,
        nguoi_nhan: address,
        so_tien: u64,
        ly_do: String,  
        released_at: u64,
    }

    struct EscrowCancelledEvent has drop, store {
        escrow_id: u64,
        nguoi_thue: address,
        so_tien_hoan: u64,
        cancelled_at: u64,
    }

    struct DisputeOpenedEvent has drop, store {
        escrow_id: u64,
        dispute_id: u64,
        opened_by: address,
        opened_at: u64,
    }

    struct RevisionRequestedEvent has drop, store {
        escrow_id: u64,
        nguoi_thue: address,
        new_han_nop: u64,
        requested_at: u64,
    }

    struct FreelancerWithdrawnEvent has drop, store {
        escrow_id: u64,
        nguoi_lam: address,
        withdrawn_at: u64,
    }

    struct ContractRejectedEvent has drop, store {
        escrow_id: u64,
        nguoi_lam: address,
        rejected_at: u64,
    }

    struct EscrowCancelledBeforeSignEvent has drop, store {
        escrow_id: u64,
        nguoi_thue: address,
        nguoi_lam: address,
        cancelled_at: u64,
    }

    fun init_module(admin: &signer) {
        move_to(admin, EscrowStore {
            escrows: table::new(),
            next_id: 1,
            platform_treasury: coin::zero<AptosCoin>(),
            escrow_created_events: account::new_event_handle<EscrowCreatedEvent>(admin),
            escrow_updated_events: account::new_event_handle<EscrowUpdatedEvent>(admin),
            worker_assigned_events: account::new_event_handle<WorkerAssignedEvent>(admin),
            worker_removed_events: account::new_event_handle<WorkerRemovedEvent>(admin),
            work_submitted_events: account::new_event_handle<WorkSubmittedEvent>(admin),
            payment_released_events: account::new_event_handle<PaymentReleasedEvent>(admin),
            escrow_cancelled_events: account::new_event_handle<EscrowCancelledEvent>(admin),
            dispute_opened_events: account::new_event_handle<DisputeOpenedEvent>(admin),
            revision_requested_events: account::new_event_handle<RevisionRequestedEvent>(admin),
            freelancer_withdrawn_events: account::new_event_handle<FreelancerWithdrawnEvent>(admin),
            contract_signed_events: account::new_event_handle<ContractSignedEvent>(admin),
            contract_rejected_events: account::new_event_handle<ContractRejectedEvent>(admin),
            escrow_cancelled_before_sign_events: account::new_event_handle<EscrowCancelledBeforeSignEvent>(admin),
        });
    }

    public entry fun tao_ky_quy(
        nguoi_thue: &signer,
        cid: String,
        contract_hash: vector<u8>,
        so_tien: u64,
        han_ung_tuyen_duration: u64,  
        thoi_gian_lam: u64,           
        thoi_gian_duyet: u64,         
    ) acquires EscrowStore {
        assert!(so_tien > 0, E_SO_TIEN_KHONG_HOP_LE);
        
        let nguoi_thue_addr = signer::address_of(nguoi_thue);
        let phi_nen_tang = (so_tien * PLATFORM_FEE_PERCENT) / 100;
        let tong_ky_quy = so_tien + phi_nen_tang;
        let tien_cong_viec = coin::withdraw<AptosCoin>(nguoi_thue, so_tien);
        let tien_phi = coin::withdraw<AptosCoin>(nguoi_thue, phi_nen_tang);
        let store = borrow_global_mut<EscrowStore>(@job_work_board);
        let escrow_id = store.next_id;
        store.next_id = store.next_id + 1;
        let now = timestamp::now_seconds();
        let han_ung_tuyen = now + han_ung_tuyen_duration;
        
        table::add(&mut store.escrows, escrow_id, Escrow {
            id: escrow_id,
            nguoi_thue: nguoi_thue_addr,
            nguoi_lam: option::none(),
            cid,
            so_tien,
            phi_nen_tang,
            tong_ky_quy,
            han_ung_tuyen,
            han_nop: 0,
            han_duyet: 0,
            thoi_gian_lam,
            thoi_gian_duyet,
            trang_thai: TRANG_THAI_CHO,
            da_nop_san_pham: false,
            evidence_cid: option::none(),
            dispute_id: option::none(),
            dispute_winner: option::none(),
            contract_hash,
            employer_signed: true,
            freelancer_signed: false,
            tien_cong_viec,
            tien_phi,
            tao_luc: now,
            bat_dau_luc: option::none(),
            gan_nguoi_lam_luc: option::none(),
        });
        
        event::emit_event(
            &mut store.escrow_created_events,
            EscrowCreatedEvent {
                escrow_id,
                nguoi_thue: nguoi_thue_addr,
                so_tien,
                phi_nen_tang,
                tong_ky_quy,
                han_ung_tuyen,
                thoi_gian_lam,
                thoi_gian_duyet,
                contract_hash,
                tao_luc: now,
            }
        );
    }

    public entry fun cap_nhat_escrow(
        nguoi_thue: &signer,
        escrow_id: u64,
        contract_hash: vector<u8>,
        so_tien_moi: u64,
        han_ung_tuyen_duration: u64,
        thoi_gian_lam: u64,
        thoi_gian_duyet: u64,
    ) acquires EscrowStore {
        assert!(so_tien_moi > 0, E_SO_TIEN_KHONG_HOP_LE);
        
        let nguoi_thue_addr = signer::address_of(nguoi_thue);
        let store = borrow_global_mut<EscrowStore>(@job_work_board);
        let escrow = table::borrow_mut(&mut store.escrows, escrow_id);
        
        assert!(escrow.nguoi_thue == nguoi_thue_addr, E_KHONG_CO_QUYEN);
        assert!(escrow.trang_thai == TRANG_THAI_CHO, E_TRANG_THAI_KHONG_HOP_LE);
        assert!(option::is_none(&escrow.nguoi_lam), E_DA_CO_NGUOI_LAM);
        
        let now = timestamp::now_seconds();
        let so_tien_cu = escrow.so_tien;
        let phi_moi = (so_tien_moi * PLATFORM_FEE_PERCENT) / 100;
        
        let phi_cap_nhat = (so_tien_moi * UPDATE_FEE_PERCENT) / 100;
        let tien_phi_cap_nhat = coin::withdraw<AptosCoin>(nguoi_thue, phi_cap_nhat);
        coin::merge(&mut store.platform_treasury, tien_phi_cap_nhat);
        
        let chenh_lech: u64;
        let la_nap_them: bool;
        
        if (so_tien_moi > so_tien_cu) {
            chenh_lech = so_tien_moi - so_tien_cu;
            la_nap_them = true;
            let chenh_lech_phi = phi_moi - escrow.phi_nen_tang;
            let tien_them = coin::withdraw<AptosCoin>(nguoi_thue, chenh_lech);
            let phi_them = coin::withdraw<AptosCoin>(nguoi_thue, chenh_lech_phi);
            coin::merge(&mut escrow.tien_cong_viec, tien_them);
            coin::merge(&mut escrow.tien_phi, phi_them);
        } else if (so_tien_moi < so_tien_cu) {
            chenh_lech = so_tien_cu - so_tien_moi;
            la_nap_them = false;
            let chenh_lech_phi = escrow.phi_nen_tang - phi_moi;
            let tien_hoan = coin::extract(&mut escrow.tien_cong_viec, chenh_lech);
            let phi_hoan = coin::extract(&mut escrow.tien_phi, chenh_lech_phi);
            coin::deposit(nguoi_thue_addr, tien_hoan);
            coin::deposit(nguoi_thue_addr, phi_hoan);
        } else {
            chenh_lech = 0;
            la_nap_them = false;
        };
        
        escrow.so_tien = so_tien_moi;
        escrow.phi_nen_tang = phi_moi;
        escrow.tong_ky_quy = so_tien_moi + phi_moi;
        escrow.contract_hash = contract_hash;
        escrow.han_ung_tuyen = now + han_ung_tuyen_duration;
        escrow.thoi_gian_lam = thoi_gian_lam;
        escrow.thoi_gian_duyet = thoi_gian_duyet;
        
        event::emit_event(
            &mut store.escrow_updated_events,
            EscrowUpdatedEvent {
                escrow_id,
                nguoi_thue: nguoi_thue_addr,
                so_tien_cu,
                so_tien_moi,
                chenh_lech,
                la_nap_them,
                contract_hash,
                updated_at: now,
            }
        );
    }

    public entry fun gan_nguoi_lam(
        nguoi_thue: &signer,
        escrow_id: u64,
        nguoi_lam_addr: address,
    ) acquires EscrowStore {
        let nguoi_thue_addr = signer::address_of(nguoi_thue);
        let store = borrow_global_mut<EscrowStore>(@job_work_board);
        let escrow = table::borrow_mut(&mut store.escrows, escrow_id);
        
        assert!(escrow.nguoi_thue == nguoi_thue_addr, E_KHONG_CO_QUYEN);
        assert!(escrow.trang_thai == TRANG_THAI_CHO, E_TRANG_THAI_KHONG_HOP_LE);
        assert!(option::is_none(&escrow.nguoi_lam), E_DA_CO_NGUOI_LAM);
        assert!(nguoi_lam_addr != nguoi_thue_addr, E_KHONG_CO_QUYEN);
        
        let now = timestamp::now_seconds();
        
        escrow.nguoi_lam = option::some(nguoi_lam_addr);
        escrow.trang_thai = TRANG_THAI_CHO_KY;
        escrow.gan_nguoi_lam_luc = option::some(now);
        
        event::emit_event(
            &mut store.worker_assigned_events,
            WorkerAssignedEvent {
                escrow_id,
                nguoi_lam: nguoi_lam_addr,
                han_nop: 0,
                assigned_at: now,
            }
        );
    }

    public entry fun ky_hop_dong(
        nguoi_lam: &signer,
        escrow_id: u64,
        contract_hash: vector<u8>,
    ) acquires EscrowStore {
        let nguoi_lam_addr = signer::address_of(nguoi_lam);
        let store = borrow_global_mut<EscrowStore>(@job_work_board);
        let escrow = table::borrow_mut(&mut store.escrows, escrow_id);
        
        assert!(option::is_some(&escrow.nguoi_lam) && *option::borrow(&escrow.nguoi_lam) == nguoi_lam_addr, E_KHONG_CO_QUYEN);
        assert!(escrow.trang_thai == TRANG_THAI_CHO_KY, E_TRANG_THAI_KHONG_HOP_LE);
        assert!(!escrow.freelancer_signed, E_DA_KY_ROI);
        assert!(escrow.contract_hash == contract_hash, E_HASH_KHONG_KHOP);
        
        let now = timestamp::now_seconds();
        
        escrow.freelancer_signed = true;
        escrow.han_nop = now + escrow.thoi_gian_lam;
        escrow.trang_thai = TRANG_THAI_DANG_LAM;
        escrow.bat_dau_luc = option::some(now);
        
        event::emit_event(
            &mut store.contract_signed_events,
            ContractSignedEvent {
                escrow_id,
                nguoi_lam: nguoi_lam_addr,
                contract_hash,
                signed_at: now,
            }
        );
    }

    /// Freelancer từ chối hợp đồng (khi chưa ký)
    public entry fun tu_choi_hop_dong(
        nguoi_lam: &signer,
        escrow_id: u64,
    ) acquires EscrowStore {
        let nguoi_lam_addr = signer::address_of(nguoi_lam);
        let store = borrow_global_mut<EscrowStore>(@job_work_board);
        let escrow = table::borrow_mut(&mut store.escrows, escrow_id);
        
        assert!(option::is_some(&escrow.nguoi_lam) && *option::borrow(&escrow.nguoi_lam) == nguoi_lam_addr, E_KHONG_CO_QUYEN);
        assert!(escrow.trang_thai == TRANG_THAI_CHO_KY, E_TRANG_THAI_KHONG_HOP_LE);
        assert!(!escrow.freelancer_signed, E_DA_KY_ROI);
        
        let now = timestamp::now_seconds();
        
        // Reset về trạng thái chờ
        escrow.nguoi_lam = option::none();
        escrow.trang_thai = TRANG_THAI_CHO;
        escrow.gan_nguoi_lam_luc = option::none();
        
        event::emit_event(
            &mut store.contract_rejected_events,
            ContractRejectedEvent {
                escrow_id,
                nguoi_lam: nguoi_lam_addr,
                rejected_at: now,
            }
        );
    }

    /// Employer hủy job khi freelancer chưa ký (trả lại tiền trừ phí phạt 40%)
    public entry fun huy_truoc_ky(
        nguoi_thue: &signer,
        escrow_id: u64,
    ) acquires EscrowStore {
        let nguoi_thue_addr = signer::address_of(nguoi_thue);
        let store = borrow_global_mut<EscrowStore>(@job_work_board);
        let escrow = table::borrow_mut(&mut store.escrows, escrow_id);
        
        assert!(escrow.nguoi_thue == nguoi_thue_addr, E_KHONG_CO_QUYEN);
        assert!(escrow.trang_thai == TRANG_THAI_CHO_KY, E_TRANG_THAI_KHONG_HOP_LE);
        assert!(!escrow.freelancer_signed, E_DA_KY_ROI);
        
        let now = timestamp::now_seconds();
        let nguoi_lam_addr = *option::borrow(&escrow.nguoi_lam);
        
        let phi_phat = (escrow.so_tien * EMPLOYER_WITHDRAWAL_PENALTY) / 100;
        let tien_hoan_lai = escrow.so_tien - phi_phat;
        
        let tien_hoan = coin::extract(&mut escrow.tien_cong_viec, tien_hoan_lai);
        let phi_phat_coin = coin::extract_all(&mut escrow.tien_cong_viec);
        let phi_nen_tang = coin::extract_all(&mut escrow.tien_phi);
        
        coin::deposit(nguoi_thue_addr, tien_hoan);
        coin::merge(&mut store.platform_treasury, phi_phat_coin);
        coin::merge(&mut store.platform_treasury, phi_nen_tang);
        
        escrow.trang_thai = TRANG_THAI_DA_HUY;
        
        event::emit_event(
            &mut store.escrow_cancelled_before_sign_events,
            EscrowCancelledBeforeSignEvent {
                escrow_id,
                nguoi_thue: nguoi_thue_addr,
                nguoi_lam: nguoi_lam_addr,
                cancelled_at: now,
            }
        );
    }

    public entry fun xoa_nguoi_lam_qua_han_ky(
        admin: &signer,
        escrow_id: u64,
    ) acquires EscrowStore {
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == @job_work_board, E_KHONG_PHAI_ADMIN);
        
        let store = borrow_global_mut<EscrowStore>(@job_work_board);
        let escrow = table::borrow_mut(&mut store.escrows, escrow_id);
        
        assert!(escrow.trang_thai == TRANG_THAI_CHO_KY, E_TRANG_THAI_KHONG_HOP_LE);
        assert!(option::is_some(&escrow.nguoi_lam), E_CHUA_CO_NGUOI_LAM);
        assert!(!escrow.freelancer_signed, E_DA_KY_ROI);
        
        let now = timestamp::now_seconds();
        let gan_luc = *option::borrow(&escrow.gan_nguoi_lam_luc);
        assert!(now > gan_luc + HAN_KY_HOP_DONG, E_CHUA_QUA_HAN_KY);
        
        let nguoi_lam_addr = *option::borrow(&escrow.nguoi_lam);
        
        escrow.nguoi_lam = option::none();
        escrow.trang_thai = TRANG_THAI_CHO;
        escrow.gan_nguoi_lam_luc = option::none();
        
        reputation::on_freelancer_timeout_internal(nguoi_lam_addr);
        
        event::emit_event(
            &mut store.worker_removed_events,
            WorkerRemovedEvent {
                escrow_id,
                nguoi_lam: nguoi_lam_addr,
                ly_do: std::string::utf8(b"QUA_HAN_KY"),
                removed_at: now,
            }
        );
    }

    public entry fun xoa_nguoi_lam(
        admin: &signer,
        escrow_id: u64,
    ) acquires EscrowStore {
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == @job_work_board, E_KHONG_PHAI_ADMIN);
        
        let store = borrow_global_mut<EscrowStore>(@job_work_board);
        let escrow = table::borrow_mut(&mut store.escrows, escrow_id);
        assert!(escrow.trang_thai == TRANG_THAI_DANG_LAM, E_TRANG_THAI_KHONG_HOP_LE);
        assert!(option::is_some(&escrow.nguoi_lam), E_CHUA_CO_NGUOI_LAM);
        assert!(!escrow.da_nop_san_pham, E_TRANG_THAI_KHONG_HOP_LE);
        
        let now = timestamp::now_seconds();
        assert!(now > escrow.han_nop, E_CHUA_QUA_HAN);
        
        let nguoi_lam_addr = *option::borrow(&escrow.nguoi_lam);
        
        escrow.nguoi_lam = option::none();
        escrow.han_nop = 0;
        escrow.trang_thai = TRANG_THAI_CHO;
        escrow.bat_dau_luc = option::none();
        
        reputation::on_freelancer_timeout_internal(nguoi_lam_addr);
        
        event::emit_event(
            &mut store.worker_removed_events,
            WorkerRemovedEvent {
                escrow_id,
                nguoi_lam: nguoi_lam_addr,
                ly_do: std::string::utf8(b"QUA_HAN"),
                removed_at: now,
            }
        );
    }

    public entry fun nop_san_pham(
        nguoi_lam: &signer,
        escrow_id: u64,
        evidence_cid: String,
    ) acquires EscrowStore {
        let nguoi_lam_addr = signer::address_of(nguoi_lam);
        let store = borrow_global_mut<EscrowStore>(@job_work_board);
        let escrow = table::borrow_mut(&mut store.escrows, escrow_id);
        
        assert!(option::is_some(&escrow.nguoi_lam) && *option::borrow(&escrow.nguoi_lam) == nguoi_lam_addr, E_KHONG_CO_QUYEN);
        assert!(escrow.trang_thai == TRANG_THAI_DANG_LAM, E_TRANG_THAI_KHONG_HOP_LE);
        
        let now = timestamp::now_seconds();
        
        escrow.da_nop_san_pham = true;
        escrow.evidence_cid = option::some(evidence_cid);
        escrow.han_duyet = now + escrow.thoi_gian_duyet;
        
        event::emit_event(
            &mut store.work_submitted_events,
            WorkSubmittedEvent {
                escrow_id,
                nguoi_lam: nguoi_lam_addr,
                evidence_cid,
                han_duyet: escrow.han_duyet,
                submitted_at: now,
            }
        );
    }

    public entry fun yeu_cau_chinh_sua(
        nguoi_thue: &signer,
        escrow_id: u64,
    ) acquires EscrowStore {
        let nguoi_thue_addr = signer::address_of(nguoi_thue);
        let store = borrow_global_mut<EscrowStore>(@job_work_board);
        let escrow = table::borrow_mut(&mut store.escrows, escrow_id);
        
        assert!(escrow.nguoi_thue == nguoi_thue_addr, E_KHONG_CO_QUYEN);
        assert!(escrow.trang_thai == TRANG_THAI_DANG_LAM, E_TRANG_THAI_KHONG_HOP_LE);
        assert!(escrow.da_nop_san_pham, E_TRANG_THAI_KHONG_HOP_LE);
        
        let now = timestamp::now_seconds();
        assert!(now <= escrow.han_duyet, E_DA_QUA_HAN);
        
        escrow.da_nop_san_pham = false;
        escrow.han_nop = now + escrow.thoi_gian_lam;
        escrow.han_duyet = 0;
        
        event::emit_event(
            &mut store.revision_requested_events,
            RevisionRequestedEvent {
                escrow_id,
                nguoi_thue: nguoi_thue_addr,
                new_han_nop: escrow.han_nop,
                requested_at: now,
            }
        );
    }

    public entry fun freelancer_rut(
        nguoi_lam: &signer,
        escrow_id: u64,
    ) acquires EscrowStore {
        let nguoi_lam_addr = signer::address_of(nguoi_lam);
        let store = borrow_global_mut<EscrowStore>(@job_work_board);
        let escrow = table::borrow_mut(&mut store.escrows, escrow_id);
        
        assert!(option::is_some(&escrow.nguoi_lam) && *option::borrow(&escrow.nguoi_lam) == nguoi_lam_addr, E_KHONG_CO_QUYEN);
        assert!(escrow.trang_thai == TRANG_THAI_DANG_LAM, E_TRANG_THAI_KHONG_HOP_LE);
        assert!(!escrow.da_nop_san_pham, E_TRANG_THAI_KHONG_HOP_LE);
        
        let now = timestamp::now_seconds();
        
        let phi_phat = (escrow.so_tien * FREELANCER_WITHDRAWAL_PENALTY) / 100;
        let phi_coin = coin::withdraw<AptosCoin>(nguoi_lam, phi_phat);
        coin::merge(&mut store.platform_treasury, phi_coin);
        
        escrow.nguoi_lam = option::none();
        escrow.han_nop = 0;
        escrow.trang_thai = TRANG_THAI_CHO;
        escrow.bat_dau_luc = option::none();
        
        reputation::on_freelancer_timeout_internal(nguoi_lam_addr);
        
        event::emit_event(
            &mut store.freelancer_withdrawn_events,
            FreelancerWithdrawnEvent {
                escrow_id,
                nguoi_lam: nguoi_lam_addr,
                withdrawn_at: now,
            }
        );
    }

    public entry fun tra_tien_nguoi_lam(
        caller: &signer,
        escrow_id: u64,
    ) acquires EscrowStore {
        let caller_addr = signer::address_of(caller);
        let store = borrow_global_mut<EscrowStore>(@job_work_board);
        let escrow = table::borrow_mut(&mut store.escrows, escrow_id);
        
        assert!(escrow.trang_thai == TRANG_THAI_DANG_LAM, E_TRANG_THAI_KHONG_HOP_LE);
        assert!(option::is_some(&escrow.nguoi_lam), E_CHUA_CO_NGUOI_LAM);
        assert!(escrow.da_nop_san_pham, E_TRANG_THAI_KHONG_HOP_LE);
        
        let now = timestamp::now_seconds();
        let ly_do: String;
        let on_time: bool;
        
        if (caller_addr == escrow.nguoi_thue) {
            ly_do = std::string::utf8(b"DUYET");
            on_time = true;
        } else {
            assert!(caller_addr == @job_work_board, E_KHONG_PHAI_ADMIN);
            assert!(now > escrow.han_duyet, E_CHUA_QUA_HAN);
            ly_do = std::string::utf8(b"QUA_HAN_DUYET");
            on_time = false;
            reputation::on_employer_timeout_internal(escrow.nguoi_thue);
        };
        
        let nguoi_lam_addr = *option::borrow(&escrow.nguoi_lam);
        let so_tien = escrow.so_tien;
        let phi_freelancer = (so_tien * FREELANCER_FEE_PERCENT) / 100;
        let tien_nhan = so_tien - phi_freelancer;
        
        let payment = coin::extract(&mut escrow.tien_cong_viec, tien_nhan);
        coin::deposit(nguoi_lam_addr, payment);
        
        let freelancer_fee = coin::extract_all(&mut escrow.tien_cong_viec);
        coin::merge(&mut store.platform_treasury, freelancer_fee);
        
        let phi = coin::extract_all(&mut escrow.tien_phi);
        coin::merge(&mut store.platform_treasury, phi);
        escrow.trang_thai = TRANG_THAI_HOAN_THANH;
        
        reputation::on_job_completed(caller, nguoi_lam_addr, escrow.nguoi_thue, on_time);
        
        event::emit_event(
            &mut store.payment_released_events,
            PaymentReleasedEvent {
                escrow_id,
                nguoi_nhan: nguoi_lam_addr,
                so_tien: tien_nhan,
                ly_do,
                released_at: now,
            }
        );
    }

    public entry fun mo_tranh_chap(
        nguoi_thue: &signer,
        escrow_id: u64,
    ) acquires EscrowStore {
        let nguoi_thue_addr = signer::address_of(nguoi_thue);
        let store = borrow_global_mut<EscrowStore>(@job_work_board);
        let escrow = table::borrow_mut(&mut store.escrows, escrow_id);
        
        assert!(escrow.nguoi_thue == nguoi_thue_addr, E_KHONG_CO_QUYEN);
        assert!(escrow.trang_thai == TRANG_THAI_DANG_LAM, E_TRANG_THAI_KHONG_HOP_LE);
        assert!(escrow.da_nop_san_pham, E_TRANG_THAI_KHONG_HOP_LE);  
        
        let now = timestamp::now_seconds();
        assert!(now <= escrow.han_duyet, E_DA_QUA_HAN);  
        
        escrow.trang_thai = TRANG_THAI_TRANH_CHAP;
        
        event::emit_event(
            &mut store.dispute_opened_events,
            DisputeOpenedEvent {
                escrow_id,
                dispute_id: 0,
                opened_by: nguoi_thue_addr,
                opened_at: now,
            }
        );
    }

    public entry fun huy_escrow(
        nguoi_thue: &signer,
        escrow_id: u64,
    ) acquires EscrowStore {
        let nguoi_thue_addr = signer::address_of(nguoi_thue);
        let store = borrow_global_mut<EscrowStore>(@job_work_board);
        let escrow = table::borrow_mut(&mut store.escrows, escrow_id);
        
        assert!(escrow.nguoi_thue == nguoi_thue_addr, E_KHONG_CO_QUYEN);
        assert!(escrow.trang_thai == TRANG_THAI_CHO, E_TRANG_THAI_KHONG_HOP_LE);
        assert!(option::is_none(&escrow.nguoi_lam), E_DA_CO_NGUOI_LAM);
        
        let now = timestamp::now_seconds();
        let tien_hoan = coin::extract_all(&mut escrow.tien_cong_viec);
        let phi_nen_tang = coin::extract_all(&mut escrow.tien_phi);
        
        coin::deposit(nguoi_thue_addr, tien_hoan);
        coin::merge(&mut store.platform_treasury, phi_nen_tang);
        
        let so_tien_hoan = escrow.so_tien;
        
        escrow.trang_thai = TRANG_THAI_DA_HUY;
        
        event::emit_event(
            &mut store.escrow_cancelled_events,
            EscrowCancelledEvent {
                escrow_id,
                nguoi_thue: nguoi_thue_addr,
                so_tien_hoan,
                cancelled_at: now,
            }
        );
    }

    /// Admin refunds poster when application deadline expires and no freelancer assigned
    public entry fun admin_refund_expired(
        admin: &signer,
        escrow_id: u64,
    ) acquires EscrowStore {
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == @job_work_board, E_KHONG_CO_QUYEN);
        
        let store = borrow_global_mut<EscrowStore>(@job_work_board);
        let escrow = table::borrow_mut(&mut store.escrows, escrow_id);
        
        assert!(escrow.trang_thai == TRANG_THAI_CHO, E_TRANG_THAI_KHONG_HOP_LE);
        assert!(option::is_none(&escrow.nguoi_lam), E_DA_CO_NGUOI_LAM);
        
        let now = timestamp::now_seconds();
        assert!(now > escrow.han_ung_tuyen, E_CHUA_HET_HAN);
        
        let nguoi_thue_addr = escrow.nguoi_thue;
        let tien_hoan = coin::extract_all(&mut escrow.tien_cong_viec);
        let phi_nen_tang = coin::extract_all(&mut escrow.tien_phi);
        
        coin::deposit(nguoi_thue_addr, tien_hoan);
        coin::deposit(@job_work_board, phi_nen_tang);
        
        let so_tien_hoan = escrow.so_tien;
        
        escrow.trang_thai = TRANG_THAI_DA_HUY;
        
        event::emit_event(
            &mut store.escrow_cancelled_events,
            EscrowCancelledEvent {
                escrow_id,
                nguoi_thue: nguoi_thue_addr,
                so_tien_hoan,
                cancelled_at: now,
            }
        );
    }

    /// Admin cancels escrow immediately (for DB failure recovery)
    public entry fun admin_cancel_escrow(
        admin: &signer,
        escrow_id: u64,
    ) acquires EscrowStore {
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == @job_work_board, E_KHONG_CO_QUYEN);
        
        let store = borrow_global_mut<EscrowStore>(@job_work_board);
        let escrow = table::borrow_mut(&mut store.escrows, escrow_id);
        
        assert!(escrow.trang_thai == TRANG_THAI_CHO, E_TRANG_THAI_KHONG_HOP_LE);
        assert!(option::is_none(&escrow.nguoi_lam), E_DA_CO_NGUOI_LAM);
        
        let now = timestamp::now_seconds();
        let nguoi_thue_addr = escrow.nguoi_thue;
        let tien_hoan = coin::extract_all(&mut escrow.tien_cong_viec);
        let phi_nen_tang = coin::extract_all(&mut escrow.tien_phi);
        
        coin::deposit(nguoi_thue_addr, tien_hoan);
        coin::deposit(nguoi_thue_addr, phi_nen_tang);
        
        let so_tien_hoan = escrow.so_tien + escrow.phi_nen_tang;
        
        escrow.trang_thai = TRANG_THAI_DA_HUY;
        
        event::emit_event(
            &mut store.escrow_cancelled_events,
            EscrowCancelledEvent {
                escrow_id,
                nguoi_thue: nguoi_thue_addr,
                so_tien_hoan,
                cancelled_at: now,
            }
        );
    }

    public(friend) fun set_dispute_id(escrow_id: u64, dispute_id: u64) acquires EscrowStore {
        let store = borrow_global_mut<EscrowStore>(@job_work_board);
        let escrow = table::borrow_mut(&mut store.escrows, escrow_id);
        escrow.dispute_id = option::some(dispute_id);
    }

    // Set escrow status to TRANH_CHAP (called by dispute module)
    public(friend) fun set_trang_thai_tranh_chap(escrow_id: u64) acquires EscrowStore {
        let store = borrow_global_mut<EscrowStore>(@job_work_board);
        let escrow = table::borrow_mut(&mut store.escrows, escrow_id);
        assert!(escrow.trang_thai == TRANG_THAI_DANG_LAM, E_TRANG_THAI_KHONG_HOP_LE);
        escrow.trang_thai = TRANG_THAI_TRANH_CHAP;
    }

    // Unlock escrow for winner to claim (called by dispute module after voting/timeout)
    // Sets winner and changes status to CHO_CLAIM, but doesn't transfer yet
    public(friend) fun unlock_for_winner(escrow_id: u64, winner: address) acquires EscrowStore {
        let store = borrow_global_mut<EscrowStore>(@job_work_board);
        let escrow = table::borrow_mut(&mut store.escrows, escrow_id);
        assert!(escrow.trang_thai == TRANG_THAI_TRANH_CHAP, E_TRANG_THAI_KHONG_HOP_LE);
        escrow.dispute_winner = option::some(winner);
        escrow.trang_thai = TRANG_THAI_CHO_CLAIM;
    }

    // Winner claims refund (called by dispute module when winner calls nhan_hoan_tien)
    public(friend) fun giai_quyet_tranh_chap(
        escrow_id: u64,
        nguoi_thang: address,
    ) acquires EscrowStore {
        let store = borrow_global_mut<EscrowStore>(@job_work_board);
        let escrow = table::borrow_mut(&mut store.escrows, escrow_id);
        
        // Must be in CHO_CLAIM status (unlocked for winner)
        assert!(escrow.trang_thai == TRANG_THAI_CHO_CLAIM, E_TRANG_THAI_KHONG_HOP_LE);
        // Verify caller is the winner
        assert!(option::is_some(&escrow.dispute_winner), E_TRANG_THAI_KHONG_HOP_LE);
        assert!(*option::borrow(&escrow.dispute_winner) == nguoi_thang, E_KHONG_CO_QUYEN);
        
        let now = timestamp::now_seconds();
        let so_tien = escrow.so_tien;
        
        let nguoi_lam_addr = *option::borrow(&escrow.nguoi_lam);
        let nguoi_thua = if (nguoi_thang == escrow.nguoi_thue) {
            nguoi_lam_addr
        } else {
            escrow.nguoi_thue
        };
        
        let payment = coin::extract_all(&mut escrow.tien_cong_viec);
        coin::deposit(nguoi_thang, payment);
        
        let phi = coin::extract_all(&mut escrow.tien_phi);
        coin::merge(&mut store.platform_treasury, phi);
        
        escrow.trang_thai = TRANG_THAI_HOAN_THANH;
        
        reputation::on_dispute_resolved_internal(nguoi_thang, nguoi_thua);
        
        event::emit_event(
            &mut store.payment_released_events,
            PaymentReleasedEvent {
                escrow_id,
                nguoi_nhan: nguoi_thang,
                so_tien,
                ly_do: std::string::utf8(b"THANG_TRANH_CHAP"),
                released_at: now,
            }
        );
    }

    #[view]
    public fun get_escrow_info(escrow_id: u64): (address, Option<address>, u64, u64, u8) acquires EscrowStore {
        let store = borrow_global<EscrowStore>(@job_work_board);
        let escrow = table::borrow(&store.escrows, escrow_id);
        (escrow.nguoi_thue, escrow.nguoi_lam, escrow.so_tien, escrow.tong_ky_quy, escrow.trang_thai)
    }

    #[view]
    public fun get_escrow_dispute_id(escrow_id: u64): Option<u64> acquires EscrowStore {
        let store = borrow_global<EscrowStore>(@job_work_board);
        let escrow = table::borrow(&store.escrows, escrow_id);
        escrow.dispute_id
    }

    #[view]
    public fun get_dispute_winner(escrow_id: u64): Option<address> acquires EscrowStore {
        let store = borrow_global<EscrowStore>(@job_work_board);
        let escrow = table::borrow(&store.escrows, escrow_id);
        escrow.dispute_winner
    }

    #[view]
    public fun can_claim_dispute_refund(escrow_id: u64, caller: address): bool acquires EscrowStore {
        let store = borrow_global<EscrowStore>(@job_work_board);
        let escrow = table::borrow(&store.escrows, escrow_id);
        
        if (escrow.trang_thai != TRANG_THAI_CHO_CLAIM) {
            return false
        };
        
        if (option::is_none(&escrow.dispute_winner)) {
            return false
        };
        
        *option::borrow(&escrow.dispute_winner) == caller
    }

    #[view]
    public fun get_escrow_deadlines(escrow_id: u64): (u64, u64, u64) acquires EscrowStore {
        let store = borrow_global<EscrowStore>(@job_work_board);
        let escrow = table::borrow(&store.escrows, escrow_id);
        (escrow.han_ung_tuyen, escrow.han_nop, escrow.han_duyet)
    }

    #[view]
    public fun is_submission_overdue(escrow_id: u64): bool acquires EscrowStore {
        let store = borrow_global<EscrowStore>(@job_work_board);
        let escrow = table::borrow(&store.escrows, escrow_id);
        let now = timestamp::now_seconds();
        escrow.trang_thai == TRANG_THAI_DANG_LAM 
            && !escrow.da_nop_san_pham 
            && escrow.han_nop > 0 
            && now > escrow.han_nop
    }

    #[view]
    public fun is_review_overdue(escrow_id: u64): bool acquires EscrowStore {
        let store = borrow_global<EscrowStore>(@job_work_board);
        let escrow = table::borrow(&store.escrows, escrow_id);
        let now = timestamp::now_seconds();
        escrow.trang_thai == TRANG_THAI_DANG_LAM 
            && escrow.da_nop_san_pham 
            && escrow.han_duyet > 0 
            && now > escrow.han_duyet
    }

    #[view]
    public fun get_platform_treasury_balance(): u64 acquires EscrowStore {
        let store = borrow_global<EscrowStore>(@job_work_board);
        coin::value(&store.platform_treasury)
    }

    #[view]
    public fun get_nguoi_thue(escrow_id: u64): address acquires EscrowStore {
        let store = borrow_global<EscrowStore>(@job_work_board);
        let escrow = table::borrow(&store.escrows, escrow_id);
        escrow.nguoi_thue
    }

    #[view]
    public fun get_nguoi_lam(escrow_id: u64): Option<address> acquires EscrowStore {
        let store = borrow_global<EscrowStore>(@job_work_board);
        let escrow = table::borrow(&store.escrows, escrow_id);
        escrow.nguoi_lam
    }

    #[view]
    public fun get_trang_thai(escrow_id: u64): u8 acquires EscrowStore {
        let store = borrow_global<EscrowStore>(@job_work_board);
        let escrow = table::borrow(&store.escrows, escrow_id);
        escrow.trang_thai
    }

    #[view]
    public fun get_contract_info(escrow_id: u64): (vector<u8>, bool, bool) acquires EscrowStore {
        let store = borrow_global<EscrowStore>(@job_work_board);
        let escrow = table::borrow(&store.escrows, escrow_id);
        (escrow.contract_hash, escrow.employer_signed, escrow.freelancer_signed)
    }

    #[view]
    public fun is_signing_overdue(escrow_id: u64): bool acquires EscrowStore {
        let store = borrow_global<EscrowStore>(@job_work_board);
        let escrow = table::borrow(&store.escrows, escrow_id);
        let now = timestamp::now_seconds();
        
        if (escrow.trang_thai != TRANG_THAI_CHO_KY) {
            return false
        };
        if (option::is_none(&escrow.gan_nguoi_lam_luc)) {
            return false
        };
        
        let gan_luc = *option::borrow(&escrow.gan_nguoi_lam_luc);
        now > gan_luc + HAN_KY_HOP_DONG
    }

    #[view]
    public fun get_signing_deadline(escrow_id: u64): u64 acquires EscrowStore {
        let store = borrow_global<EscrowStore>(@job_work_board);
        let escrow = table::borrow(&store.escrows, escrow_id);
        
        if (option::is_none(&escrow.gan_nguoi_lam_luc)) {
            return 0
        };
        
        let gan_luc = *option::borrow(&escrow.gan_nguoi_lam_luc);
        gan_luc + HAN_KY_HOP_DONG
    }

    #[view]
    public fun get_freelancer_withdrawal_penalty(escrow_id: u64): u64 acquires EscrowStore {
        let store = borrow_global<EscrowStore>(@job_work_board);
        let escrow = table::borrow(&store.escrows, escrow_id);
        (escrow.so_tien * FREELANCER_WITHDRAWAL_PENALTY) / 100
    }

    #[view]
    public fun get_employer_withdrawal_penalty(escrow_id: u64): u64 acquires EscrowStore {
        let store = borrow_global<EscrowStore>(@job_work_board);
        let escrow = table::borrow(&store.escrows, escrow_id);
        (escrow.so_tien * EMPLOYER_WITHDRAWAL_PENALTY) / 100
    }

    #[view]
    public fun get_withdrawal_penalty_percents(): (u64, u64) {
        (FREELANCER_WITHDRAWAL_PENALTY, EMPLOYER_WITHDRAWAL_PENALTY)
    }
}
