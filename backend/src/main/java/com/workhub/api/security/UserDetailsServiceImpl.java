package com.workhub.api.security;

import com.workhub.api.entity.User;
import com.workhub.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {
    
    private final UserRepository userRepository;
    
    @Override
    @Transactional
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        User user;
        if (identifier != null && identifier.startsWith("0x")) {
            user = userRepository.findByWalletAddress(identifier)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found with wallet: " + identifier));
        } else {
            user = userRepository.findByEmail(identifier)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + identifier));
        }
        return UserDetailsImpl.build(user);
    }
}
