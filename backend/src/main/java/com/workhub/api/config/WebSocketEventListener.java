package com.workhub.api.config;

import com.workhub.api.security.UserDetailsImpl;
import com.workhub.api.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final ChatService chatService;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        
        if (headerAccessor.getUser() != null) {
            UsernamePasswordAuthenticationToken auth = (UsernamePasswordAuthenticationToken) headerAccessor.getUser();
            UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
            
            chatService.userConnected(userDetails.getId());
            log.info("User connected: {} (ID: {})", userDetails.getUsername(), userDetails.getId());
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        
        if (headerAccessor.getUser() != null) {
            UsernamePasswordAuthenticationToken auth = (UsernamePasswordAuthenticationToken) headerAccessor.getUser();
            UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
            
            chatService.userDisconnected(userDetails.getId());
            log.info("User disconnected: {} (ID: {})", userDetails.getUsername(), userDetails.getId());
        }
    }
}
