package com.splitly.repository;

import com.splitly.entity.Group;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface GroupRepository extends JpaRepository<Group, Long> {
    @Query("SELECT g FROM Group g WHERE g.createdBy = :userId OR g.id IN " +
           "(SELECT m.groupId FROM GroupMember m WHERE m.userId = :userId)")
    List<Group> findAllForUser(@Param("userId") Long userId);
}
