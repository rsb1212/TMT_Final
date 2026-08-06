package com.testmgmt.service;

import com.testmgmt.dto.request.AuthDTOs.*;
import com.testmgmt.dto.response.ResponseDTOs.*;
import com.testmgmt.entity.Tenant;
import com.testmgmt.entity.User;
import com.testmgmt.enums.UserRole;
import com.testmgmt.exception.BadRequestException;
import com.testmgmt.exception.ConflictException;
import com.testmgmt.exception.ResourceNotFoundException;
import com.testmgmt.repository.TenantRepository;
import com.testmgmt.repository.UserRepository;
import com.testmgmt.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@SuppressWarnings("null")
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;

    @Transactional
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User", request.getEmail()));

        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());
        
        // Generate token with tenant ID if user has one
        String tenantId = user.getTenantId() != null ? user.getTenantId().toString() : null;
        String token = jwtUtil.generateToken(userDetails, tenantId);
        
        // Load tenant info if available
        TenantResponse tenantResponse = null;
        if (user.getTenantId() != null) {
            tenantRepository.findById(user.getTenantId()).ifPresent(tenant -> {
                // Build tenant response inside
            });
            Tenant tenant = tenantRepository.findById(user.getTenantId()).orElse(null);
            if (tenant != null) {
                tenantResponse = TenantResponse.builder()
                        .id(tenant.getId())
                        .code(tenant.getCode())
                        .name(tenant.getName())
                        .description(tenant.getDescription())
                        .active(tenant.getActive())
                        .build();
            }
        }

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .user(toUserResponse(user))
                .tenant(tenantResponse)
                .build();
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email already in use: " + request.getEmail());
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ConflictException("Username already taken: " + request.getUsername());
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .team(request.getTeam())
                .role(UserRole.TESTER)
                .active(true)
                .build();

        user = userRepository.save(user);
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails);

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .user(toUserResponse(user))
                .build();
    }

    @Transactional
    public void changePassword(String currentUserEmail, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", currentUserEmail));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    public static UserResponse toUserResponse(User user) {
        if (user == null) return null;
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .team(user.getTeam())
                .active(user.getActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
