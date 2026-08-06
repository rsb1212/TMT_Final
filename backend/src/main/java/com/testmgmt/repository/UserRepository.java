package com.testmgmt.repository;

import com.testmgmt.entity.User;
import com.testmgmt.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    List<User> findByActiveTrue();
    List<User> findByRoleAndActiveTrue(UserRole role);

    @Query("SELECT DISTINCT u.team FROM User u WHERE u.team IS NOT NULL AND u.team <> '' ORDER BY u.team")
    List<String> findDistinctTeams();

    List<User> findByTeamAndRole(String team, UserRole role);

    /** Count members in a team */
    long countByTeamIdAndActiveTrue(UUID teamId);

    /** Find users by team ID */
    List<User> findByTeamIdAndActiveTrue(UUID teamId);

    /** Find users by team ID with specific role */
    List<User> findByTeamIdAndRoleAndActiveTrue(UUID teamId, UserRole role);
}
