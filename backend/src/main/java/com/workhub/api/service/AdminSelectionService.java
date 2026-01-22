package com.workhub.api.service;

import com.workhub.api.entity.ERole;
import com.workhub.api.entity.User;
import com.workhub.api.repository.DisputeRoundRepository;
import com.workhub.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminSelectionService {

    private final UserRepository userRepository;
    private final DisputeRoundRepository disputeRoundRepository;
    private final Random random = new Random();

    private static final int REQUIRED_ADMINS = 3;

    public int countActiveAdmins() {
        return (int) userRepository.countByRole(ERole.ROLE_ADMIN);
    }

    public List<User> getAllAdmins() {
        return userRepository.findByRole(ERole.ROLE_ADMIN);
    }

    public User selectAdminForRound(Long disputeId, int roundNumber, List<Long> excludeAdminIds) {
        List<User> allAdmins = getAllAdmins();
        int totalAdmins = allAdmins.size();
        
        if (totalAdmins == 0) {
            throw new IllegalStateException("Không có admin nào trong hệ thống");
        }

        if (totalAdmins < REQUIRED_ADMINS) {
            throw new IllegalStateException("Cần ít nhất " + REQUIRED_ADMINS + " admin để xử lý tranh chấp. Hiện có: " + totalAdmins);
        }

        List<User> eligibleAdmins = allAdmins.stream()
            .filter(admin -> !excludeAdminIds.contains(admin.getId()))
            .collect(Collectors.toList());
        
        if (eligibleAdmins.isEmpty()) {
            throw new IllegalStateException("Không còn admin khả dụng cho round " + roundNumber);
        }

        int index = random.nextInt(eligibleAdmins.size());
        User selected = eligibleAdmins.get(index);
        
        log.info("Selected admin {} for dispute {} round {}", selected.getId(), disputeId, roundNumber);
        return selected;
    }

    public List<Long> getUsedAdminIds(Long disputeId) {
        return disputeRoundRepository.findAdminIdsByDisputeId(disputeId);
    }

    public User selectReplacementAdmin(Long disputeId, int roundNumber, Long timedOutAdminId) {
        List<Long> usedAdminIds = new ArrayList<>(getUsedAdminIds(disputeId));
        if (!usedAdminIds.contains(timedOutAdminId)) {
            usedAdminIds.add(timedOutAdminId);
        }
        return selectAdminForRound(disputeId, roundNumber, usedAdminIds);
    }

    public int determineRequiredRounds() {
        return 3;
    }
}
